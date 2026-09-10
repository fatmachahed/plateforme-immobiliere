# Migration Localizi — OVH → Hostinger

Objectif : redéployer la plateforme à l'identique sur un **VPS Hostinger**, avec
reprise complète de la base de données et des fichiers uploadés, puis bascule
DNS via Cloudflare. Temps d'indisponibilité visé : **< 15 min** (fenêtre de
bascule DNS).

---

## 0. Ce qui est migré / pas migré

| Élément | Où il vit aujourd'hui | Repris comment |
|---|---|---|
| Code applicatif | GitHub (`fatmachahed/plateforme-immobiliere`) | `git clone` sur le nouveau serveur |
| Base PostgreSQL | Conteneur `db`, volume `postgres_prod` | `pg_dump` → `pg_restore` (`backup.sh` / `restore.sh`) |
| Fichiers uploadés (photos, avatars, docs convention) | `/srv/localizi/uploads` (bind mount) | `uploads.tar.gz` dans l'archive |
| Secrets backend | `.env.prod` (hors Git) | inclus dans l'archive de sauvegarde |
| Config infra | `docker-compose.prod.yml`, `docker/nginx.prod.conf` | dans Git + copie dans l'archive |
| Certificat SSL | Cloudflare (edge) | rien à migrer — l'origine est en HTTP :80 |
| DNS | Cloudflare | on change juste l'enregistrement A vers la nouvelle IP |

> **Rien à faire côté Google OAuth / Stadia / Cloudflare** : ces services sont
> liés au domaine `localizi.tn`, pas au serveur. Le domaine ne change pas.

---

## 1. Commander le bon VPS Hostinger

- Gamme **VPS** (KVM). **PAS** "Hébergement Web" ni "Cloud Hosting" (Docker impossible).
- Reco : **KVM 2** ou plus — 2 vCPU / 8 Go RAM / 100 Go NVMe.
- OS : **Ubuntu 22.04** (template simple) ou **Ubuntu 24.04**. Le template
  « Ubuntu avec Docker » de Hostinger fait gagner l'étape 2.
- Noter l'**IP publique** attribuée et le mot de passe root.

---

## 2. Préparer le nouveau serveur (une seule fois)

Connexion : `ssh root@NOUVELLE_IP`

```bash
# Utilisateur non-root (recommandé)
adduser ubuntu && usermod -aG sudo ubuntu
rsync --archive --chown=ubuntu:ubuntu ~/.ssh /home/ubuntu    # si clé SSH utilisée
# se reconnecter en :  ssh ubuntu@NOUVELLE_IP

# Docker + compose (si le template ne l'a pas déjà)
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu    # puis se déconnecter/reconnecter

# Pare-feu
sudo apt-get update -y
sudo ufw allow OpenSSH && sudo ufw allow http && sudo ufw allow https
sudo ufw --force enable

# Dossier des uploads (doit exister avant le 1er démarrage)
sudo mkdir -p /srv/localizi/uploads

# Récupérer le code
git clone https://github.com/fatmachahed/plateforme-immobiliere.git ~/app
cd ~/app
```

> ⚠️ Restreindre l'accès Postgres : ne **jamais** ouvrir le port 5432 sur `ufw`.
> La base n'est accessible qu'entre conteneurs.

---

## 3. Sauvegarde sur l'ANCIEN serveur (OVH)

```bash
ssh ubuntu@141.94.65.204
cd ~/app                       # ou le dossier réel de l'app
git pull                       # récupère deploy/backup.sh
bash deploy/backup.sh
# → ~/app/backups/localizi-backup-AAAAMMJJ-HHMMSS.tar.gz (+ .sha256)
```

Transférer l'archive vers le nouveau serveur (depuis votre PC ou en direct) :

```bash
# Option A — depuis votre PC (Windows PowerShell / Git Bash)
scp ubuntu@141.94.65.204:~/app/backups/localizi-backup-*.tar.gz* .
scp localizi-backup-*.tar.gz* ubuntu@NOUVELLE_IP:~

# Option B — serveur à serveur (si SSH sortant autorisé depuis OVH)
scp ~/app/backups/localizi-backup-*.tar.gz* ubuntu@NOUVELLE_IP:~
```

> Pour limiter la perte de données pendant la bascule, on peut refaire un
> `backup.sh` juste avant le point 5 et relancer un `pg_restore` rapide
> (voir « Bascule à froid vs. delta » plus bas).

---

## 4. Restauration sur le NOUVEAU serveur (Hostinger)

```bash
ssh ubuntu@NOUVELLE_IP
cd ~/app
git pull
bash deploy/restore.sh ~/localizi-backup-AAAAMMJJ-HHMMSS.tar.gz
```

Le script : vérifie l'archive, remet `.env.prod`, démarre Postgres, restaure la
base, extrait les uploads dans `/srv/localizi/uploads`, build + démarre toute la
stack, puis health check.

Vérifications locales (le site ne reçoit pas encore de trafic public) :

```bash
curl -I http://localhost/                 # 200 → frontend OK
curl -s http://localhost/api/health       # {"status":"ok"} → backend OK
curl -I http://localhost/uploads/<un_fichier_connu>   # 200 → uploads OK
docker compose -f docker-compose.prod.yml ps           # tout "Up"/"healthy"
```

Test via l'IP directe (Cloudflare non impliqué) : ajouter temporairement dans le
fichier `hosts` de votre PC `NOUVELLE_IP  localizi.tn` et ouvrir le site.

---

## 5. Bascule DNS (Cloudflare)

1. Cloudflare → domaine `localizi.tn` → **DNS → Records**.
2. **Avant** : baisser le TTL des enregistrements A à **1 min** ~24 h à l'avance
   (si possible) pour accélérer la bascule.
3. Le jour J, modifier :
   - `A  localizi.tn      → NOUVELLE_IP`  (proxy orange activé)
   - `A  www.localizi.tn  → NOUVELLE_IP`  (proxy orange activé)
4. Laisser le **SSL/TLS mode Cloudflare inchangé** (identique à aujourd'hui —
   l'origine reste en HTTP :80, donc probablement « Flexible » ; ne pas passer
   en « Full (strict) »).
5. Purger le cache Cloudflare (**Caching → Purge Everything**).
6. Surveiller : `docker compose -f docker-compose.prod.yml logs -f proxy` sur le
   nouveau serveur — le trafic doit arriver en quelques minutes.

---

## 6. Après bascule (J+0 à J+3)

- Laisser l'**ancien serveur OVH allumé et intact** au moins 72 h (rollback =
  remettre l'ancienne IP dans Cloudflare).
- Vérifier les parcours critiques : inscription, connexion, publication
  d'annonce **avec photo** (teste l'écriture dans `/srv/localizi/uploads`),
  carte, recherche, paiement/abonnement s'il y a lieu.
- Vérifier l'envoi d'e-mails (vérification de compte, reset mot de passe) —
  SMTP configuré dans `.env.prod`, dépend parfois d'IP autorisées côté
  fournisseur d'envoi → à contrôler.
- Remettre le TTL DNS à une valeur normale (ex. 1 h / Auto).
- Planifier une sauvegarde automatique (voir §8).

---

## 7. Bascule à froid vs. delta (minimiser la perte de données)

**Simple (recommandé)** — courte coupure annoncée :
1. Mettre l'ancien site en maintenance (ou prévenir d'une fenêtre de 15 min).
2. `backup.sh` sur OVH → transfert → `restore.sh` sur Hostinger.
3. Bascule DNS.
Toute donnée écrite après le `backup.sh` et avant la bascule serait perdue —
d'où la fenêtre de maintenance.

**Sans coupure notable** — delta :
1. Faire `restore.sh` une première fois la veille (base + uploads « à peu près »).
2. Le jour J : `backup.sh` frais sur OVH, puis sur Hostinger relancer seulement
   la restauration base + un `rsync` des uploads récents, puis bascule DNS.

---

## 8. Sauvegarde automatique sur le nouveau serveur

```bash
# crontab de l'utilisateur ubuntu : sauvegarde quotidienne 3h, rétention 14 j
( crontab -l 2>/dev/null; cat <<'CRON'
0 3 * * * cd $HOME/app && bash deploy/backup.sh >> $HOME/backup.log 2>&1 && find $HOME/app/backups -name 'localizi-backup-*' -mtime +14 -delete
CRON
) | crontab -
```

Pour une vraie résilience : copier l'archive quotidienne vers un stockage
externe (Hostinger Object Storage / S3 / un autre serveur) via `rclone`.

---

## 9. Rollback

Tant que l'ancien serveur OVH tourne :
1. Cloudflare → remettre `A localizi.tn` et `A www.localizi.tn` sur `141.94.65.204`.
2. Purge cache Cloudflare.
3. Le trafic revient sur OVH en quelques minutes. Aucune donnée OVH n'a été
   touchée par la migration (opérations en lecture seule côté source).
