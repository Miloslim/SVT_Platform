// Nom du fichier: EditSequenceEditor.tsx meilleure version 19.6 à 23.46
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
import { Loader2 } from "lucide-react"; // Ajouté pour l'icône de chargement
import { Button } from "@/components/ui/button"; // Assurez-vous que le composant Button est bien importé

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
// Pour l'exemple, elles sont ici.
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

    // États qui stockeront les données de la séquence à éditer.
    // Ces états seront passés comme props `initial*` à SequenceForm.
    // Initialisés avec `undefined` ou `null` pour représenter "non encore chargé"
    // et `[]` pour les tableaux afin d'éviter les problèmes de `.length`.
    const [initialSequenceData, setInitialSequenceData] = useState<SequenceFormData | undefined>(undefined);
    const [initialSequenceItems, setInitialSequenceItems] = useState<SequenceItem[]>([]); // Initialisé comme tableau vide
    const [initialNiveauId, setInitialNiveauId] = useState<number | null>(null);
    const [initialOptionId, setInitialOptionId] = useState<number | null>(null);
    const [initialUniteId, setInitialUniteId] = useState<number | null>(null);
    const [initialChapitreId, setInitialChapitreId] = useState<number | null>(null);

    // Données pour les sélecteurs (niveaux, options, unités, chapitres) nécessaires pour
    // reconstruire la hiérarchie lors du chargement d'une séquence existante.
    const [allNiveaux, setAllNiveaux] = useState<Niveau[]>([]);
    const [allOptions, setAllOptions] = useState<Option[]>([]);
    const [allUnites, setAllUnites] = useState<Unite[]>([]);
    const [allChapitres, setAllChapitres] = useState<Chapitre[]>([]);

    // États actuels qui seront mis à jour par les callbacks de SequenceForm.
    // Ceux-ci sont gérés ici pour la logique de soumission finale.
    // Il est recommandé de les initialiser avec des valeurs par défaut sensées ou basées sur les données initiales.
    const [currentSequenceData, setCurrentSequenceData] = useState<SequenceFormData>({
        titre_sequence: "",
        objectifs_specifiques: "",
        statut: "brouillon",
        description: null,
        duree_estimee: null,
        prerequis: null,
    });
    // Correction: currentSequenceItems doit être un tableau, pas un seul objet SequenceItem.
    const [currentSequenceItems, setCurrentSequenceItems] = useState<SequenceItem[]>([]);
    const [currentSelectedNiveauId, setCurrentSelectedNiveauId] = useState<number | null>(null);
    const [currentSelectedOptionId, setCurrentSelectedOptionId] = useState<number | null>(null);
    const [currentSelectedUniteId, setCurrentSelectedUniteId] = useState<number | null>(null);
    const [currentSelectedChapitreId, setCurrentSelectedChapitreId] = useState<number | null>(null);


    // ###################################
    // # Hooks d'Effet (useEffect) #
    // ###################################

    /**
     * Effet principal pour charger toutes les données nécessaires à l'édition d'une séquence.
     * S'exécute une fois au montage ou lorsque `sequenceId` change.
     */
    useEffect(() => {
        const fetchAllDataForEdit = async () => {
            setIsLoading(true);
            setLoadError(null); // Effacer toutes les erreurs précédentes

            if (!sequenceId) {
                setLoadError("Aucun ID de séquence fourni pour l'édition.");
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

                // 3. Définir les ID de la hiérarchie
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
                                const objectifsDescriptions = activity.activite_objectifs.map((ao: any) => ao.objectifs.description_objectif);
                                items.push({
                                    id: activity.id,
                                    titre: activity.titre_activite,
                                    description: activity.description || "Pas de description fournie.",
                                    objectifs: objectifsDescriptions, // Maintenant un tableau de chaînes
                                    type: 'activity',
                                    order_in_sequence: sa.ordre
                                });
                            }
                        }
                    }
                }

                                    // Récupérer les détails des évaluations liées
                                    // ... (reste du code inchangé)

                  // Récupérer les détails des évaluations liées
if (sequence.sequence_evaluation && sequence.sequence_evaluation.length > 0) {
  console.log("✔️ [DEBUG] Évaluations liées trouvées dans la séquence:", sequence.sequence_evaluation);

  const evaluationIds = sequence.sequence_evaluation.map(se => se.evaluation_id);

  const { data: evaluationsData, error: evaluationsError } = await supabase
    .from('evaluations')
    .select(`
      id,
      titre_evaluation,
      type_evaluation,
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
    `)
    .in('id', evaluationIds);

  if (evaluationsError) {
    console.error("❌ Erreur chargement évaluations liées:", evaluationsError);
    toast.warning(`⚠️ Certaines évaluations n'ont pas pu être chargées: ${evaluationsError.message}`);
  }

  console.log("📥 [DEBUG] Données brutes des évaluations chargées depuis Supabase:", evaluationsData);

  if (evaluationsData && Array.isArray(evaluationsData)) {
    for (const se of sequence.sequence_evaluation) {
      const evaluation = evaluationsData.find((e: any) => e.id === se.evaluation_id);

      if (evaluation) {
        const connaissancesDescriptions = evaluation.evaluation_connaissances?.map((ec: any) => ec.connaissances?.titre_connaissance) || [];
        const capacitesDescriptions = evaluation.evaluation_capacite_habilete?.map((ech: any) => ech.capacites_habiletes?.titre_capacite_habilete) || [];

        const evaluationItem: SequenceItem = {
          id: evaluation.id,
          titre: evaluation.titre_evaluation || "Titre manquant",
          type_evaluation: evaluation.type_evaluation || undefined,
          description: evaluation.titre_evaluation, // Utilise le titre comme fallback
          connaissances: connaissancesDescriptions,
          capacitesEvaluees: capacitesDescriptions,
          type: "evaluation",
          order_in_sequence: se.ordre
        };

        console.log("✅ [DEBUG] Élément d’évaluation reconstruit:", evaluationItem);
        items.push(evaluationItem);
      } else {
        console.warn("⚠️ [DEBUG] Aucune évaluation trouvée pour l’ID:", se.evaluation_id);
      }
    }
  } else {
    console.warn("⚠️ [DEBUG] Aucune donnée d’évaluation trouvée ou format incorrect.");
  }
}

                    // ... (reste du code inchangé)
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
    }, [sequenceId]); // Re-exécuter si sequenceId change


    // #############################################
    // # Fonctions de Rappel / Handlers (useCallback) #
    // #############################################

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
            // Utiliser Promise.all pour les exécuter en parallèle
            const [{ error: deleteActivitesError }, { error: deleteEvaluationsError }] = await Promise.all([
                sequenceActiviteService.deleteActivitiesBySequenceId(sequenceId),
                sequenceEvaluationService.deleteEvaluationsBySequenceId(sequenceId)
            ]);

            if (deleteActivitesError) console.error("Erreur lors de la suppression des anciennes activités liées:", deleteActivitesError);
            if (deleteEvaluationsError) console.error("Erreur lors de la suppression des anciennes évaluations liées:", deleteEvaluationsError);
            // On ne jette pas d'erreur ici, on continue pour tenter de recréer les liens.

            // 4. Recréer les nouvelles liaisons avec l'ordre actuel
            let allLinksSuccessful = true;
            const activityLinks = [];
            const evaluationLinks = [];

            for (let i = 0; i < sequenceItems.length; i++) {
                const item = sequenceItems[i];
                const ordre = i + 1; // L'ordre est basé sur la position actuelle dans le tableau

                if (item.type === "activity") {
                    activityLinks.push({
                        sequence_id: sequenceId,
                        activite_id: item.id,
                        ordre: ordre,
                    });
                } else if (item.type === "evaluation") {
                    evaluationLinks.push({
                        sequence_id: sequenceId,
                        evaluation_id: item.id,
                        ordre: ordre,
                    });
                }
            }

            // Utiliser Promise.all pour insérer toutes les activités et évaluations en une seule fois (batch insert)
            // C'est beaucoup plus efficace que des insertions individuelles dans une boucle.
            const [
                { error: createActivitesError },
                { error: createEvaluationsError }
            ] = await Promise.all([
                activityLinks.length > 0 ? sequenceActiviteService.createMultipleSequenceActivite(activityLinks) : { error: null },
                evaluationLinks.length > 0 ? sequenceEvaluationService.createMultipleSequenceEvaluation(evaluationLinks) : { error: null }
            ]);

            if (createActivitesError) {
                allLinksSuccessful = false;
                console.error("Erreur lors de la création des nouvelles liaisons d'activités:", createActivitesError);
            }
            if (createEvaluationsError) {
                allLinksSuccessful = false;
                console.error("Erreur lors de la création des nouvelles liaisons d'évaluations:", createEvaluationsError);
            }

            if (allLinksSuccessful) {
                toast.success("Séquence mise à jour avec succès !", { id: toastId });
            } else if (toastId && toast.isActive(toastId)) {
                toast.warning("Séquence mise à jour, mais des erreurs sont survenues lors de la liaison de certains éléments. Veuillez vérifier les logs.", { id: toastId, duration: 8000 });
            }

            onSaveSuccess(); // Notifier le parent (ex: SequencesPage) que la sauvegarde est terminée

        } catch (error: any) {
            console.error("Erreur lors de la sauvegarde de la séquence:", error);
            toast.error(error.message || "Une erreur inattendue est survenue lors de la sauvegarde.", { id: toastId, duration: 6000 });
        } finally {
            setIsSaving(false);
        }
    }, [sequenceId, onSaveSuccess]);


    // #######################################
    // # RENDU CONDITIONNEL DU COMPOSANT #
    // #######################################

    // Le rendu conditionnel du chargement/erreur est maintenant géré plus robustement ici
    // avant même de tenter de rendre SequenceForm.
    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-64 bg-gray-50 rounded-lg shadow-inner">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-xl font-semibold text-gray-700">Chargement des données de la séquence...</p>
                <p className="text-sm text-gray-500 mt-2">Veuillez patienter pendant la préparation du formulaire d'édition.</p>
            </div>
        );
    }

    // Si une erreur est survenue lors du chargement initial par EditSequenceEditor
    if (loadError) {
        return (
            <div className="flex flex-col justify-center items-center h-64 text-red-700 bg-red-50 rounded-lg shadow-inner p-6">
                <h2 className="text-2xl font-bold mb-3">Erreur de Chargement</h2>
                <p className="text-lg text-center">{loadError}</p>
                <p className="text-sm text-gray-600 mt-2">Impossible de charger les données de la séquence pour édition.</p>
                <Button onClick={onCancel} className="mt-6 bg-red-500 hover:bg-red-600 text-white">
                    Fermer
                </Button>
            </div>
        );
    }

    // #######################################
    // # RENDU PRINCIPAL DU COMPOSANT #
    // #######################################

    // Rendre SequenceForm uniquement lorsque les données sont chargées et qu'aucune erreur ne s'est produite
    return (
        <SequenceForm
            onSequenceSubmit={handleSave} // Appelle handleSave de EditSequenceEditor
            onCancel={onCancel}
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
            // isLoadingForm et loadError sont gérés en interne par EditSequenceEditor
            // et passés pour d'éventuels ajustements d'interface utilisateur internes dans SequenceForm si nécessaire.
            // Cependant, l'écran de chargement/erreur principal est géré par ce composant.
        />
    );
};

export default EditSequenceEditor;