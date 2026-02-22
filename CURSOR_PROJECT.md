# 🌿 VANILLA TRACE — CURSOR PROJECT FILE
> **Ce fichier est la source de vérité pour Cursor.**
> Lis-le en entier avant de générer du code. Reviens le consulter à chaque nouvelle session.
> Mets à jour les statuts au fur et à mesure de l'avancement.

---

## 📌 CONTEXTE RAPIDE

| Champ | Valeur |
|---|---|
| Projet | Vanilla Trace — DApp de traçabilité de la filière vanille |
| Hackathon | Hedera Hello Future Apex Hackathon 2026 |
| Track | Open Track — Supply Chain Traceability |
| Deadline | **23 mars 2026, 23h59 ET** |
| Réseau | Hedera Testnet (démo) → Mainnet (post-hackathon) |
| Repo | https://github.com/jejew03/Trace-Vanilla- |
| Live URL | *(à renseigner après déploiement)* |

---

## 🧠 CE QUE FAIT CE PROJET (en 3 lignes)

Vanilla Trace tokenise chaque lot de vanille en **NFT HTS Hedera** et enregistre chaque étape de production (récolte → séchage → export) comme **événements immuables sur HCS**. Un **smart contract EVM** gère les rôles et droits. Les acheteurs B2B scannent un **QR code** pour vérifier l'authenticité d'un lot en temps réel via **Mirror Node Hedera**, avec un score de complétude de traçabilité calculé dynamiquement.

---

## 🏗️ ARCHITECTURE — RÈGLES ABSOLUES

> ⚠️ Ces règles ne doivent JAMAIS être violées dans le code généré.

```
HTS NFT        = identifiant canonique du lot (tokenId + serial)
               = seul moyen de transférer la propriété d'un lot

HCS Topic      = "vanilla-trace-events" (1 topic global MVP)
               = journal immuable de TOUS les événements
               = chaque message contient le tokenId + serial du lot

EVM Contract   = registry des rôles UNIQUEMENT
               = règles de validation des étapes
               = attestation minimale (hash événement HCS)
               = NE STOCKE PAS les lots (HTS = asset, pas le contrat)

Mirror Node    = SEULE source de lecture de l'historique HCS
               = indexé par le backend PostgreSQL
               = alimente /verify/:lotId en < 3 secondes

Clés privées   = JAMAIS côté serveur
               = signature côté client uniquement (HashConnect)
```

---

## 📁 STRUCTURE DU PROJET

```
vanilla-trace/
├── contracts/                    # Smart contracts Solidity
│   ├── src/
│   │   └── VanillaTrace.sol      # Contract principal (rôles + attestation)
│   ├── test/
│   │   └── VanillaTrace.test.js  # Tests Hardhat
│   └── scripts/
│       └── deploy.js             # Script de déploiement Hedera EVM
│
├── backend/                      # API Node.js
│   ├── src/
│   │   ├── routes/
│   │   │   ├── lots.js           # CRUD lots + mint NFT HTS
│   │   │   ├── steps.js          # Validation étapes + publication HCS
│   │   │   ├── verify.js         # Portail vérification (Mirror Node)
│   │   │   └── admin.js          # Dashboard impact Hedera
│   │   ├── services/
│   │   │   ├── hedera.js         # Client Hedera SDK (HTS + HCS)
│   │   │   ├── mirror.js         # Lecture Mirror Node API
│   │   │   ├── ipfs.js           # Upload métadonnées Pinata
│   │   │   └── roles.js          # Vérification rôles on-chain
│   │   ├── prisma/
│   │   │   └── schema.prisma     # Modèle DB (hcs_events, lots, actors)
│   │   └── index.js              # Entry point Express
│   ├── .env.example
│   └── package.json
│
├── frontend/                     # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── verify/[lotId]/
│   │   │   └── page.tsx          # Portail vérification public
│   │   ├── scan/
│   │   │   └── page.tsx          # Scanner QR
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard acteurs connectés
│   │   ├── lots/
│   │   │   ├── new/page.tsx      # Création lot (FARMER)
│   │   │   └── [id]/step/page.tsx # Validation étape
│   │   └── admin/
│   │       └── page.tsx          # Dashboard admin + impact Hedera
│   ├── components/
│   │   ├── QRCode.tsx
│   │   ├── QRScanner.tsx
│   │   ├── TraceabilityScore.tsx  # Score de complétude 0-100%
│   │   ├── StepTimeline.tsx       # Timeline historique HCS
│   │   ├── WalletConnect.tsx      # HashPack connection
│   │   └── ImpactCounter.tsx      # Dashboard admin métriques
│   ├── lib/
│   │   ├── hashconnect.ts         # HashConnect client
│   │   └── api.ts                 # Appels API backend
│   └── package.json
│
├── .env.example                   # Variables d'environnement (voir section ENV)
├── CURSOR_PROJECT.md              # CE FICHIER — source de vérité Cursor
└── README.md                      # Instructions setup + test (pour les juges)
```

---

## 🔑 VARIABLES D'ENVIRONNEMENT REQUISES

```bash
# .env (backend)

# Hedera
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.XXXXXX          # Compte opérateur (paie les frais testnet)
HEDERA_OPERATOR_KEY=302e...            # Clé privée opérateur (NE JAMAIS committer)
HEDERA_TOKEN_ID=0.0.YYYYYY            # TokenId HTS (rempli après déploiement)
HEDERA_TOPIC_ID=0.0.ZZZZZZ            # TopicId HCS (rempli après déploiement)
HEDERA_CONTRACT_ID=0.0.WWWWWW         # ContractId EVM (rempli après déploiement)

# Mirror Node
MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com

# Base de données
DATABASE_URL=postgresql://user:pass@localhost:5432/vanillatrace

# IPFS
PINATA_API_KEY=...
PINATA_SECRET_KEY=...

# Sécurité
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

```bash
# .env.local (frontend)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_HASHCONNECT_APP_NAME=VanillaTrace
```

---

## 📐 SCHÉMAS DE DONNÉES

### NFT HTS — Métadonnées (stockées sur IPFS)
```json
{
  "name": "VANILLE-001",
  "description": "Lot de vanille Vanilla planifolia, origine Antalaha Madagascar",
  "image": "ipfs://QmXXX",
  "properties": {
    "lotId": "0.0.123456-1",
    "tokenId": "0.0.123456",
    "serial": 1,
    "origin": "Antalaha, Madagascar",
    "variety": "Vanilla planifolia",
    "harvestDate": "2026-03-01",
    "weight_kg": 120,
    "quality_grade": "A",
    "farmer": "0.0.789012"
  }
}
```

### Message HCS — Schema strict
```json
{
  "version": "1.0",
  "lotId": "0.0.123456-1",
  "tokenId": "0.0.123456",
  "serial": 1,
  "step": "HARVEST",
  "actor": {
    "hederaAccount": "0.0.789012",
    "role": "FARMER"
  },
  "timestamp": "2026-03-01T08:30:00Z",
  "location": { "locality": "Antalaha, Madagascar" },
  "data": {
    "weight_kg": 120,
    "variety": "Vanilla planifolia",
    "quality_grade": "A"
  },
  "ipfsRef": "QmXXXXXXXXXXXXXX",
  "eventHash": "0xABCD...",
  "txRef": ""
}
```

### Prisma Schema (PostgreSQL)
```prisma
model Actor {
  id            String   @id @default(cuid())
  hederaAccount String   @unique
  role          String   // FARMER | DRYER | EXPORTER | IMPORTER | ADMIN
  name          String?
  createdAt     DateTime @default(now())
}

model Lot {
  id        String   @id @default(cuid())
  lotId     String   @unique  // "tokenId-serial" ex: "0.0.123456-1"
  tokenId   String
  serial    Int
  ipfsRef   String?
  createdAt DateTime @default(now())
  events    HcsEvent[]
}

model HcsEvent {
  id            String   @id @default(cuid())
  lotId         String
  step          String   // HARVEST | DRYING | PACKAGING | EXPORT | IMPORT
  actorAccount  String
  role          String
  timestamp     DateTime
  ipfsRef       String?
  eventHash     String?
  txId          String?
  lot           Lot      @relation(fields: [lotId], references: [lotId])
  @@index([lotId])
}
```

---

## 🎭 RÔLES ET ÉTAPES AUTORISÉES

```
ADMIN    → peut assigner des rôles, provisionner des comptes
FARMER   → peut créer un lot (mint NFT) + valider HARVEST
DRYER    → peut valider DRYING
EXPORTER → peut valider PACKAGING + EXPORT + transférer le NFT
IMPORTER → peut valider IMPORT
BUYER    → peut uniquement consulter (lecture seule)
```

### Score de complétude (calcul)
```
HARVEST   → 25%
DRYING    → 50%
PACKAGING → 65%
EXPORT    → 85%
IMPORT    → 100%
```

---

## 📄 SMART CONTRACT — VanillaTrace.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VanillaTrace {

    enum Role { NONE, FARMER, DRYER, EXPORTER, IMPORTER, ADMIN }
    enum Step { HARVEST, DRYING, PACKAGING, EXPORT, IMPORT }

    struct StepAttestation {
        uint256 timestamp;
        address actor;
        bytes32 eventHash;
        Step step;
    }

    address public owner;
    mapping(address => Role) public roles;
    mapping(bytes32 => StepAttestation[]) public attestations;

    // Étapes autorisées par rôle
    mapping(Role => mapping(Step => bool)) public stepAllowed;

    event RoleSet(address indexed actor, Role role);
    event StepAttested(bytes32 indexed lotRef, Step step, address actor, bytes32 eventHash);

    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.ADMIN, "Not admin");
        _;
    }

    modifier onlyRole(Role required) {
        require(roles[msg.sender] == required, "Wrong role");
        _;
    }

    constructor() {
        owner = msg.sender;
        roles[msg.sender] = Role.ADMIN;
        // Init des permissions
        stepAllowed[Role.FARMER][Step.HARVEST] = true;
        stepAllowed[Role.DRYER][Step.DRYING] = true;
        stepAllowed[Role.EXPORTER][Step.PACKAGING] = true;
        stepAllowed[Role.EXPORTER][Step.EXPORT] = true;
        stepAllowed[Role.IMPORTER][Step.IMPORT] = true;
    }

    function setRole(address actor, Role role) external onlyAdmin {
        roles[actor] = role;
        emit RoleSet(actor, role);
    }

    function attestStep(bytes32 lotRef, Step step, bytes32 eventHash) external {
        require(stepAllowed[roles[msg.sender]][step], "Step not allowed for role");
        attestations[lotRef].push(StepAttestation({
            timestamp: block.timestamp,
            actor: msg.sender,
            eventHash: eventHash,
            step: step
        }));
        emit StepAttested(lotRef, step, msg.sender, eventHash);
    }

    function getAttestations(bytes32 lotRef) external view returns (StepAttestation[] memory) {
        return attestations[lotRef];
    }

    function isStepAllowed(address actor, Step step) external view returns (bool) {
        return stepAllowed[roles[actor]][step];
    }
}
```

---

## 🗓️ SUIVI D'AVANCEMENT PAR SPRINT

> **Mets à jour ce tableau à chaque session Cursor.**
> Statuts : `[ ]` À faire · `[~]` En cours · `[x]` Terminé · `[!]` Bloqué

### SPRINT 1 — Setup & Infrastructure (17-23 fév.)
- [x] Initialiser le monorepo (`vanilla-trace/`)
- [x] Setup Hardhat + Solidity + déploiement testnet
- [x] Créer le topic HCS `vanilla-trace-events` (script deploy.js)
- [x] Créer le token HTS (NFT collection) (script deploy.js)
- [x] Déployer `VanillaTrace.sol` sur Hedera EVM testnet (script deploy.js)
- [x] Setup Next.js 14 + Tailwind CSS
- [x] Setup Express + Prisma + PostgreSQL
- [x] Configurer les variables d'environnement
- [ ] Premier commit GitHub avec structure de base

### SPRINT 2 — Core Hedera (24 fév. – 2 mars)
- [ ] `hedera.js` — service mint NFT HTS (createToken + mintToken)
- [ ] `hedera.js` — service publication message HCS
- [ ] `hedera.js` — service transfert NFT HTS entre acteurs
- [ ] `roles.js` — vérification rôle on-chain via contract
- [ ] `mirror.js` — lecture messages HCS depuis Mirror Node API
- [ ] PostgreSQL indexation HCS events (table `hcs_events`)
- [ ] API route `POST /lots` — créer un lot + mint NFT
- [ ] API route `POST /lots/:id/steps` — valider étape + publier HCS
- [x] Tests Hardhat sur `VanillaTrace.sol`

### SPRINT 3 — Frontend & UX (3-9 mars)
- [ ] Landing page `/` (one-liner + CTA)
- [ ] `WalletConnect.tsx` — intégration HashConnect/HashPack
- [ ] Dashboard acteurs `/dashboard` (mes lots + actions disponibles)
- [ ] Page création lot `/lots/new` (formulaire FARMER → mint NFT)
- [ ] Page validation étape `/lots/:id/step` (par rôle)
- [ ] `QRCode.tsx` — génération QR par lot
- [ ] `QRScanner.tsx` — scanner QR page `/scan`
- [ ] i18n français/anglais (next-intl)

### SPRINT 4 — Vérification & Admin (10-16 mars)
- [ ] API route `GET /verify/:lotId` — historique complet < 3s
- [ ] Portail de vérification `/verify/:lotId`
- [ ] `TraceabilityScore.tsx` — score 0-100% calculé depuis HCS events
- [ ] `StepTimeline.tsx` — timeline visuelle des étapes
- [ ] Dashboard admin `/admin` — métriques impact Hedera
- [ ] `ImpactCounter.tsx` — #comptes, #NFTs, #HCS, #transferts
- [ ] Tests de performance (vérifier < 3s sur `/verify`)
- [ ] Rate limiting sur l'API backend

### SPRINT 5 — Finalisation & Soumission (17-23 mars)
- [ ] Déploiement frontend sur Vercel
- [ ] Déploiement backend sur Railway
- [ ] README complet (setup + test + adresses contrats)
- [ ] Capturer tableau impact Hedera (démo script)
- [ ] Enregistrer vidéo démo (suivre le demo script)
- [ ] Upload vidéo YouTube + récupérer le lien
- [ ] Finaliser Pitch Deck PDF
- [ ] Soumission hackathon (≥ 1h avant deadline)

---

## 💬 PROMPTS CURSOR — UTILISATION PAR PHASE

> Copie-colle ces prompts directement dans Cursor selon ta phase d'avancement.
> Toujours commencer par : **"Lis CURSOR_PROJECT.md en entier avant de commencer."**

---

### 🚀 PROMPT 0 — Initialisation du projet

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Initialise la structure complète du monorepo Vanilla Trace telle que définie dans la section "STRUCTURE DU PROJET" de CURSOR_PROJECT.md.

Actions à réaliser :
1. Crée tous les dossiers et fichiers vides avec la bonne arborescence
2. Initialise le projet Node.js dans /backend (package.json avec les dépendances : express, @hashgraph/sdk, @prisma/client, dotenv, cors, express-rate-limit, axios)
3. Initialise le projet Next.js 14 dans /frontend avec App Router et Tailwind CSS
4. Initialise Hardhat dans /contracts (avec solidity 0.8.20 et les dépendances : hardhat, @nomicfoundation/hardhat-toolbox, @hashgraph/sdk)
5. Crée le fichier .env.example à la racine avec toutes les variables listées dans CURSOR_PROJECT.md
6. Crée un .gitignore qui exclut .env, node_modules, .next, dist
7. Crée le fichier README.md de base avec le nom du projet et les instructions de setup à compléter

Ne génère pas encore de logique métier — structure et configuration uniquement.
```

---

### 📝 PROMPT 1 — Smart Contract VanillaTrace.sol

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Génère le fichier contracts/VanillaTrace.sol complet en utilisant exactement le code défini dans la section "SMART CONTRACT — VanillaTrace.sol" de CURSOR_PROJECT.md.

Ensuite génère contracts/test/VanillaTrace.test.js avec les tests Hardhat suivants :
- Test : setRole() assigne bien un rôle à une adresse
- Test : attestStep() réussit si le rôle est autorisé pour l'étape (FARMER + HARVEST)
- Test : attestStep() échoue si le rôle n'est pas autorisé (FARMER + DRYING)
- Test : getAttestations() retourne bien les attestations d'un lot
- Test : isStepAllowed() retourne true/false correctement

Génère aussi contracts/scripts/deploy.js qui :
1. Déploie VanillaTrace.sol sur Hedera EVM via Hedera SDK (@hashgraph/sdk)
2. Utilise HEDERA_OPERATOR_ID et HEDERA_OPERATOR_KEY depuis .env
3. Log l'adresse du contrat déployé (HEDERA_CONTRACT_ID)
4. Crée le topic HCS "vanilla-trace-events" et log le HEDERA_TOPIC_ID
5. Crée le token HTS (NFT collection "VanillaTrace", symbol "VTR") et log HEDERA_TOKEN_ID

Respecte la règle : le contrat NE stocke PAS les lots. HTS = asset. HCS = historique.
```

---

### ⚙️ PROMPT 2 — Service Hedera (Backend)

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Génère backend/src/services/hedera.js — le service central qui encapsule toutes les interactions avec le SDK Hedera (@hashgraph/sdk).

Ce service doit exporter les fonctions suivantes :

1. mintLotNFT(metadata: object) → Promise<{ tokenId, serial, txId }>
   - Upload les métadonnées sur IPFS via le service ipfs.js
   - Mint un NFT HTS avec le HEDERA_TOKEN_ID depuis .env
   - Retourne tokenId, serial et txId

2. publishHCSEvent(eventPayload: object) → Promise<{ txId }>
   - Sérialise l'eventPayload en JSON
   - Publie le message sur le topic HEDERA_TOPIC_ID
   - Retourne le txId de la transaction HCS

3. transferLotNFT(tokenId, serial, fromAccountId, toAccountId) → Promise<{ txId }>
   - Transfère le NFT du fromAccount vers le toAccount
   - Retourne le txId

4. createHederaAccount() → Promise<{ accountId, privateKey, publicKey }>
   - Crée un nouveau compte Hedera sur testnet
   - Retourne accountId + keypair (NE PAS stocker la clé privée côté serveur)

Règles impératives :
- Utilise HEDERA_OPERATOR_ID et HEDERA_OPERATOR_KEY depuis process.env
- Le client Hedera est initialisé une seule fois (singleton)
- Gère les erreurs avec try/catch et messages clairs
- Pour createHederaAccount : le compte opérateur sponsorise la création (testnet)
```

---

### 🔍 PROMPT 3 — Service Mirror Node + Indexation

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Génère backend/src/services/mirror.js — service de lecture du Mirror Node Hedera.

Ce service doit exporter :

1. getTopicMessages(topicId, lotId?) → Promise<HCSEvent[]>
   - Appel GET sur MIRROR_NODE_URL/api/v1/topics/{topicId}/messages
   - Filtre les messages par lotId si fourni (filtre dans le contenu JSON du message)
   - Retourne les messages parsés selon le schema HCS de CURSOR_PROJECT.md
   - Gère la pagination (limit=100, timestamp desc)

2. indexLotEvents(lotId) → Promise<void>
   - Appelle getTopicMessages() avec le lotId
   - Upsert les événements dans la table hcs_events (Prisma)
   - Met à jour le cache PostgreSQL

3. getLotHistory(lotId) → Promise<HCSEvent[]>
   - Cherche d'abord dans PostgreSQL (index lotId)
   - Si vide, appelle indexLotEvents() puis retourne depuis DB
   - Objectif : réponse < 3 secondes

Génère aussi backend/src/routes/verify.js :
- GET /verify/:lotId → appelle getLotHistory() → retourne { lot, events, score }
- Le score est calculé selon la table de CURSOR_PROJECT.md (HARVEST=25%, ..., IMPORT=100%)
- Temps de réponse cible : < 3 secondes
```

---

### 🪙 PROMPT 4 — API Routes Lots & Steps

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Génère les routes API backend :

backend/src/routes/lots.js :
- POST /lots → créer un lot
  Body: { farmerAccountId, origin, variety, weight_kg, quality_grade, harvestDate }
  Actions: 1) upload métadonnées IPFS, 2) mint NFT HTS, 3) créer entry Prisma Lot
  Retourne: { lotId, tokenId, serial, ipfsRef, txId }

- GET /lots → liste tous les lots (avec pagination)
- GET /lots/:lotId → détail d'un lot + ses événements HCS (depuis DB)

backend/src/routes/steps.js :
- POST /lots/:lotId/steps → valider une étape
  Body: { actorAccountId, step, data: {} }
  Actions:
    1) Vérifier que l'acteur a le bon rôle (appel contract isStepAllowed)
    2) Construire le message HCS selon le schema de CURSOR_PROJECT.md
    3) Calculer eventHash (SHA256 du message JSON)
    4) Publier le message sur HCS via hedera.js
    5) Si étape = EXPORT : transférer le NFT (FARMER → EXPORTER)
    6) Sauvegarder l'événement en DB (table hcs_events)
  Retourne: { txId, eventHash, step, timestamp }

Règles :
- Validation des inputs avec express-validator
- Réponse d'erreur claire si rôle non autorisé (403)
- Réponse d'erreur claire si étape déjà validée pour ce lot (409)
```

---

### 🎨 PROMPT 5 — Frontend : Portail de Vérification

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Génère la page de vérification publique frontend/app/verify/[lotId]/page.tsx.

Cette page est la plus importante du projet (jugée par les acheteurs B2B + les juges).

Elle doit :
1. Appeler GET /verify/:lotId (API backend) au chargement
2. Afficher le composant TraceabilityScore (score 0-100% en grand, visuel circulaire)
3. Afficher le composant StepTimeline avec :
   - Chaque étape (HARVEST, DRYING, PACKAGING, EXPORT, IMPORT)
   - Statut : complété (vert + checkmark) ou en attente (gris)
   - Pour chaque étape complétée : acteur, timestamp, localité, lien Hashscan
4. Afficher les métadonnées du lot (variété, poids, origine, grade)
5. Afficher un lien vers le NFT sur Hashscan (https://hashscan.io/testnet/token/{tokenId}/{serial})
6. Afficher un bouton "Partager" (copie l'URL)
7. Afficher un state de loading et un state d'erreur (lot non trouvé)

Contraintes UX de CURSOR_PROJECT.md :
- Zéro jargon crypto (pas de "tokenId", "HCS", "gas" visible — remplacer par des termes métier)
- Responsive mobile first
- Temps de chargement < 3s
- Disponible en FR et EN (i18n)

Génère aussi les composants :
- frontend/components/TraceabilityScore.tsx (jauge circulaire SVG)
- frontend/components/StepTimeline.tsx (timeline verticale)
```

---

### 📱 PROMPT 6 — Frontend : Dashboard Acteurs

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Génère frontend/app/dashboard/page.tsx — le dashboard principal des acteurs connectés.

Ce dashboard doit :
1. Vérifier que l'utilisateur est connecté via HashPack (HashConnect)
2. Détecter le rôle de l'utilisateur (appel API /actors/:accountId/role)
3. Afficher selon le rôle :
   - FARMER : ses lots créés + bouton "Créer un nouveau lot" + bouton "Valider récolte"
   - DRYER : lots en attente de séchage (étape HARVEST complétée, DRYING manquante)
   - EXPORTER : lots en attente d'emballage/export
   - ADMIN : accès au dashboard admin complet
4. Chaque lot affiché montre : ID lot, score traçabilité, prochaine étape requise, QR code

Génère aussi frontend/components/WalletConnect.tsx :
- Bouton "Connecter HashPack"
- Utilise HashConnect pour la connexion
- Affiche l'accountId connecté une fois connecté (ex: "0.0.789012 · FARMER")
- Bouton déconnexion
- Zéro jargon crypto dans le label (afficher "Mon compte" pas "wallet")
```

---

### 🌱 PROMPT 7 — Frontend : Création de Lot

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Génère frontend/app/lots/new/page.tsx — formulaire de création de lot (FARMER uniquement).

Le formulaire doit demander :
- Nom du lot (ex: "VANILLE-001") — généré automatiquement mais modifiable
- Variété (Vanilla planifolia, Vanilla tahitensis — select)
- Localité d'origine (texte libre)
- Date de récolte (date picker)
- Poids en kg (nombre)
- Grade qualité (A, B, C — select avec descriptions visuelles sans jargon)

À la soumission :
1. Afficher un spinner "Enregistrement en cours..."
2. Appeler POST /lots (API backend)
3. Afficher la confirmation : "Votre lot {nom} a bien été enregistré ✓"
4. Afficher le QR code généré
5. Bouton "Valider la récolte maintenant" → redirige vers /lots/:id/step

Règles UX de CURSOR_PROJECT.md :
- Aucun jargon crypto dans le formulaire
- Labels en termes agricoles ("Grade de qualité" pas "metadata")
- Message d'erreur clair si la transaction Hedera échoue
- Responsive mobile (agriculteurs = smartphones)
```

---

### 🔐 PROMPT 8 — Frontend : Validation d'Étape

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Génère frontend/app/lots/[id]/step/page.tsx — page de validation d'étape.

Cette page doit :
1. Charger le lot depuis GET /lots/:lotId
2. Identifier la prochaine étape autorisée selon le rôle de l'utilisateur connecté
3. Afficher un formulaire de validation adapté à l'étape :
   - HARVEST : poids final, grade, observations
   - DRYING : durée de séchage (jours), méthode (soleil/four), taux humidité
   - PACKAGING : poids conditionné, type emballage, nombre d'unités
   - EXPORT : pays destination, transporteur, date départ estimée
   - IMPORT : date arrivée, état à réception, commentaire douanier
4. À la soumission : appeler POST /lots/:lotId/steps
5. Afficher la confirmation avec le nouveau score de traçabilité

Si l'utilisateur n'a pas le bon rôle pour cette étape : afficher un message clair ("Cette étape doit être validée par le sécheur") sans mention de smart contract ou de rôle on-chain.
```

---

### 📊 PROMPT 9 — Dashboard Admin & Impact Hedera

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Génère frontend/app/admin/page.tsx — dashboard admin réservé au rôle ADMIN.

Ce dashboard est critique pour prouver l'impact Hedera aux juges.

Il doit afficher en temps réel (polling toutes les 10s) :
1. Compteurs impact Hedera (composant ImpactCounter) :
   - Nombre de comptes Hedera créés
   - Nombre de NFT HTS mintés
   - Nombre de messages HCS publiés
   - Nombre de transferts HTS effectués

2. Liste des acteurs enregistrés (accountId, rôle, date création)

3. Liste des lots avec leur score de traçabilité actuel

4. Bouton "Provisionner un compte démo" → appelle POST /admin/accounts → crée un compte Hedera via hedera.js et affiche accountId + rôle assignable

5. Bouton "Exporter les métriques" → génère un CSV des métriques pour le pitch deck

Génère aussi :
- frontend/components/ImpactCounter.tsx (4 compteurs animés, style dashboard)
- backend/src/routes/admin.js (GET /admin/metrics, POST /admin/accounts)
```

---

### 🔧 PROMPT 10 — QR Code & Scanner

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Génère les deux composants QR code :

1. frontend/components/QRCode.tsx
   - Props : lotId (string), size? (number, défaut 200)
   - Génère un QR code qui encode l'URL : {NEXT_PUBLIC_APP_URL}/verify/{lotId}
   - Utilise la bibliothèque qrcode.react
   - Bouton "Télécharger" pour sauvegarder le QR en PNG
   - Style : carré avec logo Vanilla Trace au centre (optionnel)

2. frontend/app/scan/page.tsx + frontend/components/QRScanner.tsx
   - Scanner QR via la caméra (bibliothèque html5-qrcode)
   - Demande permission caméra au chargement
   - Quand un QR est scanné : redirige vers /verify/:lotId
   - Fallback : input manuel de l'ID lot si la caméra n'est pas disponible
   - Message clair si QR invalide (pas un lot Vanilla Trace)
   - Fonctionne sur mobile (priorité caméra arrière)
```

---

### 🌍 PROMPT 11 — i18n et Landing Page

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Génère la landing page frontend/app/page.tsx et configure l'i18n.

Landing page :
- Hero section avec one-liner : "La traçabilité de la vanille, certifiée et vérifiable en 3 secondes."
- 3 blocs de valeur (agriculteur / exportateur / acheteur B2B) selon CURSOR_PROJECT.md section 1.4
- Section "Comment ça marche" (4 étapes visuelles : Récolte → Séchage → Export → Vérification)
- CTA principal : "Vérifier un lot" (→ /scan) et "Créer un compte" (→ /dashboard)
- Section métriques live : #lots traçés, #vérifications effectuées (depuis API /admin/metrics)
- Footer avec liens : GitHub, Hackathon Hedera, Hashscan

Configure next-intl pour i18n FR/EN :
- Fichiers de traduction dans /messages/fr.json et /messages/en.json
- Switcher de langue dans le header
- Toutes les pages doivent utiliser useTranslations() pour les textes
- Les termes techniques Hedera sont CACHÉS dans les traductions (utiliser des termes métier)
```

---

### 🧪 PROMPT 12 — Tests & Performance

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Génère les tests suivants :

1. Tests Hardhat (contracts/test/VanillaTrace.test.js) — si pas encore fait :
   Couvre tous les cas décrits dans CURSOR_PROJECT.md PROMPT 1.

2. Tests API backend (backend/src/__tests__/verify.test.js) :
   - Test : GET /verify/:lotId retourne bien { lot, events, score } en < 3000ms
   - Test : score = 25 si seulement HARVEST, = 100 si toutes les étapes
   - Test : retourne 404 si lotId inexistant
   - Mock le Mirror Node et PostgreSQL (jest.mock)

3. Script de seed (backend/src/scripts/seed.js) :
   - Crée 4 acteurs de démo (FARMER, DRYER, EXPORTER, BUYER) sur Hedera testnet
   - Crée 2 lots de démo et valide toutes les étapes pour le lot 1 (score 100%)
   - Valide seulement HARVEST pour le lot 2 (score 25%)
   - Log toutes les adresses/IDs créés pour les inclure dans README
   - Ce script permet de reproduire la démo en 1 commande

Ajoute dans package.json (backend) : "seed": "node src/scripts/seed.js"
```

---

### 📦 PROMPT 13 — Déploiement & README Final

```
Lis CURSOR_PROJECT.md en entier avant de commencer.

Génère les fichiers de déploiement et le README final pour les juges du hackathon.

1. Fichier vercel.json (frontend) :
   - Configuration pour Next.js 14
   - Variables d'environnement publiques

2. Fichier railway.json ou Procfile (backend) :
   - Start command : node src/index.js
   - Build command : npx prisma migrate deploy && node src/index.js

3. .github/workflows/ci.yml :
   - Lint + tests backend (Jest) sur push/PR
   - Build frontend Next.js sur push/PR
   - Deploy sur Vercel/Railway sur push main

4. README.md complet (pour les juges) avec :
   - Description du projet (100 mots — copie depuis TDR section 12)
   - Track : Open Track
   - Tech stack complet
   - Adresses Hedera Testnet (TOKEN_ID, TOPIC_ID, CONTRACT_ID) — laisser des placeholders
   - Instructions setup local (3 commandes max pour lancer le projet)
   - Instructions test (npm run seed + URL live)
   - Lien vidéo démo YouTube — placeholder
   - Lien pitch deck — placeholder
   - Tableau impact Hedera (à remplir lors de la démo)
```

---

## 🚨 RÈGLES GÉNÉRALES POUR CURSOR

> Ces règles s'appliquent à TOUS les prompts, dans TOUTES les sessions.

1. **Toujours lire CURSOR_PROJECT.md en entier** avant de générer du code
2. **Ne jamais stocker les lots dans le smart contract** — HTS est l'asset, HCS est l'historique
3. **Ne jamais exposer les clés privées côté serveur** — signature côté client HashConnect uniquement
4. **Zéro jargon crypto dans l'UI** — utiliser des termes métier agricoles
5. **1 topic HCS global** (`vanilla-trace-events`) — ne pas créer un topic par lot
6. **Le score de traçabilité** doit toujours être calculé depuis les events HCS (pas le contrat)
7. **Mirror Node** est la seule source de vérité pour l'historique — ne pas re-lire HCS directement
8. **F-14 (splitting)** est HORS MVP — ne pas implémenter
9. **Rate limiting** : 100 req/min par IP sur toutes les routes API
10. **Mettre à jour le tableau de suivi** dans ce fichier après chaque sprint complété

---

## 📊 ÉTAT ACTUEL DU PROJET

```
Dernière mise à jour : 22 fév. 2026
Sprint actuel       : Sprint 1 — Setup (terminé) / Sprint 2 — Core Hedera
Blocages            : Aucun
Prochaine action    : Exécuter PROMPT 2 — Service Hedera (backend)
```

---

*CURSOR_PROJECT.md — Vanilla Trace v1.0*
*Source de vérité pour toutes les sessions Cursor.*
*Ne pas supprimer ce fichier. Le mettre à la racine du projet.*
