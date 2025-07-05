
//src/planipeda/ScenarioEditor/Sortabltem.tsx// Assurez-vous que tous les imports nécessaires sont présents pour ce composant
// Nom du fichier: SortableItem.tsx
// Chemin: //src/planipeda/ScenarioEditor/SortableItem.tsx

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ArrowUp, ArrowDown, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

// Assurez-vous que le chemin vers votre fichier de types est correct
// par exemple: import { SequenceItem } from "@/types/sequences";
// ou définissez l'interface ici si elle est spécifique à ce composant
interface SequenceItem {
    id: number;
    type: 'activity' | 'evaluation';
    titre: string;
    description?: string | null;
    objectifs?: string[];
    type_evaluation?: string;
    introduction_activite?: string | null;
    consignes_specifiques?: string | null;
    connaissances?: string[];
    capacitesEvaluees?: string[];
    order_in_sequence: number;
}

// Interface pour les props du composant SortableItem
interface SortableItemProps {
    id: string; // ID unique pour DND Kit (format 'type-id')
    item: SequenceItem; // Données de l'activité ou de l'évaluation
    index: number; // Index de l'élément dans la liste
    onRemove: (type: 'activity' | 'evaluation', id: number) => void; // Callback pour supprimer un élément
    onMoveUp: (id: string) => void;    // Callback pour déplacer l'élément vers le haut
    onMoveDown: (id: string) => void; // Callback pour déplacer l'élément vers le bas
    isFirst: boolean; // Indique si c'est le premier élément (pour désactiver le bouton 'up')
    isLast: boolean;  // Indique si c'est le dernier élément (pour désactiver le bouton 'down')
}

/**
 * Composant SortableItem : Représente une ligne de tableau pour un élément (activité ou évaluation)
 * de la séquence, permettant le glisser-déposer et les actions (supprimer, déplacer).
 * Ce composant est adapté pour être utilisé à l'intérieur d'un <tbody> d'un tableau.
 */
const SortableItem: React.FC<SortableItemProps> = ({ id, item, index, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) => {
    // Hook useSortable de DND Kit pour rendre l'élément triable
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id });

    // Style appliqué pour la transformation et la transition pendant le glisser-déposer
    // Utilise un style de transformation pour la ligne de tableau
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        // La ligne de tableau (<tr>) est l'élément qui est glissable et affiché
        <tr
            ref={setNodeRef} // Attache la réf pour DND Kit à la ligne
            style={style}    // Applique les styles de transformation
            className="bg-white border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
        >
            {/* Cellule pour l'ordre et la poignée de déplacement */}
            <td className="px-4 py-2 whitespace-nowrap text-center text-sm text-gray-500">
                <button {...listeners} {...attributes} className="cursor-grab p-1 text-gray-400 hover:text-gray-600 inline-block align-middle mr-1">
                    <GripVertical className="h-4 w-4" />
                </button>
                <span className="inline-block align-middle">{index + 1}</span>
            </td>
            {/* Cellule pour le type (Activité/Évaluation) */}
            <td className="px-4 py-2 whitespace-nowrap text-left text-sm font-medium">
                {item.type === 'activity' ? (
                    <span className="text-blue-600 flex items-center">
                        <span className="mr-1">▶️</span> Activité
                    </span>
                ) : (
                    <span className="text-orange-600 flex items-center">
                        <span className="mr-1">📝</span> Évaluation
                    </span>
                )}
            </td>
            {/* Cellule pour le titre et la description */}
           <td className="px-4 py-2 text-left text-sm text-gray-900">
                <div className="font-semibold">{item.titre}</div>

                {/* Affichage conditionnel des détails spécifiques selon le type d'élément */}
                {item.type === 'activity' && (
                    <>
                        {item.description && item.description.trim() !== '' && (
                            <div className="text-gray-500 text-xs mt-1"> <strong> Description: </strong> {item.description}</div>
                        )}
                        {item.objectifs && item.objectifs.length > 0 && (
                            <div className="text-gray-500 text-xs mt-1">
                                Objectifs:
                                <ul className="list-disc list-inside ml-2">
                                    {item.objectifs.map((objectif, idx) => (
                                        <li key={idx}>{objectif}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}
                {item.type === 'evaluation' && (
                    <>
                        {/* Utilisation de introduction_activite ou consignes_specifiques comme description */}
                        {item.introduction_activite && item.introduction_activite.trim() !== '' && (
                            <div className="text-gray-600 text-xs italic">
                                **Introduction:** {item.introduction_activite}
                            </div>
                        )}
                        {item.consignes_specifiques && item.consignes_specifiques.trim() !== '' && (
                            <div className="text-gray-600 text-xs italic mt-1">
                                **Consignes:** {item.consignes_specifiques}
                            </div>
                        )}
                        {item.type_evaluation && item.type_evaluation.trim() !== '' && (
                            <div className="text-gray-500 text-xs mt-1">Type: {item.type_evaluation}</div>
                        )}
                        {item.connaissances && item.connaissances.length > 0 && (
                            <div className="text-gray-500 text-xs mt-1">
                                Connaissances:
                                <ul className="list-disc list-inside ml-2">
                                    {item.connaissances.map((connaissance, idx) => (
                                        <li key={idx}>{connaissance}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {item.capacitesEvaluees && item.capacitesEvaluees.length > 0 && (
                            <div className="text-gray-500 text-xs mt-1">
                                Capacités:
                                <ul className="list-disc list-inside ml-2">
                                    {item.capacitesEvaluees.map((capacite, idx) => (
                                        <li key={idx}>{capacite}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </td>
            {/* Cellule pour les actions (déplacer, modifier, supprimer) */}
            <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveUp(id)}
                        disabled={isFirst}
                        className="p-1 h-auto w-auto text-gray-500 hover:text-blue-600"
                        title="Déplacer vers le haut"
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveDown(id)}
                        disabled={isLast}
                        className="p-1 h-auto w-auto text-gray-500 hover:text-blue-600"
                        title="Déplacer vers le bas"
                    >
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                {/*    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        // onClick={() => onEdit(item.type, item.id)} // FUTURE: Add edit functionality
                        className="p-1 h-auto w-auto text-gray-500 hover:text-yellow-600"
                        title="Modifier"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(item.type, item.id)}
                        className="p-1 h-auto w-auto text-red-500 hover:text-red-700"
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