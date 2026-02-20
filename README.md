# CUJ Modeler

Application full-stack pour créer et gérer des **Critical User Journeys (CUJ)** avec modélisation visuelle, association Dynatrace et export JSON.

## Architecture

```text
/cuj-modeler
  /frontend  -> React + Vite + TypeScript + React Flow + Zustand + Tailwind
  /backend   -> Node.js + Express + TypeScript + SQLite
```

## Pré-requis

- Node.js 20+
- npm 10+

## Installation

```bash
npm install
cp .env.example .env
```


## Configurer l'accès à npm (proxy / registry privé)

Si `npm install` échoue avec un `403`, c'est souvent lié à une politique réseau (proxy d'entreprise, registry interne obligatoire, token manquant).

1. Créer votre fichier npm local depuis le template :

```bash
cp .npmrc.example .npmrc
```

2. Adapter les clés dans `.npmrc` :
   - `registry` vers votre registry interne si nécessaire
   - `proxy` / `https-proxy` si votre réseau l'impose
   - token `_authToken` si votre registry est privé

3. Vérifier la connectivité :

```bash
npm ping
npm whoami
```

4. Réinstaller :

```bash
npm install
```

> Important : ne pas committer `.npmrc` s'il contient des secrets.

## Démarrage

### Backend

```bash
npm run dev -w cuj-modeler/backend
```

API disponible sur `http://localhost:4000`.

### Frontend

```bash
npm run dev -w cuj-modeler/frontend
```

UI disponible sur `http://localhost:5173`.

## Scripts utiles

- `npm run build` : build frontend + backend
- `npm run lint` : vérification TypeScript frontend + backend

## Fonctionnalités livrées

- Dashboard CUJ : liste, création, suppression, navigation éditeur
- Éditeur CUJ avec React Flow :
  - StepNodes connectés
  - Drag & drop de macrofonctionnalités depuis la sidebar
  - Drawer de détails à droite
  - Association de pages Dynatrace mockables
- Store Zustand avec actions demandées (`addStep`, `removeStep`, `addMacroToStep`, `removeMacroFromStep`, `attachDynatracePages`, `exportCUJ`)
- Backend REST :
  - `GET/POST /api/cuj`
  - `GET/PUT/DELETE /api/cuj/:id`
  - `GET /api/dynatrace/pages`
- Export JSON CUJ depuis le bouton dans l'éditeur
- Persistance CUJ en SQLite (`backend/data.sqlite`)

## Dynatrace (MVP)

Le service lit `DYNATRACE_TOKEN` depuis `.env`.

- Si absent : retourne les pages mockées (`APP-001`, `APP-002`)
- Si présent : point d'extension prêt pour brancher l'API réelle sans coupler l'UI

## Extensibilité (phase 2 ready)

Architecture pensée pour extension :
- services API centralisés côté frontend
- service Dynatrace isolé côté backend
- typage strict et séparation UI / logique métier

Extensions futures facilitées :
- collaboration temps réel
- scoring / SLO
- versioning CUJ
- authentification
