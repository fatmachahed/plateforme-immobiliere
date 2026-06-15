"""
Tests de création d'annonce.

Couvre le bug original :
    psycopg2.errors.InvalidTextRepresentation:
    valeur en entrée invalide pour le enum typebienenum : 'immobiliers_divers'

Les tests avec _NEEDS_AUTH sont ignorés si aucun token admin n'est disponible.
"""
import pytest
from app.enums import TypeBienEnum, CategorieEnum


# ── Payload minimal valide ────────────────────────────────────────────────────
BASE_PAYLOAD = {
    "gouvernorat_id":  1,         # Tunis (doit exister en base)
    "delegation_id":   None,
    "localite_id":     None,
    "categorie":       "vente",
    "type_bien":       "appartement",
    "titre":           "Test annonce pytest",
    "description":     "Créée par la suite de tests automatiques.",
    "superficie":      80.0,
    "prix":            150000.0,
    "devise":          "DT",
    "nb_chambres":     2,
    "nb_salles_bain":  1,
    "nb_pieces":       3,
    "anonyme":         True,
}


# ── Helpers ───────────────────────────────────────────────────────────────────
def skip_if_no_token(token):
    if not token:
        pytest.skip("Aucun token admin disponible — ignoré en CI sans base peuplée")


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Tests endpoint public /annonces/public ────────────────────────────────────
class TestPublicListing:
    def test_returns_list(self, client):
        resp = client.get("/annonces/public?limit=5")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_limit_respected(self, client):
        resp = client.get("/annonces/public?limit=3")
        assert resp.status_code == 200
        assert len(resp.json()) <= 3

    def test_skip_param(self, client):
        all_resp   = client.get("/annonces/public?limit=10").json()
        skip_resp  = client.get("/annonces/public?limit=10&skip=5").json()
        if len(all_resp) >= 6:
            assert all_resp[5]["id"] == skip_resp[0]["id"]

    def test_categorie_filter(self, client):
        resp = client.get("/annonces/public?categorie=vente&limit=10")
        assert resp.status_code == 200
        for item in resp.json():
            assert item["categorie"] == "vente"

    def test_fields_present(self, client):
        resp = client.get("/annonces/public?limit=1")
        assert resp.status_code == 200
        if not resp.json():
            pytest.skip("Base vide")
        item = resp.json()[0]
        for field in ("id", "titre", "prix", "categorie", "type_bien"):
            assert field in item, f"Champ '{field}' absent de la réponse"


# ── Tests de création (nécessitent un token valide) ──────────────────────────
class TestAnnonceCreation:
    """
    Ces tests vérifient que la création d'annonce réussit pour chaque
    type_bien — c'est exactement ce qui aurait détecté le bug enum.
    """

    @pytest.mark.parametrize("type_bien", [m.value for m in TypeBienEnum])
    def test_create_each_type_bien(self, client, admin_token, type_bien):
        skip_if_no_token(admin_token)
        payload = {**BASE_PAYLOAD, "type_bien": type_bien}
        resp = client.post("/annonces/", json=payload, headers=auth_headers(admin_token))
        # 201 Created ou 200 OK — PAS 500
        assert resp.status_code in (200, 201), (
            f"type_bien='{type_bien}' a provoqué une erreur {resp.status_code} : "
            f"{resp.text[:400]}"
        )

    @pytest.mark.parametrize("categorie", [m.value for m in CategorieEnum])
    def test_create_each_categorie(self, client, admin_token, categorie):
        skip_if_no_token(admin_token)
        payload = {**BASE_PAYLOAD, "categorie": categorie}
        if categorie == "vacances":
            payload["duree_type"] = "semaine"
        resp = client.post("/annonces/", json=payload, headers=auth_headers(admin_token))
        assert resp.status_code in (200, 201), (
            f"categorie='{categorie}' a provoqué {resp.status_code} : {resp.text[:400]}"
        )

    def test_invalid_type_bien_rejected(self, client, admin_token):
        """Une valeur invalide doit retourner 422 Unprocessable Entity, pas 500."""
        skip_if_no_token(admin_token)
        payload = {**BASE_PAYLOAD, "type_bien": "type_inexistant"}
        resp = client.post("/annonces/", json=payload, headers=auth_headers(admin_token))
        assert resp.status_code == 422, (
            f"Attendu 422 pour type_bien invalide, reçu {resp.status_code}"
        )

    def test_missing_required_field(self, client, admin_token):
        """Titre absent → 422."""
        skip_if_no_token(admin_token)
        payload = {k: v for k, v in BASE_PAYLOAD.items() if k != "titre"}
        resp = client.post("/annonces/", json=payload, headers=auth_headers(admin_token))
        assert resp.status_code == 422

    def test_devise_tnd_accepted(self, client, admin_token):
        """devise=TND (legacy) doit être accepté sans provoquer de DataError."""
        skip_if_no_token(admin_token)
        payload = {**BASE_PAYLOAD, "devise": "TND"}
        resp = client.post("/annonces/", json=payload, headers=auth_headers(admin_token))
        # 500 = bug enum côté PG ; 422 = rejet Python OK ; 200/201 = succès
        assert resp.status_code != 500, (
            f"devise=TND a provoqué un 500 (bug enum PG) : {resp.text[:400]}"
        )


# ── Tests de détail d'annonce ─────────────────────────────────────────────────
class TestAnnonceDetail:
    def test_detail_not_found_returns_404(self, client):
        resp = client.get("/annonces/999999999/detail")
        assert resp.status_code == 404

    def test_detail_returns_correct_fields(self, client):
        listing = client.get("/annonces/public?limit=1").json()
        if not listing:
            pytest.skip("Base vide")
        annonce_id = listing[0]["id"]
        resp = client.get(f"/annonces/{annonce_id}/detail")
        assert resp.status_code == 200
        data = resp.json()
        for field in ("id", "titre", "prix", "categorie", "type_bien", "gouvernorat"):
            assert field in data, f"Champ '{field}' absent du détail"
