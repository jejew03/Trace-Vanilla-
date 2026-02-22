# Vanilla Trace

DApp de traçabilité de la filière vanille — Hedera Hello Future Apex Hackathon 2026.

## Structure du projet

- **contracts/** — Smart contracts Solidity (Hardhat)
- **backend/** — API Node.js (Express, Prisma, Hedera SDK)
- **frontend/** — Next.js 14 (App Router, Tailwind CSS)

## Setup (à compléter)

1. **Variables d'environnement**  
   Copier `.env.example` vers `.env` (backend) et `.env.local` (frontend). Renseigner les variables Hedera, base de données et IPFS.

2. **Backend**
   ```bash
   cd backend && npm install && npx prisma generate
   ```
   Créer la base PostgreSQL et lancer les migrations :
   ```bash
   npx prisma migrate dev
   npm run dev
   ```

3. **Frontend**
   ```bash
   cd frontend && npm install && npm run dev
   ```

4. **Contrats**
   ```bash
   cd contracts && npm install && npm run compile
   ```

## Test

_(Instructions à compléter après implémentation des routes et du seed.)_

## Licence

MIT
