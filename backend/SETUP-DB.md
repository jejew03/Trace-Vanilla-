# Créer la base PostgreSQL pour Vanilla Trace

## 1. Créer la base de données

Avec PostgreSQL installé localement :

**Option A — Ligne de commande**
```bash
# Créer la base "vanillatrace" (utilisateur courant)
createdb vanillatrace
```

**Option B — Avec psql**
```bash
psql -U postgres -c "CREATE DATABASE vanillatrace;"
```
(Remplace `postgres` par ton utilisateur PostgreSQL.)

---

## 2. Configurer le backend

Dans le dossier **backend**, crée un fichier `.env` (copie depuis la racine ou `.env.example`) et définis au minimum :

```bash
DATABASE_URL="postgresql://USER:MOT_DE_PASSE@localhost:5432/vanillatrace"
```

Remplace :
- `USER` = ton utilisateur PostgreSQL
- `MOT_DE_PASSE` = son mot de passe
- `vanillatrace` = le nom de la base (si tu as choisi un autre nom, adapte)

Exemple (sans mot de passe en local) :
```bash
DATABASE_URL="postgresql://macbook@localhost:5432/vanillatrace"
```

---

## 3. Créer les tables (schéma Prisma)

Toujours depuis le dossier **backend** :

```bash
npm run db:push
```

Cela crée les tables `Actor`, `Lot`, `HcsEvent` sans gérer des fichiers de migration.

**Alternative avec migrations** (pour garder un historique des changements) :
```bash
npm run db:migrate
```
(Prisma te demandera un nom pour la première migration, par ex. `init`.)

---

## 4. (Optionnel) Insérer un acteur de test

```bash
npm run seed:actor
```

Cela crée l’acteur `0.0.12345` (rôle FARMER) pour tester le dashboard en mode démo.

---

## Résumé des commandes

```bash
cd backend
createdb vanillatrace                    # 1. Créer la base (une seule fois)
# Éditer backend/.env avec DATABASE_URL   # 2. Config
npm run db:push                          # 3. Créer les tables
npm run seed:actor                       # 4. (Optionnel) Acteur de test
npm start                                # Démarrer l’API
```
