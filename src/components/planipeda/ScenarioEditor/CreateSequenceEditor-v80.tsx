// Nom du fichier: CreateSequenceEditor.tsx v80%
// Chemin: src/components/planipeda/ScenarioEditor/CreateSequenceEditor.tsx

// Fonctionnalités:
// Ce composant React permet la création d'une nouvelle séquence pédagogique.
// Il offre une interface utilisateur pour définir les détails de la séquence,
// la lier à la hiérarchie pédagogique (Niveau > Option > Unité > Chapitre),
// et associer des activités et des évaluations à cette séquence.
// Il intègre la logique de calcul automatique de l'ordre de la séquence au sein de son chapitre
// et gère l'état du formulaire, les interactions utilisateur et les appels aux services backend (Supabase).
// NOUVEAU: Affiche des détails supplémentaires pour les activités et évaluations ajoutées, avec les objectifs/capacités en puces.
// NOUVEAU: Permet la réorganisation COMBINÉE des blocs d'activités et d'évaluations (une activité peut suivre une évaluation, etc.).
// NOUVEAU: L'ordre choisi est enregistré dans la base de données.
// NOUVEAU: Personnalisation de l'affichage des blocs d'évaluation pour inclure titre, connaissances et capacités/habiletés.

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { XCircle, Activity, LayoutList, ClipboardCheck, ArrowUp, ArrowDown, ClipboardList, BookText, GripVertical, X, Plus } from 'lucide-react';

// Imports de DND Kit
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Imports des éditeurs réels d'activités et d'évaluations
import ActivityChooserModal from "@/components/planipeda/ScenarioEditor/ActivityChooserModal";
import EvaluationChooserModal from "@/components/planipeda/ScenarioEditor/EvaluationChooserModal";

// Imports des services backend
import { sequencesService } from "@/services/sequencesService";
import { sequenceActiviteService } from "@/services/sequenceActiviteService";
import { sequenceEvaluationService } from "@/services/sequenceEvaluationService";

// Imports des types de base de données (Assurez-vous que ces types sont correctement définis dans dbTypes.ts)
import {
    CreateSequenceDb,
    CreateSequenceActiviteDb,
    CreateSequenceEvaluationDb,
} from "@/types/dbTypes";

// Import de la configuration Supabase
import { supabase } from "@/backend/config/supabase";

// Import du système de notification (sonner pour les toasts)
import { toast } from "sonner";

/**
 * #############################################################
 * # INTERFACES DE DONNÉES UTILISÉES DANS LE COMPOSANT #
 * #############################################################
 */

// Interfaces pour les données de sélection de la hiérarchie pédagogique
interface Niveau { id: number; nom_niveau: string; }
interface Option { id: number; nom_option: string; niveau_id: number; }
interface Unite { id: number; titre_unite: string; option_id: number; }
interface Chapitre { id: number; titre_chapitre: string; unite_id: number; }

// Interfaces pour les éléments (activités/évaluations) ajoutés à la séquence
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
    connaissances?: string[]; // NOUVEAU: Connaissances évaluées
    capacitesEvaluees?: string[]; // Capacités/Habilités évaluées
    type: 'evaluation';
}

// Type union pour la liste combinée d'activités et d'évaluations
type SequenceItem = AddedActivityItem | AddedEvaluationItem;

// Props pour le composant principal CreateSequenceEditor
interface CreateSequenceEditorProps {
    onSequenceCreated: () => void;
    onCancel: () => void;
}

/**
 * ##################################################################
 * # COMPOSANT ENFANT : SortableItem (Pour la liste glisser-déposer) #
 * ##################################################################
 * Ce composant affiche un seul élément (activité ou évaluation) dans la liste
 * réordonnable et gère son comportement de glisser-déposer.
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

const SortableItem: React.FC<SortableItemProps> = ({ item, id, index, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) => {
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
                type="button"
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
                            <div className="text-xs text-gray-500 flex items-start gap-1 mt-1">
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
                            <div className="text-xs text-gray-500 flex items-start gap-1 mt-1">
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
                    type="button"
                    onClick={() => onMoveUp(index)}
                    disabled={isFirst} // Désactive le bouton si c'est le premier élément
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Déplacer l'élément vers le haut"
                >
                    <ArrowUp className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => onMoveDown(index)}
                    disabled={isLast} // Désactive le bouton si c'est le dernier élément
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Déplacer l'élément vers le bas"
                >
                    <ArrowDown className="h-4 w-4" />
                </button>
                <button
                    type="button"
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

/**
 * ##############################################################
 * # COMPOSANT PRINCIPAL : CreateSequenceEditor #
 * ##############################################################
 * Ce composant gère la création d'une nouvelle séquence pédagogique,
 * y compris la sélection de la hiérarchie, les détails de la séquence,
 * et l'ajout/réorganisation d'activités et d'évaluations.
 */
const CreateSequenceEditor: React.FC<CreateSequenceEditorProps> = ({ onSequenceCreated, onCancel }) => {
    // États pour les données de sélection des niveaux, options, unités et chapitres
    const [niveaux, setNiveaux] = useState<Niveau[]>([]);
    const [options, setOptions] = useState<Option[]>([]);
    const [unites, setUnites] = useState<Unite[]>([]);
    const [chapitres, setChapitres] = useState<Chapitre[]>([]);

    // États pour les IDs des éléments sélectionnés dans la hiérarchie
    const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(null);
    const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
    const [selectedUniteId, setSelectedUniteId] = useState<number | null>(null);
    const [selectedChapitreId, setSelectedChapitreId] = useState<number | null>(null);

    // État pour les données de la séquence en cours de création
    const [sequenceData, setSequenceData] = useState<Partial<CreateSequenceDb>>({
        titre_sequence: "",
        objectifs_specifiques: "",
        statut: "brouillon", // Statut par défaut
        fk_chapitre: undefined, // Clé étrangère du chapitre associé
    });

    // États pour contrôler la visibilité des modales d'ajout d'activités et d'évaluations
    const [showActivityEditor, setShowActivityEditor] = useState(false);
    const [showEvaluationEditor, setShowEvaluationEditor] = useState(false);

    // État pour stocker la liste combinée des activités et évaluations associées à la séquence, dans leur ordre
    const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>([]);

    // États pour gérer l'état de sauvegarde et de chargement du formulaire
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingForm, setIsLoadingForm] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Configuration des capteurs DND Kit pour la gestion du glisser-déposer
    const sensors = useSensors(
        useSensor(PointerSensor), // Pour les interactions à la souris
        useSensor(KeyboardSensor, { // Pour les interactions au clavier
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    /**
     * Effet au montage du composant pour charger toutes les données nécessaires aux sélecteurs
     * (niveaux, options, unités, chapitres) depuis Supabase.
     * Gère les états de chargement et les erreurs potentielles.
     */
    useEffect(() => {
        const fetchSelectData = async () => {
            setIsLoadingForm(true);
            setLoadError(null);
            try {
                // Exécution parallèle des requêtes pour optimiser le chargement
                const [{ data: niveauxData, error: niveauxError }, { data: optionsData, error: optionsError }, { data: unitesData, error: unitesError }, { data: chapitresData, error: chapitresError }] =
                    await Promise.all([
                        supabase.from("niveaux").select("*"),
                        supabase.from("options").select("*"),
                        supabase.from("unites").select("*"),
                        supabase.from("chapitres").select("*"),
                    ]);

                // Gestion des erreurs pour chaque requête
                if (niveauxError) throw new Error(`Erreur Niveaux: ${niveauxError.message}`);
                if (optionsError) throw new Error(`Erreur Options: ${optionsError.message}`);
                if (unitesError) throw new Error(`Erreur Unités: ${unitesError.message}`);
                if (chapitresError) throw new Error(`Erreur Chapitres: ${chapitresError.message}`);

                // Mise à jour des états avec les données récupérées
                setNiveaux(niveauxData || []);
                setOptions(optionsData || []);
                setUnites(unitesData || []);
                setChapitres(chapitresData || []);

            } catch (error: any) {
                // Affichage d'un message d'erreur si le chargement échoue
                setLoadError(error.message || "Impossible de charger les données du formulaire.");
                toast.error(`Erreur de chargement: ${error.message || "Vérifiez votre connexion ou la configuration de Supabase."}`);
            } finally {
                // Fin du chargement, quel que soit le résultat
                setIsLoadingForm(false);
            }
        };
        fetchSelectData();
    }, []); // Le tableau de dépendances vide assure que cet effet ne s'exécute qu'une seule fois au montage

    /**
     * Effet qui réagit au changement du chapitre sélectionné.
     * Met à jour la clé étrangère du chapitre dans les données de la séquence
     * et vide la liste des éléments de séquence ajoutés (activités/évaluations),
     * car ces éléments sont spécifiques à un chapitre.
     */
    useEffect(() => {
        setSequenceData(prev => ({ ...prev, fk_chapitre: selectedChapitreId ?? undefined }));
        setSequenceItems([]); // Vider les activités/évaluations si le chapitre change
    }, [selectedChapitreId]);

    // Définition des options filtrées, unités et chapitres en fonction des sélections parentes.
    // Ceci est fait en dehors des handlers de changement pour être toujours à jour.
    const filteredOptions = selectedNiveauId
        ? options.filter(o => o.niveau_id === selectedNiveauId)
        : [];

    const filteredUnites = selectedOptionId
        ? unites.filter(u => u.option_id === selectedOptionId)
        : [];

    const filteredChapitres = selectedUniteId
        ? chapitres.filter(c => c.unite_id === selectedUniteId)
        : [];

    /**
     * Gère le changement de sélection pour les niveaux.
     * Réinitialise les sélections des options, unités et chapitres.
     * @param value L'ID du niveau sélectionné (en chaîne de caractères).
     */
    const handleNiveauChange = useCallback((value: string) => {
        const id = Number(value);
        setSelectedNiveauId(id);
        setSelectedOptionId(null);
        setSelectedUniteId(null);
        setSelectedChapitreId(null);
        setSequenceData(prev => ({ ...prev, fk_chapitre: undefined })); // Réinitialise le chapitre lié
    }, []);

    /**
     * Gère le changement de sélection pour les options.
     * Réinitialise les sélections des unités et chapitres.
     * @param value L'ID de l'option sélectionnée (en chaîne de caractères).
     */
    const handleOptionChange = useCallback((value: string) => {
        const id = Number(value);
        setSelectedOptionId(id);
        setSelectedUniteId(null);
        setSelectedChapitreId(null);
        setSequenceData(prev => ({ ...prev, fk_chapitre: undefined })); // Réinitialise le chapitre lié
    }, []);

    /**
     * Gère le changement de sélection pour les unités.
     * Réinitialise la sélection du chapitre.
     * @param value L'ID de l'unité sélectionnée (en chaîne de caractères).
     */
    const handleUniteChange = useCallback((value: string) => {
        const id = Number(value);
        setSelectedUniteId(id);
        setSelectedChapitreId(null);
        setSequenceData(prev => ({ ...prev, fk_chapitre: undefined })); // Réinitialise le chapitre lié
    }, []);

    /**
     * Gère le changement de sélection pour les chapitres.
     * Met à jour l'ID du chapitre sélectionné.
     * @param value L'ID du chapitre sélectionné (en chaîne de caractères).
     */
    const handleChapitreChange = useCallback((value: string) => {
        const id = Number(value);
        setSelectedChapitreId(id);
    }, []);

    /**
     * Gère les changements sur les champs de texte (<Input> ou <Textarea>).
     * Met à jour l'état `sequenceData` dynamiquement.
     * @param e L'événement de changement d'un élément HTMLInput ou HTMLTextArea.
     */
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSequenceData(prev => ({
            ...prev,
            [name]: value,
        }));
    }, []);

    /**
     * Gère le changement de statut de la séquence.
     * @param value Le nouveau statut sélectionné.
     */
    const handleStatusChange = useCallback((value: string) => {
        setSequenceData(prev => ({ ...prev, statut: value }));
    }, []);

    /**
     * Ouvre la modale `ActivityChooserModal` si un chapitre est sélectionné.
     * Affiche un toast d'erreur sinon.
     */
    const handleAddActivityClick = useCallback(() => {
        if (!selectedChapitreId) {
            toast.error("Veuillez sélectionner un chapitre avant d'ajouter une activité.");
            return;
        }
        setShowActivityEditor(true);
    }, [selectedChapitreId]); // Dépendance à selectedChapitreId

    /**
     * Ouvre la modale `EvaluationChooserModal` si un chapitre est sélectionné.
     * Affiche un toast d'erreur sinon.
     */
    const handleAddEvaluationClick = useCallback(() => {
        if (!selectedChapitreId) {
            toast.error("Veuillez sélectionner un chapitre avant d'ajouter une évaluation.");
            return;
        }
        setShowEvaluationEditor(true);
    }, [selectedChapitreId]); // Dépendance à selectedChapitreId

    /**
     * Callback pour ajouter une activité à la liste `sequenceItems` après sa création/sélection.
     * @param activityId L'ID de l'activité.
     * @param activityTitle Le titre de l'activité.
     * @param description La description de l'activité.
     * @param objectifs Les objectifs de l'activité.
     */
    const handleActivityCreated = useCallback((activityId: number, activityTitle: string, description: string, objectifs: string[]) => {
        setSequenceItems(prev => [...prev, { id: activityId, titre: activityTitle, description, objectifs, type: 'activity' }]);
        setShowActivityEditor(false); // Ferme la modale
        toast.success(`Activité "${activityTitle}" ajoutée à la liste.`);
    }, []);

    /**
     * Callback pour ajouter une évaluation à la liste `sequenceItems` après sa création/sélection.
     * @param evaluationId L'ID de l'évaluation.
     * @param evaluationTitle Le titre de l'évaluation.
     * @param type_evaluation Le type d'évaluation.
     * @param description La description de l'évaluation.
     * @param connaissances Les connaissances évaluées.
     * @param capacitesEvaluees Les capacités évaluées.
     */
    const handleEvaluationCreated = useCallback((evaluationId: number, evaluationTitle: string, type_evaluation?: string, description?: string, connaissances?: string[], capacitesEvaluees?: string[]) => {
        setSequenceItems(prev => [...prev, { id: evaluationId, titre: evaluationTitle, type_evaluation, description, connaissances, capacitesEvaluees, type: 'evaluation' }]);
        setShowEvaluationEditor(false); // Ferme la modale
        toast.success(`Évaluation "${evaluationTitle}" ajoutée à la liste.`);
    }, []);

    /**
     * Supprime un élément (activité ou évaluation) de la liste `sequenceItems`.
     * @param idToRemove L'ID de l'élément à supprimer.
     * @param typeToRemove Le type de l'élément ('activity' ou 'evaluation').
     */
    const handleRemoveSequenceItem = useCallback((idToRemove: number, typeToRemove: 'activity' | 'evaluation') => {
        setSequenceItems(prev => prev.filter(item => !(item.id === idToRemove && item.type === typeToRemove)));
        toast.success(`${typeToRemove === 'activity' ? "Activité" : "Évaluation"} retirée de la liste de liaison.`);
    }, []);

    /**
     * Déplace manuellement un élément dans la liste `sequenceItems` vers le haut ou vers le bas.
     * Utilisé par les boutons fléchés dans `SortableItem`.
     * @param index L'index actuel de l'élément à déplacer.
     * @param direction 'up' pour monter, 'down' pour descendre.
     */
    const handleMoveSequenceItem = useCallback((index: number, direction: 'up' | 'down') => {
        setSequenceItems(prev => {
            const newItems = [...prev];
            const newIndex = direction === 'up' ? index - 1 : index + 1;

            // Vérifie si le nouvel index est valide (dans les limites du tableau)
            if (newIndex >= 0 && newIndex < newItems.length) {
                const [movedItem] = newItems.splice(index, 1); // Retire l'élément à l'index courant
                newItems.splice(newIndex, 0, movedItem); // Insère l'élément au nouvel index
                return newItems;
            }
            return prev; // Retourne l'état précédent si le déplacement n'est pas possible
        });
    }, []);

    /**
     * Gère la fin d'une opération de glisser-déposer (DND Kit).
     * Met à jour l'ordre des éléments dans le tableau `sequenceItems` après un déplacement.
     * @param event L'événement `DragEndEvent` de DND Kit.
     */
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        // Vérifie si l'élément a été effectivement déplacé vers une autre position
        if (active.id !== over?.id) {
            setSequenceItems((items) => {
                // Trouve l'index de l'élément actif et de l'élément sur lequel il a été déposé
                const oldIndex = items.findIndex(item => `${item.type}-${item.id}` === active.id);
                const newIndex = items.findIndex(item => `${item.type}-${item.id}` === over?.id);
                // Utilise `arrayMove` de DND Kit pour réorganiser le tableau
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }, []);

    /**
     * Fonction de soumission principale du formulaire.
     * Crée la séquence pédagogique dans la base de données et lie les activités/évaluations associées.
     * Gère les validations, les appels aux services Supabase et les notifications.
     * @param e L'événement de soumission du formulaire.
     */
 const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Empêche le rechargement de la page par défaut du formulaire
        setIsSaving(true); // Active l'état de sauvegarde
        let toastId: string | undefined; // ID pour contrôler le toast de chargement

        try {
            // Affiche un toast de chargement
            toastId = toast.loading("Création de la séquence et liaison des éléments...", { id: "createSequenceToast" });

            // ###################################
            // # Étape 1: Validation du formulaire #
            // ###################################
            if (!selectedChapitreId) {
                throw new Error("Veuillez sélectionner un chapitre pour la séquence.");
            }
            if (!sequenceData.titre_sequence?.trim()) { // S'assure que le titre n'est pas vide ou seulement des espaces
                throw new Error("Le titre de la séquence est obligatoire.");
            }

            // #######################################################
            // # Étape 2: Calcul de l'ordre de la nouvelle séquence #
            // #######################################################
            // Récupère les séquences existantes dans le chapitre pour déterminer le prochain ordre
            const { data: existingSequencesInChap, error: fetchOrderError } = await sequencesService.getSequencesByChapitreId(selectedChapitreId);

            if (fetchOrderError) {
                throw new Error(`Erreur lors de la récupération de l'ordre des séquences existantes : ${fetchOrderError.message}`);
            }

            // Le prochain ordre sera le nombre de séquences existantes + 1
            const nextOrder = (existingSequencesInChap?.length || 0) + 1;

            // ########################################
            // # Étape 3: Création de la séquence principale #
            // ########################################
            const sequenceToCreate: CreateSequenceDb = {
                // CORRECTION : Utilisez 'chapitre_id' comme nom de colonne, confirmé par le schéma de votre DB.
                chapitre_id: selectedChapitreId, 
                titre_sequence: sequenceData.titre_sequence.trim(),
                objectifs_specifiques: sequenceData.objectifs_specifiques?.trim() || null,
                ordre: nextOrder,
                statut: sequenceData.statut || "brouillon",
                // Si vous souhaitez ajouter 'description', 'duree_estimee', 'prerequis', 'created_by', 'ordre_dans_chapitre',
                // vous devez les inclure ici et mettre à jour le type CreateSequenceDb dans dbTypes.ts.
                // Par exemple, d'après votre schéma:
                description: sequenceData.description?.trim() || null, // Assurez-vous d'avoir ce champ dans sequenceData
                duree_estimee: sequenceData.duree_estimee || null, // Assurez-vous d'avoir ce champ dans sequenceData
                prerequis: sequenceData.prerequis || null, // Assurez-vous d'avoir ce champ dans sequenceData
                created_by: "CURRENT_USER_ID", // TODO: À remplacer par la logique d'authentification réelle
                // ordre_dans_chapitre: nextOrder, // Si cette colonne est distincte de 'ordre' et nécessaire
            };

            const { data: newSequence, error: createSequenceError } = await sequencesService.createSequence(sequenceToCreate);

            if (createSequenceError || !newSequence) {
                throw new Error(`Échec de la création de la séquence : ${createSequenceError?.message || "Données non reçues après création."}`);
            }

            const newSequenceId = newSequence.id; // Récupère l'ID de la séquence nouvellement créée

            // ###########################################################
            // # Étape 4: Liaison des activités et évaluations à la séquence #
            // ###########################################################
            let allLinksSuccessful = true; // Drapeaux pour savoir si toutes les liaisons ont réussi
            // Parcourt tous les éléments (activités/évaluations) dans l'ordre défini par l'utilisateur
            for (let i = 0; i < sequenceItems.length; i++) {
                const item = sequenceItems[i];
                const currentOrderInSequence = i + 1; // L'ordre dans la séquence (commence à 1)

                if (item.type === "activity") {
                    // Crée l'objet de liaison pour une activité
                    const activiteLink: CreateSequenceActiviteDb = {
                        sequence_id: newSequenceId,
                        activite_id: item.id,
                        ordre: currentOrderInSequence,
                    };
                    const { error: linkError } = await sequenceActiviteService.createSequenceActivite(activiteLink);
                    if (linkError) {
                        allLinksSuccessful = false;
                        console.error(`Erreur de liaison activité "${item.titre}" (ID: ${item.id}):`, linkError);
                        toast.error(`Échec de la liaison de l'activité "${item.titre}".`, { id: toastId, duration: 5000 });
                    }
                } else if (item.type === "evaluation") {
                    // Crée l'objet de liaison pour une évaluation
                    const evaluationLink: CreateSequenceEvaluationDb = {
                        sequence_id: newSequenceId,
                        evaluation_id: item.id,
                        ordre: currentOrderInSequence,
                    };
                    const { error: linkError } = await sequenceEvaluationService.createSequenceEvaluation(evaluationLink);
                    if (linkError) {
                        allLinksSuccessful = false;
                        console.error(`Erreur de liaison évaluation "${item.titre}" (ID: ${item.id}):`, linkError);
                        toast.error(`Échec de la liaison de l'évaluation "${item.titre}".`, { id: toastId, duration: 5000 });
                    }
                }
            }

            // #############################
            // # Étape 5: Finalisation et feedback #
            // #############################
            if (allLinksSuccessful) {
                toast.success("Séquence pédagogique créée avec succès !", { id: toastId });
            } else {
                toast.warning("Séquence créée, mais certains éléments n'ont pas pu être liés. Veuillez vérifier les logs.", { id: toastId, duration: 8000 });
            }

            // Réinitialisation du formulaire à son état initial
            setSequenceData({
                titre_sequence: "",
                objectifs_specifiques: "",
                statut: "brouillon",
                fk_chapitre: undefined, // Cette ligne ne gère plus la colonne DB directement mais l'état interne
                // Réinitialisez également les champs 'description', 'duree_estimee', 'prerequis' si vous les utilisez
                description: "",
                duree_estimee: null,
                prerequis: null,
            });
            setSelectedNiveauId(null);
            setSelectedOptionId(null);
            setSelectedUniteId(null);
            setSelectedChapitreId(null);
            setSequenceItems([]); // Vide la liste des éléments ajoutés

            onSequenceCreated(); // Appelle le callback pour informer le parent de la création réussie (ex: fermer la modale, rafraîchir une liste)

        } catch (error: any) {
            // Capture et affiche les erreurs survenues pendant le processus
            console.error("Erreur dans handleSubmit:", error);
            toast.error(error.message || "Une erreur inattendue est survenue lors de la création de la séquence.", { id: toastId, duration: 6000 });
        } finally {
            setIsSaving(false); // Désactive l'état de sauvegarde
        }
    };


    /**
     * Calcule la validité du formulaire pour activer/désactiver le bouton de soumission.
     * Le formulaire est valide si un chapitre est sélectionné et si le titre de la séquence n'est pas vide.
     */
    const isFormValid =
        selectedChapitreId !== null &&
        sequenceData.titre_sequence &&
        sequenceData.titre_sequence.trim().length > 0;

    /**
     * #######################################
     * # RENDU CONDITIONNEL DU COMPOSANT #
     * #######################################
     */

    // Affiche un message de chargement pendant la récupération des données initiales
    if (isLoadingForm) {
        return (
            <div className="flex justify-center items-center h-48">
                <p className="text-lg text-gray-600">Chargement des données du formulaire...</p>
            </div>
        );
    }

    // Affiche un message d'erreur si le chargement initial a échoué
    if (loadError) {
        return (
            <div className="flex flex-col justify-center items-center h-48 text-red-600">
                <p className="text-lg">Erreur lors du chargement du formulaire :</p>
                <p className="text-sm">{loadError}</p>
                <Button onClick={onCancel} className="mt-4">Retour</Button>
            </div>
        );
    }

    // Rendu principal du formulaire si le chargement est terminé et sans erreur
    return (
        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-lg shadow-xl max-w-3xl mx-auto">
            {/* Section 1: Liaison à la hiérarchie pédagogique */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
                <h2 className="text-xl font-bold text-blue-800 mb-4">Liaison de la Séquence au Programme Pédagogique</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Sélecteur de Niveau */}
                    <div>
                        <Label htmlFor="niveau" className="text-sm font-medium text-gray-700">Niveau</Label>
                        <Select onValueChange={handleNiveauChange} value={selectedNiveauId?.toString() || ""}>
                            <SelectTrigger id="niveau" className="h-10 text-base">
                                <SelectValue placeholder="Sélectionner un niveau" />
                            </SelectTrigger>
                            <SelectContent>
                                {niveaux.map((n) => (
                                    <SelectItem key={n.id} value={n.id.toString()}>{n.nom_niveau}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sélecteur d'Option (dépend du niveau sélectionné) */}
                    <div>
                        <Label htmlFor="option" className="text-sm font-medium text-gray-700">Option</Label>
                        <Select onValueChange={handleOptionChange} value={selectedOptionId?.toString() || ""} disabled={!selectedNiveauId}>
                            <SelectTrigger id="option" className="h-10 text-base">
                                <SelectValue placeholder="Sélectionner une option" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Filtre les options en fonction du niveau sélectionné */}
                                {filteredOptions.map((o) => (
                                    <SelectItem key={o.id} value={o.id.toString()}>{o.nom_option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sélecteur d'Unité (dépend de l'option sélectionnée) */}
                    <div>
                        <Label htmlFor="unite" className="text-sm font-medium text-gray-700">Unité</Label>
                        <Select onValueChange={handleUniteChange} value={selectedUniteId?.toString() || ""} disabled={!selectedOptionId}>
                            <SelectTrigger id="unite" className="h-10 text-base">
                                <SelectValue placeholder="Sélectionner une unité" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Filtre les unités en fonction de l'option sélectionnée */}
                                {filteredUnites.map((u) => (
                                    <SelectItem key={u.id} value={u.id.toString()}>{u.titre_unite}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sélecteur de Chapitre (dépend de l'unité sélectionnée) */}
                    <div>
                        <Label htmlFor="chapitre" className="text-sm font-medium text-gray-700">Chapitre</Label>
                        <Select onValueChange={handleChapitreChange} value={selectedChapitreId?.toString() || ""} disabled={!selectedUniteId}>
                            <SelectTrigger id="chapitre" className="h-10 text-base">
                                <SelectValue placeholder="Sélectionner un chapitre" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Filtre les chapitres en fonction de l'unité sélectionnée */}
                                {filteredChapitres.map((c) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>{c.titre_chapitre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Section 2: Informations détaillées de la Séquence */}
            <div className="relative p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Détails de la Séquence</h2>

                {/* Sélecteur de statut (positionné en haut à droite) */}
                <div className="absolute top-4 right-4">
                    <Label htmlFor="statut" className="sr-only">Statut</Label>
                    <Select onValueChange={handleStatusChange} value={sequenceData.statut || "brouillon"}>
                        <SelectTrigger id="statut" className="h-9 w-[120px] text-sm bg-white shadow-sm">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="brouillon">Brouillon</SelectItem>
                            <SelectItem value="validee">Validée</SelectItem>
                            <SelectItem value="archivee">Archivée</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Champs de saisie du titre et des objectifs de la séquence */}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="titre_sequence" className="text-sm font-medium text-gray-700">Titre de la séquence <span className="text-red-500">*</span></Label>
                        <Input
                            id="titre_sequence"
                            name="titre_sequence"
                            value={sequenceData.titre_sequence || ""}
                            onChange={handleChange}
                            placeholder="Ex: Introduction à la programmation"
                            required
                            className="h-10 text-base"
                        />
                    </div>
                    <div>
                        <Label htmlFor="objectifs_specifiques" className="text-sm font-medium text-gray-700">Objectif général de la séquence</Label>
                        <Input
                            id="objectifs_specifiques"
                            name="objectifs_specifiques"
                            value={sequenceData.objectifs_specifiques || ""}
                            onChange={handleChange}
                            placeholder="Décrivez l'objectif principal de cette séquence."
                            className="h-10 text-base"
                        />
                    </div>
                </div>
            </div>

            {/* Section 3: Activités et Évaluations de la Séquence - Affichage amélioré et réordonnable */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                <h3 className="text-lg font-bold text-blue-800 mb-3">Éléments de la Séquence (Activités & Évaluations)</h3>
                {sequenceItems.length === 0 ? (
                    <p className="text-gray-600 text-sm mb-4">Ajoutez des activités ou des évaluations à cette séquence.</p>
                ) : (
                    <div className="space-y-3 mb-4">
                        {/* Conteneur DND Kit pour la réorganisation des éléments */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={sequenceItems.map(item => `${item.type}-${item.id}`)} // Création d'IDs uniques pour le DND
                                strategy={verticalListSortingStrategy} // Stratégie de tri vertical
                            >
                                {sequenceItems.map((item, index) => (
                                    <SortableItem
                                        key={`${item.type}-${item.id}`} // Clé React unique pour le rendu de la liste
                                        id={`${item.type}-${item.id}`} // ID unique pour DND Kit
                                        item={item}
                                        index={index}
                                        onRemove={handleRemoveSequenceItem}
                                        onMoveUp={handleMoveSequenceItem}
                                        onMoveDown={handleMoveSequenceItem}
                                        isFirst={index === 0}
                                        isLast={index === sequenceItems.length - 1}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                )}
                {/* Boutons pour ajouter Activité / Évaluation */}
                <div className="flex gap-3">
                    <Button
                        type="button"
                        onClick={handleAddActivityClick}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-semibold h-10"
                        disabled={isSaving || !selectedChapitreId} // Désactivé si en sauvegarde ou pas de chapitre sélectionné
                    >
                        <Plus className="h-4 w-4 mr-2" /> Activité
                    </Button>
                    <Button
                        type="button"
                        onClick={handleAddEvaluationClick}
                        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-sm font-semibold h-10"
                        disabled={isSaving || !selectedChapitreId} // Désactivé si en sauvegarde ou pas de chapitre sélectionné
                    >
                        <Plus className="h-4 w-4 mr-2" /> Évaluation
                    </Button>
                </div>
            </div>

            {/* Boutons d'action du formulaire : Annuler et Créer */}
            <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="h-10 px-5">
                    Annuler
                </Button>
                <Button type="submit" disabled={isSaving || !isFormValid} className="h-10 px-5">
                    {isSaving ? "Création en cours..." : "Créer la Séquence"}
                </Button>
            </div>

            {/* --- Modales pour les éditeurs d'activités et d'évaluations --- */}
            {/* Modale pour ajouter une activité */}
            {showActivityEditor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl mx-auto overflow-y-auto max-h-[90vh]">
                        <ActivityChooserModal
                            onActivityAdded={handleActivityCreated}
                            onClose={() => setShowActivityEditor(false)}
                            chapitreId={selectedChapitreId}
                            niveauId={selectedNiveauId}
                            optionId={selectedOptionId}
                            uniteId={selectedUniteId}
                        />
                    </div>
                </div>
            )}

            {/* Modale pour ajouter une évaluation */}
            {showEvaluationEditor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl mx-auto overflow-y-auto max-h-[90vh]">
                        <EvaluationChooserModal
                            onEvaluationAdded={handleEvaluationCreated}
                            onClose={() => setShowEvaluationEditor(false)}
                            chapitreId={selectedChapitreId}
                            niveauId={selectedNiveauId}
                            optionId={selectedOptionId}
                            uniteId={selectedUniteId}
                        />
                    </div>
                </div>
            )}
        </form>
    );
};

// Exportation par défaut du composant CreateSequenceEditor
export default CreateSequenceEditor;
