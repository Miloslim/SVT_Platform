// 🌐 Chemin : src/components/planipeda/ScenarioEditor/EditEvaluationEditor.tsx
// 📄 Nom du fichier : EditEvaluationEditor.tsx
//
// 💡 Fonctionnalités :
//    - Charge une évaluation existante depuis Supabase en utilisant son ID.
//    - Prépare les données de l'évaluation (y compris les relations complexes) pour le formulaire d'édition.
//    - Gère l'état de chargement, de sauvegarde, les erreurs et les messages de succès.
//    - Affiche un résumé de la position hiérarchique de l'évaluation (Niveau, Option, Unité, Chapitre).
//    - Sert de composant parent au `CreateEvaluationEditor` pour la logique de formulaire et la gestion de la soumission.
//    - Met à jour l'évaluation et toutes ses relations many-to-many (objectifs, compétences, connaissances, modalités, blocs de contenu)
//      dans Supabase lors de la sauvegarde.
//    - Gère l'insertion de nouvelles connaissances si saisies par l'utilisateur.
//    - Fournit des mécanismes d'annulation et de redirection post-sauvegarde.

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/backend/config/supabase";
import { EvaluationData } from "@/types/evaluation";
import CreateEvaluationEditor from "@/components/planipeda/ScenarioEditor/CreateEvaluationEditor";
import toast from "react-hot-toast";

// --- Interfaces de Props du Composant ---
interface EditEvaluationEditorProps {
    evaluationId: number;
    onSaved?: () => void;
    onCancel?: () => void;
}

// --- Interfaces pour les données complexes reçues de Supabase (structure des jointures) ---
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

interface EvaluationContentBlockDB {
    id?: number;
    evaluation_id: number;
    block_order: number;
    block_type: string;
    text_content_html?: string | null;
    questions_html?: string | null;
    media_url?: string | null;
    media_alt_text?: string | null;
    media_position?: string | null;
}

interface ChapterHierarchyDB {
    id: number;
    titre_chapitre: string;
    unite: {
        id: number;
        titre_unite: string;
        option: {
            id: number;
            nom_option: string;
            niveau: {
                id: number;
                nom_niveau: string;
            };
        };
    };
}


const EditEvaluationEditor: React.FC<EditEvaluationEditorProps> = ({ evaluationId, onSaved, onCancel }) => {
    const navigate = useNavigate();

    // 1. États du Composant
    // Gèrent l'état de l'interface utilisateur (chargement, sauvegarde, erreurs)
    // et les données de l'évaluation, qui seront passées au formulaire enfant.
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [evaluationData, setEvaluationData] = useState<EvaluationData>({
        titre_evaluation: "",
        chapitre_id: null,
        competence_ids: [],
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

    // États pour l'affichage de la position hiérarchique
    const [niveauOption, setNiveauOption] = useState<{ niveau: string; option: string } | null>(null);
    const [uniteChapitre, setUniteChapitre] = useState<{ unite: string; chapitre: string } | null>(null);

    const setFormError = useCallback((message: string | null) => {
        setError(message);
        if (message) setSuccessMessage(null);
    }, []);

    // 2. Chargement des données de l'évaluation (useEffect)
    // Récupère l'évaluation et toutes ses relations depuis Supabase.
    useEffect(() => {
        if (!evaluationId) {
            setError("ID de l'évaluation manquant pour l'édition.");
            setLoading(false);
            return;
        }

        const fetchEvaluation = async () => {
            setLoading(true);
            setError(null);
            toast.loading("Chargement de l'évaluation...", { id: "loadingEditEval" });
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
                        chapitre:chapitre_id(
                            id,
                            titre_chapitre,
                            unite:unite_id(
                                id,
                                titre_unite,
                                option:option_id(
                                    id,
                                    nom_option,
                                    niveau:niveau_id(
                                        id,
                                        nom_niveau
                                    )
                                )
                            )
                        ),
                        evaluation_objectifs(objectif_id),
                        evaluation_competences(
                            competence_id,
                            competence:competences(type_competence, id)
                        ),
                        evaluation_connaissances(connaissance_id),
                        evaluation_modalites(modalite_id),
                        evaluation_content_blocks(*),
                        evaluation_capacite_habilete(capacite_habilete_id)
                        `
                    )
                    .eq("id", evaluationId)
                    .maybeSingle();

                if (fetchError) {
                    if (fetchError.code === "PGRST116") {
                        toast.error("Évaluation non trouvée.", { id: "loadingEditEval" });
                        setFormError("Évaluation non trouvée.");
                    } else {
                        throw fetchError;
                    }
                }

                if (evaluationDataDB) {
                    // Extraction des données hiérarchiques
                    const chapterData = evaluationDataDB.chapitre as ChapterHierarchyDB;
                    const uniteData = chapterData?.unite;
                    const optionData = uniteData?.option;
                    const niveauData = optionData?.niveau;

                    const niveauId = niveauData?.id ?? null;
                    const optionId = optionData?.id ?? null;
                    const uniteId = uniteData?.id ?? null;
                    const extractedChapitreId = chapterData?.id ?? null; // ID du chapitre corrigé

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

                    // Tri des blocs de contenu
                    const sortedContentBlocks = (evaluationDataDB.evaluation_content_blocks as EvaluationContentBlockDB[])
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
                        niveau_id: niveauId,
                        option_id: optionId,
                        unite_id: uniteId,
                        chapitre_id: extractedChapitreId, // Utilisez l'ID corrigé ici
                        objectifs: selectedObjectifIds,
                        selected_competence_id: specificCompetenceId,
                        selected_general_competence_ids: generalCompetenceIds,
                        selected_connaissance_ids: selectedConnaissanceIds,
                        new_connaissance_text: null,
                        selected_capacite_habilete_ids: selectedCapaciteHabileteIds,
                        sequence_id: null,
                        activite_id: null,
                    });

                    toast.success("Évaluation chargée avec succès !", { id: "loadingEditEval" });

                    // Mise à jour des états pour l'affichage de la position
                    if (niveauData && optionData) {
                        setNiveauOption({
                            niveau: niveauData.nom_niveau,
                            option: optionData.nom_option,
                        });
                    } else {
                        setNiveauOption(null);
                    }

                    if (uniteData && chapterData) {
                        setUniteChapitre({
                            unite: uniteData.titre_unite,
                            chapitre: chapterData.titre_chapitre,
                        });
                    } else {
                        setUniteChapitre(null);
                    }

                } else {
                    setFormError("Évaluation introuvable ou erreur de chargement des données.");
                    toast.error("Évaluation introuvable ou erreur de chargement des données.", { id: "loadingEditEval" });
                }

            } catch (err: any) {
                console.error("Erreur de chargement de l'évaluation :", err.message);
                toast.error(`Échec du chargement de l'évaluation : ${err.message}`, { id: "loadingEditEval" });
                setFormError(`Échec du chargement de l'évaluation : ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchEvaluation();
    }, [evaluationId, setFormError]);

    // 3. Gestionnaire de mise à jour des champs (Callback)
    // Permet au composant enfant de mettre à jour l'état de l'évaluation.
    const handleUpdateEvaluationData = useCallback((updatedFields: Partial<EvaluationData>) => {
        setEvaluationData(prevData => ({ ...prevData, ...updatedFields }));
    }, []);

    // 4. Fonction de Sauvegarde des données (Callback)
    // Gère la validation et la mise à jour de l'évaluation et de toutes ses relations dans Supabase.
    const handleSave = async () => {
        setError(null);
        setSuccessMessage(null);
        const toastId = toast.loading("Sauvegarde en cours...");

        // Validation du formulaire
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

        const hasSpecificCompetence = evaluationData.selected_competence_id !== null;
        const hasGeneralCompetences = (evaluationData.selected_general_competence_ids && evaluationData.selected_general_competence_ids.length > 0);
        if (!hasSpecificCompetence && !hasGeneralCompetences) {
            setFormError("Veuillez sélectionner au moins une compétence (spécifique ou générale).");
            toast.error("Veuillez sélectionner au moins une compétence (spécifique ou générale).", { id: toastId });
            setSaving(false);
            return;
        }

        const hasSelectedConnaissances = (evaluationData.selected_connaissance_ids && evaluationData.selected_connaissance_ids.length > 0);
        const hasNewConnaissanceText = (evaluationData.new_connaissance_text && evaluationData.new_connaissance_text.trim() !== '');
        if (evaluationData.chapitre_id && !hasSelectedConnaissances && !hasNewConnaissanceText) {
            setFormError("Veuillez sélectionner au moins une connaissance ou ajouter une nouvelle notion si un chapitre est sélectionné.");
            toast.error("Veuillez sélectionner au moins une connaissance ou ajouter une nouvelle notion si un chapitre est sélectionné.", { id: toastId });
            setSaving(false);
            return;
        }

        const hasSelectedModalites = (evaluationData.modalite_evaluation_ids && evaluationData.modalite_evaluation_ids.length > 0);
        const hasAutreModaliteText = (evaluationData.modalite_evaluation_autre_texte && evaluationData.modalite_evaluation_autre_texte.trim() !== '');
        if (!hasSelectedModalites && !hasAutreModaliteText) {
            setFormError("Veuillez sélectionner au moins une modalité d'évaluation ou spécifier une nouvelle modalité.");
            toast.error("Veuillez sélectionner au moins une modalité d'évaluation ou spécifier une nouvelle modalité.", { id: toastId });
            setSaving(false);
            return;
        }

        if (!evaluationData.introduction_activite || evaluationData.introduction_activite.trim() === "" || evaluationData.introduction_activite === "<p><br></p>") {
            setFormError("La section 'Situation d'évaluation / Introduction' est obligatoire.");
            toast.error("La section 'Situation d'évaluation / Introduction' est obligatoire.", { id: toastId });
            setSaving(false);
            return;
        }
        if (!evaluationData.contenu_blocs || evaluationData.contenu_blocs.length === 0) {
            setFormError("Veuillez ajouter au moins un bloc de contenu (paragraphe, image, etc.) pour le corps de l'activité.");
            toast.error("Veuillez ajouter au moins un bloc de contenu (paragraphe, image, etc.) pour le corps de l'activité.", { id: toastId });
            setSaving(false);
            return;
        }

        setSaving(true);
        try {
            const {
                id, niveau_id, option_id, unite_id,
                objectifs, competence_ids,
                selected_competence_id, selected_general_competence_ids,
                selected_connaissance_ids, new_connaissance_text,
                selected_capacite_habilete_ids,
                ressource_urls, ressources_eleve_urls,
                contenu_blocs,
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

            // Gérer la nouvelle connaissance
            let finalConnaissanceIds = [...(evaluationData.selected_connaissance_ids || [])];
            if (evaluationData.new_connaissance_text && evaluationData.new_connaissance_text.trim() !== '') {
                const { data: newConnaissanceData, error: newConnaissanceError } = await supabase
                    .from('connaissances')
                    .insert({
                        titre_connaissance: evaluationData.new_connaissance_text.trim(),
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
            if (evaluationData.objectifs && evaluationData.objectifs.length > 0) {
                const uniqueObjectifIds = Array.from(new Set(evaluationData.objectifs));
                const objectifRelations = uniqueObjectifIds.map((objId) => ({
                    evaluation_id: evaluationId,
                    objectif_id: objId,
                }));
                const { error: objRelError } = await supabase.from("evaluation_objectifs").insert(objectifRelations);
                if (objRelError) throw objRelError;
            }

            await supabase.from("evaluation_competences").delete().eq("evaluation_id", evaluationId);
            const allCompetenceIdsToLink: number[] = [];
            if (evaluationData.selected_competence_id) {
                allCompetenceIdsToLink.push(evaluationData.selected_competence_id);
            }
            if (evaluationData.selected_general_competence_ids && evaluationData.selected_general_competence_ids.length > 0) {
                allCompetenceIdsToLink.push(...evaluationData.selected_general_competence_ids);
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
            if (evaluationData.modalite_evaluation_ids && evaluationData.modalite_evaluation_ids.length > 0) {
                const uniqueModaliteIds = Array.from(new Set(evaluationData.modalite_evaluation_ids));
                const modaliteRelations = uniqueModaliteIds.map((modaliteId) => ({
                    evaluation_id: evaluationId,
                    modalite_id: modaliteId,
                }));
                const { error: modaliteRelError } = await supabase.from("evaluation_modalites").insert(modaliteRelations);
                if (modaliteRelError) throw modaliteRelError;
            }

            await supabase.from("evaluation_capacite_habilete").delete().eq("evaluation_id", evaluationId);
            if (evaluationData.selected_capacite_habilete_ids && evaluationData.selected_capacite_habilete_ids.length > 0) {
                const uniqueCapaciteIds = Array.from(new Set(evaluationData.selected_capacite_habilete_ids));
                const capaciteRelations = uniqueCapaciteIds.map((capId) => ({
                    evaluation_id: evaluationId,
                    capacite_habilete_id: capId,
                }));
                const { error: capaciteRelError } = await supabase.from("evaluation_capacite_habilete").insert(capaciteRelations);
                if (capaciteRelError) throw capaciteRelError;
            }

            await supabase.from("evaluation_content_blocks").delete().eq("evaluation_id", evaluationId);
            if (evaluationData.contenu_blocs && evaluationData.contenu_blocs.length > 0) {
                const contentBlocksToInsert = evaluationData.contenu_blocs.map(block => ({
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
                if (contentBlocksError) throw contentBlocksError;
            }

            toast.success("Évaluation mise à jour avec succès !", { id: toastId });
            setSuccessMessage("Évaluation mise à jour avec succès.");
            if (onSaved) onSaved();

        } catch (err: any) {
            console.error("Erreur lors de la sauvegarde de l'évaluation:", err);
            toast.error(`Échec de la sauvegarde de l'évaluation : ${err.message || "Erreur inconnue"}`, { id: toastId });
            setError(`Échec de la sauvegarde de l'évaluation : ${err.message || "Erreur inconnue"}`);
        } finally {
            setSaving(false);
        }
    };

    // 5. Gestion de l'annulation
    // Redirige ou appelle le callback d'annulation.
    const handleBack = () => {
        if (onCancel) onCancel();
        else navigate(-1);
    };

    // 6. Rendu Conditionnel du Composant
    // Affiche l'état de chargement, les messages d'erreur, ou le formulaire d'édition.
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
                    onClick={handleBack}
                    className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Retour à la liste
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            {/* 7. Section : Position de l'évaluation */}
            {/* Affiche les informations de hiérarchie pour le contexte. */}
            <section className="max-w-3xl mx-auto p-6 bg-pink-50 rounded-lg shadow-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">📍 Position de l'évaluation</h3>
                {niveauOption && (
                    <p className="mb-1 text-gray-700 font-medium">
                        <span className="italic">Niveau & Option : </span>
                        {niveauOption.niveau} - {niveauOption.option}
                    </p>
                )}
                {uniteChapitre && (
                    <p className="mb-1 text-gray-700 font-medium">
                        <span className="italic">Unité & Chapitre : </span>
                        {uniteChapitre.unite} - {uniteChapitre.chapitre}
                    </p>
                )}
                {!niveauOption && !uniteChapitre && (
                    <p className="text-gray-500 italic">Informations de position non disponibles.</p>
                )}
            </section>

            {/* 8. Section : Formulaire d'édition (CreateEvaluationEditor) */}
            {/* Le composant enfant qui gère l'interface utilisateur du formulaire. */}
            <CreateEvaluationEditor
                initialData={evaluationData}
                onUpdate={handleUpdateEvaluationData}
                onSaveTrigger={handleSave}
                onCancel={handleBack}
                saving={saving}
                error={error}
                successMessage={successMessage}
                setFormError={setFormError}
                onSuccessRedirectPath="/evaluations"
            />
        </div>
    );
};

export default EditEvaluationEditor;