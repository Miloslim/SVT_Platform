// Nom du fichier: EvaluationChooserModal.tsx
// Chemin: src/components/planipeda/ScenarioEditor/EvaluationChooserModal.tsx

// Fonctionnalités:
// Ce composant modal permet à l'utilisateur de choisir une évaluation existante
// ou d'en créer une nouvelle pour l'ajouter à une séquence.
// Il orchestre la logique entre un formulaire de création (CreateInsertEvaluationEditor)
// et un sélecteur d'évaluations existantes (EvaluationSelector).
// Il gère la persistance des données d'évaluation, y compris leurs relations
// complexes (objectifs, connaissances, capacités/habiletés, etc.) avec Supabase,
// et transmet les détails pertinents de l'évaluation choisie/créée au composant parent.

import React, { useState, useEffect, useCallback } from 'react';
import CreateInsertEvaluationEditor from './CreateInsertEvaluationEditor'; // Import de l'éditeur de formulaire pur
import EvaluationSelector from './EvaluationSelector'; // Import du sélecteur d'évaluations existantes
import { supabase } from '@/backend/config/supabase';
import { EvaluationDatacrt as EvaluationData } from '@/types/evaluation'; // Import de l'interface EvaluationDatacrt, aliasée pour la cohérence
import { ContentBlockData } from "./EvaluationContent/EvaluationContentEditor"; // Pour le typage des blocs de contenu
import toast from "react-hot-toast"; // REMARQUE: Votre projet utilise 'sonner' pour les toasts, assurez-vous de la cohérence.

// --- Interfaces pour les données de liaison avec la base de données ---
// Ces interfaces sont utilisées pour typer les données avant insertion dans Supabase
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

// --- INTERFACE POUR LES DONNÉES D'ÉVALUATION À PASSER AU PARENT ---
// Cette interface reflète les propriétés nécessaires pour créer un SequenceItem
export interface EvaluationForSequence {
    id: number;
    titre_evaluation: string;
    type_evaluation?: string | null;
    // SUPPRIMÉ: description?: string | null; // Cette ligne est supprimée car 'description' n'est pas dans la table 'evaluations'
    connaissances?: string[]; // Descriptions des connaissances
    capacitesEvaluees?: string[]; // Descriptions des capacités évaluées
    introduction_activite?: string | null;
    consignes_specifiques?: string | null;
}


// --- Props du composant EvaluationChooserModal ---
interface EvaluationChooserModalProps {
    onEvaluationAdded: (evaluationData: EvaluationForSequence) => void;
    onClose: () => void;
    chapitreId?: number | null;
    niveauId?: number | null;
    optionId?: number | null;
    uniteId?: number | null;
}

const EvaluationChooserModal: React.FC<EvaluationChooserModalProps> = ({
    onEvaluationAdded,
    onClose,
    chapitreId,
    niveauId,
    optionId,
    uniteId
}) => {
    // État pour basculer entre la vue de création et de sélection d'évaluation
    const [currentView, setCurrentView] = useState<'create' | 'select'>('create');

    // État local pour les données de la nouvelle évaluation en cours de création
    const [newEvaluationData, setNewEvaluationData] = useState<Partial<EvaluationData>>({
        titre_evaluation: '',
        chapitre_id: chapitreId,
        niveau_id: niveauId,
        option_id: optionId,
        unite_id: uniteId,
        modalite_evaluation_ids: [],
        objectifs: [],
        selected_general_competence_ids: [],
        selected_connaissance_ids: [],
        selected_capacite_habilete_ids: [],
        contenu_blocs: [],
        ressource_urls: null,
        ressources_eleve_urls: null,
        introduction_activite: "<p></p>",
        // SUPPRIMÉ: description: null, // Cette ligne est supprimée
        type_evaluation: null,
        modalite_evaluation_autre_texte: null,
        grille_correction: null,
        consignes_specifiques: null,
        new_connaissance_text: null,
        selected_competence_id: null,
        sequence_id: null,
        activite_id: null,
    });

    // États pour gérer le processus de sauvegarde d'une nouvelle évaluation
    const [isSavingNewEvaluation, setIsSavingNewEvaluation] = useState(false);
    const [newEvaluationSaveError, setNewEvaluationSaveError] = useState<string | null>(null);
    const [newEvaluationSaveSuccess, setNewEvaluationSaveSuccess] = useState<string | null>(null);

    // Callback pour que l'éditeur de formulaire puisse remonter les erreurs de validation
    const handleSetFormError = useCallback((message: string | null) => {
        setNewEvaluationData(prev => ({ ...prev, formError: message }));
    }, []);

    // Callback pour mettre à jour les données de la nouvelle évaluation depuis l'éditeur
    const handleNewEvaluationUpdate = useCallback((updatedFields: Partial<EvaluationData>) => {
        setNewEvaluationData(prev => ({ ...prev, ...updatedFields }));
        // Efface les messages de succès/erreur quand l'utilisateur modifie le formulaire
        setNewEvaluationSaveError(null);
        setNewEvaluationSaveSuccess(null);
        // Si l'erreur de formulaire n'est pas explicitement définie, la vider
        if (updatedFields.formError === undefined) {
            setNewEvaluationData(prev => ({ ...prev, formError: null }));
        }
    }, []);

    // Fonction utilitaire pour parser les URLs stockées en JSON stringifié (si applicable)
    const parseUrls = useCallback((urlsData: string | null | undefined): string[] => {
        if (typeof urlsData === 'string' && urlsData) {
            try {
                const parsed = JSON.parse(urlsData);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    }, []);

    // --- GESTIONNAIRE DE SAUVEGARDE CENTRALISÉ POUR LA CRÉATION D'ÉVALUATION ---
    const handleNewEvaluationSaveTrigger = async () => {
        setIsSavingNewEvaluation(true);
        setNewEvaluationSaveError(null);
        setNewEvaluationSaveSuccess(null);
        let toastId: string | undefined;

        try {
            toastId = toast.loading("Création de l'évaluation...", { id: "createEvaluationModalToast" });

            // Vérification des erreurs de validation remontées par le formulaire enfant
            if (newEvaluationData.formError) {
                throw new Error(newEvaluationData.formError);
            }

            // Vérifications finales des champs obligatoires (redondant mais sécurisant)
            if (!newEvaluationData.titre_evaluation || newEvaluationData.titre_evaluation.trim() === "") {
                throw new Error("Le titre de l'évaluation est obligatoire.");
            }
            if (newEvaluationData.chapitre_id === null || newEvaluationData.chapitre_id === undefined) {
                throw new Error("Le chapitre est obligatoire pour l'évaluation.");
            }

            // Préparation des données pour l'insertion dans la table principale `evaluations`
            // S'ASSURER QUE SEULES LES COLONNES EXISTANTES DANS LA TABLE `evaluations` SONT INCLUSES ICI.
            const evaluationToInsert = {
                titre_evaluation: newEvaluationData.titre_evaluation.trim(),
                chapitre_id: newEvaluationData.chapitre_id,
                sequence_id: newEvaluationData.sequence_id || null,
                activite_id: newEvaluationData.activite_id || null,
                ressource_urls: newEvaluationData.ressource_urls || null,
                ressources_eleve_urls: newEvaluationData.ressources_eleve_urls || null,
                type_evaluation: newEvaluationData.type_evaluation || null,
                modalite_evaluation_autre_texte: newEvaluationData.modalite_evaluation_autre_texte || null,
                grille_correction: newEvaluationData.grille_correction || null,
                introduction_activite: newEvaluationData.introduction_activite || "<p></p>",
                consignes_specifiques: newEvaluationData.consignes_specifiques || null,
                // SUPPRIMÉ: description: newEvaluationData.description || null, // Cette ligne est supprimée
                date_creation: new Date().toISOString(),
            };

            // 1. Insertion de l'évaluation principale
            const { data: newEvaluationResult, error: insertError } = await supabase
                .from("evaluations")
                .insert(evaluationToInsert)
                // SUPPRIMÉ: 'description' de la sélection car la colonne n'existe pas
                .select("id, titre_evaluation, type_evaluation, introduction_activite, consignes_specifiques")
                .single();

            if (insertError) {
                throw insertError;
            }
            if (!newEvaluationResult || !newEvaluationResult.id) {
                throw new Error("Erreur lors de la création de l'évaluation. ID non retourné.");
            }

            const newEvaluationId = newEvaluationResult.id;

            // --- Récupération des descriptions pour les connaissances et capacités (pour le callback parent) ---
            let connaissanceDescriptions: string[] = [];
            let finalConnaissanceIds = [...(newEvaluationData.selected_connaissance_ids || [])];
            if (newEvaluationData.new_connaissance_text && newEvaluationData.new_connaissance_text.trim() !== '') {
                const { data: newConnaissanceData, error: newConnaissanceError } = await supabase
                    .from('connaissances')
                    .insert({
                        titre_connaissance: newEvaluationData.new_connaissance_text.trim(),
                        chapitre_id: newEvaluationData.chapitre_id,
                        description_connaissance: newEvaluationData.new_connaissance_text.trim(),
                    })
                    .select('id, titre_connaissance')
                    .single();

                if (newConnaissanceError) {
                    throw newConnaissanceError;
                } else if (newConnaissanceData) {
                    finalConnaissanceIds.push(newConnaissanceData.id);
                    connaissanceDescriptions.push(newConnaissanceData.titre_connaissance);
                }
            }

            // Récupère les titres des connaissances existantes sélectionnées
            if (finalConnaissanceIds.length > 0) {
                const { data: connaissancesData, error: connaissancesError } = await supabase
                    .from('connaissances')
                    .select('titre_connaissance')
                    .in('id', finalConnaissanceIds);

                if (!connaissancesError && connaissancesData) {
                    const existingConnaissanceTitles = connaissancesData.map(conn => conn.titre_connaissance);
                    connaissanceDescriptions = Array.from(new Set([...connaissanceDescriptions, ...existingConnaissanceTitles]));
                }
            }

            let capaciteHabileteDescriptions: string[] = [];
            if (newEvaluationData.selected_capacite_habilete_ids && newEvaluationData.selected_capacite_habilete_ids.length > 0) {
                const { data: capacitesData, error: capacitesError } = await supabase
                    .from('capacites_habiletes')
                    .select('titre_capacite_habilete')
                    .in('id', newEvaluationData.selected_capacite_habilete_ids);

                if (!capacitesError && capacitesData) {
                    capaciteHabileteDescriptions = capacitesData.map(cap => cap.titre_capacite_habilete);
                }
            }
            // --- FIN Récupération des descriptions ---

            // --- Gestion des tables de liaison ---

            // 2. Objectifs (evaluation_objectifs)
            if (newEvaluationData.objectifs && newEvaluationData.objectifs.length > 0) {
                const uniqueObjectifIds = Array.from(new Set(newEvaluationData.objectifs));
                const objectifRelations: EvaluationObjectifLink[] = uniqueObjectifIds.map((objectif_id) => ({
                    evaluation_id: newEvaluationId,
                    objectif_id: objectif_id,
                }));
                const { error: objRelError } = await supabase.from("evaluation_objectifs").insert(objectifRelations);
                if (objRelError) {
                    console.error("Erreur insertion evaluation_objectifs:", objRelError.message);
                }
            }

            // 3. Compétences (evaluation_competences) : Inclut spécifiques et générales
            const allCompetenceIdsToLink: number[] = [];
            if (newEvaluationData.selected_competence_id) {
                allCompetenceIdsToLink.push(newEvaluationData.selected_competence_id);
            }
            if (newEvaluationData.selected_general_competence_ids && newEvaluationData.selected_general_competence_ids.length > 0) {
                allCompetenceIdsToLink.push(...newEvaluationData.selected_general_competence_ids);
            }
            if (allCompetenceIdsToLink.length > 0) {
                const uniqueCompetenceIds = Array.from(new Set(allCompetenceIdsToLink));
                const competenceRelations: EvaluationCompetenceLink[] = uniqueCompetenceIds.map((competence_id) => ({
                    evaluation_id: newEvaluationId,
                    competence_id: competence_id,
                    resultat: null,
                }));
                const { error: compRelError } = await supabase.from("evaluation_competences").insert(competenceRelations);
                if (compRelError) {
                    console.error("Erreur insertion evaluation_competences:", compRelError.message);
                }
            }

            // 4. Connaissances (evaluation_connaissances) - Utilise maintenant finalConnaissanceIds
            if (finalConnaissanceIds.length > 0) {
                const uniqueConnaissanceIds = Array.from(new Set(finalConnaissanceIds));
                const connaissanceRelations: EvaluationConnaissanceLink[] = uniqueConnaissanceIds.map((connaissance_id) => ({
                    evaluation_id: newEvaluationId,
                    connaissance_id: connaissance_id,
                }));
                const { error: connaissanceRelError } = await supabase.from("evaluation_connaissances").insert(connaissanceRelations);
                if (connaissanceRelError) {
                    console.error("Erreur insertion evaluation_connaissances:", connaissanceRelError.message);
                }
            }

            // 5. Modalités d'évaluation (evaluation_modalites)
            if (newEvaluationData.modalite_evaluation_ids && newEvaluationData.modalite_evaluation_ids.length > 0) {
                const uniqueModaliteIds = Array.from(new Set(newEvaluationData.modalite_evaluation_ids));
                const modaliteRelations: EvaluationModaliteLink[] = uniqueModaliteIds.map((modalite_id) => ({
                    evaluation_id: newEvaluationId,
                    modalite_id: modalite_id,
                }));
                const { error: modaliteRelError } = await supabase.from("evaluation_modalites").insert(modaliteRelations);
                if (modaliteRelError) {
                    console.error("Erreur insertion evaluation_modalites:", modaliteRelError.message);
                }
            }

            // 6. Capacités/Habiletés (evaluation_capacite_habilete)
            if (newEvaluationData.selected_capacite_habilete_ids && newEvaluationData.selected_capacite_habilete_ids.length > 0) {
                const uniqueCapaciteIds = Array.from(new Set(newEvaluationData.selected_capacite_habilete_ids));
                const capaciteRelations: EvaluationCapaciteHabileteLink[] = uniqueCapaciteIds.map((capacite_habilete_id) => ({
                    evaluation_id: newEvaluationId,
                    capacite_habilete_id: capacite_habilete_id,
                    resultat: null,
                }));
                const { error: capaciteRelError } = await supabase.from("evaluation_capacite_habilete").insert(capaciteRelations);
                if (capaciteRelError) {
                    console.error("Erreur insertion evaluation_capacite_habilete:", capaciteRelError.message);
                }
            }

            // 7. Blocs de contenu (evaluation_content_blocks)
            if (newEvaluationData.contenu_blocs && newEvaluationData.contenu_blocs.length > 0) {
                const contentBlocksToInsert: EvaluationContentBlockDB[] = newEvaluationData.contenu_blocs.map((block, index) => ({
                    evaluation_id: newEvaluationId,
                    block_order: block.order !== undefined ? block.order : index,
                    block_type: block.type,
                    text_content_html: block.text_content_html || null,
                    questions_html: block.questions_html || null,
                    media_url: block.media_url || null,
                    media_alt_text: block.media_alt_text || null,
                    media_position: block.media_position || null,
                }));
                const { error: contentBlocksError } = await supabase.from("evaluation_content_blocks").insert(contentBlocksToInsert);
                if (contentBlocksError) {
                    console.error("Erreur insertion evaluation_content_blocks:", contentBlocksError.message);
                }
            }

            // Succès final
            toast.success("Évaluation enregistrée avec succès !", { id: toastId });
            setNewEvaluationSaveSuccess("Évaluation enregistrée avec succès !");

            // --- MODIFICATION CRUCIALE ICI : Passer un objet complet ---
            onEvaluationAdded({
                id: newEvaluationResult.id,
                titre_evaluation: newEvaluationResult.titre_evaluation || "Titre inconnu",
                type_evaluation: newEvaluationResult.type_evaluation || null,
                // SUPPRIMÉ: description: newEvaluationResult.description || null, // Cette ligne est supprimée
                connaissances: connaissanceDescriptions, // Passer les connaissances récupérées
                capacitesEvaluees: capaciteHabileteDescriptions, // Passer les capacités évaluées récupérées
                introduction_activite: newEvaluationResult.introduction_activite || null, // Récupéré directement du résultat de l'insertion
                consignes_specifiques: newEvaluationResult.consignes_specifiques || null, // Récupéré directement du résultat de l'insertion
            });
            // --- FIN MODIFICATION ---

            // Fermeture de la modale après un court délai
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err: any) {
            toast.error(err.message || "Une erreur inconnue est survenue lors de l'enregistrement.", { id: toastId });
            setNewEvaluationSaveError(err.message || "Une erreur inconnue est survenue lors de l'enregistrement.");
        } finally {
            setIsSavingNewEvaluation(false);
        }
    };

    // Effet pour vider les messages de succès/erreur après un certain temps
    useEffect(() => {
        if (newEvaluationSaveSuccess) {
            const timer = setTimeout(() => setNewEvaluationSaveSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
        if (newEvaluationSaveError) {
            const timer = setTimeout(() => setNewEvaluationSaveError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [newEvaluationSaveSuccess, newEvaluationSaveError]);

    // Gestionnaire pour la sélection d'une évaluation existante
    const handleExistingEvaluationSelected = useCallback(async (
        evaluationId: number,
        evaluationTitle: string,
        // Les paramètres suivants sont ignorés car nous faisons une requête complète
        // type_evaluation_from_selector?: string,
        // SUPPRIMÉ: description_from_selector?: string,
        // connaissances_from_selector?: string[],
        // capacitesEvaluees_from_selector?: string[]
    ) => {
        try {
            const { data: evaluationDetails, error } = await supabase
                .from('evaluations')
                .select(`
                    id,
                    titre_evaluation,
                    type_evaluation,
                    introduction_activite,
                    consignes_specifiques,
                    evaluation_connaissances ( connaissances ( titre_connaissance ) ),
                    evaluation_capacite_habilete ( capacites_habiletes ( titre_capacite_habilete ) )
                `) // SUPPRIMÉ: 'description' de la sélection
                .eq('id', evaluationId)
                .single();

            if (error) {
                console.error("Error fetching existing evaluation details:", error.message);
                toast.error("Failed to load existing evaluation details.");
                return;
            }

            if (evaluationDetails) {
                // Mapper les données complexes pour les passer comme des tableaux de chaînes
                const mappedConnaissances = evaluationDetails.evaluation_connaissances
                    ?.map((c: any) => c.connaissances?.titre_connaissance) // Explicitement typer c comme 'any' pour éviter les erreurs de compilation avec les types imbriqués
                    .filter(Boolean) as string[] || [];
                const mappedCapacites = evaluationDetails.evaluation_capacite_habilete
                    ?.map((c: any) => c.capacites_habiletes?.titre_capacite_habilete)
                    .filter(Boolean) as string[] || [];

                onEvaluationAdded({
                    id: evaluationDetails.id,
                    titre_evaluation: evaluationDetails.titre_evaluation,
                    type_evaluation: evaluationDetails.type_evaluation,
                    // SUPPRIMÉ: description: evaluationDetails.description, // Cette ligne est supprimée
                    connaissances: mappedConnaissances,
                    capacitesEvaluees: mappedCapacites,
                    introduction_activite: evaluationDetails.introduction_activite,
                    consignes_specifiques: evaluationDetails.consignes_specifiques,
                });
                onClose();
            } else {
                toast.error("Évaluation existante non trouvée.");
            }
        } catch (fetchError: any) {
            console.error("Error in handleExistingEvaluationSelected:", fetchError.message);
            toast.error("Une erreur est survenue lors de la sélection de l'évaluation existante.");
        }
    }, [onEvaluationAdded, onClose]); // Dépendances du useCallback

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Ajouter une Évaluation</h2>

            <div className="flex justify-center gap-4 mb-6">
                <button
                    type="button"
                    className={`px-6 py-2 rounded-md transition-colors font-medium ${
                        currentView === 'create' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setCurrentView('create')}
                >
                    Créer une nouvelle évaluation
                </button>
                <button
                    type="button"
                    className={`px-6 py-2 rounded-md transition-colors font-medium ${
                        currentView === 'select' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setCurrentView('select')}
                >
                    Sélectionner une évaluation existante
                </button>
            </div>

            {currentView === 'create' && (
                <CreateInsertEvaluationEditor
                    key={currentView}
                    initialData={newEvaluationData}
                    onUpdate={handleNewEvaluationUpdate}
                    onSaveTrigger={handleNewEvaluationSaveTrigger}
                    onCancel={onClose}
                    saving={isSavingNewEvaluation}
                    error={newEvaluationSaveError}
                    successMessage={newEvaluationSaveSuccess}
                    onSuccessRedirectPath={undefined}
                    setFormError={handleSetFormError}
                    niveauIdParent={niveauId}
                    optionIdParent={optionId}
                    uniteIdParent={uniteId}
                    chapitreIdParent={chapitreId}
                />
            )}

            {currentView === 'select' && (
                <EvaluationSelector
                    key={currentView}
                    onEvaluationSelected={handleExistingEvaluationSelected}
                    onCancel={onClose}
                    chapitreId={chapitreId}
                    niveauId={niveauId}
                    optionId={optionId}
                    uniteId={uniteId}
                />
            )}
        </div>
    );
};

export default EvaluationChooserModal;