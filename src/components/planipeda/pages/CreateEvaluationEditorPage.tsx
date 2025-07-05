// ============================================================
// Titre : CreateEvaluationEditorPage
// Chemin : src/components/planipeda/pages/CreateEvaluationEditorPage.tsx
// Fonctionnalités :
//   - Page principale pour la création ou la modification d'une évaluation.
//   - Gère l'état global du formulaire et orchestre la persistance des données dans Supabase.
//   - Charge les données existantes en mode édition en naviguant la hiérarchie (chapitre -> unité -> option -> niveau).
//   - Appelle le composant CreateEvaluationEditor pour l'affichage du formulaire.
//   - Gère la logique de sauvegarde en interagissant avec plusieurs tables de la base de données.
//   - MODIFICATION: Ajout de logs de débogage très détaillés pour l'insertion des tables de liaison
//                 et ajustement temporaire de la gestion d'erreur pour les capacités.
//   - MODIFICATION: Le champ 'introduction_activite' est maintenant vide par défaut lors de la création d'une nouvelle évaluation.
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CreateEvaluationEditor, { EvaluationData } from "../ScenarioEditor/CreateEvaluationEditor";
import { supabase } from "@/backend/config/supabase";
import toast from "react-hot-toast";

// --- Interfaces pour les données spécifiques au chargement/sauvegarde ---
interface EvaluationCompetenceLink {
    evaluation_id: number;
    competence_id: number;
    resultat?: string | null;
}

interface EvaluationConnaissanceLink {
    evaluation_id: number;
    connaissance_id: number;
}

interface EvaluationObjectifLink {
    evaluation_id: number;
    objectif_id: number;
}

interface EvaluationModaliteLink {
    evaluation_id: number;
    modalite_id: number;
}

interface EvaluationCapaciteHabileteLink {
    evaluation_id: number;
    capacite_habilete_id: number;
    resultat?: string | null;
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

interface CompetenceWithType {
    competence_id: number;
    competence: {
        type_competence: 'spécifique' | 'générale';
        id: number;
    };
}

interface ChapterHierarchy {
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


const CreateEvaluationEditorPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const evaluationId = id ? parseInt(id, 10) : undefined;
    const navigate = useNavigate();

    // --- États locaux de la page ---
    const [evaluation, setEvaluation] = useState<EvaluationData>({
        titre_evaluation: "",
        chapitre_id: null,
        sequence_id: null,
        activite_id: null,
        ressource_urls: null,
        type_evaluation: null,
        modalite_evaluation_autre_texte: null,
        modalite_evaluation_ids: [],
        grille_correction: null,
        objectifs: [],
        selected_competence_id: null,
        selected_general_competence_ids: [],
        selected_connaissance_ids: [],
        new_connaissance_text: null,
        selected_capacite_habilete_ids: [],
        niveau_id: null,
        option_id: null,
        unite_id: null,
        introduction_activite: "<p></p>", // MODIFIÉ: Initialisation à vide ici
        contenu_blocs: [],
        consignes_specifiques: null,
        ressources_eleve_urls: null,
    });

    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);

    // --- useEffect pour le chargement initial des données en mode édition ---
    useEffect(() => {
        const fetchEvaluationData = async () => {
            if (evaluationId) {
                setLoading(true);
                toast.loading("Chargement de l'évaluation...", { id: "loadingEval" });
                try {
                    const { data: evaluationData, error: evalError } = await supabase
                        .from("evaluations")
                        .select(
                            `
                            id,
                            titre_evaluation,
                            chapitre_id,
                            sequence_id,
                            activite_id,
                            ressource_urls_json,
                            type_evaluation,
                            modalite_evaluation_autre_texte,
                            grille_correction,
                            introduction_activite,
                            consignes_specifiques,
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
                            evaluation_competences(competence_id, competence:competences(type_competence, id)),
                            evaluation_connaissances(connaissance_id),
                            evaluation_modalites(modalite_id),
                            evaluation_content_blocks(*),
                            evaluation_capacite_habilete(capacite_habilete_id)
                            `
                        )
                        .eq("id", evaluationId)
                        .single();

                    if (evalError) {
                        if (evalError.code === "PGRST116") {
                            toast.error("Évaluation non trouvée.", { id: "loadingEval" });
                            setFormError("Évaluation non trouvée.");
                        } else {
                            throw evalError;
                        }
                    }

                    if (evaluationData) {
                        const chapterData = evaluationData.chapitre as ChapterHierarchy;
                        const uniteData = chapterData?.unite;
                        const optionData = uniteData?.option;
                        const niveauData = optionData?.niveau;

                        const niveauId = niveauData?.id ?? null;
                        const optionId = optionData?.id ?? null;
                        const uniteId = uniteData?.id ?? null;

                        const specificCompetenceId = (evaluationData.evaluation_competences as CompetenceWithType[]).find(
                            (comp) => comp.competence?.type_competence === 'spécifique'
                        )?.competence.id || null;

                        const generalCompetenceIds = (evaluationData.evaluation_competences as CompetenceWithType[])
                            .filter((comp) => comp.competence?.type_competence === 'générale')
                            .map((comp) => comp.competence.id);

                        const selectedObjectifIds = (evaluationData.evaluation_objectifs as EvaluationObjectifLink[]).map(
                            (obj) => obj.objectif_id
                        );
                        const selectedConnaissanceIds = (evaluationData.evaluation_connaissances as EvaluationConnaissanceLink[]).map(
                            (conn) => conn.connaissance_id
                        );
                        const selectedModaliteIds = (evaluationData.evaluation_modalites as EvaluationModaliteLink[]).map(
                            (mod) => mod.modalite_id
                        );
                        const selectedCapaciteHabileteIds = (evaluationData.evaluation_capacite_habilete as EvaluationCapaciteHabileteLink[]).map(
                            (cap) => cap.capacite_habilete_id
                        );

                        const parsedProfessorUrls = evaluationData.ressource_urls_json ? JSON.stringify(evaluationData.ressource_urls_json) : null;
                        const parsedStudentUrls = evaluationData.ressources_eleve_urls ? JSON.stringify(evaluationData.ressources_eleve_urls) : null;

                        const sortedContentBlocks = (evaluationData.evaluation_content_blocks as EvaluationContentBlockDB[])
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
                            }) as ContentBlockData);

                        setEvaluation({
                            id: evaluationId,
                            titre_evaluation: evaluationData.titre_evaluation,
                            chapitre_id: evaluationData.chapitre_id,
                            sequence_id: evaluationData.sequence_id,
                            activite_id: evaluationData.activite_id,
                            ressource_urls: parsedProfessorUrls,
                            type_evaluation: evaluationData.type_evaluation,
                            modalite_evaluation_autre_texte: evaluationData.modalite_evaluation_autre_texte,
                            grille_correction: evaluationData.grille_correction,
                            introduction_activite: evaluationData.introduction_activite || '',
                            consignes_specifiques: evaluationData.consignes_specifiques || null,
                            ressources_eleve_urls: parsedStudentUrls,

                            niveau_id: niveauId,
                            option_id: optionId,
                            unite_id: uniteId,
                            objectifs: selectedObjectifIds,
                            selected_competence_id: specificCompetenceId,
                            selected_general_competence_ids: generalCompetenceIds,
                            selected_connaissance_ids: selectedConnaissanceIds,
                            modalite_evaluation_ids: selectedModaliteIds,
                            selected_capacite_habilete_ids: selectedCapaciteHabileteIds,
                            new_connaissance_text: null,
                            contenu_blocs: sortedContentBlocks,
                        });
                        toast.success("Évaluation chargée avec succès !", { id: "loadingEval" });
                    }
                } catch (err: any) {
                    console.error("Erreur de chargement de l'évaluation :", err.message);
                    toast.error(`Échec du chargement de l'évaluation : ${err.message}`, { id: "loadingEval" });
                    setFormError(`Échec du chargement de l'évaluation : ${err.message}`);
                } finally {
                    setLoading(false);
                }
            } else {
                // Initialisation pour une nouvelle évaluation
                setEvaluation({
                    titre_evaluation: "",
                    chapitre_id: null,
                    sequence_id: null,
                    activite_id: null,
                    ressource_urls: null,
                    type_evaluation: null,
                    modalite_evaluation_autre_texte: null,
                    modalite_evaluation_ids: [],
                    grille_correction: null,
                    objectifs: [],
                    selected_competence_id: null,
                    selected_general_competence_ids: [],
                    selected_connaissance_ids: [],
                    new_connaissance_text: null,
                    selected_capacite_habilete_ids: [],
                    niveau_id: null,
                    option_id: null,
                    unite_id: null,
                    introduction_activite: "<p></p>", // MODIFIÉ: Initialisation à vide ici pour une nouvelle évaluation
                    contenu_blocs: [],
                    consignes_specifiques: null,
                    ressources_eleve_urls: null,
                });
                setLoading(false);
            }
        };

        fetchEvaluationData();
    }, [evaluationId]);

    // --- Gestionnaire de mise à jour des champs du formulaire ---
    const handleUpdateEvaluation = useCallback((updatedFields: Partial<EvaluationData>) => {
        setEvaluation((prev) => ({ ...prev, ...updatedFields }));
        setFormError(null);
    }, []);

    // --- Gestionnaire de sauvegarde de l'évaluation (INSERT/UPDATE) ---
    const handleSave = async () => {
        setSaving(true);
        setFormError(null);
        const toastId = toast.loading("Sauvegarde en cours...");

        // ADDED: Log the full evaluation state at the very beginning of handleSave
        console.log("DEBUG: Full evaluation state at start of handleSave:", evaluation); 

        try {
            if (!evaluation.titre_evaluation.trim()) {
                setFormError("Le titre de l'évaluation est obligatoire.");
                toast.error("Le titre de l'évaluation est obligatoire.", { id: toastId });
                return;
            }

            let newEvaluationId: number;

            const evaluationToSave = {
                titre_evaluation: evaluation.titre_evaluation,
                chapitre_id: evaluation.chapitre_id,
                sequence_id: evaluation.sequence_id,
                activite_id: evaluation.activite_id,
                ressource_urls_json: evaluation.ressource_urls ? JSON.parse(evaluation.ressource_urls) : null,
                type_evaluation: evaluation.type_evaluation,
                modalite_evaluation_autre_texte: evaluation.modalite_evaluation_autre_texte,
                grille_correction: evaluation.grille_correction,
                introduction_activite: evaluation.introduction_activite,
                consignes_specifiques: evaluation.consignes_specifiques,
                ressources_eleve_urls: evaluation.ressources_eleve_urls ? JSON.parse(evaluation.ressources_eleve_urls) : null,
            };

            console.log("➡️ Données d'évaluation principales à sauvegarder:", evaluationToSave);


            if (evaluationId) {
                const { data, error: updateError } = await supabase
                    .from("evaluations")
                    .update(evaluationToSave)
                    .eq("id", evaluationId)
                    .select("id")
                    .single();

                if (updateError) throw updateError;
                newEvaluationId = data.id;
                toast.success("Évaluation mise à jour avec succès !", { id: toastId });
            } else {
                const { data, error: insertError } = await supabase
                    .from("evaluations")
                    .insert(evaluationToSave)
                    .select("id")
                    .single();

                if (insertError) throw insertError;
                newEvaluationId = data.id;
                toast.success("Évaluation créée avec succès !", { id: toastId });
            }

            console.log("✅ ID de l'évaluation principale obtenue:", newEvaluationId);

            // --- Gestion des tables de liaison et des blocs de contenu ---

            // Traitement de la nouvelle connaissance si elle a été saisie
            let finalConnaissanceIds = [...(evaluation.selected_connaissance_ids || [])];
            console.log("DEBUG: initial finalConnaissanceIds (from selected):", finalConnaissanceIds);
            if (evaluation.new_connaissance_text && evaluation.new_connaissance_text.trim() !== '') {
                console.log("DEBUG: New knowledge text detected:", evaluation.new_connaissance_text.trim());
                const { data: newConnaissanceData, error: newConnaissanceError } = await supabase
                    .from('connaissances')
                    .insert({ 
                        titre_connaissance: evaluation.new_connaissance_text.trim(),
                        chapitre_id: evaluation.chapitre_id,
                        description_connaissance: '', // Fournir une chaîne vide pour la description
                    })
                    .select('id')
                    .single();

                if (newConnaissanceError) {
                    console.error("❌ Erreur Supabase lors de l'insertion de la nouvelle connaissance:", newConnaissanceError.message, newConnaissanceError);
                    throw newConnaissanceError;
                }
                if (newConnaissanceData) {
                    finalConnaissanceIds.push(newConnaissanceData.id);
                    console.log("✅ Nouvelle connaissance insérée et ajoutée aux sélections:", newConnaissanceData.id);
                    console.log("DEBUG: finalConnaissanceIds after new knowledge insert:", finalConnaissanceIds);
                }
            } else {
                console.log("DEBUG: No new knowledge text to insert.");
            }


            // 1. Objectifs (evaluation_objectifs)
            console.log("DEBUG: evaluation.objectifs before processing:", evaluation.objectifs);
            await supabase.from("evaluation_objectifs").delete().eq("evaluation_id", newEvaluationId);
            if (evaluation.objectifs && evaluation.objectifs.length > 0) {
                const uniqueObjectifIds = Array.from(new Set(evaluation.objectifs));
                const objectifRelations = uniqueObjectifIds.map((objectif_id) => ({
                    evaluation_id: newEvaluationId,
                    objectif_id: objectif_id,
                }));
                console.log("➡️ Objectifs à insérer:", objectifRelations);
                const { error: objRelError } = await supabase.from("evaluation_objectifs").insert(objectifRelations);
                if (objRelError) {
                    console.error("❌ Erreur Supabase lors de l'insertion des liens d'objectifs:", objRelError.message, objRelError);
                    throw objRelError;
                }
                console.log("✅ Objectifs insérés avec succès.");
            } else {
                console.log("ℹ️ Aucun objectif sélectionné pour l'insertion.");
            }

            // 2. Compétences (evaluation_competences) : Inclut spécifiques et générales
            const allCompetenceIdsToLink: number[] = [];
            if (evaluation.selected_competence_id) {
                allCompetenceIdsToLink.push(evaluation.selected_competence_id);
            }
            if (evaluation.selected_general_competence_ids && evaluation.selected_general_competence_ids.length > 0) {
                allCompetenceIdsToLink.push(...evaluation.selected_general_competence_ids);
            }
            console.log("DEBUG: allCompetenceIdsToLink before processing:", allCompetenceIdsToLink);
            await supabase.from("evaluation_competences").delete().eq("evaluation_id", newEvaluationId);
            if (allCompetenceIdsToLink.length > 0) {
                const uniqueCompetenceIds = Array.from(new Set(allCompetenceIdsToLink));
                const competenceRelations: EvaluationCompetenceLink[] = uniqueCompetenceIds.map((competence_id) => ({
                    evaluation_id: newEvaluationId,
                    competence_id: competence_id,
                    resultat: null,
                }));
                console.log("➡️ Compétences à insérer:", competenceRelations);
                const { error: compRelError } = await supabase.from("evaluation_competences").insert(competenceRelations);
                if (compRelError) {
                    console.error("❌ Erreur Supabase lors de l'insertion des liens de compétences:", compRelError.message, compRelError);
                    throw compRelError;
                }
                console.log("✅ Compétences insérées avec succès.");
            } else {
                console.log("ℹ️ Aucune compétence sélectionnée pour l'insertion.");
            }

            // 3. Connaissances (evaluation_connaissances) - Utilise maintenant finalConnaissanceIds
            console.log("DEBUG: finalConnaissanceIds before processing:", finalConnaissanceIds);
            await supabase.from("evaluation_connaissances").delete().eq("evaluation_id", newEvaluationId);
            if (finalConnaissanceIds.length > 0) {
                const uniqueConnaissanceIds = Array.from(new Set(finalConnaissanceIds));
                const connaissanceRelations: EvaluationConnaissanceLink[] = uniqueConnaissanceIds.map((connaissance_id) => ({
                    evaluation_id: newEvaluationId,
                    connaissance_id: connaissance_id,
                }));
                console.log("➡️ Connaissances à insérer:", connaissanceRelations);
                const { error: connaissanceRelError } = await supabase.from("evaluation_connaissances").insert(connaissanceRelations);
                if (connaissanceRelError) {
                    console.error("❌ Erreur Supabase lors de l'insertion des liens de connaissances:", connaissanceRelError.message, connaissanceRelError);
                    throw connaissanceRelError;
                }
                console.log("✅ Connaissances insérées avec succès.");
            } else {
                console.log("ℹ️ Aucune connaissance sélectionnée ou ajoutée pour l'insertion.");
            }

            // 4. Modalités d'évaluation (evaluation_modalites)
            console.log("DEBUG: evaluation.modalite_evaluation_ids before processing:", evaluation.modalite_evaluation_ids);
            await supabase.from("evaluation_modalites").delete().eq("evaluation_id", newEvaluationId);
            if (evaluation.modalite_evaluation_ids && evaluation.modalite_evaluation_ids.length > 0) {
                const uniqueModaliteIds = Array.from(new Set(evaluation.modalite_evaluation_ids));
                const modaliteRelations: EvaluationModaliteLink[] = uniqueModaliteIds.map((modalite_id) => ({
                    evaluation_id: newEvaluationId,
                    modalite_id: modalite_id,
                }));
                console.log("➡️ Modalités à insérer:", modaliteRelations);
                const { error: modaliteRelError } = await supabase.from("evaluation_modalites").insert(modaliteRelations);
                if (modaliteRelError) {
                    console.error("❌ Erreur Supabase lors de l'insertion des liens de modalités:", modaliteRelError.message, modaliteRelError);
                    throw modaliteRelError;
                }
                console.log("✅ Modalités insérées avec succès.");
            } else {
                console.log("ℹ️ Aucune modalité sélectionnée pour l'insertion.");
            }

            // 5. Capacités/Habiletés (evaluation_capacite_habilete)
            console.log("DEBUG: evaluation.selected_capacite_habilete_ids before processing:", evaluation.selected_capacite_habilete_ids);
            // ADDED: More precise logs for content and length
            console.log("DEBUG: evaluation.selected_capacite_habilete_ids VALUE:", evaluation.selected_capacite_habilete_ids);
            console.log("DEBUG: evaluation.selected_capacite_habilete_ids LENGTH:", evaluation.selected_capacite_habilete_ids ? evaluation.selected_capacite_habilete_ids.length : 'N/A');

            await supabase.from("evaluation_capacite_habilete").delete().eq("evaluation_id", newEvaluationId);
            if (evaluation.selected_capacite_habilete_ids && evaluation.selected_capacite_habilete_ids.length > 0) {
                const uniqueCapaciteIds = Array.from(new Set(evaluation.selected_capacite_habilete_ids));
                const capaciteRelations: EvaluationCapaciteHabileteLink[] = uniqueCapaciteIds.map((capacite_habilete_id) => ({
                    evaluation_id: newEvaluationId,
                    capacite_habilete_id: capacite_habilete_id,
                    resultat: null,
                }));
                console.log("➡️ Capacités/Habiletés à insérer:", capaciteRelations);
                const { data: capaciteInsertData, error: capaciteRelError } = await supabase.from("evaluation_capacite_habilete").insert(capaciteRelations);
                if (capaciteRelError) {
                    console.error("❌ Erreur Supabase lors de l'insertion des liens de capacités/habiletés:", capaciteRelError.message, capaciteRelError);
                    // COMMENTED OUT: throw capaciteRelError; // Temporary: Don't throw here to allow other inserts to proceed for debugging
                    console.log("DEBUG: CapaciteHabilete insertion FAILED, but allowing other saves to continue.");
                } else {
                    console.log("✅ Capacités/Habiletés insérées avec succès. Données:", capaciteInsertData);
                }
            } else {
                console.log("ℹ️ Aucune capacité/habileté sélectionnée pour l'insertion (Condition évaluée à false).");
            }

            // 6. Blocs de contenu (evaluation_content_blocks)
            console.log("DEBUG: evaluation.contenu_blocs before processing:", evaluation.contenu_blocs);
            // ADDED: More precise logs for content and length
            console.log("DEBUG: evaluation.contenu_blocs VALUE:", evaluation.contenu_blocs);
            console.log("DEBUG: evaluation.contenu_blocs LENGTH:", evaluation.contenu_blocs ? evaluation.contenu_blocs.length : 'N/A');

            await supabase.from("evaluation_content_blocks").delete().eq("evaluation_id", newEvaluationId);
            if (evaluation.contenu_blocs && evaluation.contenu_blocs.length > 0) {
                const contentBlocksToInsert: EvaluationContentBlockDB[] = evaluation.contenu_blocs.map(block => ({
                    evaluation_id: newEvaluationId,
                    block_order: block.order,
                    block_type: block.type,
                    text_content_html: block.text_content_html,
                    questions_html: block.questions_html,
                    media_url: block.media_url,
                    media_alt_text: block.media_alt_text,
                    media_position: block.media_position,
                }));
                console.log("➡️ Blocs de contenu à insérer:", contentBlocksToInsert);
                const { data: contentBlocksInsertData, error: contentBlocksError } = await supabase.from("evaluation_content_blocks").insert(contentBlocksToInsert);
                if (contentBlocksError) {
                    console.error("❌ Erreur Supabase lors de l'insertion des blocs de contenu:", contentBlocksError.message, contentBlocksError);
                    // COMMENTED OUT: throw contentBlocksError; // Temporary: Don't throw here for debugging
                    console.log("DEBUG: Content blocks insertion FAILED, but allowing other saves to continue.");
                } else {
                    console.log("✅ Blocs de contenu insérés avec succès. Données:", contentBlocksInsertData);
                }
            } else {
                console.log("ℹ️ Aucun bloc de contenu sélectionné pour l'insertion (Condition évaluée à false).");
            }


            // REDIRECTION après toutes les sauvegardes réussies
            navigate(`/planipeda/evaluations`);

        } catch (err: any) {
            console.error("Erreur générale lors de la sauvegarde de l'évaluation :", err);
            toast.error(`Échec de la sauvegarde de l'évaluation : ${err.message || "Erreur inconnue"}`, { id: toastId });
            setFormError(`Échec de la sauvegarde de l'évaluation : ${err.message || "Erreur inconnue"}`);
        } finally {
            setSaving(false);
        }
    };

    // --- Rendu du Composant ---
    if (loading) {
        return <div className="text-center p-8 text-lg text-blue-800">Chargement de l'évaluation...</div>;
    }

    return (
        <div className="p-6 space-y-8">
                {/* 🔙 Bouton Retour */}
            <div className="flex items-center mb-6">
              <button 
                onClick={() => window.history.back()} 
                className="btn-outline mb-6 flex items-center gap-1">
                ← Retour à la liste des évaluations
              </button>
            </div>
        <CreateEvaluationEditor
            initialData={evaluation}
            onUpdate={handleUpdateEvaluation}
            onSaveTrigger={handleSave}
            onCancel={() => navigate(-1)}
            saving={saving}
            error={formError}
            onSuccessRedirectPath="/planipeda/evaluations"
            setFormError={setFormError}
        />
        </div>
    );
};

export default CreateEvaluationEditorPage;
