//
import React from 'react';

type Props = {
  studentId?: number; // Optionnel, à compléter selon l'implémentation
};

const StudentResultsDashboard: React.FC<Props> = ({ studentId }) => {
  // Exemple statique simple
  return (
    <div className="p-6 border rounded shadow-sm bg-white">
      <h2 className="text-2xl font-bold mb-4">Résultats de l’élève</h2>
      {studentId ? (
        <p>Affichage des résultats pour l’élève ID : {studentId}</p>
      ) : (
        <p>Sélectionnez un élève pour voir ses résultats détaillés.</p>
      )}
      {/* Ici, vous pouvez intégrer graphiques, listes de scores, etc. */}
    </div>
  );
};

export { StudentResultsDashboard };
