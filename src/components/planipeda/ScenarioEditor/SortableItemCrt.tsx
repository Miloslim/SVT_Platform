// Nom du fichier: SortableItemCrt.tsx
// Chemin: src/components/planipeda/ScenarioEditor/SortableItemCrt.tsx

// Fonctionnalités:
// Ce composant React affiche un seul élément (activité ou évaluation) dans une liste
// réordonnable. Il gère son comportement de glisser-déposer via DND Kit et fournit
// des actions pour retirer ou déplacer manuellement l'élément dans la liste.

// --- 1. Imports ---
import React from "react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { XCircle, Activity, LayoutList, ClipboardCheck, ArrowUp, ArrowDown, ClipboardList, BookText, GripVertical } from 'lucide-react';

// --- 2. Interfaces de données utilisées dans le composant ---

/**
 * Interfaces pour les éléments (activités/évaluations) ajoutés à la séquence.
 * Ces interfaces incluent des détails pour l'affichage dans la liste.
 */
interface AddedActivityItem {
    id: number;
    titre: string;
    description: string;
    objectifs: string[]; // Descriptions des objectifs
    type: 'activity';
}

interface AddedEvaluationItem {
    id: number;
    titre: string;
    type_evaluation?: string; // Ex: "Formative", "Sommative"
    description?: string; // Brève description
    connaissances?: string[]; // Connaissances évaluées
    capacitesEvaluees?: string[]; // Capacités/Habilités évaluées
    type: 'evaluation';
}

// Type union pour la liste combinée d'activités et d'évaluations affichée et réordonnée
type SequenceItem = AddedActivityItem | AddedEvaluationItem;

/**
 * Props pour le composant SortableItem.
 */
interface SortableItemProps {
    item: SequenceItem;
    id: string; // L'ID unique pour DND-kit (par exemple, "activity-1", "evaluation-2")
    index: number;
    onRemove: (id: number, type: 'activity' | 'evaluation') => void;
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    isFirst: boolean;
    isLast: boolean;
}

// --- 3. Composant SortableItem ---
const SortableItemCrt: React.FC<SortableItemProps> = ({ item, id, index, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) => {
    // Utilisation du hook useSortable de DND Kit pour les propriétés de glisser-déposer
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: id });

    // Styles pour l'animation de glisser-déposer
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 0, // Met l'élément dragué au-dessus des autres
        opacity: isDragging ? 0.7 : 1, // Léger effet de transparence lors du glisser
    };

    return (
        <div
            ref={setNodeRef} // Référence pour l'élément DOM glissable
            style={style}
            className={`relative p-3 border rounded-md bg-white text-gray-700 shadow-sm flex items-center group
                        ${isDragging ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`} // Style visuel pendant le glisser
        >
            {/* Handle de glisser-déposer */}
            <button
                type="button" // Important: pour ne pas soumettre le formulaire parent
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 cursor-grab active:cursor-grabbing mr-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...attributes} // Attributs nécessaires pour l'accessibilité du glisser-déposer
                {...listeners} // Écouteurs d'événements pour le glisser-déposer
                title="Glisser pour réorganiser"
            >
                <GripVertical className="h-5 w-5" />
            </button>

            {/* Contenu de l'élément (activité ou évaluation) */}
            <div className="flex-1 min-w-0 pr-4">
                {item.type === 'activity' ? (
                    <>
                        {/* Affichage spécifique pour une activité */}
                        <div className="flex items-center gap-2 mb-1">
                            <Activity className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="font-semibold text-base text-gray-800">{item.titre}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1" style={{ maxWidth: '95%' }}>
                            {item.description || "Pas de description fournie."}
                        </p>

                        {/* Objectifs de l'activité */}
                        {item.objectifs && item.objectifs.length > 0 && item.objectifs[0] !== "Aucun objectif" && (
                            <div className="text-xs text-gray-500 flex items-start gap-1">
                                <LayoutList className="h-3.5 w-3.5 flex-shrink-0 mt-1" />
                                <div className="flex flex-col">
                                    <span className="font-bold">Objectifs :</span>
                                    <ul className="list-disc list-inside space-y-0.5 pl-0">
                                        {item.objectifs.map((obj, objIndex) => (
                                            <li key={objIndex} className="truncate" style={{ maxWidth: '200px' }}>
                                                {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </>
                ) : ( // item.type === 'evaluation'
                    <>
                        {/* Affichage spécifique pour une évaluation */}
                        <div className="flex items-center gap-2 mb-1">
                            <ClipboardCheck className="h-4 w-4 text-orange-600 flex-shrink-0" />
                            <span className="font-semibold text-base text-gray-800">{item.titre}</span>
                            {item.type_evaluation && (
                                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                    {item.type_evaluation}
                                </span>
                            )}
                        </div>

                        {/* Connaissances évaluées */}
                        {item.connaissances && item.connaissances.length > 0 && item.connaissances[0] !== "Aucune connaissance" && (
                            <div className="text-xs text-gray-500 flex items-start gap-1">
                                <BookText className="h-3.5 w-3.5 flex-shrink-0 mt-1" />
                                <div className="flex flex-col">
                                    <span className="font-bold">Connaissances :</span>
                                    <ul className="list-disc list-inside space-y-0.5 pl-0">
                                        {item.connaissances.map((con, conIndex) => (
                                            <li key={conIndex} className="truncate" style={{ maxWidth: '200px' }}>
                                                {con}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Capacités/Habilités évaluées */}
                        {item.capacitesEvaluees && item.capacitesEvaluees.length > 0 && item.capacitesEvaluees[0] !== "Aucune capacité" && (
                            <div className="text-xs text-gray-500 flex items-start gap-1">
                                <ClipboardList className="h-3.5 w-3.5 flex-shrink-0 mt-1" />
                                <div className="flex flex-col">
                                    <span className="font-bold">Capacités évaluées :</span>
                                    <ul className="list-disc list-inside space-y-0.5 pl-0">
                                        {item.capacitesEvaluees.map((cap, capIndex) => (
                                            <li key={capIndex} className="truncate" style={{ maxWidth: '200px' }}>
                                                {cap}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            {/* Boutons de suppression et de réorganisation manuelle (haut/bas) */}
            <div className="flex flex-col gap-1 items-end ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                    type="button" // Important: pour ne pas soumettre le formulaire parent
                    onClick={() => onMoveUp(index)}
                    disabled={isFirst} // Désactive le bouton si c'est le premier élément
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Déplacer l'élément vers le haut"
                >
                    <ArrowUp className="h-4 w-4" />
                </button>
                <button
                    type="button" // Important: pour ne pas soumettre le formulaire parent
                    onClick={() => onMoveDown(index)}
                    disabled={isLast} // Désactive le bouton si c'est le dernier élément
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Déplacer l'élément vers le bas"
                >
                    <ArrowDown className="h-4 w-4" />
                </button>
                <button
                    type="button" // Important: pour ne pas soumettre le formulaire parent
                    onClick={() => onRemove(item.id, item.type)}
                    className="p-1 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                    title="Retirer l'élément"
                >
                    <XCircle className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

export default SortableItemCrt;