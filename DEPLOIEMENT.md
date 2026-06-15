# Guide de déploiement Localizi — OVH

## Architecture

```
Internet
   │
   ▼
[ Nginx proxy ] (:80 / :443)
   ├── /          → frontend (nginx SPA)
   ├── /api/      → backend FastAPI  (strip /api, proxy :8000)
   └── /uploads/  → fichiers statiques backend
```

Trois environnements :

| Environnement | Fichier Compose              | .env            | Accès        |
|---------------|------------------------------|-----------------|--------------|
| Dev           | docker-compose.yml           | .env.dev        | localhost    |
| Pré-prod      | docker-compose.preprod.yml   | .env.preprod    | IP serveur   |
| Prod          | docker-compose.prod.yml      | .env.prod       | HTTPS domaine|

---

## 1. Développement local

```bash
# Copier le fichier env (déjà prêt, peut être commité)
# .env.dev est inclus dans le repo

docker compose up --build
```

- Frontend : http://localhost:5173  (Vite HMR)
- Backend  : http://localhost:8000
- Swagger  : http://localhost:8000/docs

---

## 2. Pré-production (serveur OVH, sans SSL)

### 2a. Sur le serveur — première fois

```bash
# Installer Docker
bash deploy/setup-ovh.sh   # sans argument = pas de SSL

# Cloner le projet
git clone https://github.com/VOTRE_REPO/localizi.git /srv/localizi
cd /srv/localizi
```

### 2b. Configurer l'environnement

```bash
cp .env.preprod.example .env.preprod
nano .env.preprod    # remplir les valeurs
```

Valeurs à renseigner dans `.env.preprod` :
```
POSTGRES_USER=localizi_preprod
POSTGRES_PASSWORD=MOT_DE_PASSE_FORT
POSTGRES_DB=localizi_preprod_db
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
CORS_ORIGINS=http://IP_SERVEUR,http://preprod.votre-domaine.tn
```

### 2c. Lancer

```bash
./deploy/deploy.sh preprod
```

Accès : `http://IP_SERVEUR`

---

## 3. Production (OVH, HTTPS + domaine)

### 3a. Prérequis DNS

Pointer votre domaine vers l'IP OVH :
```
A    votre-domaine.tn     → IP_OVH
A    www.votre-domaine.tn → IP_OVH
```

Attendre la propagation DNS avant de continuer.

### 3b. Préparation serveur + SSL

```bash
bash deploy/setup-ovh.sh votre-domaine.tn
```

Ce script :
- Installe Docker + Compose
- Configure UFW (ports 22, 80, 443)
- Obtient un certificat Let's Encrypt
- Configure le renouvellement automatique

### 3c. Configurer l'environnement prod

```bash
cd /srv/localizi
cp .env.prod.example .env.prod
nano .env.prod
```

Valeurs `.env.prod` :
```
DATABASE_URL=postgresql://USER:PASS@HOST:5432/DB?sslmode=require
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
CORS_ORIGINS=https://votre-domaine.tn,https://www.votre-domaine.tn
```

### 3d. Mettre à jour nginx.prod.conf

Remplacer `votre-domaine.tn` par votre vrai domaine dans `docker/nginx.prod.conf` :
```bash
sed -i 's/votre-domaine.tn/VOTRE_VRAI_DOMAINE/g' docker/nginx.prod.conf
```

### 3e. Déployer

```bash
./deploy/deploy.sh prod
```

Accès : `https://votre-domaine.tn`

---

## 4. Mises à jour (re-déploiement)

```bash
cd /srv/localizi
./deploy/deploy.sh prod   # pull git + rebuild + restart
```

Le script :
1. `git pull` (fast-forward)
2. `docker compose up --build -d` (rebuild uniquement les images modifiées)
3. Vérifie `/health` du backend
4. Nettoie les anciennes images

---

## 5. Commandes utiles

```bash
# Voir les logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f proxy

# Redémarrer un service
docker compose -f docker-compose.prod.yml restart backend

# Ouvrir un shell dans le backend
docker compose -f docker-compose.prod.yml exec backend bash

# Sauvegarder la BDD
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup_$(date +%Y%m%d).sql

# Restaurer
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U $POSTGRES_USER $POSTGRES_DB < backup_20240101.sql

# Vérifier health check
curl http://localhost:8000/health
```

---

## 6. Structure des fichiers de déploiement

```
localizi/
├── Dockerfile.backend              # Image Python/FastAPI
├── Dockerfile.frontend             # Image Node build + Nginx SPA
├── docker-compose.yml              # Dev (volumes hot-reload)
├── docker-compose.preprod.yml      # Pré-prod (images buildées)
├── docker-compose.prod.yml         # Prod (SSL, limites mémoire)
├── .env.dev                        # Dev (commitable)
├── .env.preprod.example            # Template préprod
├── .env.prod.example               # Template prod (NE JAMAIS commiter .env.prod)
├── docker/
│   ├── nginx.preprod.conf          # Reverse proxy HTTP
│   └── nginx.prod.conf             # Reverse proxy HTTPS + SSL
├── frontend/real_estate_front/
│   └── nginx.frontend.conf         # SPA routing (dans le conteneur frontend)
└── deploy/
    ├── setup-ovh.sh                # Installation initiale serveur
    └── deploy.sh                   # Script de déploiement
```

---

## 7. Variables d'environnement — référence complète

| Variable         | Dev                          | Preprod/Prod                            |
|------------------|------------------------------|-----------------------------------------|
| `DATABASE_URL`   | auto via docker-compose      | PostgreSQL OVH Managed (recommandé)     |
| `SECRET_KEY`     | `dev-secret-key-...`         | `secrets.token_hex(32)` sur le serveur  |
| `CORS_ORIGINS`   | `http://localhost:5173`      | `https://votre-domaine.tn`              |
| `VITE_API_URL`   | `/api` (proxy Vite)          | `/api` (baked au build, proxy Nginx)    |

> **Note `VITE_API_URL`** : Vite bake cette valeur au moment du `npm run build`.
> En dev, le proxy Vite (`vite.config.js`) redirige `/api/*` vers `localhost:8000`.
> En préprod/prod, Nginx strip `/api/` et proxie vers `backend:8000`.
> Dans les deux cas, le frontend appelle toujours `/api/...` — aucun changement de code.
