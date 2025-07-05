// Nom du fichier: SequenceForm.tsx la meilleure version brute19.06 à 23:45
// Chemin: src/components/planipeda/ScenarioEditor/SequenceForm.tsx

// Importations des bibliothèques et composants nécessaires
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, GripVertical, Trash2, ArrowUp, ArrowDown, Edit } from "lucide-react"; // Icônes
import { Button } from "@/components/ui/button"; // Composant bouton de shadcn/ui
import { Input } from "@/components/ui/input";    // Composant input de shadcn/ui
import { Label } from "@/components/ui/label";    // Composant label de shadcn/ui
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"; // Composants select de shadcn/ui
import { Textarea } from "@/components/ui/textarea"; // Composant textarea de shadcn/ui
import {
    DndContext,            // Contexte principal pour le glisser-déposer
    closestCenter,         // Stratégie de détection de collision
    KeyboardSensor,        // Capteur pour les interactions clavier
    PointerSensor,         // Capteur pour les interactions souris/touch
    useSensor,             // Hook pour utiliser les capteurs
    useSensors,            // Hook pour combiner plusieurs capteurs
} from "@dnd-kit/core";
import {
    SortableContext,                   // Contexte pour les éléments triables
    sortableKeyboardCoordinates,       // Coordonnées pour le tri au clavier
    verticalListSortingStrategy,       // Stratégie de tri vertical
    useSortable,                       // Hook pour rendre un élément triable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities"; // Utilitaires CSS pour les transformations DND
import { supabase } from "@/backend/config/supabase"; // Client Supabase pour les requêtes BDD
import { toast } from "sonner"; // Bibliothèque pour les notifications toast

// Importation des modales pour ajouter des activités et évaluations
import ActivityChooserModal from "@/components/planipeda/ScenarioEditor/ActivityChooserModal";
import EvaluationChooserModal from "@/components/planipeda/ScenarioEditor/EvaluationChooserModal";

// Importations des interfaces de types (assurez-vous que ce fichier existe et est correct)
// J'ai mis à jour les types pour AddedActivityItem et AddedEvaluationItem
// afin de refléter la structure des objets avec des propriétés comme description_objectif
// et titre_connaissance, avant leur transformation en simples chaînes pour SequenceItem.
import { SequenceFormData, SequenceItem } from "@/types/sequences";

// Définition des types pour la hiérarchie pédagogique
interface Niveau { id: number; nom_niveau: string; }
interface Option { id: number; nom_option: string; niveau_id: number; }
interface Unite { id: number; titre_unite: string; option_id: number; }
interface Chapitre { id: number; titre_chapitre: string; unite_id: number; }

// Interfaces pour les données d'activités et d'évaluations ajoutées via les modales
// J'ai déduit ces interfaces basées sur l'utilisation dans handleActivityCreated et handleEvaluationCreated.
// Celles-ci sont essentielles pour le mappage correct des données.
interface AddedActivityItem {
    id: number;
    titre_activite: string;
    description: string | null;
    objectifs: Array<{ id: number; description_objectif: string }>; // Array d'objets
    // autres champs si nécessaire
}

// MISE À JOUR ICI : Ajout de introduction_activite et consignes_specifiques
interface AddedEvaluationItem {
    id: number;
    titre_evaluation: string; // Utilisé comme 'titre' dans SequenceItem
    introduction_activite: string | null; // Nouvelle colonne
    consignes_specifiques: string | null; // Nouvelle colonne
    type_evaluation: string;
    connaissances: Array<{ id: number; titre_connaissance: string }>; // Array d'objets
    capacites_habiletes: Array<{ id: number; titre_capacite_habilete: string }>; // Array d'objets
    // autres champs si nécessaire
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
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        // onClick={() => onEdit(item.type, item.id)} // FUTURE: Add edit functionality
                        className="p-1 h-auto w-auto text-gray-500 hover:text-yellow-600"
                        title="Modifier"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
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


// Interface pour les props du composant principal SequenceForm
interface SequenceFormProps {
    onSequenceSubmit: (
        data: SequenceFormData,
        chapitreId: number,
        sequenceItems: SequenceItem[],
        isEdit: boolean
    ) => Promise<void>;
    onCancel: () => void;

    initialSequenceData?: SequenceFormData;
    initialSequenceItems?: SequenceItem[];
    initialNiveauId?: number | null;
    initialOptionId?: number | null;
    initialUniteId?: number | null;
    initialChapitreId?: number | null;

    onUpdateSequenceData?: (updatedFields: Partial<SequenceFormData>) => void;
    onUpdateSequenceItems?: (updatedItems: SequenceItem[]) => void;
    onUpdateHierarchyIds?: (niveauId: number | null, optionId: number | null, uniteId: number | null, chapitreId: number | null) => void;

    isLoadingForm?: boolean;
    loadError?: string | null;
    isSaving?: boolean;
}

/**
 * Composant SequenceForm : Formulaire pour créer ou modifier une séquence pédagogique.
 * Il gère la liaison avec la hiérarchie pédagogique, les détails de la séquence,
 * et l'ajout/réorganisation d'activités et d'évaluations dans un format tabulaire.
 */
const SequenceForm: React.FC<SequenceFormProps> = ({
    onSequenceSubmit,
    onCancel,
    initialSequenceData,
    initialSequenceItems,
    initialNiveauId,
    initialOptionId,
    initialUniteId,
    initialChapitreId,
    onUpdateSequenceData,
    onUpdateSequenceItems,
    onUpdateHierarchyIds,
    isLoadingForm = false,
    loadError = null,
    isSaving = false,
}) => {
    // #######################################
    // # Déclarations des États (useState) #
    // #######################################

    const [sequenceData, setSequenceData] = useState<SequenceFormData>(
        initialSequenceData || {
            titre_sequence: "",
            objectifs_specifiques: "",
            statut: "brouillon",
            description: null,
            duree_estimee: null,
            prerequis: null,
            mots_cles: null,
        }
    );
    const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(initialNiveauId || null);
    const [selectedOptionId, setSelectedOptionId] = useState<number | null>(initialOptionId || null);
    const [selectedUniteId, setSelectedUniteId] = useState<number | null>(initialUniteId || null);
    const [selectedChapitreId, setSelectedChapitreId] = useState<number | null>(initialChapitreId || null);
    const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>(initialSequenceItems || []);

    const [niveaux, setNiveaux] = useState<Niveau[]>([]);
    const [options, setOptions] = useState<Option[]>([]);
    const [unites, setUnites] = useState<Unite[]>([]);
    const [chapitres, setChapitres] = useState<Chapitre[]>([]);

    const [showActivityEditor, setShowActivityEditor] = useState(false);
    const [showEvaluationEditor, setShowEvaluationEditor] = useState(false);

    // ###################################
    // # Hooks d'Effet (useEffect) #
    // ###################################

    useEffect(() => {
        const fetchHierarchyData = async () => {
            try {
                const [{ data: niveauxData }, { data: optionsData }, { data: unitesData }, { data: chapitresData }] =
                    await Promise.all([
                        supabase.from("niveaux").select("*"),
                        supabase.from("options").select("*"),
                        supabase.from("unites").select("*"),
                        supabase.from("chapitres").select("*"),
                    ]);

                setNiveaux(niveauxData || []);
                setOptions(optionsData || []);
                setUnites(unitesData || []);
                setChapitres(chapitresData || []);

            } catch (error: any) {
                console.error("Erreur lors du chargement des données de hiérarchie:", error);
                toast.error("Échec du chargement des données de hiérarchie.");
            }
        };
        fetchHierarchyData();
    }, []);

    useEffect(() => {
        if (initialSequenceData) {
            setSequenceData(initialSequenceData);
        }
        if (initialSequenceItems) {
            setSequenceItems(initialSequenceItems);
        }
        if (initialNiveauId !== undefined) {
            setSelectedNiveauId(initialNiveauId);
        }
        if (initialOptionId !== undefined) {
            setSelectedOptionId(initialOptionId);
        }
        if (initialUniteId !== undefined) {
            setSelectedUniteId(initialUniteId);
        }
        if (initialChapitreId !== undefined) {
            setSelectedChapitreId(initialChapitreId);
        }
    }, [initialSequenceData, initialSequenceItems, initialNiveauId, initialOptionId, initialUniteId, initialChapitreId]);


    // #############################################
    // # Fonctions de Rappel / Handlers (useCallback) #
    // #############################################

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const newValue = type === 'number' ? (value === '' ? null : parseFloat(value)) : value;

        setSequenceData(prev => {
            const newState = { ...prev, [name]: newValue };
            onUpdateSequenceData?.(newState);
            return newState;
        });
    }, [onUpdateSequenceData]);

    const handleStatusChange = useCallback((value: string) => {
        setSequenceData(prev => {
            const newState = { ...prev, statut: value as "brouillon" | "validee" | "archivee" };
            onUpdateSequenceData?.(newState);
            return newState;
        });
    }, [onUpdateSequenceData]);

    const handleNiveauChange = useCallback((value: string) => {
        const id = parseInt(value);
        setSelectedNiveauId(id);
        setSelectedOptionId(null);
        setSelectedUniteId(null);
        setSelectedChapitreId(null);
        onUpdateHierarchyIds?.(id, null, null, null);
    }, [onUpdateHierarchyIds]);

    const handleOptionChange = useCallback((value: string) => {
        const id = parseInt(value);
        setSelectedOptionId(id);
        setSelectedUniteId(null);
        setSelectedChapitreId(null);
        onUpdateHierarchyIds?.(selectedNiveauId, id, null, null);
    }, [selectedNiveauId, onUpdateHierarchyIds]);

    const handleUniteChange = useCallback((value: string) => {
        const id = parseInt(value);
        setSelectedUniteId(id);
        setSelectedChapitreId(null);
        onUpdateHierarchyIds?.(selectedNiveauId, selectedOptionId, id, null);
    }, [selectedNiveauId, selectedOptionId, onUpdateHierarchyIds]);

    const handleChapitreChange = useCallback((value: string) => {
        const id = parseInt(value);
        setSelectedChapitreId(id);
        onUpdateHierarchyIds?.(selectedNiveauId, selectedOptionId, selectedUniteId, id);
    }, [selectedNiveauId, selectedOptionId, selectedUniteId, onUpdateHierarchyIds]);

    const handleAddActivityClick = useCallback(() => {
        if (selectedChapitreId === null) {
            toast.error("Veuillez d'abord sélectionner un chapitre.");
            return;
        }
        setShowActivityEditor(true);
    }, [selectedChapitreId]);

    const handleAddEvaluationClick = useCallback(() => {
        if (selectedChapitreId === null) {
            toast.error("Veuillez d'abord sélectionner un chapitre.");
            return;
        }
        setShowEvaluationEditor(true);
    }, [selectedChapitreId]);

    const handleActivityCreated = useCallback((newActivity: AddedActivityItem) => {
        setSequenceItems(prevItems => {
            // S'assurer que les objectifs sont mappés en tableau de chaînes
            const mappedObjectifs = newActivity.objectifs ?
                newActivity.objectifs.map(obj => obj.description_objectif) : [];

            const newItems = [...prevItems, {
                id: newActivity.id,
                titre: newActivity.titre_activite,
                description: newActivity.description || undefined, // undefined si null/vide
                objectifs: mappedObjectifs, // Assurez-vous que c'est un tableau de strings
                type: 'activity',
                order_in_sequence: prevItems.length + 1
            }];
            onUpdateSequenceItems?.(newItems);
            return newItems;
        });
        setShowActivityEditor(false);
    }, [onUpdateSequenceItems]);

    // MISE À JOUR ICI : Utilisation de introduction_activite et consignes_specifiques
    const handleEvaluationCreated = useCallback((newEvaluation: AddedEvaluationItem) => {
        setSequenceItems(prevItems => {
            // S'assurer que les connaissances et capacités sont mappées en tableaux de chaînes
            const mappedConnaissances = newEvaluation.connaissances ?
                newEvaluation.connaissances.map(c => c.titre_connaissance) : [];
            const mappedCapacites = newEvaluation.capacites_habiletes ?
                newEvaluation.capacites_habiletes.map(ch => ch.titre_capacite_habilete) : [];

            const newItems = [...prevItems, {
                id: newEvaluation.id,
                titre: newEvaluation.titre_evaluation, // Utilise titre_evaluation comme titre générique
                type_evaluation: newEvaluation.type_evaluation,
                // Utilise introduction_activite ou consignes_specifiques comme description
                // On peut choisir la priorité ou les concaténer
                description: newEvaluation.introduction_activite || newEvaluation.consignes_specifiques || undefined,
                introduction_activite: newEvaluation.introduction_activite || undefined, // Pour affichage dans SortableItem
                consignes_specifiques: newEvaluation.consignes_specifiques || undefined, // Pour affichage dans SortableItem
                connaissances: mappedConnaissances, // Assurez-vous que c'est un tableau de strings
                capacitesEvaluees: mappedCapacites, // Assurez-vous que c'est un tableau de strings
                type: 'evaluation',
                order_in_sequence: prevItems.length + 1
            }];
            onUpdateSequenceItems?.(newItems);
            return newItems;
        });
        setShowEvaluationEditor(false);
    }, [onUpdateSequenceItems]);

    const handleRemoveSequenceItem = useCallback((type: 'activity' | 'evaluation', id: number) => {
        setSequenceItems(prevItems => {
            const updatedItems = prevItems.filter(item => !(item.type === type && item.id === id));
            onUpdateSequenceItems?.(updatedItems);
            return updatedItems;
        });
    }, [onUpdateSequenceItems]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = useCallback(({ active, over }: any) => {
        if (active.id !== over.id) {
            setSequenceItems((items) => {
                const oldIndex = items.findIndex(item => `${item.type}-${item.id}` === active.id);
                const newIndex = items.findIndex(item => `${item.type}-${item.id}` === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newItems = [...items];
                    const [movedItem] = newItems.splice(oldIndex, 1);
                    newItems.splice(newIndex, 0, movedItem);
                    onUpdateSequenceItems?.(newItems);
                    return newItems;
                }
                return items;
            });
        }
    }, [onUpdateSequenceItems]);

    const handleMoveSequenceItem = useCallback((id: string, direction: 'up' | 'down') => {
        setSequenceItems(prevItems => {
            const index = prevItems.findIndex(item => `${item.type}-${item.id}` === id);
            if (index === -1) return prevItems;

            const newItems = [...prevItems];
            if (direction === 'up' && index > 0) {
                [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
            } else if (direction === 'down' && index < newItems.length - 1) {
                [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
            }
            onUpdateSequenceItems?.(newItems);
            return newItems;
        });
    }, [onUpdateSequenceItems]);


    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChapitreId) {
            toast.error("Veuillez sélectionner un chapitre avant de soumettre.");
            return;
        }
        if (!sequenceData.titre_sequence?.trim()) {
            toast.error("Le titre de la séquence est obligatoire.");
            return;
        }

        const isEditMode = initialSequenceData !== undefined;

        await onSequenceSubmit(sequenceData, selectedChapitreId, sequenceItems, isEditMode);

    }, [sequenceData, selectedChapitreId, sequenceItems, initialSequenceData, onSequenceSubmit]);


    // #######################################
    // # Fonctions utilitaires / Mémoisation #
    // #######################################

    const filteredOptions = useMemo(() => {
        return selectedNiveauId
            ? options.filter((o) => o.niveau_id === selectedNiveauId)
            : [];
    }, [selectedNiveauId, options]);

    const filteredUnites = useMemo(() => {
        return selectedOptionId
            ? unites.filter((u) => u.option_id === selectedOptionId)
            : [];
    }, [selectedOptionId, unites]);

    const filteredChapitres = useMemo(() => {
        return selectedUniteId
            ? chapitres.filter((c) => c.unite_id === selectedUniteId)
            : [];
    }, [selectedUniteId, chapitres]);

    const isFormValid = useMemo(() => {
        return (
            selectedNiveauId !== null &&
            selectedOptionId !== null &&
            selectedUniteId !== null &&
            selectedChapitreId !== null &&
            sequenceData.titre_sequence.trim() !== ""
        );
    }, [selectedNiveauId, selectedOptionId, selectedUniteId, selectedChapitreId, sequenceData.titre_sequence]);

    // #######################################
    // # RENDU CONDITIONNEL DU COMPOSANT #
    // #######################################

    if (isLoadingForm) {
        return (
            <div className="flex justify-center items-center h-48">
                <p className="text-lg text-gray-600">Chargement des données du formulaire...</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex flex-col justify-center items-center h-48 text-red-600">
                <p className="text-lg">Erreur lors du chargement du formulaire :</p>
                <p className="text-sm">{loadError}</p>
                <Button onClick={onCancel} className="mt-4">Retour</Button>
            </div>
        );
    }

    // #######################################
    // # RENDU PRINCIPAL DU COMPONENT #
    // #######################################

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
                        <Select onValueChange={handleOptionChange} value={selectedOptionId?.toString() || ""} disabled={selectedNiveauId === null}>
                            <SelectTrigger id="option" className="h-10 text-base">
                                <SelectValue placeholder="Sélectionner une option" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredOptions.map((o) => (
                                    <SelectItem key={o.id} value={o.id.toString()}>{o.nom_option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sélecteur d'Unité (dépend de l'option sélectionnée) */}
                    <div>
                        <Label htmlFor="unite" className="text-sm font-medium text-gray-700">Unité</Label>
                        <Select onValueChange={handleUniteChange} value={selectedUniteId?.toString() || ""} disabled={selectedOptionId === null}>
                            <SelectTrigger id="unite" className="h-10 text-base">
                                <SelectValue placeholder="Sélectionner une unité" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredUnites.map((u) => (
                                    <SelectItem key={u.id} value={u.id.toString()}>{u.titre_unite}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sélecteur de Chapitre (dépend de l'unité sélectionnée) */}
                    <div>
                        <Label htmlFor="chapitre" className="text-sm font-medium text-gray-700">Chapitre</Label>
                        <Select onValueChange={handleChapitreChange} value={selectedChapitreId?.toString() || ""} disabled={selectedUniteId === null}>
                            <SelectTrigger id="chapitre" className="h-10 text-base">
                                <SelectValue placeholder="Sélectionner un chapitre" />
                            </SelectTrigger>
                            <SelectContent>
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

                {/* Sélecteur de statut (positionné en haut à droite pour un accès rapide) */}
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
                    <div>
                        <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={sequenceData.description || ""}
                            onChange={handleChange}
                            placeholder="Description détaillée de la séquence."
                            className="min-h-[80px] text-base"
                        />
                    </div>
                    <div>
                        <Label htmlFor="duree_estimee" className="text-sm font-medium text-gray-700">Durée estimée (heures)</Label>
                        <Input
                            id="duree_estimee"
                            name="duree_estimee"
                            type="number"
                            value={sequenceData.duree_estimee === null ? "" : sequenceData.duree_estimee}
                            onChange={handleChange}
                            placeholder="Ex: 2.5"
                            className="h-10 text-base"
                            step="0.1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="prerequis" className="text-sm font-medium text-gray-700">Prérequis</Label>
                        <Input
                            id="prerequis"
                            name="prerequis"
                            value={sequenceData.prerequis || ""}
                            onChange={handleChange}
                            placeholder="Ex: Connaissances de base en algorithmique"
                            className="h-10 text-base"
                        />
                    </div>
                </div>
            </div>

            {/* Section 3: Activités et Évaluations de la Séquence - Affichage Tabulaire */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                <h3 className="text-lg font-bold text-blue-800 mb-3">Éléments de la Séquence (Activités & Évaluations)</h3>

                {/* Boutons d'ajout (maintenant au-dessus du tableau) */}
                <div className="flex gap-4 mb-6">
                    <Button
                        type="button"
                        onClick={handleAddActivityClick}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" // flex-1 pour qu'ils prennent la même largeur
                        disabled={isSaving || selectedChapitreId === null}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Ajouter une Activité
                    </Button>
                    <Button
                        type="button"
                        onClick={handleAddEvaluationClick}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" // flex-1 pour qu'ils prennent la même largeur
                        disabled={isSaving || selectedChapitreId === null}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Ajouter une Évaluation
                    </Button>
                </div>

                {/* Affichage des éléments de la séquence dans un tableau */}
                {sequenceItems.length === 0 ? (
                    // Message si la liste est vide
                    <p className="text-gray-600 text-sm text-center py-4">Aucun élément dans cette séquence. Ajoutez-en ci-dessus !</p>
                ) : (
                    <div className="overflow-x-auto rounded-md border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                        Ordre
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                        Type
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Titre / Description
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            {/* DndContext et SortableContext enveloppent le <tbody> */}
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={sequenceItems.map(item => `${item.type}-${item.id}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {/* Chaque SortableItem rendra une ligne <tr> */}
                                        {sequenceItems.map((item, index) => (
                                            <SortableItem
                                                key={`${item.type}-${item.id}`}
                                                id={`${item.type}-${item.id}`}
                                                item={item}
                                                index={index}
                                                onRemove={handleRemoveSequenceItem}
                                                onMoveUp={(id) => handleMoveSequenceItem(id, 'up')}
                                                onMoveDown={(id) => handleMoveSequenceItem(id, 'down')}
                                                isFirst={index === 0}
                                                isLast={index === sequenceItems.length - 1}
                                            />
                                        ))}
                                    </tbody>
                                </SortableContext>
                            </DndContext>
                        </table>
                    </div>
                )}
            </div>

            {/* Boutons d'action du formulaire : Annuler et Soumettre */}
            <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="h-10 px-5">
                    Annuler
                </Button>
                <Button type="submit" disabled={isSaving || !isFormValid} className="h-10 px-5">
                    {isSaving ? "Sauvegarde en cours..." : (initialSequenceData ? "Mettre à jour la Séquence" : "Créer la Séquence")}
                </Button>
            </div>

            {/* --- Modales pour les éditeurs d'activités et d'évaluations --- */}
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

export default SequenceForm;