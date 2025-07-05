// src/components/planipeda/entities/DashboardPlanifications.tsx
import React, { useEffect, useState } from 'react';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { planificationService } from '@/services/planificationService'; // import nommé corrigé
import { Planification } from '@/types/planificationTypes';

interface DashboardPlanificationsProps {
  navigate: (path: string) => void;
}

const DashboardPlanifications: React.FC<DashboardPlanificationsProps> = ({ navigate }) => {
  const [planifications, setPlanifications] = useState<Planification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Charger toutes les fiches de planification
  const fetchPlanifications = async () => {
    setLoading(true);
    try {
      const data = await planificationService.getAllPlanifications(); // à implémenter côté service
      setPlanifications(data);
    } catch (error) {
      console.error('Erreur chargement planifications:', error);
      alert('Erreur lors du chargement des fiches de planification.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanifications();
  }, []);

  // Supprimer une fiche de planification
  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette fiche de planification ?')) return;

    try {
      await planificationService.deletePlanification(id); // à implémenter côté service
      setPlanifications((prev) => prev.filter((p) => p.id !== id));
      alert('Fiche supprimée.');
    } catch (error) {
      console.error('Erreur suppression fiche:', error);
      alert('Erreur lors de la suppression.');
    }
  };

  return (
    <section className="dashboard-planifications bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Fiches de Planification</h2>
        <button
          onClick={() => navigate('/planipeda/chapitre/planifier')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition"
        >
          <FiPlus />
          Créer une fiche
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 italic">Chargement des fiches...</p>
      ) : planifications.length === 0 ? (
        <p className="text-gray-600 italic">Aucune fiche de planification trouvée.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {planifications.map(({ id, nomFiche, statut, updatedAt }) => (
            <div key={id} className="border border-gray-200 rounded-lg p-4 shadow hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">{nomFiche || 'Sans nom'}</h3>
              <p className="text-sm text-gray-600 mb-4">
                Statut : <span className="font-medium">{statut}</span>
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Dernière modification : {new Date(updatedAt).toLocaleDateString()}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => navigate(`/planipeda/chapitre/planifier/${id}`)}
                  title="Modifier la fiche"
                  className="text-indigo-600 hover:text-indigo-800 transition"
                >
                  <FiEdit size={20} />
                </button>
                <button
                  onClick={() => handleDelete(id)}
                  title="Supprimer la fiche"
                  className="text-red-600 hover:text-red-800 transition"
                >
                  <FiTrash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default DashboardPlanifications;
