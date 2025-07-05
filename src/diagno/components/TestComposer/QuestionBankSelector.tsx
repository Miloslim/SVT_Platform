// ======================================================================
// 📄 Fichier : QuestionBankSelector.tsx
// 📁 Chemin : src/diagno/components/TestComposer/QuestionBankSelector.tsx
// 📌 Description : Composant pour sélectionner les évaluations (questions)
//     associées aux objectifs sélectionnés.
// ======================================================================

import React, { useEffect, useState } from 'react';
import { testsService } from '../../services/testsService';

interface QuestionBankSelectorProps {
  selectedObjectifs: number[];
  selectedEvaluations: number[];
  setSelectedEvaluations: (ids: number[]) => void;
}

const QuestionBankSelector: React.FC<QuestionBankSelectorProps> = ({
  selectedObjectifs,
  selectedEvaluations,
  setSelectedEvaluations,
}) => {
  const [evaluations, setEvaluations] = useState<
    { id: number; titre_evaluation: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedObjectifs.length === 0) {
      setEvaluations([]);
      return;
    }

    async function loadEvaluations() {
      setLoading(true);
      setError(null);
      try {
        const data = await testsService.getEvaluationsByObjectifs(selectedObjectifs);
        setEvaluations(data ?? []);
      } catch (err) {
        setError('Erreur lors du chargement des évaluations');
      } finally {
        setLoading(false);
      }
    }

    loadEvaluations();
  }, [selectedObjectifs]);

  function toggleEvaluation(id: number) {
    if (selectedEvaluations.includes(id)) {
      setSelectedEvaluations(selectedEvaluations.filter((eid) => eid !== id));
    } else {
      setSelectedEvaluations([...selectedEvaluations, id]);
    }
  }

  return (
    <div>
      {loading && <p>Chargement des évaluations...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && evaluations.length === 0 && <p>Aucune évaluation trouvée.</p>}

      <ul className="max-h-48 overflow-auto border p-2 rounded">
        {evaluations.map((evalItem) => (
          <li key={evalItem.id} className="mb-1">
            <label className="cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedEvaluations.includes(evalItem.id)}
                onChange={() => toggleEvaluation(evalItem.id)}
                className="mr-2"
              />
              {evalItem.titre_evaluation}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuestionBankSelector;
