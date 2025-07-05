// Nom du fichier: EditSequenceEditor.tsx
// Chemin: src/components/planipeda/ScenarioEditor/EditSequenceEditor.tsx

// Fonctionnalités:
// Ce composant est une enveloppe (wrapper) pour SequenceForm, dédié à la modification de séquences existantes.
// Il est responsable de:
// - Récupérer l'ID de la séquence à modifier via ses props.
// - Charger toutes les données de cette séquence depuis Supabase, y compris sa hiérarchie (chapitre, unité, option, niveau).
// - Charger les activités et évaluations déjà liées à cette séquence, en respectant leur ordre.
// - Gérer les états de chargement et d'erreur spécifiques à l'édition.
// - Transmettre les données initiales chargées et les callbacks de mise à jour au SequenceForm.
// - Gérer la logique de soumission (UPDATE) pour la séquence et ses liaisons d'activités/évaluations.

// --- 1. Imports ---
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/backend/config/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Import du composant de formulaire principal (renommé SequenceForm)
import SequenceForm from "@/components/planipeda/ScenarioEditor/SequenceForm"; // <--- CHANGEMENT ICI

// Imports des services backend
import { sequencesService } from "@/services/sequencesService";
import { sequenceActiviteService } from "@/services/sequenceActiviteService";
import { sequenceEvaluationService } from "@/services/sequenceEvaluationService";

// Import des interfaces de types (assurez-vous que ces chemins et noms sont corrects dans votre projet)
import {
    SequenceFormData,
    AddedActivityItem,
    AddedEvaluationItem,
    SequenceItem,
    CreateSequenceDb, // Utilisé dans handleSubmit pour le type Update (si CreateSequenceDb est compatible pour l'INSERT)
    UpdateSequenceDb // Utilisé pour l'update
} from "@/types/sequences"; // Assurez-vous que ce fichier existe et contient les types nécessaires

// Définition des types pour la hiérarchie pédagogique (si non déjà dans types/sequences)
interface Niveau { id: number; nom_niveau: string; }
interface Option { id: number; nom_option: string; niveau_id: number; }
interface Unite { id: number; titre_unite: string; option_id: number; }
interface Chapitre { id: number; titre_chapitre: string; unite_id: number; }

// Interface pour la récupération d'une séquence complète depuis la DB avec ses jointures
// Les noms des relations doivent correspondre exactement à ceux définis dans votre schéma Supabase
// (par exemple, si votre table de liaison est 'sequence_activite', utilisez ce nom).
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
    // Noms des relations Supabase pour les tables de liaison
    // Vérifiez ces noms dans votre console Supabase > Database > API > (votre table 'sequences')
    sequence_activite: { activite_id: number; ordre: number }[];
    sequence_evaluation: { evaluation_id: number; ordre: number }[];
}

// Props pour le composant EditSequenceEditor
interface EditSequenceEditorProps {
    sequenceId: number; // L'ID de la séquence à modifier (requis)
    onSaveSuccess: () => void; // Callback après une sauvegarde réussie (ex: ferme la modale)
    onCancel: () => void; // Callback si l'utilisateur annule
}

const EditSequenceEditor: React.FC<EditSequenceEditorProps> = ({ sequenceId, onSaveSuccess, onCancel }) => {
    // #######################################
    // # Déclarations des États (useState) #
    // #######################################

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // États qui stockeront les données de la séquence à éditer
    // Ces états seront passés comme `initial*` props au SequenceForm
    const [initialSequenceData, setInitialSequenceData] = useState<SequenceFormData | undefined>(undefined);
    const [initialSequenceItems, setInitialSequenceItems] = useState<SequenceItem[] | undefined>(undefined);
    const [initialNiveauId, setInitialNiveauId] = useState<number | null | undefined>(undefined);
    const [initialOptionId, setInitialOptionId] = useState<number | null | undefined>(undefined);
    const [initialUniteId, setInitialUniteId] = useState<number | null | undefined>(undefined);
    const [initialChapitreId, setInitialChapitreId] = useState<number | null | undefined>(undefined);

    // Données des sélecteurs (niveaux, options, unités, chapitres) nécessaires pour la reconstruction
    // de la hiérarchie quand on charge une séquence existante. Ces états sont utilisés par le
    // useEffect pour déterminer les IDs hiérarchiques de la séquence.
    const [allNiveaux, setAllNiveaux] = useState<Niveau[]>([]);
    const [allOptions, setAllOptions] = useState<Option[]>([]);
    const [allUnites, setAllUnites] = useState<Unite[]>([]);
    const [allChapitres, setAllChapitres] = useState<Chapitre[]>([]);

    // États locaux qui seront mis à jour par les callbacks du SequenceForm
    // et gérés ici pour la soumission finale.
    const [currentSequenceData, setCurrentSequenceData] = useState<SequenceFormData>({
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


    // ###################################
    // # Hooks d'Effet (useEffect) #
    // ###################################

    /**
     * Effet principal pour charger toutes les données nécessaires à l'édition de la séquence.
     * S'exécute une seule fois au montage ou quand `sequenceId` change.
     */
    useEffect(() => {
        const fetchAllDataForEdit = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                // 1. Charger toutes les données de hiérarchie en parallèle
                const [{ data: niveauxData, error: niveauxError }, { data: optionsData, error: optionsError }, { data: unitesData, error: unitesError }, { data: chapitresData, error: chapitresError }] =
                    await Promise.all([
                        supabase.from("niveaux").select("*"),
                        supabase.from("options").select("*"),
                        supabase.from("unites").select("*"),
                        supabase.from("chapitres").select("*"),
                    ]);

                if (niveauxError) throw new Error(`Erreur Niveaux: ${niveauxError.message}`);
                if (optionsError) throw new Error(`Erreur Options: ${optionsError.message}`);
                if (unitesError) throw new Error(`Erreur Unités: ${unitesError.message}`);
                if (chapitresError) throw new Error(`Erreur Chapitres: ${chapitresError.message}`);

                // Mettre à jour les états des listes complètes
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

                if (sequenceError) throw sequenceError;
                if (!sequence) throw new Error("Séquence non trouvée.");

                // Pré-remplir les états de données de la séquence principale
                setInitialSequenceData({
                    titre_sequence: sequence.titre_sequence,
                    objectifs_specifiques: sequence.objectifs_specifiques || "",
                    description: sequence.description,
                    duree_estimee: sequence.duree_estimee,
                    prerequis: sequence.prerequis,
                    statut: sequence.statut,
                });
                // Initialiser aussi les "current" états avec les données chargées
                setCurrentSequenceData({
                    titre_sequence: sequence.titre_sequence,
                    objectifs_specifiques: sequence.objectifs_specifiques || "",
                    description: sequence.description,
                    duree_estimee: sequence.duree_estimee,
                    prerequis: sequence.prerequis,
                    statut: sequence.statut,
                });


                // 3. Définir les IDs de hiérarchie
                setInitialChapitreId(sequence.chapitre_id);
                setCurrentSelectedChapitreId(sequence.chapitre_id);

                const chapitreFound = (chapitresData || []).find(c => c.id === sequence.chapitre_id);
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

                // 4. Reconstituer la liste des éléments de séquence (activités et évaluations)
                const items: SequenceItem[] = [];

                // Récupération des détails des activités liées
                if (sequence.sequence_activite && sequence.sequence_activite.length > 0) {
                    const activityIds = sequence.sequence_activite.map(sa => sa.activite_id);
                    const { data: activitiesData, error: activitiesError } = await supabase
                        .from('activites')
                        .select(`
                            id,
                            titre_activite,
                            description,
                            activite_objectifs(objectif_id),
                            objectifs(description_objectif)
                        `)
                        .in('id', activityIds);

                    if (activitiesError) console.error("Erreur chargement activités liées:", activitiesError);

                    if (activitiesData) {
                        for (const sa of sequence.sequence_activite) {
                            const activity = activitiesData.find(a => a.id === sa.activite_id);
                            if (activity) {
                                const objectifsDescriptions = activity.objectifs.map((obj: any) => obj.description_objectif);
                                items.push({
                                    id: activity.id,
                                    titre: activity.titre_activite,
                                    description: activity.description || "Pas de description fournie.",
                                    objectifs: objectifsDescriptions,
                                    type: 'activity',
                                    order_in_sequence: sa.ordre
                                });
                            }
                        }
                    }
                }

                // Récupération des détails des évaluations liées
                if (sequence.sequence_evaluation && sequence.sequence_evaluation.length > 0) {
                    const evaluationIds = sequence.sequence_evaluation.map(se => se.evaluation_id);
                    const { data: evaluationsData, error: evaluationsError } = await supabase
                        .from('evaluations')
                        .select(`
                            id,
                            titre_evaluation,
                            type_evaluation,
                            description,
                            evaluation_connaissances(connaissance_id),
                            connaissances(titre_connaissance),
                            evaluation_capacite_habilete(capacite_habilete_id),
                            capacites_habiletes(titre_capacite_habilete)
                        `)
                        .in('id', evaluationIds);

                    if (evaluationsError) console.error("Erreur chargement évaluations liées:", evaluationsError);

                    if (evaluationsData) {
                        for (const se of sequence.sequence_evaluation) {
                            const evaluation = evaluationsData.find(e => e.id === se.evaluation_id);
                            if (evaluation) {
                                const connaissancesDescriptions = evaluation.connaissances.map((c: any) => c.titre_connaissance);
                                const capacitesDescriptions = evaluation.capacites_habiletes.map((ch: any) => ch.titre_capacite_habilete);
                                items.push({
                                    id: evaluation.id,
                                    titre: evaluation.titre_evaluation,
                                    type_evaluation: evaluation.type_evaluation || undefined,
                                    description: evaluation.description || undefined,
                                    connaissances: connaissancesDescriptions,
                                    capacitesEvaluees: capacitesDescriptions,
                                    type: 'evaluation',
                                    order_in_sequence: se.ordre
                                });
                            }
                        }
                    }
                }

                // Trier les items par leur ordre dans la séquence
                items.sort((a, b) => (a.order_in_sequence || 0) - (b.order_in_sequence || 0));
                setInitialSequenceItems(items);
                setCurrentSequenceItems(items); // Initialiser aussi l'état modifiable

            } catch (error: any) {
                console.error("Erreur lors du chargement des données pour l'édition:", error);
                setLoadError(error.message || "Erreur lors du chargement des données de la séquence.");
                toast.error(`Échec du chargement: ${error.message || "Vérifiez les logs."}`);
            } finally {
                setIsLoading(false);
            }
        };

        if (sequenceId) {
            fetchAllDataForEdit();
        } else {
            setLoadError("Aucun ID de séquence fourni pour l'édition.");
            setIsLoading(false);
        }
    }, [sequenceId]); // Re-exécuter si l'ID de séquence change


    // #############################################
    // # Fonctions de Rappel / Handlers (useCallback) #
    // #############################################

    /**
     * Callback pour mettre à jour les données principales de la séquence.
     * Reçu de SequenceForm.
     */
    const handleUpdateSequenceData = useCallback((updatedFields: Partial<SequenceFormData>) => {
        setCurrentSequenceData(prev => ({ ...prev, ...updatedFields }));
    }, []);

    /**
     * Callback pour mettre à jour la liste des éléments de la séquence.
     * Reçu de SequenceForm.
     */
    const handleUpdateSequenceItems = useCallback((updatedItems: SequenceItem[]) => {
        setCurrentSequenceItems(updatedItems);
    }, []);

    /**
     * Callback pour mettre à jour les IDs de la hiérarchie sélectionnée.
     * Reçu de SequenceForm.
     */
    const handleUpdateHierarchyIds = useCallback((niveauId: number | null, optionId: number | null, uniteId: number | null, chapitreId: number | null) => {
        setCurrentSelectedNiveauId(niveauId);
        setCurrentSelectedOptionId(optionId);
        setCurrentSelectedUniteId(uniteId);
        setCurrentSelectedChapitreId(chapitreId);
    }, []);


    /**
     * Logique de sauvegarde des modifications de la séquence.
     * Cette fonction sera appelée par SequenceForm quand il soumet le formulaire.
     */
    const handleSave = useCallback(async (data: SequenceFormData, chapitreId: number, sequenceItems: SequenceItem[], isEdit: boolean) => {
        // La prop `isEdit` est ici redondante car EditSequenceEditor est toujours en mode édition,
        // mais elle est là pour la cohérence avec l'interface de SequenceForm si ce dernier
        // est aussi utilisé directement pour la création.
        if (!isEdit) {
            console.warn("handleSave appelé en mode création par erreur dans EditSequenceEditor.");
            return;
        }

        setIsSaving(true);
        let toastId: string | undefined;

        try {
            toastId = toast.loading("Sauvegarde des modifications...", { id: "editSequenceToast" });

            // 1. Validation de base
            if (!chapitreId) {
                throw new Error("Veuillez sélectionner un chapitre pour la séquence.");
            }
            if (!data.titre_sequence?.trim()) {
                throw new Error("Le titre de la séquence est obligatoire.");
            }

            // 2. Mise à jour de la séquence principale
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

            // 3. Supprimer les anciennes liaisons (activités/évaluations)
            // On s'assure de supprimer uniquement les liaisons de CETTE séquence.
            await sequenceActiviteService.deleteActivitiesBySequenceId(sequenceId);
            await sequenceEvaluationService.deleteEvaluationsBySequenceId(sequenceId);

            // 4. Recréer les nouvelles liaisons avec les ordres actuels
            let allLinksSuccessful = true;
            for (let i = 0; i < sequenceItems.length; i++) { // Utiliser sequenceItems de l'argument pour s'assurer d'avoir les données les plus à jour
                const item = sequenceItems[i];
                const orderInSequence = i + 1; // L'ordre est basé sur la position dans le tableau actuel

                if (item.type === "activity") {
                    const activiteLink: { sequence_id: number; activite_id: number; ordre: number } = {
                        sequence_id: sequenceId,
                        activite_id: item.id,
                        ordre: orderInSequence,
                    };
                    const { error: linkError } = await sequenceActiviteService.createSequenceActivite(activiteLink);
                    if (linkError) {
                        allLinksSuccessful = false;
                        console.error(`Erreur de liaison activité "${item.titre}" (ID: ${item.id}):`, linkError);
                    }
                } else if (item.type === "evaluation") {
                    const evaluationLink: { sequence_id: number; evaluation_id: number; ordre: number } = {
                        sequence_id: sequenceId,
                        evaluation_id: item.id,
                        ordre: orderInSequence,
                    };
                    const { error: linkError } = await sequenceEvaluationService.createSequenceEvaluation(evaluationLink);
                    if (linkError) {
                        allLinksSuccessful = false;
                        console.error(`Erreur de liaison évaluation "${item.titre}" (ID: ${item.id}):`, linkError);
                    }
                }
            }

            if (allLinksSuccessful) {
                toast.success("Séquence mise à jour avec succès !", { id: toastId });
            } else if (toastId && toast.isActive(toastId)) {
                toast.warning("Séquence mise à jour, mais certains éléments n'ont pas pu être liés.", { id: toastId, duration: 8000 });
            }

            onSaveSuccess(); // Indique au parent (ex: SequencesPage) que la sauvegarde est terminée

        } catch (error: any) {
            console.error("Erreur lors de la sauvegarde de la séquence:", error);
            toast.error(error.message || "Une erreur inattendue est survenue lors de la sauvegarde.", { id: toastId, duration: 6000 });
        } finally {
            setIsSaving(false);
        }
    }, [
        sequenceId,
        onSaveSuccess
        // currentSequenceData, currentSelectedChapitreId, currentSequenceItems ne sont plus directement utilisés ici
        // car les données les plus à jour sont passées via les arguments de handleSave.
    ]);


    // #######################################
    // # RENDU CONDITIONNEL DU COMPOSANT #
    // #######################################

    // Le rendu conditionnel de chargement/erreur est délégué au SequenceForm via les props
    // mais on garde un état de chargement ici pour gérer la "pré-préparation" des données.
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <p className="text-lg text-gray-600">Chargement des données de la séquence pour édition...</p>
            </div>
        );
    }

    // Si une erreur est survenue pendant le chargement initial de EditSequenceEditor
    if (loadError) {
        return (
            <div className="flex flex-col justify-center items-center h-48 text-red-600">
                <p className="text-lg">Erreur lors du chargement :</p>
                <p className="text-sm">{loadError}</p>
                <Button onClick={onCancel} className="mt-4">Fermer</Button>
            </div>
        );
    }

    // #######################################
    // # RENDU PRINCIPAL DU COMPOSANT #
    // #######################################

    return (
        <SequenceForm // <--- CHANGEMENT ICI
            onSequenceSubmit={handleSave} // Appelle handleSave de EditSequenceEditor
            onCancel={onCancel}
            initialSequenceData={initialSequenceData}
            initialSequenceItems={initialSequenceItems}
            initialNiveauId={initialNiveauId}
            initialOptionId={initialOptionId}
            initialUniteId={initialUniteId}
            initialChapitreId={initialChapitreId}
            onUpdateSequenceData={handleUpdateSequenceData} // Passer le callback de mise à jour des données
            onUpdateSequenceItems={handleUpdateSequenceItems} // Passer le callback de mise à jour des items
            onUpdateHierarchyIds={handleUpdateHierarchyIds} // Passer le callback pour la hiérarchie
            isSaving={isSaving}
            isLoadingForm={isLoading} // Propaguer l'état de chargement initial
            loadError={loadError} // Propaguer l'erreur de chargement initial
        />
    );
};

export default EditSequenceEditor;