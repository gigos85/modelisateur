export const db = {
  cujs: [
    {
      id: 'cuj-1',
      name: "Souscription Crédit",
      criticity: 'or',
      components: [
        {
          id: 1,
          code: 'COMP001',
          name: 'Composant Authentification',
          desc: 'Gestion de l\'authentification utilisateur',
          macros: [
            { id: 1, code: 'MFP0000775', name: 'Saisir, déposer, consulter sa DAL par le DE', criticity: '2 - Critique', desc: 'api-credit svc-tarification' },
            { id: 2, code: 'MFP0000776', name: 'Vérification Éligibilité', criticity: '1 - Majeure', desc: 'idp-auth' }
          ]
        },
        {
          id: 2,
          code: 'COMP002',
          name: 'Composant Traitement',
          desc: 'Traitement des demandes de crédit',
          macros: [
            { id: 3, code: 'MFP0000777', name: 'Création Dossier', criticity: '2 - Critique', desc: 'api-credit svc-notifications' },
            { id: 4, code: 'MFP0000778', name: 'Signature Électronique', criticity: '1 - Majeure', desc: 'svc-notifications' }
          ]
        }
      ],
      standaloneMacros: [],
      steps: [
        { id: 's1', name: 'Étape Simulation', position: { x: 80, y: 80 }, macros: [{ name: 'Saisir, déposer, consulter sa DAL par le DE' }, { name: 'Vérification Éligibilité' }] },
        { id: 's2', name: 'Étape Création Dossier', position: { x: 360, y: 120 }, macros: [{ name: 'Création Dossier' }] },
        { id: 's3', name: 'Étape Signature', position: { x: 640, y: 100 }, macros: [{ name: 'Signature Électronique' }] }
      ],
      edges: [{ from: 's1', to: 's2' }, { from: 's2', to: 's3' }]
    }
  ]
}
