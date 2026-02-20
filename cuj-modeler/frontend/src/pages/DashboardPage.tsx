import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cujService } from '../services/cujService';
import { useCujStore } from '../store/cujStore';
import { Criticity } from '../types/cuj';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { cujs, setCujs, setSelectedCuj } = useCujStore();
  const [name, setName] = useState('Nouveau Parcours');
  const [criticity, setCriticity] = useState<Criticity>('Gold');

  useEffect(() => {
    void cujService.list().then(setCujs);
  }, [setCujs]);

  const createCuj = async () => {
    const created = await cujService.create({ name, criticity, steps: [] });
    setCujs([created, ...cujs]);
    setSelectedCuj(created.id);
    navigate(`/editor/${created.id}`);
  };

  const deleteCuj = async (id: string) => {
    await cujService.remove(id);
    setCujs(cujs.filter((cuj) => cuj.id !== id));
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Dashboard CUJ</h1>
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-lg border bg-white p-4 md:grid-cols-4">
        <input className="rounded border p-2" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="rounded border p-2" value={criticity} onChange={(e) => setCriticity(e.target.value as Criticity)}>
          <option>Gold</option>
          <option>Silver</option>
          <option>Bronze</option>
        </select>
        <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={createCuj}>
          Créer un nouveau CUJ
        </button>
      </div>
      <div className="rounded-lg border bg-white">
        {cujs.map((cuj) => (
          <div key={cuj.id} className="flex items-center justify-between border-b p-4 last:border-b-0">
            <div>
              <div className="font-semibold">{cuj.name}</div>
              <div className="text-xs text-slate-500">Criticité: {cuj.criticity}</div>
            </div>
            <div className="flex gap-3">
              <Link className="text-blue-600" to={`/editor/${cuj.id}`} onClick={() => setSelectedCuj(cuj.id)}>
                Ouvrir
              </Link>
              <button className="text-red-600" onClick={() => void deleteCuj(cuj.id)}>
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
