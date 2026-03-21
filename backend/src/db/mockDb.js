export const db = {
  cujs: [
    {
      id: 'cuj-1',
      name: "Souscription Crédit",
      criticity: 'or',
      steps: [
        { id: 's1', name: 'Étape Simulation', position: { x: 80, y: 80 }, macros: [{ name: 'Calcul Mensualité' }, { name: 'Vérification Éligibilité' }] },
        { id: 's2', name: 'Étape Création Dossier', position: { x: 360, y: 120 }, macros: [{ name: 'Création Dossier' }] },
        { id: 's3', name: 'Étape Signature', position: { x: 640, y: 100 }, macros: [{ name: 'Signature Électronique' }] }
      ],
      macros: [
        { name: 'Calcul Mensualité', desc: 'api-credit  svc-tarification' },
        { name: 'Vérification Éligibilité', desc: 'idp-auth' },
        { name: 'Création Dossier', desc: 'api-credit  svc-notifications' },
        { name: 'Signature Électronique', desc: 'svc-notifications' }
      ],
      edges: [{ from: 's1', to: 's2' }, { from: 's2', to: 's3' }]
    }
  ]
}
