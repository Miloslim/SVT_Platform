// 🌐 Chemin : src/components/planipeda/chapitreplanifier/EditEvaluationForm.tsx
// 📄 Nom du fichier : EditEvaluationForm.tsx
//
// 💡 Fonctionnalités :
//    - Charge une évaluation existante depuis Supabase en utilisant son ID.
//    - Prépare les données de l'évaluation (y compris les relations complexes) pour le formulaire d'édition.
//    - Gère l'état de chargement, de sauvegarde, les erreurs et les messages de succès.
//    - Sert de composant parent au `CreateEvaluationEditor` pour la logique de formulaire et la gestion de la soumission.
//    - Met à jour l'évaluation et toutes ses relations many-to-many (objectifs, compétences, connaissances, modalités, blocs de contenu)
//      dans Supabase lors de la sauvegarde.
//    - Gère l'insertion de nouvelles connaissances si saisies par l'utilisateur.
//    - Fournit des mécanismes d'annulation et des callbacks de succès pour la modale parente.

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/backend/config/supabase";
import { EvaluationData, ContentBlockData } from "@/types/planificationTypes"; // Import des types consolidés
import CreateEvaluationEditor from "@/components/planipeda/ScenarioEditor/CreateEvaluationEditor";
import toast from "react-hot-toast";

// --- Interfaces de Props du Composant ---
interface EditEvaluationFormProps {
    evaluationId: number;
    onSaveSuccess: (updatedEvaluationData: EvaluationData) => void; // Callback après sauvegarde réussie
    onCancel: () => void; // Callback pour annuler l'édition
}

// --- Interfaces pour les données complexes reçues de Supabase (structure des jointures) ---
// (Ces interfaces sont internes au composant pour la manipulation des données brutes de la DB)
interface CompetenceWithType {
    competence_id: number;
    competence: {
        type_competence: 'spécifique' | 'générale';
        id: number;
    };
}

interface EvaluationObjectifLinkDB {
    objectif_id: number;
}
interface EvaluationConnaissanceLinkDB {
    connaissance_id: number;
}
interface EvaluationModaliteLinkDB {
    modalite_id: number;
}
interface EvaluationCapaciteHabileteLinkDB {
    capacite_habilete_id: number;
}

// Note: ChapterHierarchyDB n'est pas nécessaire ici car la position sera affichée par le parent
// si besoin, ou déjà connue par l'évaluation chargée.

const EditEvaluationForm: React.FC<EditEvaluationFormProps> = ({ evaluationId, onSaveSuccess, onCancel }) => {
    // 1. États du Composant
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [evaluationData, setEvaluationData] = useState<EvaluationData>({
        titre_evaluation: "",
        chapitre_id: null,
        competence_ids: [], // Pas directement utilisé dans le formulaire EvaluationData
        objectifs: [],
        modalite_evaluation_ids: [],
        modalite_evaluation_autre_texte: null,
        grille_correction: null,
        introduction_activite: "<p></p>",
        contenu_blocs: [],
        consignes_specifiques: null,
        ressource_urls: null,
        ressources_eleve_urls: null,
        type_evaluation: null,
        selected_competence_id: null,
        selected_general_competence_ids: [],
        selected_connaissance_ids: [],
        new_connaissance_text: null,
        selected_capacite_habilete_ids: [],
        niveau_id: null,
        option_id: null,
        unite_id: null,
        sequence_id: null,
        activite_id: null,
    });

    const setFormError = useCallback((message: string | null) => {
        setError(message);
        if (message) setSuccessMessage(null);
    }, []);

    // 2. Chargement des données de l'évaluation (useEffect)
    useEffect(() => {
        if (!evaluationId) {
            setError("ID de l'évaluation manquant pour l'édition.");
            setLoading(false);
            return;
        }

        const fetchEvaluation = async () => {
            setLoading(true);
            setError(null);
            toast.loading("Chargement de l'évaluation...", { id: "loadingEditEvalForm" });
            try {
                const { data: evaluationDataDB, error: fetchError } = await supabase
                    .from("evaluations")
                    .select(
                        `
                        id,
                        titre_evaluation,
                        type_evaluation,
                        modalite_evaluation_autre_texte,
                        grille_correction,
                        introduction_activite,
                        consignes_specifiques,
                        ressource_urls_json,
                        ressources_eleve_urls,
                        chapitre_id,
                        evaluation_objectifs(objectif_id),
                        evaluation_competences(
                            competence_id,
                            competence:competences(type_competence, id)
                        ),
                        evaluation_connaissances(connaissance_id),
                        evaluation_modalites(modalite_id),
                        evaluation_content_blocks(id, block_order, block_type, text_content_html, questions_html, media_url, media_alt_text, media_position),
                        evaluation_capacite_habilete(capacite_habilete_id)
                        `
                    )
                    .eq("id", evaluationId)
                    .maybeSingle();

                if (fetchError) {
                    if (fetchError.code === "PGRST116") {
                        toast.error("Évaluation non trouvée.", { id: "loadingEditEvalForm" });
                        setFormError("Évaluation non trouvée.");
                    } else {
                        throw fetchError;
                    }
                }

                if (evaluationDataDB) {
                    // Traitement des compétences
                    const specificCompetenceId = (evaluationDataDB.evaluation_competences as CompetenceWithType[]).find(
                        (comp) => comp.competence?.type_competence === 'spécifique'
                    )?.competence.id || null;
                    const generalCompetenceIds = (evaluationDataDB.evaluation_competences as CompetenceWithType[])
                        .filter((comp) => comp.competence?.type_competence === 'générale')
                        .map((comp) => comp.competence.id);

                    // Récupération des IDs des éléments liés (many-to-many)
                    const selectedObjectifIds = (evaluationDataDB.evaluation_objectifs as EvaluationObjectifLinkDB[]).map(
                        (obj) => obj.objectif_id
                    );
                    const selectedConnaissanceIds = (evaluationDataDB.evaluation_connaissances as EvaluationConnaissanceLinkDB[]).map(
                        (conn) => conn.connaissance_id
                    );
                    const selectedModaliteIds = (evaluationDataDB.evaluation_modalites as EvaluationModaliteLinkDB[]).map(
                        (mod) => mod.modalite_id
                    );
                    const selectedCapaciteHabileteIds = (evaluationDataDB.evaluation_capacite_habilete as EvaluationCapaciteHabileteLinkDB[]).map(
                        (cap) => cap.capacite_habilete_id
                    );

                    // Conversion des champs JSONB
                    const parsedProfessorUrls = evaluationDataDB.ressource_urls_json ? JSON.stringify(evaluationDataDB.ressource_urls_json) : null;
                    const parsedStudentUrls = evaluationDataDB.ressources_eleve_urls ? JSON.stringify(evaluationDataDB.ressources_eleve_urls) : null;

                    // Tri des blocs de contenu et mappage vers ContentBlockData
                    const sortedContentBlocks: ContentBlockData[] = (evaluationDataDB.evaluation_content_blocks as any[])
                        .sort((a, b) => a.block_order - b.block_order)
                        .map(block => ({
                            id: block.id,
                            order: block.block_order,
                            type: block.block_type,
                            text_content_html: block.text_content_html,
                            questions_html: block.questions_html,
                            media_url: block.media_url,
                            media_alt_text: block.media_alt_text,
                            media_position: block.media_position,
                        }));
                    console.log("[EditEvaluationForm] Loaded sortedContentBlocks:", sortedContentBlocks);


                    // Mise à jour de l'état local du formulaire
                    setEvaluationData({
                        id: evaluationId,
                        titre_evaluation: evaluationDataDB.titre_evaluation || "",
                        type_evaluation: evaluationDataDB.type_evaluation || null,
                        modalite_evaluation_ids: selectedModaliteIds,
                        modalite_evaluation_autre_texte: evaluationDataDB.modalite_evaluation_autre_texte || null,
                        grille_correction: evaluationDataDB.grille_correction || null,
                        introduction_activite: evaluationDataDB.introduction_activite || "<p></p>",
                        contenu_blocs: sortedContentBlocks,
                        consignes_specifiques: evaluationDataDB.consignes_specifiques || null,
                        ressource_urls: parsedProfessorUrls,
                        ressources_eleve_urls: parsedStudentUrls,
                        chapitre_id: evaluationDataDB.chapitre_id || null,
                        objectifs: selectedObjectifIds,
                        selected_competence_id: specificCompetenceId,
                        selected_general_competence_ids: generalCompetenceIds,
                        selected_connaissance_ids: selectedConnaissanceIds,
                        new_connaissance_text: null, // Toujours null au chargement
                        selected_capacite_habilete_ids: selectedCapaciteHabileteIds,
                        sequence_id: null,
                        activite_id: null,
                        niveau_id: null,
                        option_id: null,
                        unite_id: null,
                    });

                    toast.success("Évaluation chargée avec succès !", { id: "loadingEditEvalForm" });

                } else {
                    setFormError("Évaluation introuvable ou erreur de chargement des données.");
                    toast.error("Évaluation introuvable ou erreur de chargement des données.", { id: "loadingEditEvalForm" });
                }

            } catch (err: any) {
                console.error("Erreur de chargement de l'évaluation :", err.message);
                toast.error(`Échec du chargement de l'évaluation : ${err.message}`, { id: "loadingEditEvalForm" });
                setFormError(`Échec du chargement de l'évaluation : ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchEvaluation();
    }, [evaluationId, setFormError]); // Le callback setFormError doit être dans les dépendances

    // 3. Gestionnaire de mise à jour des champs (Callback)
    const handleUpdateEvaluationData = useCallback((updatedFields: Partial<EvaluationData>) => {
        console.log("[EditEvaluationForm] Updating evaluationData with:", updatedFields);
        setEvaluationData(prevData => ({ ...prevData, ...updatedFields }));
    }, []);

    // 4. Fonction de Sauvegarde des données (Callback)
    const handleSave = async () => {
        setError(null);
        setSuccessMessage(null);
        const toastId = toast.loading("Sauvegarde en cours...");

        // Validation du formulaire (simplifiée ici pour l'exemple, à adapter si nécessaire)
        if (!evaluationData.titre_evaluation || evaluationData.titre_evaluation.trim() === "") {
            setFormError("Le titre de l'évaluation est obligatoire.");
            toast.error("Le titre de l'évaluation est obligatoire.", { id: toastId });
            setSaving(false);
            return;
        }
        if (!evaluationData.chapitre_id) {
            setFormError("Veuillez sélectionner un chapitre.");
            toast.error("Veuillez sélectionner un chapitre.", { id: toastId });
            setSaving(false);
            return;
        }
        // ... (Ajouter d'autres validations si elles sont spécifiques au formulaire de modification)

        console.log("[EditEvaluationForm] handleSave triggered.");
        console.log("[EditEvaluationForm] evaluationData.contenu_blocs before save:", evaluationData.contenu_blocs);

        setSaving(true);
        try {
            const {
                id,
                niveau_id, option_id, unite_id,
                objectifs,
                competence_ids,
                selected_competence_id, selected_general_competence_ids,
                selected_connaissance_ids, new_connaissance_text,
                selected_capacite_habilete_ids,
                ressource_urls, ressources_eleve_urls,
                contenu_blocs, // IMPORTANT: Ceci est le tableau que nous voulons sauvegarder
                modalite_evaluation_ids,
                ...fieldsToUpdate
            } = evaluationData;

            const finalFieldsToUpdate: any = {
                ...fieldsToUpdate,
                ressource_urls_json: ressource_urls ? JSON.parse(ressource_urls) : null,
                ressources_eleve_urls: ressources_eleve_urls ? JSON.parse(ressources_eleve_urls) : null,
                date_mise_a_jour: new Date().toISOString()
            };

            // Mise à jour de l'évaluation principale
            const { error: updateEvaluationError } = await supabase
                .from("evaluations")
                .update(finalFieldsToUpdate)
                .eq("id", evaluationId);

            if (updateEvaluationError) {
                throw updateEvaluationError;
            }

            // Gérer la nouvelle connaissance (insertion si texte fourni)
            let finalConnaissanceIds = [...(selected_connaissance_ids || [])];
            if (new_connaissance_text && new_connaissance_text.trim() !== '') {
                const { data: newConnaissanceData, error: newConnaissanceError } = await supabase
                    .from('connaissances')
                    .insert({
                        titre_connaissance: new_connaissance_text.trim(),
                        chapitre_id: evaluationData.chapitre_id,
                        description_connaissance: '',
                    })
                    .select('id')
                    .single();

                if (newConnaissanceError) {
                    throw newConnaissanceError;
                }
                if (newConnaissanceData) {
                    finalConnaissanceIds.push(newConnaissanceData.id);
                }
            }

            // Synchronisation des tables de liaison (many-to-many)
            await supabase.from("evaluation_objectifs").delete().eq("evaluation_id", evaluationId);
            if (objectifs && objectifs.length > 0) {
                const uniqueObjectifIds = Array.from(new Set(objectifs));
                const objectifRelations = uniqueObjectifIds.map((objId) => ({
                    evaluation_id: evaluationId,
                    objectif_id: objId,
                }));
                const { error: objRelError } = await supabase.from("evaluation_objectifs").insert(objectifRelations);
                if (objRelError) throw objRelError;
            }

            await supabase.from("evaluation_competences").delete().eq("evaluation_id", evaluationId);
            const allCompetenceIdsToLink: number[] = [];
            if (selected_competence_id) {
                allCompetenceIdsToLink.push(selected_competence_id);
            }
            if (selected_general_competence_ids && selected_general_competence_ids.length > 0) {
                allCompetenceIdsToLink.push(...selected_general_competence_ids);
            }
            if (allCompetenceIdsToLink.length > 0) {
                const uniqueCompetenceIds = Array.from(new Set(allCompetenceIdsToLink));
                const competenceRelations = uniqueCompetenceIds.map((comp_id) => ({
                    evaluation_id: evaluationId,
                    competence_id: comp_id,
                }));
                const { error: compRelError } = await supabase.from("evaluation_competences").insert(competenceRelations);
                if (compRelError) throw compRelError;
            }

            await supabase.from("evaluation_connaissances").delete().eq("evaluation_id", evaluationId);
            if (finalConnaissanceIds.length > 0) {
                const uniqueConnaissanceIds = Array.from(new Set(finalConnaissanceIds));
                const connaissanceRelations = uniqueConnaissanceIds.map((connId) => ({
                    evaluation_id: evaluationId,
                    connaissance_id: connId,
                }));
                const { error: connRelError } = await supabase.from("evaluation_connaissances").insert(connaissanceRelations);
                if (connRelError) throw connRelError;
            }

            await supabase.from("evaluation_modalites").delete().eq("evaluation_id", evaluationId);
            if (modalite_evaluation_ids && modalite_evaluation_ids.length > 0) {
                const uniqueModaliteIds = Array.from(new Set(modalite_evaluation_ids));
                const modaliteRelations = uniqueModaliteIds.map((modaliteId) => ({
                    evaluation_id: evaluationId,
                    modalite_id: modaliteId,
                }));
                const { error: modaliteRelError } = await supabase.from("evaluation_modalites").insert(modaliteRelations);
                if (modaliteRelError) throw modaliteRelError;
            }

            await supabase.from("evaluation_capacite_habilete").delete().eq("evaluation_id", evaluationId);
            if (selected_capacite_habilete_ids && selected_capacite_habilete_ids.length > 0) {
                const uniqueCapaciteIds = Array.from(new Set(selected_capacite_habilete_ids));
                const capaciteRelations = uniqueCapaciteIds.map((capId) => ({
                    evaluation_id: evaluationId,
                    capacite_habilete_id: capId,
                }));
                const { error: capaciteRelError } = await supabase.from("evaluation_capacite_habilete").insert(capaciteRelations);
                if (capaciteRelError) throw capaciteRelError;
            }

            // Blocs de contenu: Suppression et Insertion
            console.log("[EditEvaluationForm] Deleting existing content blocks for evaluation_id:", evaluationId);
            await supabase.from("evaluation_content_blocks").delete().eq("evaluation_id", evaluationId);

            if (contenu_blocs && contenu_blocs.length > 0) {
                console.log("[EditEvaluationForm] Preparing to insert new content blocks:", contenu_blocs);
                const contentBlocksToInsert = contenu_blocs.map(block => ({
                    evaluation_id: evaluationId,
                    block_order: block.order,
                    block_type: block.type,
                    text_content_html: block.text_content_html,
                    questions_html: block.questions_html,
                    media_url: block.media_url,
                    media_alt_text: block.media_alt_text,
                    media_position: block.media_position,
                }));
                const { error: contentBlocksError } = await supabase.from("evaluation_content_blocks").insert(contentBlocksToInsert);
                if (contentBlocksError) {
                    console.error("[EditEvaluationForm] Error inserting content blocks:", contentBlocksError);
                    throw contentBlocksError;
                }
                console.log("[EditEvaluationForm] Content blocks inserted successfully.");
            } else {
                console.log("[EditEvaluationForm] No content blocks to insert or contenu_blocs is empty.");
            }

            toast.success("Évaluation mise à jour avec succès !", { id: toastId });
            setSuccessMessage("Évaluation mise à jour avec succès.");
            onSaveSuccess(evaluationData);

        } catch (err: any) {
            console.error("Erreur lors de la sauvegarde de l'évaluation:", err);
            toast.error(`Échec de la sauvegarde de l'évaluation : ${err.message || "Erreur inconnue"}`, { id: toastId });
            setError(`Échec de la sauvegarde de l'évaluation : ${err.message || "Erreur inconnue"}`);
        } finally {
            setSaving(false);
        }
    };

    // 5. Rendu Conditionnel du Composant
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-xl font-semibold text-gray-700">Chargement de l'évaluation...</p>
            </div>
        );
    }

    if (error && !loading) {
        return (
            <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-xl text-center">
                <p className="text-red-600 text-lg mb-4">{error}</p>
                <button
                    onClick={onCancel}
                    className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Annuler
                </button>
            </div>
        );
    }

    return (
        <div className="p-2 space-y-4">
            <CreateEvaluationEditor
                initialData={evaluationData}
                onUpdate={handleUpdateEvaluationData}
                onSaveTrigger={handleSave}
                onCancel={onCancel}
                saving={saving}
                error={error}
                successMessage={successMessage}
                setFormError={setFormError}
                onSuccessRedirectPath={undefined}
            />
        </div>
    );
};

export default EditEvaluationForm;
