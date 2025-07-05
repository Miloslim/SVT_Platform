// Nom du fichier: SequenceForm.tsx
// Chemin: src/components/planipeda/ScenarioEditor/SequenceForm.tsx

// Ce composant est un formulaire générique pour la création et l'édition de séquences.
// Il gère l'état local du formulaire, la logique de sélection de la hiérarchie pédagogique,
// l'ajout et la réorganisation des activités et évaluations au sein de la séquence.

// --- 1. Imports ---
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react"; // Icône pour les boutons d'ajout
import { supabase } from "@/backend/config/supabase"; // Assurez-vous que l'import est correct

// Imports pour le glisser-déposer (Dnd-kit)
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// Import du composant pour les éléments de la liste triable
import SortableItem from "./SortableItem";

// Import des modales de sélection/création d'activités/évaluations
import ActivityChooserModal from "@/components/planipeda/ScenarioEditor/ActivityChooserModal";
import EvaluationChooserModal from "@/components/planipeda/ScenarioEditor/EvaluationChooserModal";

// Import des interfaces de types (assurez-vous que ces types sont définis et correspondent)
import {
    SequenceFormData,
    SequenceItem,
    AddedActivityItem, // Interface pour l'activité ajoutée via la modale
    AddedEvaluationItem, // Interface pour l'évaluation ajoutée via la modale
    SequenceStatus,
} from "@/types/sequences"; // Vérifiez ce chemin et les définitions

// Interfaces pour la hiérarchie pédagogique (si non déjà dans un fichier global)
interface Niveau { id: number; nom_niveau: string; }
interface Option { id: number; nom_option: string; niveau_id: number; }
interface Unite { id: number; titre_unite: string; option_id: number; }
interface Chapitre { id: number; titre_chapitre: string; unite_id: number; }

// --- Définition des Props pour SequenceForm ---
interface SequenceFormProps {
    // Callbacks pour la soumission et l'annulation
    onSequenceSubmit: (
        data: SequenceFormData,
        chapitreId: number | null,
        sequenceItems: SequenceItem[],
        isEditing: boolean
    ) => void;
    onCancel: () => void;
    // Données initiales pour le mode édition
    initialSequenceData?: SequenceFormData;
    initialSequenceItems?: SequenceItem[];
    initialNiveauId?: number | null;
    initialOptionId?: number | null;
    initialUniteId?: number | null;
    initialChapitreId?: number | null;
    // Callbacks pour mettre à jour l'état du parent (EditSequenceEditor)
    onUpdateSequenceData: (data: Partial<SequenceFormData>) => void;
    onUpdateSequenceItems: (items: SequenceItem[]) => void;
    onUpdateHierarchyIds: (niveauId: number | null, optionId: number | null, uniteId: number | null, chapitreId: number | null) => void;
    isSaving: boolean; // Indique si une sauvegarde est en cours
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
    isSaving,
    onUpdateHierarchyIds, // Ajouté pour être utilisé dans le useEffect
}) => {
    // --- États locaux du formulaire ---
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
    const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>(initialSequenceItems || []);

    // États pour les sélecteurs de hiérarchie pédagogique
    const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(initialNiveauId || null);
    const [selectedOptionId, setSelectedOptionId] = useState<number | null>(initialOptionId || null);
    const [selectedUniteId, setSelectedUniteId] = useState<number | null>(initialUniteId || null);
    const [selectedChapitreId, setSelectedChapitreId] = useState<number | null>(initialChapitreId || null);

    // États pour les listes de données de la hiérarchie
    const [niveaux, setNiveaux] = useState<Niveau[]>([]);
    const [options, setOptions] = useState<Option[]>([]);
    const [unites, setUnites] = useState<Unite[]>([]);
    const [chapitres, setChapitres] = useState<Chapitre[]>([]);

    // États pour les modales d'ajout d'activité/évaluation
    const [showActivityEditor, setShowActivityEditor] = useState(false);
    const [showEvaluationEditor, setShowEvaluationEditor] = useState(false);

    // --- Hooks d'Effet (useEffect) ---

    // Effet pour charger toutes les données de hiérarchie (niveaux, options, unités, chapitres)
    // S'exécute une seule fois au montage du composant.
    useEffect(() => {
        const fetchHierarchyData = async () => {
            const [
                { data: niveauxData },
                { data: optionsData },
                { data: unitesData },
                { data: chapitresData }
            ] = await Promise.all([
                supabase.from("niveaux").select("*"),
                supabase.from("options").select("*"),
                supabase.from("unites").select("*"),
                supabase.from("chapitres").select("*"),
            ]);

            setNiveaux(niveauxData || []);
            setOptions(optionsData || []);
            setUnites(unitesData || []);
            setChapitres(chapitresData || []);
        };
        fetchHierarchyData();
    }, []);

    // Effet pour notifier le parent des changements dans les données de la séquence principale
    useEffect(() => {
        onUpdateSequenceData(sequenceData);
    }, [sequenceData, onUpdateSequenceData]);

    // Effet pour notifier le parent des changements dans les éléments de la séquence
    useEffect(() => {
        onUpdateSequenceItems(sequenceItems);
    }, [sequenceItems, onUpdateSequenceItems]);

    // Effet pour notifier le parent des changements dans les IDs de hiérarchie
    useEffect(() => {
        onUpdateHierarchyIds(selectedNiveauId, selectedOptionId, selectedUniteId, selectedChapitreId);
    }, [selectedNiveauId, selectedOptionId, selectedUniteId, selectedChapitreId, onUpdateHierarchyIds]);


    // --- Fonctions de Rappel / Handlers ---

    // Handler générique pour les champs de texte et numériques de sequenceData
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setSequenceData(prev => ({
            ...prev,
            [name]: type === "number" ? (value === "" ? null : Number(value)) : value,
        }));
    }, []);

    // Handlers pour les sélecteurs de hiérarchie pédagogique
    const handleNiveauChange = useCallback((value: string) => {
        const id = parseInt(value, 10);
        setSelectedNiveauId(id);
        setSelectedOptionId(null);
        setSelectedUniteId(null);
        setSelectedChapitreId(null);
    }, []);

    const handleOptionChange = useCallback((value: string) => {
        const id = parseInt(value, 10);
        setSelectedOptionId(id);
        setSelectedUniteId(null);
        setSelectedChapitreId(null);
    }, []);

    const handleUniteChange = useCallback((value: string) => {
        const id = parseInt(value, 10);
        setSelectedUniteId(id);
        setSelectedChapitreId(null);
    }, []);

    const handleChapitreChange = useCallback((value: string) => {
        const id = parseInt(value, 10);
        setSelectedChapitreId(id);
    }, []);

    // Handler pour le changement de statut de la séquence
    const handleStatusChange = useCallback((value: string) => {
        setSequenceData(prev => ({ ...prev, statut: value as SequenceStatus }));
    }, []);

    // Filtres des options, unités et chapitres basés sur les sélections précédentes (useMemo pour la performance)
    const filteredOptions = useMemo(() => {
        return options.filter(opt => opt.niveau_id === selectedNiveauId);
    }, [options, selectedNiveauId]);

    const filteredUnites = useMemo(() => {
        return unites.filter(unit => unit.option_id === selectedOptionId);
    }, [unites, selectedOptionId]);

    const filteredChapitres = useMemo(() => {
        return chapitres.filter(chap => chap.unite_id === selectedUniteId);
    }, [chapitres, selectedUniteId]);

    // --- Gestion des éléments de séquence (Activités/Évaluations) ---

    // Ouvre la modale d'ajout d'activité
    const handleAddActivityClick = useCallback(() => {
        if (!selectedChapitreId) {
            toast.error("Veuillez sélectionner un chapitre avant d'ajouter une activité.");
            return;
        }
        setShowActivityEditor(true);
    }, [selectedChapitreId]);

    // Ouvre la modale d'ajout d'évaluation
    const handleAddEvaluationClick = useCallback(() => {
        if (!selectedChapitreId) {
            toast.error("Veuillez sélectionner un chapitre avant d'ajouter une évaluation.");
            return;
        }
        setShowEvaluationEditor(true);
    }, [selectedChapitreId]);

    /**
     * Gère l'ajout d'une nouvelle activité depuis la modale.
     * @param newActivity L'objet activité renvoyé par ActivityChooserModal.
     */
    const handleActivityCreated = useCallback((newActivity: AddedActivityItem) => {
        // Log très important : vérifiez le contenu de newActivity ici
        console.log("--- DEBUG: newActivity reçu de la modale ActivityChooserModal ---", newActivity);

        setSequenceItems(prevItems => {
            // Mappage des objectifs : assurez-vous que `objectifs` est bien un tableau d'objets avec `description_objectif`
            const mappedObjectifs = (newActivity.objectifs || []).map(obj => obj.description_objectif).filter(Boolean);

            const newItem: SequenceItem = {
                id: newActivity.id, // L'ID de l'activité DOIT être présent et valide
                titre: newActivity.titre_activite || 'Activité sans titre', // Utilisez un fallback si titre est null/undefined
                description: newActivity.description || undefined, // Conservez undefined si la description est absente
                objectifs: mappedObjectifs,
                type: 'activity',
                order_in_sequence: prevItems.length + 1, // Ordre initial
            };

            const updatedItems = [...prevItems, newItem];
            // Log des items mis à jour pour vérifier la structure du nouvel élément
            console.log("--- DEBUG: sequenceItems APRÈS ajout Activité ---", updatedItems);
            onUpdateSequenceItems?.(updatedItems); // Notifie le parent
            return updatedItems;
        });
        setShowActivityEditor(false); // Ferme la modale
    }, [onUpdateSequenceItems]);

    /**
     * Gère l'ajout d'une nouvelle évaluation depuis la modale.
     * @param newEvaluation L'objet évaluation renvoyé par EvaluationChooserModal.
     */
    const handleEvaluationCreated = useCallback((newEvaluation: AddedEvaluationItem) => {
        // Log très important : vérifiez le contenu de newEvaluation ici
        console.log("--- DEBUG: newEvaluation reçu de la modale EvaluationChooserModal ---", newEvaluation);

        setSequenceItems(prevItems => {
            // Mappage des connaissances et capacités
            const mappedConnaissances = (newEvaluation.connaissances || []).map(kc => kc.titre_connaissance).filter(Boolean);
            const mappedCapacites = (newEvaluation.capacites_habiletes || []).map(ch => ch.titre_capacite_habilete).filter(Boolean);

            const newItem: SequenceItem = {
                id: newEvaluation.id, // L'ID de l'évaluation DOIT être présent et valide
                titre: newEvaluation.titre_evaluation || 'Évaluation sans titre', // Fallback
                type_evaluation: newEvaluation.type_evaluation || undefined,
                description: newEvaluation.introduction_activite || newEvaluation.consignes_specifiques || undefined, // Utilise la meilleure description disponible
                connaissances: mappedConnaissances,
                capacitesEvaluees: mappedCapacites,
                type: 'evaluation',
                order_in_sequence: prevItems.length + 1, // Ordre initial
            };

            const updatedItems = [...prevItems, newItem];
            // Log des items mis à jour pour vérifier la structure du nouvel élément
            console.log("--- DEBUG: sequenceItems APRÈS ajout Évaluation ---", updatedItems);
            onUpdateSequenceItems?.(updatedItems); // Notifie le parent
            return updatedItems;
        });
        setShowEvaluationEditor(false); // Ferme la modale
    }, [onUpdateSequenceItems]);


    // Gère la suppression d'un élément de la séquence
    // SequenceForm.tsx

// ... (vos imports et le reste de votre composant)

const handleRemoveSequenceItem = useCallback((type: 'activity' | 'evaluation', id: number) => {
    const fullIdToRemove = `${type}-${id}`; // C'est maintenant correct
 //   console.log(`[DEBUG] handleRemoveSequenceItem appelé pour supprimer : ${fullIdToRemove}`);
 //   console.log(`[DEBUG] État actuel de sequenceItems AVANT filtre :`, sequenceItems); // Ajoutez ce log

    setSequenceItems(prevItems => {
        const updatedItems = prevItems.filter(item => {
            const itemFullId = `${item.type}-${item.id}`;
            // console.log(`[DEBUG] Comparaison : "${itemFullId}" === "${fullIdToRemove}" ? ${itemFullId === fullIdToRemove}`); // Décommentez pour un debug très fin
            return itemFullId !== fullIdToRemove;
        });

        const reorderedItems = updatedItems.map((item, index) => ({
            ...item,
            order_in_sequence: index + 1
        }));

    //    console.log(`[DEBUG] État de sequenceItems APRÈS filtre et réordonnancement (avant retour) :`, reorderedItems); // Ajoutez ce log
        
        // Assurez-vous que onUpdateSequenceItems est bien une prop de SequenceForm et qu'elle est utilisée si nécessaire
        // onUpdateSequenceItems?.(reorderedItems); // Décommentez si cette prop est définie et utilisée

        return reorderedItems;
    });
    
    toast.success("Élément retiré de la séquence.");
   // console.log("[DEBUG] Toast de succès affiché."); // Ajoutez ce log
}, [sequenceItems, onUpdateSequenceItems]); // Ajoutez sequenceItems aux dépendances du useCallback pour être sûr qu'il a la dernière version.
    // Gère le déplacement des éléments dans la séquence (haut/bas)
    const handleMoveSequenceItem = useCallback((idToMove: string, direction: 'up' | 'down') => {
        setSequenceItems(prevItems => {
            const index = prevItems.findIndex(item => `${item.type}-${item.id}` === idToMove);
            if (index === -1) return prevItems;

            let newIndex = index;
            if (direction === 'up' && index > 0) {
                newIndex = index - 1;
            } else if (direction === 'down' && index < prevItems.length - 1) {
                newIndex = index + 1;
            } else {
                return prevItems; // Pas de mouvement possible
            }

            const movedItems = arrayMove(prevItems, index, newIndex);
            // Réajuster l'ordre après le mouvement
            const reorderedItems = movedItems.map((item, idx) => ({
                ...item,
                order_in_sequence: idx + 1
            }));
            onUpdateSequenceItems?.(reorderedItems); // Notifie le parent
            return reorderedItems;
        });
    }, [onUpdateSequenceItems]);

    // --- Dnd-kit handlers ---
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setSequenceItems((prevItems) => {
                const oldIndex = prevItems.findIndex(item => `${item.type}-${item.id}` === String(active.id));
                const newIndex = prevItems.findIndex(item => `${item.type}-${item.id}` === String(over?.id));
                const movedItems = arrayMove(prevItems, oldIndex, newIndex);
                // Réajuster l'ordre après le drag-and-drop
                const reorderedItems = movedItems.map((item, idx) => ({
                    ...item,
                    order_in_sequence: idx + 1
                }));
                onUpdateSequenceItems?.(reorderedItems); // Notifie le parent
                return reorderedItems;
            });
        }
    }, [onUpdateSequenceItems]);

    // Validation du formulaire pour activer le bouton de soumission
    const isFormValid = useMemo(() => {
        return (
            selectedChapitreId !== null &&
            sequenceData.titre_sequence.trim() !== ""
        );
    }, [selectedChapitreId, sequenceData.titre_sequence]);

    // #######################################
    // # RENDU PRINCIPAL DU COMPONENT #
    // #######################################
   // SequenceForm.tsx (extrait, retrouvez cette section dans votre fichier)

return (
    // IMPORTANT: The onSubmit handler now calls the prop from the parent!
    <form onSubmit={(e) => {
        e.preventDefault(); // Prevent default browser form submission
        if (selectedChapitreId === null) {
            toast.error("Veuillez sélectionner un chapitre pour la séquence.");
            return;
        }
        onSequenceSubmit(
            sequenceData,
            selectedChapitreId,
            sequenceItems,
            initialSequenceData ? true : false // Indique si on est en mode édition
        );
    }} className="space-y-5 bg-white p-6 rounded-lg shadow-xl max-w-[100vw] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche */}
            <div className="space-y-6">
                {/* Section 1: Liaison de la Séquence au Programme Pédagogique */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
                    <h2 className="text-xl font-bold text-blue-800 mb-4">Liaison de la Séquence au Programme Pédagogique</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Sélecteur de Niveau */}
                        <div>
                            <Label htmlFor="niveau">Niveau</Label>
                            <Select onValueChange={handleNiveauChange} value={selectedNiveauId?.toString() || ""}>
                                <SelectTrigger id="niveau">
                                    <SelectValue placeholder="Sélectionner un niveau" />
                                </SelectTrigger>
                                <SelectContent>
                                    {niveaux.map((n) => (
                                        <SelectItem key={n.id} value={n.id.toString()}>{n.nom_niveau}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Sélecteur d'Option */}
                        <div>
                            <Label htmlFor="option">Option</Label>
                            <Select onValueChange={handleOptionChange} value={selectedOptionId?.toString() || ""} disabled={!selectedNiveauId}>
                                <SelectTrigger id="option">
                                    <SelectValue placeholder="Sélectionner une option" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredOptions.map((o) => (
                                        <SelectItem key={o.id} value={o.id.toString()}>{o.nom_option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Sélecteur d'Unité */}
                        <div>
                            <Label htmlFor="unite">Unité</Label>
                            <Select onValueChange={handleUniteChange} value={selectedUniteId?.toString() || ""} disabled={!selectedOptionId}>
                                <SelectTrigger id="unite">
                                    <SelectValue placeholder="Sélectionner une unité" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredUnites.map((u) => (
                                        <SelectItem key={u.id} value={u.id.toString()}>{u.titre_unite}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Sélecteur de Chapitre */}
                        <div>
                            <Label htmlFor="chapitre">Chapitre</Label>
                            <Select onValueChange={handleChapitreChange} value={selectedChapitreId?.toString() || ""} disabled={!selectedUniteId}>
                                <SelectTrigger id="chapitre">
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

                {/* Section 2: Détails de la Séquence */}
                <div className="relative p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Détails de la Séquence</h2>
                    {/* Sélecteur de Statut */}
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
                    <div className="space-y-4">
                        {/* Champ Titre */}
                        <div>
                            <Label htmlFor="titre_sequence">Titre</Label>
                            <Input id="titre_sequence" name="titre_sequence" value={sequenceData.titre_sequence || ""} onChange={handleChange} required />
                        </div>
                        {/* Champ Objectif Général */}
                        <div>
                            <Label htmlFor="objectifs_specifiques">Objectif général</Label>
                            <Input id="objectifs_specifiques" name="objectifs_specifiques" value={sequenceData.objectifs_specifiques || ""} onChange={handleChange} />
                        </div>
                        {/* Champ Description */}
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" value={sequenceData.description || ""} onChange={handleChange} />
                        </div>
                        {/* Champ Durée Estimée */}
                        <div>
                            <Label htmlFor="duree_estimee">Durée estimée</Label>
                            <Input id="duree_estimee" name="duree_estimee" type="number" value={sequenceData.duree_estimee || ""} onChange={handleChange} />
                        </div>
                        {/* Champ Prérequis */}
                        <div>
                            <Label htmlFor="prerequis">Prérequis</Label>
                            <Input id="prerequis" name="prerequis" value={sequenceData.prerequis || ""} onChange={handleChange} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Colonne droite */}
            <div className="flex flex-col h-full justify-between space-y-6">
                {/* Section: Éléments de la Séquence (Activités/Évaluations) */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                    <h3 className="text-lg font-bold text-blue-800 mb-3">Éléments de la Séquence</h3>
                    {/* Boutons d'ajout */}
                    <div className="flex gap-4 mb-6">
                        <Button type="button" onClick={handleAddActivityClick} disabled={isSaving || !selectedChapitreId} className="flex-1 bg-blue-600 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Ajouter une Activité
                        </Button>
                        <Button type="button" onClick={handleAddEvaluationClick} disabled={isSaving || !selectedChapitreId} className="flex-1 bg-orange-600 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Ajouter une Évaluation
                        </Button>
                    </div>
                    {/* Affichage des éléments de la séquence */}
                    {sequenceItems.length === 0 ? (
                        <p className="text-center text-gray-600">Aucun élément ajouté.</p>
                    ) : (
                        // Début de la zone corrigée pour le DndContext et SortableContext
                        // DndContext et SortableContext DOIVENT ENVELOPPER LE CONTENEUR DU TABLEAU ENTIER
                        // C'est la seule façon d'éviter le problème de validation HTML et d'assurer la stabilité.
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={sequenceItems.map(item => `${item.type}-${item.id}`)} strategy={verticalListSortingStrategy}>
                                <div className="overflow-x-auto border rounded-md">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-2 py-2 text-xs font-medium text-gray-500">Ordre</th>
                                                <th className="px-2 py-2 text-xs font-medium text-gray-500">Type</th>
                                                <th className="px-4 py-2 text-xs font-medium text-gray-500">Titre / Description</th>
                                                <th className="px-2 py-2 text-xs font-medium text-gray-500">Actions</th>
                                            </tr>
                                        </thead>
                                        {/* tbody est maintenant un enfant direct de table, ce qui est correct */}
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {/* Les SortableItem doivent rendre des <tr> */}
                                            {sequenceItems.map((item, index) => (
                                                <SortableItem
                                                    key={`${item.type}-${item.id}`} // La clé est cruciale pour la performance de React et Dnd-kit
                                                    id={`${item.type}-${item.id}`} // L'ID pour Dnd-kit
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
                                    </table>
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
                {/* Boutons d'action (Annuler, Créer/Mettre à jour) */}
                <div className="flex justify-start gap-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Annuler</Button>
                    {/* Ce bouton est de type "submit" pour déclencher l'onSubmit du formulaire */}
                    <Button type="submit" disabled={isSaving || !isFormValid}>
                        {isSaving ? "Sauvegarde en cours..." : initialSequenceData ? "Mettre à jour" : "Créer"}
                    </Button>
                </div>
            </div>
        </div>

        {/* Modale d'ajout/édition d'Activité */}
        {showActivityEditor && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl mx-auto overflow-y-auto max-h-[90vh]">
                    {/* Assurez-vous que les props passées à ActivityChooserModal sont correctes */}
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

        {/* Modale d'ajout/édition d'Évaluation */}
        {showEvaluationEditor && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl mx-auto overflow-y-auto max-h-[90vh]">
                    {/* Assurez-vous que les props passées à EvaluationChooserModal sont correctes */}
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