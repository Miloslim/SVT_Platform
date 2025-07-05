// Nom du fichier: SequenceForm1.tsx (ancienne version, recupération: titre; objectif; select chapitre..)
// Ancien nom: CreateSequenceEditor.tsx
// Chemin: src/components/planipeda/ScenarioEditor/SequenceForm.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, GripVertical, Trash2, ArrowUp, ArrowDown, Edit } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea"; // Ajout si non déjà présent
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/backend/config/supabase"; // Assurez-vous que le chemin est correct
import { toast } from "sonner"; // Pour les notifications
import ActivityChooserModal from "@/components/planipeda/ScenarioEditor/ActivityChooserModal"; // Assurez-vous que le chemin est correct
import EvaluationChooserModal from "@/components/planipeda/ScenarioEditor/EvaluationChooserModal"; // Assurez-vous que le chemin est correct

// Imports des interfaces de types
import { SequenceFormData, SequenceItem, AddedActivityItem, AddedEvaluationItem } from "@/types/sequences"; // Assurez-vous que ce fichier existe et contient les types nécessaires

// Définition des types pour la hiérarchie pédagogique (si non déjà dans types/sequences)
interface Niveau { id: number; nom_niveau: string; }
interface Option { id: number; nom_option: string; niveau_id: number; }
interface Unite { id: number; titre_unite: string; option_id: number; }
interface Chapitre { id: number; titre_chapitre: string; unite_id: number; }

// Composant SortableItem (inchangé)
interface SortableItemProps {
    id: string; // Unique ID for DND Kit
    item: SequenceItem;
    index: number;
    onRemove: (type: 'activity' | 'evaluation', id: number) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    isFirst: boolean;
    isLast: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, item, index, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const getItemIcon = () => {
        if (item.type === 'activity') {
            return <span className="mr-2 text-blue-500">▶️</span>;
        }
        if (item.type === 'evaluation') {
            return <span className="mr-2 text-orange-500">📝</span>;
        }
        return null;
    };

    const getDetails = () => {
        if (item.type === 'activity') {
            return (
                <>
                    <p className="text-gray-600 text-sm italic">{item.description}</p>
                    {item.objectifs && item.objectifs.length > 0 && (
                        <p className="text-gray-500 text-xs mt-1">
                            Objectifs: {item.objectifs.join(', ')}
                        </p>
                    )}
                </>
            );
        }
        if (item.type === 'evaluation') {
            return (
                <>
                    <p className="text-gray-600 text-sm italic">{item.description || 'Pas de description.'}</p>
                    <p className="text-gray-500 text-xs mt-1">Type: {item.type_evaluation || 'N/A'}</p>
                    {(item.connaissances && item.connaissances.length > 0) && (
                        <p className="text-gray-500 text-xs mt-1">Connaissances: {item.connaissances.join(', ')}</p>
                    )}
                    {(item.capacitesEvaluees && item.capacitesEvaluees.length > 0) && (
                        <p className="text-gray-500 text-xs mt-1">Capacités: {item.capacitesEvaluees.join(', ')}</p>
                    )}
                </>
            );
        }
        return null;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center bg-white p-3 rounded-md shadow-sm border border-gray-200"
        >
            <button {...listeners} {...attributes} className="cursor-grab p-2 -ml-2 text-gray-400 hover:text-gray-600">
                <GripVertical className="h-5 w-5" />
            </button>
            <div className="flex-1 ml-2">
                <p className="font-semibold text-gray-800 flex items-center">
                    {getItemIcon()} {item.titre}
                </p>
                {getDetails()}
            </div>
            <div className="flex items-center space-x-2 ml-auto">
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
        </div>
    );
};


// Props pour le composant de formulaire générique (anciennement CreateSequenceEditor)
interface SequenceFormProps {
    onSequenceSubmit: (
        data: SequenceFormData,
        chapitreId: number,
        sequenceItems: SequenceItem[],
        isEdit: boolean // Ajout d'une prop pour indiquer si c'est une édition
    ) => Promise<void>; // Changé pour être une promesse
    onCancel: () => void;
    // Props pour les données initiales (rendues optionnelles pour la création)
    initialSequenceData?: SequenceFormData;
    initialSequenceItems?: SequenceItem[];
    initialNiveauId?: number | null;
    initialOptionId?: number | null;
    initialUniteId?: number | null;
    initialChapitreId?: number | null;
    // Callbacks pour mettre à jour les états dans le composant parent (EditSequenceEditor)
    onUpdateSequenceData?: (updatedFields: Partial<SequenceFormData>) => void;
    onUpdateSequenceItems?: (updatedItems: SequenceItem[]) => void;
    onUpdateHierarchyIds?: (niveauId: number | null, optionId: number | null, uniteId: number | null, chapitreId: number | null) => void;
    // États de chargement/erreur du parent (EditSequenceEditor)
    isLoadingForm?: boolean; // Renommé pour éviter la confusion avec le isLoading interne
    loadError?: string | null;
    isSaving?: boolean; // Indique si une opération de sauvegarde est en cours
}

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
    isLoadingForm = false, // Valeur par défaut pour le mode création
    loadError = null,     // Valeur par défaut
    isSaving = false,     // Valeur par défaut
}) => {
    // #######################################
    // # Déclarations des États (useState) #
    // #######################################

    // États du formulaire
    const [sequenceData, setSequenceData] = useState<SequenceFormData>(
        initialSequenceData || {
            titre_sequence: "",
            objectifs_specifiques: "",
            statut: "brouillon",
            description: null,
            duree_estimee: null,
            prerequis: null,
        }
    );
    const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(initialNiveauId || null);
    const [selectedOptionId, setSelectedOptionId] = useState<number | null>(initialOptionId || null);
    const [selectedUniteId, setSelectedUniteId] = useState<number | null>(initialUniteId || null);
    const [selectedChapitreId, setSelectedChapitreId] = useState<number | null>(initialChapitreId || null);
    const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>(initialSequenceItems || []);

    // États pour les données des sélecteurs
    const [niveaux, setNiveaux] = useState<Niveau[]>([]);
    const [options, setOptions] = useState<Option[]>([]);
    const [unites, setUnites] = useState<Unite[]>([]);
    const [chapitres, setChapitres] = useState<Chapitre[]>([]);

    // États pour les modales d'ajout d'activité/évaluation
    const [showActivityEditor, setShowActivityEditor] = useState(false);
    const [showEvaluationEditor, setShowEvaluationEditor] = useState(false);

    // ###################################
    // # Hooks d'Effet (useEffect) #
    // ###################################

    /**
     * Effet pour charger les données initiales des sélecteurs (niveaux, options, etc.).
     * S'exécute une seule fois au montage du composant.
     */
    useEffect(() => {
        const fetchHierarchyData = async () => {
            // Pas de setIsLoading ici car géré par le parent si en mode édition
            // setLoadError(null); // Pas ici non plus
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
                // Le loadError sera géré par le parent si applicable
            }
        };
        fetchHierarchyData();
    }, []);

    /**
     * Synchronise les props initiales avec les états locaux quand les props changent.
     * C'est crucial pour le mode édition lorsque les données sont chargées de manière asynchrone par le parent.
     */
    useEffect(() => {
        if (initialSequenceData) {
            setSequenceData(initialSequenceData);
        }
        if (initialSequenceItems) {
            setSequenceItems(initialSequenceItems);
        }
        // Ces checks sont importants pour ne pas écraser les sélections utilisateur
        // si le formulaire est en mode création et que initialXId est undefined.
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
        // Gérer les nombres pour duree_estimee
        const newValue = type === 'number' ? (value === '' ? null : parseFloat(value)) : value;

        setSequenceData(prev => {
            const newState = { ...prev, [name]: newValue };
            onUpdateSequenceData?.(newState); // Notifier le parent des changements
            return newState;
        });
    }, [onUpdateSequenceData]);

    const handleStatusChange = useCallback((value: string) => {
        setSequenceData(prev => {
            const newState = { ...prev, statut: value as "brouillon" | "validee" | "archivee" };
            onUpdateSequenceData?.(newState); // Notifier le parent des changements
            return newState;
        });
    }, [onUpdateSequenceData]);

    const handleNiveauChange = useCallback((value: string) => {
        const id = parseInt(value);
        setSelectedNiveauId(id);
        setSelectedOptionId(null); // Réinitialiser les sélections dépendantes
        setSelectedUniteId(null);
        setSelectedChapitreId(null);
        onUpdateHierarchyIds?.(id, null, null, null); // Notifier le parent
    }, [onUpdateHierarchyIds]);

    const handleOptionChange = useCallback((value: string) => {
        const id = parseInt(value);
        setSelectedOptionId(id);
        setSelectedUniteId(null);
        setSelectedChapitreId(null);
        onUpdateHierarchyIds?.(selectedNiveauId, id, null, null); // Notifier le parent
    }, [selectedNiveauId, onUpdateHierarchyIds]);

    const handleUniteChange = useCallback((value: string) => {
        const id = parseInt(value);
        setSelectedUniteId(id);
        setSelectedChapitreId(null);
        onUpdateHierarchyIds?.(selectedNiveauId, selectedOptionId, id, null); // Notifier le parent
    }, [selectedNiveauId, selectedOptionId, onUpdateHierarchyIds]);

    const handleChapitreChange = useCallback((value: string) => {
        const id = parseInt(value);
        setSelectedChapitreId(id);
        onUpdateHierarchyIds?.(selectedNiveauId, selectedOptionId, selectedUniteId, id); // Notifier le parent
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
            const newItems = [...prevItems, {
                id: newActivity.id,
                titre: newActivity.titre_activite,
                description: newActivity.description || "Pas de description fournie.",
                objectifs: newActivity.objectifs.map(obj => obj.description_objectif),
                type: 'activity',
                order_in_sequence: prevItems.length + 1 // Assigner un ordre initial
            }];
            onUpdateSequenceItems?.(newItems); // Notifier le parent
            return newItems;
        });
        setShowActivityEditor(false);
    }, [onUpdateSequenceItems]);

    const handleEvaluationCreated = useCallback((newEvaluation: AddedEvaluationItem) => {
        setSequenceItems(prevItems => {
            const newItems = [...prevItems, {
                id: newEvaluation.id,
                titre: newEvaluation.titre_evaluation,
                type_evaluation: newEvaluation.type_evaluation,
                description: newEvaluation.description,
                connaissances: newEvaluation.connaissances.map(c => c.titre_connaissance),
                capacitesEvaluees: newEvaluation.capacites_habiletes.map(ch => ch.titre_capacite_habilete),
                type: 'evaluation',
                order_in_sequence: prevItems.length + 1 // Assigner un ordre initial
            }];
            onUpdateSequenceItems?.(newItems); // Notifier le parent
            return newItems;
        });
        setShowEvaluationEditor(false);
    }, [onUpdateSequenceItems]);

    const handleRemoveSequenceItem = useCallback((type: 'activity' | 'evaluation', id: number) => {
        setSequenceItems(prevItems => {
            const updatedItems = prevItems.filter(item => !(item.type === type && item.id === id));
            onUpdateSequenceItems?.(updatedItems); // Notifier le parent
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
                    onUpdateSequenceItems?.(newItems); // Notifier le parent
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
            onUpdateSequenceItems?.(newItems); // Notifier le parent
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

        // Déterminer si c'est une création ou une modification
        const isEditMode = initialSequenceData !== undefined;

        // Passer le contrôle au parent (EditSequenceEditor ou CreateSequenceEditor)
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

    // Affiche un message de chargement pendant la récupération des données initiales (si en mode édition)
    if (isLoadingForm) {
        return (
            <div className="flex justify-center items-center h-48">
                <p className="text-lg text-gray-600">Chargement des données du formulaire...</p>
            </div>
        );
    }

    // Affiche un message d'erreur si le chargement initial a échoué (si en mode édition)
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
    // # RENDU PRINCIPAL DU COMPOSANT #
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
                    {/* Champs additionnels: description, durée estimée, prérequis */}
                    <div>
                        <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                        <Textarea // Utiliser Textarea pour des descriptions plus longues
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
                            step="0.1" // Permet les valeurs décimales
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
                                        onMoveUp={(id) => handleMoveSequenceItem(id, 'up')}
                                        onMoveDown={(id) => handleMoveSequenceItem(id, 'down')}
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
                        type="button" // Important: pour ne pas soumettre le formulaire principal
                        onClick={handleAddActivityClick}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-semibold h-10"
                        disabled={isSaving || selectedChapitreId === null} // Désactivé si en sauvegarde ou pas de chapitre sélectionné
                    >
                        <Plus className="h-4 w-4 mr-2" /> Activité
                    </Button>
                    <Button
                        type="button" // Important: pour ne pas soumettre le formulaire principal
                        onClick={handleAddEvaluationClick}
                        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-sm font-semibold h-10"
                        disabled={isSaving || selectedChapitreId === null} // Désactivé si en sauvegarde ou pas de chapitre sélectionné
                    >
                        <Plus className="h-4 w-4 mr-2" /> Évaluation
                    </Button>
                </div>
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