//
import React from 'react';

type Props = {
  classId?: number; // Optionnel, selon usage
};

const ClassStatsCharts: React.FC<Props> = ({ classId }) => {
  // Exemple statique simple
  return (
    <div className="p-6 border rounded shadow-sm bg-white">
      <h2 className="text-2xl font-bold mb-4">Statistiques de la classe</h2>
      {classId ? (
        <p>Affichage des statistiques pour la classe ID : {classId}</p>
      ) : (
        <p>Sélectionnez une classe pour visualiser les statistiques.</p>
      )}
      {/* Intégrer graphiques (barres, camemberts) ici */}
    </div>
  );
};

export { ClassStatsCharts };
