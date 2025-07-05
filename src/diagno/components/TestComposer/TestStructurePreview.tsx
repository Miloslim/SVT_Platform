// ======================================================================
// 📄 Fichier : TestStructurePreview.tsx
// 📁 Chemin : src/diagno/components/TestComposer/TestStructurePreview.tsx
// 📌 Description : Aperçu simple de la structure du test avec
//     la liste des évaluations sélectionnées dans l’ordre.
// ======================================================================

import React from 'react';

interface TestStructurePreviewProps {
  selectedEvaluations: number[];
}

const TestStructurePreview: React.FC<TestStructurePreviewProps> = ({
  selectedEvaluations,
}) => {
  return (
    <div className="border rounded p-4 max-h-64 overflow-auto bg-gray-50">
      {selectedEvaluations.length === 0 ? (
        <p className="text-gray-600">Aucune évaluation sélectionnée.</p>
      ) : (
        <ol className="list-decimal list-inside space-y-1">
          {selectedEvaluations.map((evalId, index) => (
            <li key={evalId}>Évaluation ID: {evalId}</li> // À remplacer par le titre si disponible
          ))}
        </ol>
      )}
    </div>
  );
};

export default TestStructurePreview;
