# Système de Persistence des Parcours - Guide de Test

## ✅ Implémentation Effectuée

### 1. **Base de Données SQLite**
- ✅ Fichier de base de données SQLite créé à: `backend/src/db/cuj-data.db`
- ✅ Module de gestion de base de données: `backend/src/db/database.js`
- ✅ Tables créées:
  - `cujs`: Parcours principaux
  - `steps`: Étapes du parcours
  - `macros`: Macros (à niveau CUJ)
  - `step_macros`: Liaison entre steps et macros
  - `edges`: Connexions entre étapes
  - `macro_pages`: Pages Dynatrace liées aux macros

### 2. **Endpoints API Persistents**
Les routes suivantes persistent automatiquement les données:

#### Parcours (CUJs)
- `GET /api/cuj` - Récupérer tous les parcours
- `GET /api/cuj/{id}` - Récupérer un parcours spécifique
- `POST /api/cuj` - Créer un parcours
- `PUT /api/cuj/{id}` - Modifier un parcours (nom, criticité)
- `POST /api/cuj/{id}/save-layout` - Sauvegarder le layout complet (nodes + edges) ⭐ NOUVEAU

#### Étapes
- `POST /api/cuj/{id}/steps` - Créer une étape
- `PUT /api/cuj/{id}/steps/{stepId}` - Modifier une étape (nom, position)
- `DELETE /api/cuj/{id}/steps/{stepId}` - Supprimer une étape

#### Macros
- `POST /api/cuj/{id}/macros` - Créer une macro
- `POST /api/cuj/{id}/steps/{stepId}/macros` - Lier une macro à une étape
- `PUT /api/cuj/{id}/steps/{stepId}/macros/{macroName}` - Renommer une macro
- `DELETE /api/cuj/{id}/steps/{stepId}/macros/{macroName}` - Supprimer une macro d'une étape

#### Connexions (Edges)
- `POST /api/cuj/{id}/edges` - Créer une connexion
- `DELETE /api/cuj/{id}/edges` - Supprimer une connexion

#### Pages Dynatrace
- `POST /api/cuj/{id}/steps/{stepId}/macros/{macroName}/pages` - Lier une page
- `DELETE /api/cuj/{id}/steps/{stepId}/macros/{macroName}/pages/{pageId}` - Supprimer une page

### 3. **Auto-Sauvegarde Frontend** 
- ✅ Implémentée dans `CanvasArea.tsx`
- ✅ Debounce de 1 seconde après chaque modification
- ✅ Sauvegarde automatique des positions et connexions

## 🧪 Instructions de Test

### Test 1: Créer un Parcours
```bash
# Depuis le terminal, créer un nouveau parcours
curl -X POST http://localhost:4000/api/cuj \
  -H "Content-Type: application/json" \
  -d '{"name":"Mon Parcours Test","criticity":"or"}'
```

### Test 2: Vérifier la Persistence
1. Ouvrir l'application à http://localhost:5173
2. Créer un nouveau parcours (via la sidebar)
3. Ajouter des étapes (drag & drop depuis "Étape")
4. Modifier les noms et positions
5. Créer des connexions entre étapes
6. **Rafraîchir la page** (F5)
7. ✅ **Les modifications doivent persister!**

### Test 3: Vérifier la Base de Données
```bash
# Afficher les contenus de la base de données
cd backend
sqlite3 src/db/cuj-data.db

# Quelques commandes SQL utiles:
SELECT * FROM cujs;
SELECT * FROM steps;
SELECT * FROM edges;
SELECT * FROM macros;
.tables  # Afficher toutes les tables
```

### Test 4: Points de Sauvegarde
La persistence se déclenche lors de:
- ✅ Création d'étape
- ✅ Modification du nom d'étape
- ✅ Modification de la position (drag & drop)
- ✅ Création/suppression de connexion
- ✅ Ajout/suppression de macro
- ✅ Modification du nom du parcours
- ✅ Modification de la criticité

### Test 5: Liens Macro-Step Persistants
1. Ajouter une étape
2. Drag une macro depuis la sidebar vers l'étape
3. Vérifier dans la DB: `SELECT * FROM step_macros;`
4. Rafraîchir la page - **les macros doivent persister**

## 📊 Structure de la Base de Données

### Table `cujs`
```
id (TEXT) - Identifiant unique
name (TEXT) - Nom du parcours
criticity (TEXT) - or, argent, bronze
created_at (DATETIME)
updated_at (DATETIME)
```

### Table `steps`
```
id (TEXT) - Identifiant unique
cuj_id (TEXT FK)
name (TEXT)
position_x (REAL)
position_y (REAL)
```

### Table `edges`
```
from_step_id (TEXT FK)
to_step_id (TEXT FK)
cuj_id (TEXT FK)
```

## 🔄 Flux de Données

```
Frontend (React)
    ↓
CanvasArea (Auto-save debounced)
    ↓
cujApi.ts (Appels HTTP)
    ↓
Backend Express Routes
    ↓
database.js (Opérations async)
    ↓
SQLite (cuj-data.db)
```

## ⚡ Performance
- Auto-save avec debounce pour éviter les surcharges
- Requêtes SQL optimisées avec indices (UNIQUE constraints)
- Transactions asynchrones pour la cohérence des données

## 🛠️ Fichiers Modifiés/Créés

1. **Créés:**
   - `backend/src/db/database.js` - Module SQLite complet
   
2. **Modifiés:**
   - `backend/src/routes/cujRoutes.js` - Utilise maintenant la DB
   - `frontend/src/api/cujApi.ts` - Ajout `saveCujLayout()`
   - `frontend/src/components/CanvasArea.tsx` - Auto-save avec debounce

3. **Créé automatiquement:**
   - `backend/src/db/cuj-data.db` - Base de données SQLite

## ✨ Prochaines Étapes Possibles

- [ ] Implémenter la synchronisation en temps réel (WebSocket)
- [ ] Ajouter la gestion des versions/historique
- [ ] Export/Import JSON
- [ ] Backup automatique
- [ ] Authentification/Autorisation
