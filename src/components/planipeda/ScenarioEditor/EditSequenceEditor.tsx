// Nom du fichier: EditSequenceEditor.tsx
// Chemin: src/components/planipeda/ScenarioEditor/EditSequenceEditor.tsx

// Fonctionnalités:
// Ce composant est une enveloppe (wrapper) pour SequenceForm, dédié à la modification de séquences existantes.
// Il est responsable de:
// - Récupérer l'ID de la séquence à modifier via les paramètres de l'URL.
// - Charger toutes les données de cette séquence depuis Supabase, y compris sa hiérarchie (chapitre, unité, option, niveau).
// - Charger les activités et évaluations déjà liées à cette séquence, en respectant leur ordre.
// - Gérer les états de chargement et d'erreur spécifiques à l'édition.
// - Transmettre les données initiales chargées et les callbacks de mise à jour au SequenceForm.
// - Gérer la logique de soumission (UPDATE) pour la séquence et ses liaisons d'activités/évaluations.
// - Rediriger l'utilisateur après une sauvegarde réussie ou une annulation.

// --- 1. Imports ---
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/backend/config/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react"; // Ajouté pour l'icône de chargement
import { Button } from "@/components/ui/button"; // Assurez-vous que le composant Button est bien importé
import { useNavigate, useParams } from "react-router-dom"; // Import de useParams pour récupérer l'ID de l'URL

// Import du composant de formulaire principal
import SequenceForm from "@/components/planipeda/ScenarioEditor/SequenceForm";

// Imports des services backend
import { sequencesService } from "@/services/sequencesService";
import { sequenceActiviteService } from "@/services/sequenceActiviteService";
import { sequenceEvaluationService } from "@/services/sequenceEvaluationService";

// Import des interfaces de types
import {
    SequenceFormData,
    SequenceItem,
    UpdateSequenceDb // Utilisé pour le payload de mise à jour
} from "@/types/sequences"; // Assurez-vous que ces types sont correctement définis ici

// Définition des types pour la hiérarchie pédagogique
// Il est préférable de les définir dans un fichier de types centralisé si elles sont utilisées ailleurs.
interface Niveau { id: number; nom_niveau: string; }
interface Option { id: number; nom_option: string; niveau_id: number; }
interface Unite { id: number; titre_unite: string; option_id: number; }
interface Chapitre { id: number; titre_chapitre: string; unite_id: number; }

// Interface pour la récupération d'une séquence complète depuis la DB avec ses jointures
// Ajustée pour les noms de relations Supabase corrects (en supposant sequence_activite et sequence_evaluation sont des tables)
interface SequenceFromDB {
    id: number;
    chapitre_id: number;
    titre_sequence: string;
    objectifs_specifiques: string | null;
    ordre: number; // L'ordre de la séquence dans le chapitre (si pertinent)
    statut: "brouillon" | "validee" | "archivee";
    description: string | null;
    duree_estimee: number | null;
    prerequis: string | null;
    created_by: string;
    created_at: string;
    // Noms des tables de liaison réelles utilisées par Supabase PostgREST
    sequence_activite: { activite_id: number; ordre: number }[];
    sequence_evaluation: { evaluation_id: number; ordre: number }[];
}

// Le composant ne prend plus de props, mais utilise useParams.
const EditSequenceEditor: React.FC = () => {
    const navigate = useNavigate(); // Pour la redirection après sauvegarde/annulation
    // MODIFICATION CLÉ ICI : Utiliser 'id' car c'est le nom du paramètre dans la route de App.tsx
    const { id: routeSequenceId } = useParams<{ id: string }>(); // Récupère l'ID depuis l'URL

    // Convertir l'ID de la route en nombre, ou null si non valide
    const sequenceId = routeSequenceId ? parseInt(routeSequenceId, 10) : null;

    // --- Déclarations des États (useState) ---
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // États pour stocker les données initiales de la séquence à éditer
    const [initialSequenceData, setInitialSequenceData] = useState<SequenceFormData | undefined>(undefined);
    const [initialSequenceItems, setInitialSequenceItems] = useState<SequenceItem[]>([]);
    const [initialNiveauId, setInitialNiveauId] = useState<number | null>(null);
    const [initialOptionId, setInitialOptionId] = useState<number | null>(null);
    const [initialUniteId, setInitialUniteId] = useState<number | null>(null);
    const [initialChapitreId, setInitialChapitreId] = useState<number | null>(null);

    // États pour stocker toutes les données de hiérarchie pour les sélecteurs
    const [allNiveaux, setAllNiveaux] = useState<Niveau[]>([]);
    const [allOptions, setAllOptions] = useState<Option[]>([]);
    const [allUnites, setAllUnites] = useState<Unite[]>([]);
    const [allChapitres, setAllChapitres] = useState<Chapitre[]>([]);

    // États pour les données de la séquence EN COURS D'ÉDITION (mis à jour par SequenceForm)
    const [currentSequenceData, setCurrentSequenceData] = useState<Partial<SequenceFormData>>({
        titre_sequence: "",
        objectifs_specifiques: "",
        statut: "brouillon",
        description: null,
        duree_estimee: null,
        prerequis: null,
    });
    const [currentSequenceItems, setCurrentSequenceItems] = useState<SequenceItem[]>([]);
    const [currentSelectedNiveauId, setCurrentSelectedNiveauId] = useState<number | null>(null);
    const [currentSelectedOptionId, setCurrentSelectedOptionId] = useState<number | null>(null);
    const [currentSelectedUniteId, setCurrentSelectedUniteId] = useState<number | null>(null);
    const [currentSelectedChapitreId, setCurrentSelectedChapitreId] = useState<number | null>(null);


    // --- Hooks d'Effet (useEffect) ---
    /**
     * Effet principal pour charger toutes les données nécessaires à l'édition d'une séquence.
     * S'exécute une fois au montage ou lorsque `sequenceId` change.
     */
    useEffect(() => {
        const fetchAllDataForEdit = async () => {
            setIsLoading(true);
            setLoadError(null); // Effacer toutes les erreurs précédentes

            // Vérifier si sequenceId est valide
            if (!sequenceId || isNaN(sequenceId)) {
                setLoadError("ID de séquence invalide ou manquant dans l'URL.");
                setIsLoading(false);
                return;
            }

            try {
                // 1. Charger toutes les données de hiérarchie en parallèle
                const [
                    { data: niveauxData, error: niveauxError },
                    { data: optionsData, error: optionsError },
                    { data: unitesData, error: unitesError },
                    { data: chapitresData, error: chapitresError }
                ] = await Promise.all([
                    supabase.from("niveaux").select("*"),
                    supabase.from("options").select("*"),
                    supabase.from("unites").select("*"),
                    supabase.from("chapitres").select("*"),
                ]);

                if (niveauxError) throw new Error(`Erreur Niveaux: ${niveauxError.message}`);
                if (optionsError) throw new Error(`Erreur Options: ${optionsError.message}`);
                if (unitesError) throw new Error(`Erreur Unités: ${unitesError.message}`);
                if (chapitresError) throw new Error(`Erreur Chapitres: ${chapitresError.message}`);

                // Mettre à jour les états pour les listes complètes
                setAllNiveaux(niveauxData || []);
                setAllOptions(optionsData || []);
                setAllUnites(unitesData || []);
                setAllChapitres(chapitresData || []);

                // 2. Charger les détails de la séquence spécifique
                const { data: sequence, error: sequenceError } = await supabase
                    .from("sequences")
                    .select(`
                        *,
                        sequence_activite(activite_id, ordre),
                        sequence_evaluation(evaluation_id, ordre)
                    `)
                    .eq("id", sequenceId)
                    .single();

                if (sequenceError) {
                    // Spécifique si la séquence n'est pas trouvée (ex: ID invalide)
                    if (sequenceError.code === "PGRST116") { // Code pour "No rows found"
                        throw new Error("Séquence introuvable ou non autorisée. Veuillez vérifier l'ID.");
                    }
                    throw sequenceError;
                }
                if (!sequence) throw new Error("Séquence non trouvée après la requête réussie (cas inattendu).");

                // Pré-remplir les états principaux des données de la séquence
                const loadedSequenceData: SequenceFormData = {
                    titre_sequence: sequence.titre_sequence,
                    objectifs_specifiques: sequence.objectifs_specifiques || "",
                    description: sequence.description,
                    duree_estimee: sequence.duree_estimee,
                    prerequis: sequence.prerequis,
                    statut: sequence.statut,
                };
                setInitialSequenceData(loadedSequenceData);
                setCurrentSequenceData(loadedSequenceData); // Initialiser également l'état actuel

                // 3. Définir les ID de la hiérarchie en remontant du chapitre au niveau
                const chapitreFound = (chapitresData || []).find(c => c.id === sequence.chapitre_id);
                setInitialChapitreId(sequence.chapitre_id);
                setCurrentSelectedChapitreId(sequence.chapitre_id);

                if (chapitreFound) {
                    setInitialUniteId(chapitreFound.unite_id);
                    setCurrentSelectedUniteId(chapitreFound.unite_id);

                    const uniteFound = (unitesData || []).find(u => u.id === chapitreFound.unite_id);
                    if (uniteFound) {
                        setInitialOptionId(uniteFound.option_id);
                        setCurrentSelectedOptionId(uniteFound.option_id);

                        const optionFound = (optionsData || []).find(o => o.id === uniteFound.option_id);
                        if (optionFound) {
                            setInitialNiveauId(optionFound.niveau_id);
                            setCurrentSelectedNiveauId(optionFound.niveau_id);
                        }
                    }
                }

                // 4. Reconstruire la liste des éléments de séquence (activités et évaluations)
                const items: SequenceItem[] = [];

                // Récupérer les détails des activités liées
                if (sequence.sequence_activite && sequence.sequence_activite.length > 0) {
                    const activityIds = sequence.sequence_activite.map(sa => sa.activite_id);
                    const { data: activitiesData, error: activitiesError } = await supabase
                        .from('activites')
                        .select(`
                            id,
                            titre_activite,
                            description,
                            activite_objectifs (
                                objectifs (
                                    description_objectif
                                )
                            )
                        `)
                        .in('id', activityIds);

                    if (activitiesError) {
                        console.error("Erreur chargement activités liées:", activitiesError);
                        toast.warning(`Certaines activités n'ont pas pu être chargées: ${activitiesError.message}`);
                    }

                    if (activitiesData) {
                        for (const sa of sequence.sequence_activite) {
                            const activity = activitiesData.find((a: any) => a.id === sa.activite_id);
                            if (activity) {
                                // Aplatir les objectifs imbriqués
                                const objectifsDescriptions = (activity.activite_objectifs || []).map((ao: any) => ao.objectifs?.description_objectif).filter(Boolean);
                                items.push({
                                    id: activity.id,
                                    titre: activity.titre_activite,
                                    description: activity.description,
                                    objectifs: objectifsDescriptions,
                                    type: 'activity',
                                    order_in_sequence: sa.ordre
                                });
                            }
                        }
                    }
                }

                // Récupérer les détails des évaluations liées
                if (sequence.sequence_evaluation && sequence.sequence_evaluation.length > 0) {
                    const evaluationIds = sequence.sequence_evaluation.map(se => se.evaluation_id);

                    const { data: evaluationsData, error: evaluationsError } = await supabase
                        .from('evaluations')
                        .select(`
                            id,
                            titre_evaluation,
                            type_evaluation,
                            introduction_activite,
                            consignes_specifiques,
                            evaluation_connaissances (
                                connaissances (
                                    titre_connaissance
                                )
                            ),
                            evaluation_capacite_habilete (
                                capacites_habiletes (
                                    titre_capacite_habilete
                                )
                            )
                        `) // IMPORTANT : 'description' a été supprimé ici
                        .in('id', evaluationIds);

                    if (evaluationsError) {
                        console.error("Erreur chargement évaluations liées:", evaluationsError);
                        toast.warning(`Certaines évaluations n'ont pas pu être chargées: ${evaluationsError.message}`);
                    }

                    if (evaluationsData && Array.isArray(evaluationsData)) {
                        for (const se of sequence.sequence_evaluation) {
                            const evaluation = evaluationsData.find((e: any) => e.id === se.evaluation_id);

                            if (evaluation) {
                                // Aplatir les connaissances et capacités
                                const connaissancesDescriptions = (evaluation.evaluation_connaissances || []).map((ec: any) => ec.connaissances?.titre_connaissance).filter(Boolean) || [];
                                const capacitesDescriptions = (evaluation.evaluation_capacite_habilete || []).map((ech: any) => ech.capacites_habiletes?.titre_capacite_habilete).filter(Boolean) || [];

                                const evaluationItem: SequenceItem = {
                                    id: evaluation.id,
                                    titre: evaluation.titre_evaluation || "Titre manquant",
                                    type_evaluation: evaluation.type_evaluation || undefined,
                                    // Utilise 'introduction_activite' en priorité pour la description, puis 'consignes_specifiques'
                                    description: evaluation.introduction_activite || evaluation.consignes_specifiques || undefined,
                                    connaissances: connaissancesDescriptions,
                                    capacitesEvaluees: capacitesDescriptions,
                                    type: "evaluation",
                                    order_in_sequence: se.ordre
                                };
                                items.push(evaluationItem);
                            } else {
                                console.warn("Aucune évaluation trouvée pour l’ID (peut-être supprimée):", se.evaluation_id);
                            }
                        }
                    } else {
                        console.warn("Aucune donnée d’évaluation trouvée ou format incorrect lors du chargement.");
                    }
                }

                // Trier les éléments par leur ordre dans la séquence
                items.sort((a, b) => (a.order_in_sequence || 0) - (b.order_in_sequence || 0));
                setInitialSequenceItems(items);
                setCurrentSequenceItems(items); // Initialiser également l'état mutable actuel

            } catch (error: any) {
                console.error("Erreur lors du chargement des données pour l'édition:", error);
                setLoadError(error.message || "Erreur lors du chargement des données de la séquence.");
                toast.error(`Échec du chargement: ${error.message || "Vérifiez les logs."}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllDataForEdit();
    }, [sequenceId]); // Re-exécuter si sequenceId change (issu de useParams)


    // --- Fonctions de Rappel / Handlers (useCallback) ---

    /**
     * Callback pour mettre à jour les données principales de la séquence. Reçu de SequenceForm.
     */
    const handleUpdateSequenceData = useCallback((updatedFields: Partial<SequenceFormData>) => {
        setCurrentSequenceData(prev => ({ ...prev, ...updatedFields }));
    }, []);

    /**
     * Callback pour mettre à jour la liste des éléments de séquence. Reçu de SequenceForm.
     */
    const handleUpdateSequenceItems = useCallback((updatedItems: SequenceItem[]) => {
        setCurrentSequenceItems(updatedItems);
    }, []);

    /**
     * Callback pour mettre à jour les ID de hiérarchie sélectionnés. Reçu de SequenceForm.
     */
    const handleUpdateHierarchyIds = useCallback((niveauId: number | null, optionId: number | null, uniteId: number | null, chapitreId: number | null) => {
        setCurrentSelectedNiveauId(niveauId);
        setCurrentSelectedOptionId(optionId);
        setCurrentSelectedUniteId(uniteId);
        setCurrentSelectedChapitreId(chapitreId);
    }, []);


    /**
     * Logique pour sauvegarder les modifications de la séquence.
     * Cette fonction sera appelée par SequenceForm lorsqu'il soumettra le formulaire.
     */
    const handleSave = useCallback(async (data: SequenceFormData, chapitreId: number | null, sequenceItems: SequenceItem[]) => {
        setIsSaving(true);
        let toastId: string | undefined;

        // Log crucial : Que contient sequenceItems au moment de la sauvegarde ?
        console.log("--- DEBUG: sequenceItems reçus par handleSave (EditSequenceEditor) ---", sequenceItems);

        // Ajouter une vérification pour sequenceId ici aussi.
        if (!sequenceId) {
            toast.error("ID de séquence manquant pour la sauvegarde. Veuillez recharger la page.");
            setIsSaving(false);
            return;
        }

        try {
            toastId = toast.loading("Sauvegarde des modifications...", { id: "editSequenceToast" });

            // 1. Validation de base
            if (!chapitreId) {
                throw new Error("Veuillez sélectionner un chapitre pour la séquence.");
            }
            if (!data.titre_sequence?.trim()) {
                throw new Error("Le titre de la séquence est obligatoire.");
            }

            // 2. Mettre à jour la séquence principale
            const sequenceToUpdate: UpdateSequenceDb = {
                chapitre_id: chapitreId,
                titre_sequence: data.titre_sequence.trim(),
                objectifs_specifiques: data.objectifs_specifiques?.trim() || null,
                statut: data.statut || "brouillon",
                description: data.description?.trim() || null,
                duree_estimee: data.duree_estimee || null,
                prerequis: data.prerequis?.trim() || null,
            };

            const { error: updateError } = await sequencesService.updateSequence(sequenceId, sequenceToUpdate);
            if (updateError) {
                throw new Error(`Échec de la mise à jour de la séquence : ${updateError.message}`);
            }

            // 3. Supprimer les anciennes liaisons (activités/évaluations) associées à CETTE séquence
            // Utiliser Promise.allSettled pour continuer même si une suppression échoue
            const deleteResults = await Promise.allSettled([
                sequenceActiviteService.deleteActivitiesBySequenceId(sequenceId),
                sequenceEvaluationService.deleteEvaluationsBySequenceId(sequenceId)
            ]);

            let deleteErrorsDetected = false;
            deleteResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value.error) {
                    console.error("Erreur lors de la suppression d'anciennes liaisons:", result.value.error);
                    deleteErrorsDetected = true;
                } else if (result.status === 'rejected') {
                    console.error("Erreur inattendue lors de la suppression d'anciennes liaisons:", result.reason);
                    deleteErrorsDetected = true;
                }
            });
            if (deleteErrorsDetected) {
                toast.warning("Des erreurs sont survenues lors de la suppression d'anciennes liaisons. La sauvegarde peut être incomplète.", { id: toastId, duration: 8000 });
            }

            // 4. Recréer les nouvelles liaisons avec l'ordre actuel
            const activityLinks = [];
            const evaluationLinks = [];

            for (let i = 0; i < sequenceItems.length; i++) {
                const item = sequenceItems[i];
                const ordre = i + 1; // L'ordre est basé sur la position actuelle dans le tableau

                if (item.type === "activity") {
                    // Vérification cruciale : l'ID doit être un nombre valide et positif
                    if (typeof item.id === 'number' && item.id > 0) {
                        activityLinks.push({
                            sequence_id: sequenceId,
                            activite_id: item.id, // item.id est l'ID de l'activité réelle
                            ordre: ordre,
                        });
                    } else {
                        console.warn(`Activité avec ID invalide ou manquant, ignorée pour l'insertion:`, item);
                    }
                } else if (item.type === "evaluation") {
                    // Vérification cruciale : l'ID doit être un nombre valide et positif
                    if (typeof item.id === 'number' && item.id > 0) {
                        evaluationLinks.push({
                            sequence_id: sequenceId,
                            evaluation_id: item.id, // item.id est l'ID de l'évaluation réelle
                            ordre: ordre,
                        });
                    } else {
                        console.warn(`Évaluation avec ID invalide ou manquant, ignorée pour l'insertion:`, item);
                    }
                }
            }

            // Logs pour vérifier les liens avant l'insertion
            console.log("--- DEBUG: activityLinks prêts à l'insertion ---", activityLinks);
            console.log("--- DEBUG: evaluationLinks prêts à l'insertion ---", evaluationLinks);

            // Utiliser Promise.allSettled pour insérer toutes les activités et évaluations en une seule fois (batch insert)
            // Cela permet de savoir quelles insertions ont échoué sans arrêter tout le processus
            const createResults = await Promise.allSettled([
                activityLinks.length > 0 ? sequenceActiviteService.createMultipleSequenceActivite(activityLinks) : Promise.resolve({ data: null, error: null }),
                evaluationLinks.length > 0 ? sequenceEvaluationService.createMultipleSequenceEvaluation(evaluationLinks) : Promise.resolve({ data: null, error: null })
            ]);

            let createErrorsDetected = false;
            createResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value.error) {
                    console.error("Erreur lors de la création de nouvelles liaisons:", result.value.error);
                    createErrorsDetected = true;
                } else if (result.status === 'rejected') {
                    console.error("Erreur inattendue lors de la création de nouvelles liaisons:", result.reason);
                    createErrorsDetected = true;
                }
            });

            // Afficher le toast final basé sur le succès ou l'échec global des liaisons
            if (!deleteErrorsDetected && !createErrorsDetected) {
                toast.success("Séquence et liaisons mises à jour avec succès !", { id: toastId });
            } else {
                toast.warning("Séquence mise à jour, mais des erreurs sont survenues lors de la gestion des liaisons d'activités/évaluations. Veuillez vérifier les logs de la console.", { id: toastId, duration: 8000 });
            }

            navigate("/planipeda/sequences"); // Redirige vers la page de liste des séquences

        } catch (error: any) {
            console.error("Erreur lors de la sauvegarde de la séquence:", error);
            // Assurez-vous que le toast est bien mis à jour en cas d'erreur
            toast.error(error.message || "Une erreur inattendue est survenue lors de la sauvegarde.", { id: toastId, duration: 6000 });
        } finally {
            setIsSaving(false);
        }
    }, [sequenceId, navigate]); // Ajout de navigate dans les dépendances

    // Fonction d'annulation qui redirige
    const handleCancel = useCallback(() => {
        navigate("/planipeda/sequences"); // Redirige vers la page de liste des séquences
    }, [navigate]);


    // --- RENDU CONDITIONNEL DU COMPOSANT ---

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-64 bg-gray-50 rounded-lg shadow-inner">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-xl font-semibold text-gray-700">Chargement des données de la séquence...</p>
                <p className="text-sm text-gray-500 mt-2">Veuillez patienter pendant la préparation du formulaire d'édition.</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex flex-col justify-center items-center h-64 text-red-700 bg-red-50 rounded-lg shadow-inner p-6">
                <h2 className="text-2xl font-bold mb-3">Erreur de Chargement</h2>
                <p className="text-lg text-center">{loadError}</p>
                <p className="text-sm text-gray-600 mt-2">Impossible de charger les données de la séquence pour édition.</p>
                <Button onClick={handleCancel} className="mt-6 bg-red-500 hover:bg-red-600 text-white">
                    Retour aux séquences
                </Button>
            </div>
        );
    }

    // --- RENDU PRINCIPAL DU COMPOSANT ---

    return (
        <SequenceForm
            onSequenceSubmit={handleSave} // Appelle handleSave de EditSequenceEditor
            onCancel={handleCancel} // Appelle la nouvelle fonction handleCancel
            initialSequenceData={initialSequenceData}
            initialSequenceItems={initialSequenceItems}
            initialNiveauId={initialNiveauId}
            initialOptionId={initialOptionId}
            initialUniteId={initialUniteId}
            initialChapitreId={initialChapitreId}
            onUpdateSequenceData={handleUpdateSequenceData}
            onUpdateSequenceItems={handleUpdateSequenceItems}
            onUpdateHierarchyIds={handleUpdateHierarchyIds}
            isSaving={isSaving}
        />
    );
};

export default EditSequenceEditor;