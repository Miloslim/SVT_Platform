// Nom du fichier: CreateSequenceEditor.tsx
// Chemin: src/components/planipeda/ScenarioEditor/CreateSequenceEditor.tsx

// Fonctionnalités:
// Ce composant React permet la création d'une nouvelle séquence pédagogique.
// Il offre une interface utilisateur pour définir les détails de la séquence,
// la lier à la hiérarchie pédagogique (Niveau > Option > Unité > Chapitre),
// et associer des activités et des évaluations à cette séquence.
// Il intègre la logique de calcul automatique de l'ordre de la séquence au sein de son chapitre
// et gère l'état du formulaire, les interactions utilisateur et les appels aux services backend (Supabase).
// Affiche des détails supplémentaires pour les activités et évaluations ajoutées, avec les objectifs/capacités en puces.
// Permet la réorganisation COMBINÉE des blocs d'activités et d'évaluations (une activité peut suivre une évaluation, etc.).
// L'ordre choisi est enregistré dans la base de données.
// Personnalisation de l'affichage des blocs d'évaluation pour inclure titre, connaissances et capacités/habiletés.

// --- 1. Imports ---
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
// Icônes de lucide-react (Assurez-vous que 'lucide-react' est installé)
import { Plus } from 'lucide-react'; // GripVertical, ArrowUp, ArrowDown, XCircle, Activity, LayoutList, ClipboardCheck, ClipboardList, BookText sont maintenant dans SortableItemCrt

// Imports de DND Kit (Assurez-vous que '@dnd-kit/core' et '@dnd-kit/sortable' sont installés)
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
// CSS from '@dnd-kit/utilities' est maintenant dans SortableItemCrt

// Imports des éditeurs réels d'activités et d'évaluations (Vérifiez et ajustez les chemins si nécessaire)
import ActivityChooserModalCrt from "@/components/planipeda/ScenarioEditor/ActivityChooserModalCrt";
import EvaluationChooserModalCrt from "@/components/planipeda/ScenarioEditor/EvaluationChooserModalCrt";

// Import du nouveau composant SortableItemCrt
import SortableItemCrt from "@/components/planipeda/ScenarioEditor/SortableItemCrt"; // Assurez-vous que le chemin est correct

// Imports des services backend spécifiques à la création/liaison de séquences
import { sequencesService } from "@/services/sequencesService";
import { sequenceActiviteService } from "@/services/sequenceActiviteService";
import { sequenceEvaluationService } from "@/services/sequenceEvaluationService";

// Import de la configuration Supabase (Utilisé pour les requêtes directes pour Niveaux, Options, Unités, Chapitres)
import { supabase } from "@/backend/config/supabase";

// Import du système de notification (Assurez-vous que 'sonner' est installé)
import { toast } from "sonner";


// --- 2. Interfaces de données utilisées dans le composant ---

// Interfaces pour les données de sélection de la hiérarchie pédagogique (Définies directement ici comme dans votre version)
interface Niveau { id: number; nom_niveau: string; }
interface Option { id: number; nom_option: string; niveau_id: number; }
interface Unite { id: number; titre_unite: string; option_id: number; }
interface Chapitre { id: number; titre_chapitre: string; unite_id: number; }

/**
 * Interfaces pour les éléments (activités/évaluations) ajoutés à la séquence.
 * Ces interfaces doivent correspondre à celles utilisées dans SortableItemCrt.
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
 * Interface pour les données du formulaire de séquence.
 * Reflète les champs de la table 'sequences' mais adaptés pour l'état React du formulaire.
 */
interface SequenceFormData {
    titre_sequence: string;
    objectifs_specifiques: string;
    description: string | null;
    duree_estimee: number | null; // Peut être null si non renseigné
    prerequis: string | null;
    statut: "brouillon" | "validee" | "archivee";
}

/**
 * Interface pour les données à insérer dans la table 'sequences'.
 * (Définie selon votre structure de table pour insertion des données - fichier2)
 */
interface CreateSequenceDb {
    chapitre_id: number;
    titre_sequence: string;
    objectifs_specifiques: string | null;
    ordre: number;
    statut: "brouillon" | "validee" | "archivee";
    description: string | null;
    duree_estimee: number | null;
    prerequis: string | null;
    created_by: string; // Ou number, selon votre schéma
}

/**
 * Interface pour les données à insérer dans la table 'sequence_activites'.
 * (Définie selon votre structure de table pour insertion des données - fichier2)
 */
interface CreateSequenceActiviteDb {
    sequence_id: number;
    activite_id: number;
    ordre: number;
}

/**
 * Interface pour les données à insérer dans la table 'sequence_evaluations'.
 * (Définie selon votre structure de table pour insertion des données - fichier2)
 */
interface CreateSequenceEvaluationDb {
    sequence_id: number;
    evaluation_id: number;
    ordre: number;
}

/**
 * Props pour le composant principal CreateSequenceEditor.
 */
interface CreateSequenceEditorProps {
    onSequenceCreated: () => void;
    onCancel: () => void;
}


// --- 3. Composant Principal : CreateSequenceEditor ---
const CreateSequenceEditor: React.FC<CreateSequenceEditorProps> = ({ onSequenceCreated, onCancel }) => {
    // #######################################
    // # Déclarations des États (useState) #
    // #######################################

    // États de chargement et de sauvegarde
    const [isLoadingForm, setIsLoadingForm] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // États pour les données de sélection de la hiérarchie pédagogique
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
    const [sequenceData, setSequenceData] = useState<SequenceFormData>({
        titre_sequence: "",
        objectifs_specifiques: "",
        statut: "brouillon", // Statut par défaut
        description: null,
        duree_estimee: null,
        prerequis: null,
    });

    // État pour stocker la liste combinée des activités et évaluations associées à la séquence, dans leur ordre
    const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>([]);

    // États pour contrôler la visibilité des modales d'ajout d'activités et d'évaluations
    const [showActivityEditor, setShowActivityEditor] = useState(false);
    const [showEvaluationEditor, setShowEvaluationEditor] = useState(false);

    // Configuration des capteurs DND Kit pour la gestion du glisser-déposer
    const sensors = useSensors(
        useSensor(PointerSensor), // Pour les interactions à la souris
        useSensor(KeyboardSensor, { // Pour les interactions au clavier
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );


    // ###################################
    // # Hooks d'Effet (useEffect) #
    // ###################################

    /**
     * Effet au montage du composant pour charger toutes les données nécessaires aux sélecteurs
     * (niveaux, options, unités, chapitres) directement depuis Supabase.
     * Gère les états de chargement et les erreurs potentielles.
     */
    useEffect(() => {
        const fetchSelectData = async () => {
            setIsLoadingForm(true);
            setLoadError(null);
            try {
                // Exécution parallèle des requêtes directes pour optimiser le chargement
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
     * Vide la liste des éléments de séquence ajoutés (activités/évaluations),
     * car ces éléments sont spécifiques à un chapitre.
     */
    useEffect(() => {
        // La gestion de fk_chapitre se fait directement dans handleSubmit lors de la création de sequenceToCreate
        setSequenceItems([]); // Vider les activités/évaluations si le chapitre change
    }, [selectedChapitreId]);


    // #######################################
    // # Variables Calculées / Dérivées #
    // #######################################

    // Définition des options filtrées en fonction du niveau sélectionné.
    const filteredOptions = selectedNiveauId
        ? options.filter(o => o.niveau_id === selectedNiveauId)
        : [];

    // Définition des unités filtrées en fonction de l'option sélectionnée.
    const filteredUnites = selectedOptionId
        ? unites.filter(u => u.option_id === selectedOptionId)
        : [];

    // Définition des chapitres filtrés en fonction de l'unité sélectionnée.
    const filteredChapitres = selectedUniteId
        ? chapitres.filter(c => c.unite_id === selectedUniteId)
        : [];

    /**
     * Calcule la validité du formulaire pour activer/désactiver le bouton de soumission.
     * Le formulaire est valide si un chapitre est sélectionné et si le titre de la séquence n'est pas vide.
     */
    const isFormValid =
        selectedChapitreId !== null &&
        sequenceData.titre_sequence &&
        sequenceData.titre_sequence.trim().length > 0;


    // #############################################
    // # Fonctions de Rappel / Handlers (useCallback) #
    // #############################################

    /** Gère le changement de sélection pour les niveaux. Réinitialise les sélections dépendantes. */
    const handleNiveauChange = useCallback((value: string) => {
        const id = Number(value);
        setSelectedNiveauId(id);
        setSelectedOptionId(null);
        setSelectedUniteId(null);
        setSelectedChapitreId(null);
    }, []);

    /** Gère le changement de sélection pour les options. Réinitialise les sélections dépendantes. */
    const handleOptionChange = useCallback((value: string) => {
        const id = Number(value);
        setSelectedOptionId(id);
        setSelectedUniteId(null);
        setSelectedChapitreId(null);
    }, []);

    /** Gère le changement de sélection pour les unités. Réinitialise les sélections dépendantes. */
    const handleUniteChange = useCallback((value: string) => {
        const id = Number(value);
        setSelectedUniteId(id);
        setSelectedChapitreId(null);
    }, []);

    /** Gère le changement de sélection pour les chapitres. */
    const handleChapitreChange = useCallback((value: string) => {
        const id = Number(value);
        setSelectedChapitreId(id);
    }, []);

    /** Gère les changements sur les champs de texte (<Input> ou <Textarea>). */
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSequenceData(prev => ({
            ...prev,
            [name]: name === "duree_estimee" ? (value === "" ? null : parseFloat(value)) : value,
        }));
    }, []);

    /** Gère le changement de statut de la séquence. */
    const handleStatusChange = useCallback((value: string) => {
        setSequenceData(prev => ({ ...prev, statut: value as SequenceFormData['statut'] }));
    }, []);

    /** Ouvre la modale `ActivityChooserModal` (vérifie si un chapitre est sélectionné). */
    const handleAddActivityClick = useCallback(() => {
        if (!selectedChapitreId) {
            toast.error("Veuillez sélectionner un chapitre avant d'ajouter une activité.");
            return;
        }
        setShowActivityEditor(true);
    }, [selectedChapitreId]);

    /** Ouvre la modale `EvaluationChooserModal` (vérifie si un chapitre est sélectionné). */
    const handleAddEvaluationClick = useCallback(() => {
        if (!selectedChapitreId) {
            toast.error("Veuillez sélectionner un chapitre avant d'ajouter une évaluation.");
            return;
        }
        setShowEvaluationEditor(true);
    }, [selectedChapitreId]);

    /** Callback pour ajouter une activité à la liste `sequenceItems` après sa création/sélection. */
    const handleActivityCreated = useCallback((activityId: number, activityTitle: string, description: string, objectifs: string[]) => {
        setSequenceItems(prev => [...prev, { id: activityId, titre: activityTitle, description, objectifs, type: 'activity' }]);
        setShowActivityEditor(false); // Ferme la modale
        toast.success(`Activité "${activityTitle}" ajoutée à la liste.`);
    }, []);

    /** Callback pour ajouter une évaluation à la liste `sequenceItems` après sa création/sélection. */
    const handleEvaluationCreated = useCallback((evaluationId: number, evaluationTitle: string, type_evaluation?: string, description?: string, connaissances?: string[], capacitesEvaluees?: string[]) => {
        setSequenceItems(prev => [...prev, { id: evaluationId, titre: evaluationTitle, type_evaluation, description, connaissances, capacitesEvaluees, type: 'evaluation' }]);
        setShowEvaluationEditor(false); // Ferme la modale
        toast.success(`Évaluation "${evaluationTitle}" ajoutée à la liste.`);
    }, []);

    /** Supprime un élément (activité ou évaluation) de la liste `sequenceItems`. */
    const handleRemoveSequenceItem = useCallback((idToRemove: number, typeToRemove: 'activity' | 'evaluation') => {
        setSequenceItems(prev => prev.filter(item => !(item.id === idToRemove && item.type === typeToRemove)));
        toast.success(`${typeToRemove === 'activity' ? "Activité" : "Évaluation"} retirée de la liste de liaison.`);
    }, []);

    /** Déplace manuellement un élément dans la liste `sequenceItems` vers le haut ou vers le bas. */
    const handleMoveSequenceItem = useCallback((index: number, direction: 'up' | 'down') => {
        setSequenceItems(prev => {
            const newItems = [...prev];
            const newIndex = direction === 'up' ? index - 1 : index + 1;

            if (newIndex >= 0 && newIndex < newItems.length) {
                const [movedItem] = newItems.splice(index, 1);
                newItems.splice(newIndex, 0, movedItem);
                return newItems;
            }
            return prev;
        });
    }, []);

    /** Gère la fin d'une opération de glisser-déposer (DND Kit). */
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setSequenceItems((items) => {
                const oldIndex = items.findIndex(item => `${item.type}-${item.id}` === active.id);
                const newIndex = items.findIndex(item => `${item.type}-${item.id}` === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }, []);

    /**
     * Fonction de soumission principale du formulaire.
     * Crée la séquence pédagogique dans la base de données et lie les activités/évaluations associées.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        let toastId: string | undefined;

        try {
            toastId = toast.loading("Création de la séquence et liaison des éléments...", { id: "createSequenceToast" });

            // Étape 1: Validation du formulaire
            if (!selectedChapitreId) {
                throw new Error("Veuillez sélectionner un chapitre pour la séquence.");
            }
            if (!sequenceData.titre_sequence?.trim()) {
                throw new Error("Le titre de la séquence est obligatoire.");
            }

            // Étape 2: Calcul de l'ordre de la nouvelle séquence
            const { data: existingSequencesInChap, error: fetchOrderError } = await sequencesService.getSequencesByChapitreId(selectedChapitreId);

            if (fetchOrderError) {
                throw new Error(`Erreur lors de la récupération de l'ordre des séquences existantes : ${fetchOrderError.message}`);
            }

            const nextOrder = (existingSequencesInChap?.length || 0) + 1;

            // Étape 3: Création de la séquence principale
            const sequenceToCreate: CreateSequenceDb = {
                chapitre_id: selectedChapitreId,
                titre_sequence: sequenceData.titre_sequence.trim(),
                objectifs_specifiques: sequenceData.objectifs_specifiques?.trim() || null,
                ordre: nextOrder,
                statut: sequenceData.statut || "brouillon",
                description: sequenceData.description?.trim() || null,
                duree_estimee: sequenceData.duree_estimee || null,
                prerequis: sequenceData.prerequis || null,
                created_by: "CURRENT_USER_ID", // TODO: À remplacer par la logique d'authentification réelle
            };

            const { data: newSequence, error: createSequenceError } = await sequencesService.createSequence(sequenceToCreate);

            if (createSequenceError || !newSequence) {
                throw new Error(`Échec de la création de la séquence : ${createSequenceError?.message || "Données non reçues après création."}`);
            }

            const newSequenceId = newSequence.id;

            // Étape 4: Liaison des activités et évaluations à la séquence
            let allLinksSuccessful = true;
            for (let i = 0; i < sequenceItems.length; i++) {
                const item = sequenceItems[i];
                const currentOrderInSequence = i + 1;

                if (item.type === "activity") {
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

            // Étape 5: Finalisation et feedback
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
                description: null,
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
            setIsSaving(false);
        }
    };


    // #######################################
    // # RENDU CONDITIONNEL DU COMPOSANT #
    // #######################################

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
                        <Input
                            id="description"
                            name="description"
                            value={sequenceData.description || ""}
                            onChange={handleChange}
                            placeholder="Description détaillée de la séquence."
                            className="h-10 text-base"
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
                                    <SortableItemCrt // Utilisez le nouveau nom du composant ici
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
            {/* Les modales sont rendues conditionnellement. Elles sont placées ici car elles sont enfants directes
                du formulaire dans le DOM et nécessitent le `type="button"` sur leurs boutons internes
                pour éviter la soumission intempestive du formulaire parent. */}
            {showActivityEditor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl mx-auto overflow-y-auto max-h-[90vh]">
                        <ActivityChooserModalCrt
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
                        <EvaluationChooserModalCrt
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

export default CreateSequenceEditor;