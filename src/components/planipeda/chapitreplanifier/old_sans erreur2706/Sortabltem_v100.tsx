
//src/planipeda/chapitreplanifier/Sortabltem.tsx// Assurez-vous que tous les imports nécessaires sont présents pour ce composant
// Nom du fichier: SortableItem.tsx
// 🌐 Chemin : src/components/planipeda/ScenarioEditor/SortableItem.tsx
// 📄 Nom du fichier : SortableItem.tsx
//
// 💡 Fonctionnalités :
//    - Composant réutilisable pour afficher un élément de séquence (activité, évaluation) dans une liste triable.
//    - Intègre les fonctionnalités de glisser-déposer de `dnd-kit`.
//    - Affiche un résumé des informations de l'élément avec une icône pertinente.
//    - Fournit des boutons pour supprimer et réordonner manuellement l'élément.
//    - **NOUVEAU** : Rendu stylisé et minimaliste avec icônes.

import React, { useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SequenceItem } from '@/types/sequences'; // Assurez-vous que ce type est correct et complet
import { Button } from '@/components/ui/button'; // Assurez-vous que ce composant existe ou adaptez-le
import {
    Activity, // Icône pour activité
    BookText, // Icône pour évaluation
    ArrowUp, ArrowDown, // Icônes pour déplacer
    Trash2, // Icône pour supprimer
    GripVertical, // Icône pour la poignée de drag
    LayoutStack // Icône pour séquence (si utilisé pour des blocs de séquence aussi)
} from 'lucide-react'; // Import des icônes Lucide

interface SortableItemProps {
    id: string; // L'ID unique pour dnd-kit (ex: "activity-123", "evaluation-456")
    item: SequenceItem; // L'objet SequenceItem complet
    index: number; // L'index actuel de l'élément dans la liste
    onRemove: (type: 'activity' | 'evaluation', itemId: number) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    isFirst: boolean;
    isLast: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({
    id,
    item,
    index,
    onRemove,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleRemove = useCallback(() => {
        // Confirme la suppression avant de l'exécuter
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${item.titre}" de la séquence?`)) {
            onRemove(item.type, item.id);
        }
    }, [item.id, item.titre, item.type, onRemove]);

    // Détermine l'icône et les couleurs en fonction du type d'élément
    const IconComponent = item.type === 'activity' ? Activity : (item.type === 'evaluation' ? BookText : LayoutStack);
    const borderColor = item.type === 'activity' ? 'border-green-400' : (item.type === 'evaluation' ? 'border-purple-400' : 'border-blue-400');
    const bgColor = item.type === 'activity' ? 'bg-green-50' : (item.type === 'evaluation' ? 'bg-purple-50' : 'bg-blue-50');
    const titleColor = item.type === 'activity' ? 'text-green-800' : (item.type === 'evaluation' ? 'text-purple-800' : 'text-blue-800');
    const iconColor = item.type === 'activity' ? 'text-green-600' : (item.type === 'evaluation' ? 'text-purple-600' : 'text-blue-600');

    return (
        <tr ref={setNodeRef} style={style} className={`relative transition-transform duration-300 ease-in-out ${bgColor} border-b border-gray-200 hover:shadow-lg`}>
            {/* Colonne de l'ordre */}
            <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-center relative">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold
                    ${item.type === 'activity' ? 'bg-green-200 text-green-800' : 'bg-purple-200 text-purple-800'}`}>
                    {item.order_in_sequence}
                </span>
                {/* Poignée de drag */}
                <div {...attributes} {...listeners} className="absolute inset-y-0 left-0 flex items-center justify-center w-8 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-900">
                    <GripVertical className="h-5 w-5" />
                </div>
            </td>

            {/* Colonne du Type */}
            <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                    ${item.type === 'activity' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                    <IconComponent className={`h-4 w-4 mr-1 ${iconColor}`} />
                    {item.type === 'activity' ? 'Activité' : 'Évaluation'}
                </span>
            </td>

            {/* Colonne du Titre / Description */}
            <td className="px-4 py-3">
                <div className="flex items-center">
                    <IconComponent className={`h-6 w-6 mr-3 ${iconColor} flex-shrink-0`} />
                    <div className="text-sm font-medium ${titleColor}">
                        {item.titre}
                        {item.description && (
                            <p className="text-gray-600 text-xs mt-1 truncate max-w-xs md:max-w-md lg:max-w-lg">
                                {item.description}
                            </p>
                        )}
                        {item.type === 'evaluation' && item.type_evaluation && (
                            <p className="text-gray-500 text-xs mt-1">
                                Type: {item.type_evaluation}
                            </p>
                        )}
                    </div>
                </div>
            </td>

            {/* Colonne des Actions */}
            <td className="px-2 py-3 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                    <Button
                        type="button"
                        onClick={() => onMoveUp(id)}
                        disabled={isFirst}
                        className="p-1.5 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                        title="Déplacer vers le haut"
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        onClick={() => onMoveDown(id)}
                        disabled={isLast}
                        className="p-1.5 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                        title="Déplacer vers le bas"
                    >
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        onClick={handleRemove}
                        className="p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
                        title="Supprimer"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </td>
        </tr>
    );
};

export default SortableItem;
