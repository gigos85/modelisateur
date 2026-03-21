# Guide de Déploiement Frontend + Backend

## Architecture

Le frontend (React/Vite) est construit et servi par le backend (Express) sur la même URL.

```
Frontend (Client) 
    ↓
Backend Express (http://localhost:4000)
    ├── Fichiers statiques (/) → dist/
    └── API Routes (/api/*)
```

## Configuration

### 1. Frontend (API Relatives)
- Les URLs API utilisent des chemins relatifs (`/api/cuj`, `/api/dynatrace`)
- Cela permet au frontend de fonctionner depuis n'importe quelle origine
- Fichiers modifiés: `src/api/cujApi.ts`, `src/api/dynatraceApi.ts`

### 2. Backend (Static Serving)
- Express sert les fichiers statiques du répertoire `frontend/dist`
- Une route `*` fallback redirige vers `index.html` pour le routage côté client (SPA)
- Les routes API restent séparées et accessibles via `/api/*`
- Fichier modifié: `src/index.js`

## Scripts de Build

### Frontend
```bash
cd frontend
npm run build          # Construit le frontend dans dist/
npm run dev           # Mode développement
```

### Backend
```bash
cd backend
npm run build         # Construit uniquement le frontend
npm run build:full    # Construit le frontend puis démarre le serveur
npm run dev           # Mode développement (sans frontend)
npm start             # Démarre le serveur
```

## Flux de Déploiement

### Développement séparé (frontend + backend)
```bash
# Terminal 1: Frontend dev
cd frontend
npm run dev          # http://localhost:5173 (Vite dev server)

# Terminal 2: Backend
cd backend
npm run dev          # http://localhost:4000 (API)
```

### Production (frontend intégré au backend)
```bash
# S'assurer que les dépendances sont installées
cd frontend && npm install && npm run build
cd backend && npm install

# Démarrer le serveur qui sert frontend + API
cd backend
npm run build:full   # Construit le frontend et démarre le serveur
# OU
npm run build && npm start
```

Accédez à `http://localhost:4000` pour accéder au frontend + API.

## Dépendances

Le backend nécessite `path` et `url` (modules Node.js natifs - pas d'installation nécessaire).

## Structure des Répertoires Après Build

```
frontend/
  dist/                  # Fichiers construits (servus par Express)
    index.html
    assets/
    ...
  src/
    ...

backend/
  src/
    index.js            # Sert /frontend/dist comme contenu static
    routes/
    ...
```

## Notes

- Le frontend doit être construit AVANT de démarrer le serveur backend en production
- Le frontend est optionnel en développement (le Vite dev server peut tourner indépendamment)
- CORS est configuré pour permettre les requests locales
- La route `*` fallback assure que le routage React fonctionne correctement
