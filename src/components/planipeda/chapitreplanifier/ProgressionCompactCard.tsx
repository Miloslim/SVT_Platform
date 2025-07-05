// 📁 src/components/planipeda/chapitreplanifier/ProgressionCompactCard.tsx

import React from 'react';
import { PlanChapterProgressionItem, PlanActivity, PlanSequence, PlanEvaluation } from '@/types/planificationTypes';
import { FlaskConical, Lightbulb, BookText } from 'lucide-react'; // Icônes

interface ProgressionCompactCardProps {
    item: PlanChapterProgressionItem;
    index: number; // L'index dans le tableau pour Drag & Drop, pas l'ordre de la DB
    onDelete: (itemId: string) => void;
    onSelect: (item: PlanChapterProgressionItem) => void;
    onEditMasterActivity?: (activityId: number, planActivityId: string) => void;
    onEditMasterEvaluation?: (evaluationId: number, planEvaluationId: string) => void;
    onEditMasterSequence?: (sequenceId: number, planSequenceId: string) => void;
}

const ProgressionCompactCard: React.FC<ProgressionCompactCardProps> = ({
    item,
    onDelete,
    onSelect,
    onEditMasterActivity,
    onEditMasterEvaluation,
    onEditMasterSequence,
}) => {
    const IconComponent = item.type === 'activity' ? Lightbulb : (item.type === 'evaluation' ? BookText : FlaskConical);
    const borderColor = item.type === 'activity' ? 'border-green-400' : (item.type === 'evaluation' ? 'border-purple-400' : 'border-blue-400');
    const bgColor = item.type === 'activity' ? 'bg-green-50' : (item.type === 'evaluation' ? 'bg-purple-50' : 'bg-blue-50');
    const textColor = item.type === 'activity' ? 'text-green-800' : (item.type === 'evaluation' ? 'text-purple-800' : 'text-blue-800');
    const iconColor = item.type === 'activity' ? 'text-green-600' : (item.type === 'evaluation' ? 'text-purple-600' : 'text-blue-600');

    // Récupérer le titre de manière robuste selon le type d'item
    let displayTitle = '';
    let displayType = '';
    const isMasterLinked = typeof item.sourceId === 'number';

    if (item.type === 'sequence') {
        const seq = item as PlanSequence;
        displayTitle = seq.titre || 'Nouvelle Séquence';
        displayType = 'Séquence';
    } else if (item.type === 'activity') {
        const act = item as PlanActivity;
        displayTitle = act.titre || 'Nouvelle Activité';
        displayType = 'Activité';
    } else if (item.type === 'evaluation') {
        const evalItem = item as PlanEvaluation;
        displayTitle = evalItem.titre || 'Nouvelle Évaluation';
        displayType = `Évaluation (${evalItem.type_evaluation || 'N/A'})`;
    }

    const handleEditMaster = (e: React.MouseEvent) => {
        e.stopPropagation(); // Empêche le déclenchement de onSelect
        if (!isMasterLinked || !item.sourceId) return;

        if (item.type === 'activity' && onEditMasterActivity) {
            onEditMasterActivity(item.sourceId, item.id);
        } else if (item.type === 'evaluation' && onEditMasterEvaluation) {
            onEditMasterEvaluation(item.sourceId, item.id);
        } else if (item.type === 'sequence' && onEditMasterSequence) {
            onEditMasterSequence(item.sourceId, item.id);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Empêche le déclenchement de onSelect
        onDelete(item.id);
    };

    return (
        <div
            className={`flex items-center justify-between w-full p-2 rounded-md ${bgColor} border ${borderColor} ${textColor}
                cursor-pointer transition-all duration-150 ease-in-out hover:shadow-md hover:border-opacity-75`}
            onClick={() => onSelect(item)}
            title={`Cliquer pour voir les détails de "${displayTitle}"`}
        >
            <div className="flex items-center flex-grow">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs mr-2 ${bgColor.replace('-50', '-200')} ${textColor}`}>
                    {item.ordre}
                </span>
                <IconComponent className={`h-4 w-4 mr-2 ${iconColor} flex-shrink-0`} />
                <span className={`font-semibold text-sm truncate`}>{displayTitle}</span>
                <span className="ml-2 text-xs text-gray-500 italic">({displayType.split('(')[0].trim()})</span>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
                {isMasterLinked && (
                    <button
                        onClick={handleEditMaster}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                        title="Modifier l'entité maître"
                    >
                        Éditer
                    </button>
                )}
                <button
                    onClick={handleDeleteClick}
                    className="p-1 bg-red-400 text-white rounded-full hover:bg-red-500 transition duration-150 ease-in-out text-xs"
                    title="Supprimer de la planification"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};

export default ProgressionCompactCard;
