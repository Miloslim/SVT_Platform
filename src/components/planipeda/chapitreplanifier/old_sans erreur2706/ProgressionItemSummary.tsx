// src/components/planipeda/chapitreplanifier/ProgressionItemSummary.tsx

import React from 'react';
import { PlanChapterProgressionItem, PlanActivity, PlanEvaluation } from '@/types/planificationTypes';

interface ProgressionItemSummaryProps {
  item: PlanChapterProgressionItem;
  index: number;
  totalItems: number;
  onMoveUp: (id: string, direction: 'up') => void;
  onMoveDown: (id: string, direction: 'down') => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

const ProgressionItemSummary: React.FC<ProgressionItemSummaryProps> = ({
  item,
  index,
  totalItems,
  onMoveUp,
  onMoveDown,
  onDelete,
  onToggleExpand,
}) => {
  const isFirst = index === 0;
  const isLast = index === totalItems - 1;

  // Déterminer le type d'élément pour l'affichage et le style
  let typeColorClass = 'text-gray-800';
  let typeText = 'Inconnu';
  let borderColor = 'border-gray-300';
  let durationDisplay = '';

  switch (item.type) {
    case 'sequence':
      typeText = 'Séquence';
      typeColorClass = 'text-blue-700 font-semibold';
      borderColor = 'border-blue-500';
      // Pas de durée directe pour la séquence dans ce modèle
      break;
    case 'activity':
      typeText = 'Activité';
      typeColorClass = 'text-green-700 font-semibold';
      borderColor = 'border-green-500';
      if ((item as PlanActivity).dureeEstimeeMinutes != null) {
        durationDisplay = `(${(item as PlanActivity).dureeEstimeeMinutes} min)`;
      }
      break;
    case 'evaluation':
      typeText = 'Évaluation';
      typeColorClass = 'text-purple-700 font-semibold';
      borderColor = 'border-purple-500';
      if ((item as PlanEvaluation).dureeEstimeeMinutes != null) {
        durationDisplay = `(${(item as PlanEvaluation).dureeEstimeeMinutes} min)`;
      }
      break;
  }

  const handleDeleteClick = () => {
    // TODO: Remplacer window.confirm par un composant modal personnalisé pour une meilleure UX
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${item.titre || typeText}" de la progression ?`)) {
      onDelete(item.id);
    }
  };

  const handleToggleExpandClick = () => {
    onToggleExpand(item.id);
  };

  return (
    <tr className={`border-b ${borderColor} bg-white hover:bg-gray-50`}>
      <td className={`px-4 py-3 whitespace-nowrap text-center text-sm ${typeColorClass}`}>
        {typeText}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-700">
        {item.ordre + 1} {/* Affichage de l'ordre lisible par l'humain (base 1) */}
      </td>
      <td className="px-4 py-3 text-left text-sm font-medium text-gray-900 truncate max-w-xs">
        {item.titre}
        {durationDisplay && (
          <span className="ml-2 text-xs text-gray-500">{durationDisplay}</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
        <div className="flex justify-center space-x-2">
          {/* Boutons de déplacement */}
          <button
            onClick={() => onMoveUp(item.id, 'up')}
            disabled={isFirst}
            className={`p-1 rounded-full ${
              isFirst ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            } transition duration-150 ease-in-out`}
            title="Déplacer vers le haut"
          >
            {/* Icône flèche vers le haut */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
          <button
            onClick={() => onMoveDown(item.id, 'down')}
            disabled={isLast}
            className={`p-1 rounded-full ${
              isLast ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            } transition duration-150 ease-in-out`}
            title="Déplacer vers le bas"
          >
            {/* Icône flèche vers le bas */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          {/* Bouton déplier/replier les détails avec icônes distinctes (carré plus/moins) */}
          <button
            onClick={handleToggleExpandClick}
            className="p-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition duration-150 ease-in-out"
            title={item.isExpanded ? "Replier les détails" : "Déplier les détails"}
          >
            {item.isExpanded ? (
              // Icône Minus Square pour l'état déplié (suggérant de replier)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-20" /> {/* Ligne horizontale */}
                <rect x="2" y="2" width="20" height="20" rx="2" ry="2" /> {/* Carré */}
              </svg>
            ) : (
              // Icône Plus Square pour l'état replié (suggérant de déplier)
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m-8-8h16" /> {/* Croix (plus) */}
                <rect x="2" y="2" width="20" height="20" rx="2" ry="2" /> {/* Carré */}
              </svg>
            )}
          </button>

          {/* Bouton de suppression */}
          <button
            onClick={handleDeleteClick}
            className="p-1 rounded-full bg-red-500 hover:bg-red-600 text-white transition duration-150 ease-in-out"
            title="Supprimer l'élément"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ProgressionItemSummary;
