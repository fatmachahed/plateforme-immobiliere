"""
Routeur : demandes immobilières (demande côté acheteur/locataire).

Flux :
  POST /demandes                        → crée la demande (statut pending) + envoie email confirmation
  POST /demandes/token/{t}/confirm      → confirme (active) + notifie l'admin (pas les agents)
  POST /demandes/token/{t}/close        → clôture la demande
  POST /demandes/token/{t}/renew        → renouvelle 30 jours
  GET  /demandes/token/{t}              → lit la demande (pour page de gestion)
  GET  /demandes/mes                    → liste agent/agence : demandes qui LUI ont été assignées par l'admin
  GET  /demandes/miennes                → liste des demandes déposées par l'utilisateur connecté
  POST /demandes/{id}/consulter         → trace la consultation par un agent
  GET  /demandes/admin/all              → liste admin complète (toutes, tous statuts)
  POST /demandes/admin/{id}/assign      → admin assigne (ou réassigne/désassigne) une demande à un agent
  POST /demandes/admin/{id}/cloturer    → admin clôture

Toutes les demandes remontent d'abord à l'admin (aucune visibilité automatique
par gouvernorat pour éviter la concurrence entre agents d'une même zone) ;
l'admin dispatche ensuite manuellement chaque demande à l'agent de son choix.
"""

import html
import json
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.routers.users import get_current_user
from app.utils.auth import get_current_user_optional
from app.email_utils import send_email, LOGO_IMG_HTML, SOCIAL_FOOTER_HTML

import os

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

router = APIRouter(prefix="/demandes", tags=["Demandes"])


# ── Schémas Pydantic ──────────────────────────────────────────────────────────

class DemandeCreate(BaseModel):
    nom:          str
    email:        EmailStr
    telephone:    Optional[str] = None
    whatsapp:     str                    # requis : contact principal pour les agents
    categorie:    str                    # achat | location | vacances
    type_bien:    str
    gouvernorats: List[str]              # liste gouvernorats (un seul élément actuellement)
    delegations:  List[str] = []
    budget_min:   Optional[float] = None
    budget_max:   Optional[float] = None
    devise:       Optional[str] = "DT"   # DT | EUR | USD
    surface_min:  Optional[float] = None
    surface_max:  Optional[float] = None
    nb_pieces:    Optional[str]  = None
    meuble:       Optional[str]  = None  # oui | non | indifferent
    colocation:   Optional[str]  = None  # oui | non
    delai:        Optional[str]  = None  # urgent | 3mois | reflexion
    description:  Optional[str]  = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_demande_by_token(token: str, db: Session):
    row = db.execute(
        text("SELECT * FROM demandes_immo WHERE token = :t"),
        {"t": token}
    ).fetchone()
    if not row:
        raise HTTPException(404, "Demande introuvable ou lien invalide.")
    return row._mapping


def _send_confirmation_email(demande: dict):
    token = demande["token"]
    nom   = html.escape(demande["nom"])
    lien_confirm = f"{FRONTEND_URL}/ma-demande/{token}?action=confirm"
    lien_gerer   = f"{FRONTEND_URL}/ma-demande/{token}"

    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#f8fafc;padding:24px">
      <div style="text-align:center;padding:16px 0 24px">{LOGO_IMG_HTML}</div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:32px">
        <h2 style="color:#0f172a;margin:0 0 16px;font-size:18px">Confirmez votre demande</h2>
        <p style="margin:0 0 8px;color:#374151">Bonjour <strong>{nom}</strong>,</p>
        <p style="margin:0 0 20px;color:#374151;line-height:1.6">
          Votre demande immobilière a bien été reçue. Cliquez sur le bouton ci-dessous
          pour la <strong>confirmer</strong>. Notre équipe l'assignera ensuite à
          l'agent immobilier le plus adapté à votre recherche.
        </p>
        <div style="text-align:center;margin-bottom:24px">
          <a href="{lien_confirm}"
             style="display:inline-block;padding:13px 28px;background:#6366f1;color:#fff;
                    text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
            ✓ Confirmer ma demande
          </a>
        </div>
        <p style="font-size:13px;color:#9ca3af;text-align:center;margin:0">
          Vous pouvez aussi <a href="{lien_gerer}" style="color:#6366f1">gérer votre demande</a>
          à tout moment (renouveler, clôturer) via ce lien personnel.<br/>
          Ce lien est valable 30 jours.
        </p>
      </div>
      {SOCIAL_FOOTER_HTML}
    </div>
    """
    send_email(demande["email"], "Confirmez votre demande immobilière — Localizi.tn", html_body)


def _demande_summary_html(demande: dict) -> str:
    """Bloc HTML récapitulatif d'une demande, réutilisé dans plusieurs emails."""
    gouvernorats = demande.get("gouvernorats")
    if isinstance(gouvernorats, str):
        gouvernorats = json.loads(gouvernorats) if gouvernorats else []
    delegations = demande.get("delegations")
    if isinstance(delegations, str):
        delegations = json.loads(delegations) if delegations else []

    categorie_label = {"achat": "Achat", "location": "Location", "vacances": "Vacances"}.get(demande["categorie"], demande["categorie"])
    type_bien = html.escape(demande["type_bien"] or "")
    gouv_str  = ", ".join(gouvernorats or [])
    delegations_str = ""
    if delegations:
        delegations_str = f"<p style='margin:4px 0;color:#374151'><strong>Délégation(s) :</strong> {html.escape(', '.join(delegations))}</p>"
    devise = demande.get("devise") or "DT"
    budget_str = ""
    if demande.get("budget_min") or demande.get("budget_max"):
        bmin = f"{int(demande['budget_min']):,} {devise}" if demande.get("budget_min") else "—"
        bmax = f"{int(demande['budget_max']):,} {devise}" if demande.get("budget_max") else "—"
        budget_str = f"<p style='margin:4px 0;color:#374151'><strong>Budget :</strong> {bmin} → {bmax}</p>"
    desc_str = ""
    if demande.get("description"):
        desc_str = f"<p style='margin:4px 0;color:#374151'><strong>Description :</strong> {html.escape(demande['description'])}</p>"

    return f"""
        <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:20px">
          <p style="margin:4px 0;color:#374151"><strong>Type :</strong> {categorie_label} · {type_bien}</p>
          <p style="margin:4px 0;color:#374151"><strong>Gouvernorat(s) :</strong> {gouv_str}</p>
          {delegations_str}
          {budget_str}
          {desc_str}
        </div>
    """


def _send_admin_notification(demande: dict, db: Session):
    """Notifie uniquement les administrateurs qu'une nouvelle demande est confirmée
    et à dispatcher — jamais directement les agents/agences, pour éviter toute
    concurrence entre professionnels d'une même zone."""
    rows = db.execute(text("""
        SELECT DISTINCT email FROM users
        WHERE role = 'admin' AND is_blocked IS NOT TRUE AND email IS NOT NULL AND email <> ''
    """)).fetchall()
    if not rows:
        return

    lien = f"{FRONTEND_URL}/admin"
    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#f8fafc;padding:24px">
      <div style="text-align:center;padding:16px 0 24px">{LOGO_IMG_HTML}</div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:32px">
        <h2 style="color:#0f172a;margin:0 0 16px;font-size:18px">Nouvelle demande à dispatcher</h2>
        <p style="margin:0 0 16px;color:#374151;line-height:1.6">
          Un acheteur/locataire a confirmé sa demande. Choisissez l'agent ou l'agence
          à qui l'assigner.
        </p>
        {_demande_summary_html(demande)}
        <div style="text-align:center">
          <a href="{lien}"
             style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;
                    text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
            Assigner cette demande
          </a>
        </div>
      </div>
      {SOCIAL_FOOTER_HTML}
    </div>
    """
    for row in rows:
        if row.email:
            send_email(row.email, "Nouvelle demande à dispatcher — Localizi.tn", html_body)


def _send_assignment_notification(demande: dict, agent_email: str):
    """Notifie l'agent/agence qu'une demande vient de lui être assignée par l'admin."""
    lien = f"{FRONTEND_URL}/compte?tab=demandes"
    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#f8fafc;padding:24px">
      <div style="text-align:center;padding:16px 0 24px">{LOGO_IMG_HTML}</div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:32px">
        <h2 style="color:#0f172a;margin:0 0 16px;font-size:18px">Une demande vous a été assignée</h2>
        <p style="margin:0 0 16px;color:#374151;line-height:1.6">
          L'administrateur vous a assigné la demande suivante :
        </p>
        {_demande_summary_html(demande)}
        <div style="text-align:center">
          <a href="{lien}"
             style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;
                    text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
            Voir le contact
          </a>
        </div>
      </div>
      {SOCIAL_FOOTER_HTML}
    </div>
    """
    send_email(agent_email, "Une demande vous a été assignée — Localizi.tn", html_body)


def _send_expiry_email(demande: dict):
    token = demande["token"]
    nom   = html.escape(demande["nom"])
    lien_renew = f"{FRONTEND_URL}/ma-demande/{token}?action=renew"
    lien_close = f"{FRONTEND_URL}/ma-demande/{token}?action=close"

    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#f8fafc;padding:24px">
      <div style="text-align:center;padding:16px 0 24px">{LOGO_IMG_HTML}</div>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:32px">
        <h2 style="color:#0f172a;margin:0 0 16px;font-size:18px">Votre demande a expiré</h2>
        <p style="margin:0 0 8px;color:#374151">Bonjour <strong>{nom}</strong>,</p>
        <p style="margin:0 0 20px;color:#374151;line-height:1.6">
          Votre demande immobilière sur Localizi.tn a expiré après 30 jours.
          Avez-vous trouvé votre bien ?
        </p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <a href="{lien_renew}"
             style="display:inline-block;padding:12px 20px;background:#6366f1;color:#fff;
                    text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
            Renouveler (30 jours)
          </a>
          <a href="{lien_close}"
             style="display:inline-block;padding:12px 20px;background:#f1f5f9;color:#0f172a;
                    text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;border:1px solid #e2e8f0;">
            J'ai trouvé, clôturer
          </a>
        </div>
      </div>
      {SOCIAL_FOOTER_HTML}
    </div>
    """
    send_email(demande["email"], "Votre demande immobilière a expiré — Localizi.tn", html_body)


# ── Endpoints publics ─────────────────────────────────────────────────────────

@router.post("", status_code=201)
def creer_demande(
    data: DemandeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
):
    token = secrets.token_urlsafe(32)
    expire_at = datetime.now(timezone.utc) + timedelta(days=30)

    row = db.execute(text("""
        INSERT INTO demandes_immo
          (nom, email, telephone, whatsapp, categorie, type_bien, gouvernorats, delegations,
           budget_min, budget_max, devise, surface_min, surface_max, nb_pieces,
           meuble, colocation, delai, description, statut, token, expire_at, user_id)
        VALUES
          (:nom, :email, :telephone, :whatsapp, :categorie, :type_bien, :gouvernorats, :delegations,
           :budget_min, :budget_max, :devise, :surface_min, :surface_max, :nb_pieces,
           :meuble, :colocation, :delai, :description, 'pending', :token, :expire_at, :user_id)
        RETURNING *
    """), {
        "nom":         data.nom,
        "email":       data.email.lower(),
        "telephone":   data.telephone,
        "whatsapp":    data.whatsapp,
        "categorie":   data.categorie,
        "type_bien":   data.type_bien,
        "gouvernorats": json.dumps(data.gouvernorats, ensure_ascii=False),
        "delegations":  json.dumps(data.delegations, ensure_ascii=False),
        "budget_min":  data.budget_min,
        "budget_max":  data.budget_max,
        "devise":      data.devise or "DT",
        "surface_min": data.surface_min,
        "surface_max": data.surface_max,
        "nb_pieces":   data.nb_pieces,
        "meuble":      data.meuble,
        "colocation":  data.colocation,
        "delai":       data.delai,
        "description": data.description,
        "user_id":     current_user.id if current_user else None,
        "token":       token,
        "expire_at":   expire_at,
    })
    db.commit()
    demande = dict(row.fetchone()._mapping)
    _send_confirmation_email(demande)
    return {"message": "Demande créée. Email de confirmation envoyé."}


@router.get("/token/{token}")
def lire_demande_par_token(token: str, db: Session = Depends(get_db)):
    d = _get_demande_by_token(token, db)
    result = dict(d)
    result["gouvernorats"] = json.loads(result["gouvernorats"]) if isinstance(result["gouvernorats"], str) else result["gouvernorats"]
    result["delegations"]  = json.loads(result["delegations"])  if isinstance(result.get("delegations"), str) else (result.get("delegations") or [])
    # Ne pas exposer les coordonnées dans ce endpoint public
    result.pop("telephone", None)
    result.pop("whatsapp",  None)
    return result


@router.post("/token/{token}/confirm")
def confirmer_demande(token: str, db: Session = Depends(get_db)):
    d = _get_demande_by_token(token, db)
    if d["statut"] not in ("pending",):
        raise HTTPException(400, f"La demande est déjà en statut '{d['statut']}'.")
    expire_at = datetime.now(timezone.utc) + timedelta(days=30)
    db.execute(text("""
        UPDATE demandes_immo SET statut='active', expire_at=:exp, confirmed_at=NOW()
        WHERE token=:t
    """), {"t": token, "exp": expire_at})
    db.commit()
    demande = dict(_get_demande_by_token(token, db))
    demande["gouvernorats"] = json.loads(demande["gouvernorats"]) if isinstance(demande["gouvernorats"], str) else demande["gouvernorats"]
    _send_admin_notification(demande, db)
    return {"message": "Demande confirmée. Notre équipe va l'assigner à un agent."}


@router.post("/token/{token}/close")
def cloturer_demande(token: str, db: Session = Depends(get_db)):
    d = _get_demande_by_token(token, db)
    if d["statut"] == "closed":
        raise HTTPException(400, "La demande est déjà clôturée.")
    db.execute(text("UPDATE demandes_immo SET statut='closed' WHERE token=:t"), {"t": token})
    db.commit()
    return {"message": "Demande clôturée."}


@router.post("/token/{token}/renew")
def renouveler_demande(token: str, db: Session = Depends(get_db)):
    d = _get_demande_by_token(token, db)
    if d["statut"] == "closed":
        raise HTTPException(400, "Impossible de renouveler une demande clôturée.")
    expire_at = datetime.now(timezone.utc) + timedelta(days=30)
    db.execute(text("""
        UPDATE demandes_immo SET statut='active', expire_at=:exp WHERE token=:t
    """), {"t": token, "exp": expire_at})
    db.commit()
    return {"message": "Demande renouvelée pour 30 jours."}


# ── Endpoint agents : liste des demandes filtrées ─────────────────────────────

@router.get("/mes")
def liste_demandes_agent(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Demandes visibles pour un agent/agence : uniquement celles que l'admin lui a
    explicitement assignées (assigned_agent_id) — jamais par simple correspondance
    de gouvernorat, pour éviter toute concurrence entre professionnels d'une même
    zone. L'admin voit tout (comme sur /demandes/admin/all) : il n'est en
    concurrence avec personne, et doit pouvoir retrouver toutes les demandes
    depuis son propre "Mon compte" sans repasser par /admin."""
    if current_user.role not in ("agence", "agent", "admin"):
        raise HTTPException(403, "Accès réservé aux professionnels.")

    if current_user.role == "admin":
        rows = db.execute(text("""
            SELECT id, nom, email, telephone, whatsapp, categorie, type_bien,
                   gouvernorats, delegations, budget_min, budget_max, devise,
                   surface_min, surface_max,
                   nb_pieces, meuble, colocation, delai, description,
                   statut, expire_at, created_at
            FROM demandes_immo
            WHERE statut IN ('active', 'expired')
            ORDER BY created_at DESC
        """)).fetchall()
    else:
        rows = db.execute(text("""
            SELECT id, nom, email, telephone, whatsapp, categorie, type_bien,
                   gouvernorats, delegations, budget_min, budget_max, devise,
                   surface_min, surface_max,
                   nb_pieces, meuble, colocation, delai, description,
                   statut, expire_at, created_at
            FROM demandes_immo
            WHERE assigned_agent_id = :uid
              AND statut IN ('active', 'expired')
            ORDER BY created_at DESC
        """), {"uid": current_user.id}).fetchall()

    result = []
    for r in rows:
        d = dict(r._mapping)
        d["gouvernorats"] = json.loads(d["gouvernorats"]) if isinstance(d["gouvernorats"], str) else d["gouvernorats"]
        d["delegations"]  = json.loads(d["delegations"])  if isinstance(d.get("delegations"), str) else (d.get("delegations") or [])
        result.append(d)
    return result


# ── Endpoint utilisateur : ses propres demandes déposées ─────────────────────

@router.get("/miennes")
def liste_mes_demandes(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    rows = db.execute(text("""
        SELECT id, nom, email, telephone, whatsapp, categorie, type_bien,
               gouvernorats, delegations, budget_min, budget_max, devise,
               surface_min, surface_max,
               nb_pieces, meuble, colocation, delai, description,
               statut, token, expire_at, created_at
        FROM demandes_immo
        WHERE user_id = :uid
        ORDER BY created_at DESC
    """), {"uid": current_user.id}).fetchall()

    result = []
    for r in rows:
        d = dict(r._mapping)
        d["gouvernorats"] = json.loads(d["gouvernorats"]) if isinstance(d["gouvernorats"], str) else d["gouvernorats"]
        d["delegations"]  = json.loads(d["delegations"])  if isinstance(d.get("delegations"), str) else (d.get("delegations") or [])
        result.append(d)
    return result


# ── Traçabilité consultation ──────────────────────────────────────────────────

@router.post("/{demande_id}/consulter")
def tracer_consultation(demande_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role not in ("agence", "agent", "admin"):
        raise HTTPException(403, "Accès réservé aux professionnels.")
    db.execute(text("""
        INSERT INTO demande_consultations (demande_id, user_id)
        VALUES (:did, :uid)
        ON CONFLICT DO NOTHING
    """), {"did": demande_id, "uid": current_user.id})
    db.commit()
    return {"message": "Consultation enregistrée."}


# ── Liste admin complète ──────────────────────────────────────────────────────

@router.get("/admin/all")
def liste_demandes_admin(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(403, "Accès admin uniquement.")
    rows = db.execute(text("""
        SELECT d.*,
               COUNT(c.id) as nb_consultations,
               u.username as assigned_agent_nom, u.email as assigned_agent_email
        FROM demandes_immo d
        LEFT JOIN demande_consultations c ON c.demande_id = d.id
        LEFT JOIN users u ON u.id = d.assigned_agent_id
        GROUP BY d.id, u.username, u.email
        ORDER BY d.created_at DESC
    """)).fetchall()
    result = []
    for r in rows:
        d = dict(r._mapping)
        d["gouvernorats"] = json.loads(d["gouvernorats"]) if isinstance(d["gouvernorats"], str) else d["gouvernorats"]
        d["delegations"]  = json.loads(d["delegations"])  if isinstance(d.get("delegations"), str) else (d.get("delegations") or [])
        result.append(d)
    return result


class AssignDemande(BaseModel):
    agent_id: Optional[int] = None  # None → désassigne


@router.post("/admin/{demande_id}/assign")
def admin_assigner(demande_id: int, data: AssignDemande, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(403, "Accès admin uniquement.")

    demande_row = db.execute(text("SELECT * FROM demandes_immo WHERE id=:id"), {"id": demande_id}).fetchone()
    if not demande_row:
        raise HTTPException(404, "Demande introuvable.")

    if data.agent_id is not None:
        agent = db.execute(text("""
            SELECT id, email, role FROM users WHERE id=:id AND role IN ('agence','agent')
        """), {"id": data.agent_id}).fetchone()
        if not agent:
            raise HTTPException(400, "Agent ou agence introuvable.")

    db.execute(text("UPDATE demandes_immo SET assigned_agent_id=:aid WHERE id=:id"),
               {"aid": data.agent_id, "id": demande_id})
    db.commit()

    if data.agent_id is not None and agent.email:
        try:
            _send_assignment_notification(dict(demande_row._mapping), agent.email)
        except Exception as e:
            print(f"[assign] email error: {e}")

    return {"message": "Demande assignée." if data.agent_id else "Demande désassignée."}


@router.post("/admin/{demande_id}/cloturer")
def admin_cloturer(demande_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(403)
    db.execute(text("UPDATE demandes_immo SET statut='closed' WHERE id=:id"), {"id": demande_id})
    db.commit()
    return {"message": "Demande clôturée par l'admin."}


# ── Tâche d'expiration (à appeler par un cron ou au démarrage) ───────────────

def expire_demandes(db: Session):
    """Marque les demandes actives expirées et envoie l'email de renouvellement."""
    rows = db.execute(text("""
        UPDATE demandes_immo
        SET statut = 'expired'
        WHERE statut = 'active'
          AND expire_at < NOW()
        RETURNING *
    """)).fetchall()
    db.commit()
    for r in rows:
        try:
            _send_expiry_email(dict(r._mapping))
        except Exception as e:
            print(f"[expire_demandes] email error: {e}")
    return len(rows)
