// src/components/planipeda/ScenarioEditor/EditEvaluationForm.tsx

/**
 * Nom du Fichier: EditEvaluationForm.tsx
 * Chemin: src/components/planipeda/ScenarioEditor/EditEvaluationForm.tsx
 *
 * Fonctionnalités:
 * - Composant principal de saisie et modification des données d'une évaluation maître.
 * - Charge une évaluation existante depuis Supabase en utilisant son ID.
 * - Prépare les données de l'évaluation (y compris les relations complexes) pour le formulaire d'édition.
 * - Gère l'état de chargement, de sauvegarde, les erreurs et les messages de succès.
 * - Affiche un résumé de la position hiérarchique de l'évaluation (Niveau, Option, Unité, Chapitre).
 * - Intègre divers sélecteurs (hiérarchique, compétences, modalités) et éditeurs de contenu (TinyMCE).
 * - Gère les données du formulaire, les validations et la soumission à Supabase.
 * - Met à jour l'évaluation et toutes ses relations many-to-many (objectifs, compétences, connaissances, modalités, blocs de contenu).
 * - Gère l'insertion de nouvelles connaissances si saisies par l'utilisateur.
 * - Permet le défilement vers le haut/bas, la suppression et l'expansion/contraction des blocs de contenu.
 * - Fournit des mécanismes d'annulation et appelle un callback `onSaveSuccess` après sauvegarde.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/backend/config/supabase";
import { EvaluationData, ContentBlockData } from "@/types/evaluation"; // Assurez-vous que ContentBlockData est exporté
import toast from "react-hot-toast";
import { Editor } from '@tinymce/tinymce-react';
import { v4 as uuidv4 } from 'uuid';

// Importation des sous-composants nécessaires
import HierarchicalSelector from "./HierarchicalSelector";
import MultiFileUpload from "./MultiFileUpload";
import CompetenceSelector, { CompetenceSelectorProps } from "./CompetenceSelector";
import ModaliteSelector from "./ModaliteSelector";
// import EvaluationContentEditor from "./EvaluationContent/EvaluationContentEditor"; // Plus utilisé directement, la logique est intégrée
import StudentResourceUploader from "./EvaluationContent/StudentResourceUploader";

// --- Interfaces de Props du Composant ---
interface EditEvaluationFormProps {
  evaluationId: number;
  onSaveSuccess: (updatedMasterEvaluationId: number) => void;
  onCancel: () => void;
}

// --- Interfaces pour les données complexes reçues de Supabase (structure des jointures) ---
// Ces interfaces sont spécifiques à la forme des données reçues de la DB, avant de les transformer en EvaluationData
interface CompetenceWithTypeDB {
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
  block_type: ContentBlockData['type']; // Utiliser le type de ContentBlockData
  text_content_html?: string | null;
  questions_html?: string | null;
  media_url?: string | null;
  media_alt_text?: string | null;
  media_position?: ContentBlockData['media_position'] | null;
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

// --- Interfaces pour les suggestions de formulaire (pour les formes rapides) ---
interface FormSuggestions {
  grilleCorrectionPlaceholder?: string;
  showStudentResources?: boolean;
  showProfessorResources?: boolean;
  evaluationContentInitialPrompts?: {
    introduction?: string;
    blocks?: ContentBlockData[];
    consignes?: string;
  };
}

// --- Interface pour une Forme Rapide d'Évaluation ---
interface QuickFormConfig {
    key: string;
    label: string;
    modalities: number[];
    suggestions: FormSuggestions;
}

// --- Définition centralisée des Formes Rapides d'Évaluation ---
const QUICK_FORMS_CONFIG: QuickFormConfig[] = [
    {
        key: "exercice_consignes",
        label: "Exercice & Consignes",
        modalities: [6, 3, 4],
        suggestions: {
            grilleCorrectionPlaceholder: "Critères d'évaluation pour la résolution de l'exercice et le suivi des consignes...",
            showStudentResources: true,
            evaluationContentInitialPrompts: {
                introduction: "<p></p>", // Introduction vide par défaut pour cette forme rapide
                blocks: [
                    { id: `block-${Date.now()}-exo1`, type: 'paragraph_with_media', order: 0,
                      text_content_html: "<p>Insérez ici les données (texte, graphique, image) à analyser pour la première partie de l'exercice.</p>",
                      questions_html: "<p>1. Analysez les données et répondez à la question...</p>"
                    }
                ],
                consignes: "<p></p>" // Consignes vides par défaut pour cette forme rapide
            }
        }
    },
    {
        key: "qcm",
        label: "QCM",
        modalities: [1],
        suggestions: {
            grilleCorrectionPlaceholder: "Barème pour le QCM : points par bonne réponse, pénalités...",
            showStudentResources: false,
            evaluationContentInitialPrompts: {
                introduction: "<p>Lisez attentivement les questions et choisissez la bonne réponse.</p>",
                blocks: [
                    { id: `block-${Date.now()}-qcm1`, type: 'question', order: 0,
                      text_content_html: "<p><strong>Question 1 :</strong> Quel est le rôle principal de la chlorophylle ?</p><ul><li>A) Absorber l'eau</li><li>B) Capturer l'énergie lumineuse</li><li>C) Produire de l'oxygène</li></ul>"
                    }
                ],
                consignes: "Une seule bonne réponse par question. Ne pas cocher plusieurs cases."
            }
        }
    },
    {
        key: "synthese_dissertation",
        label: "Sujet de Synthèse / Dissertation",
        modalities: [2, 5],
        suggestions: {
            grilleCorrectionPlaceholder: "Critères d'évaluation de la clarté du plan, de la pertinence des arguments, de la richesse des connaissances mobilisées, de la qualité de la rédaction...",
            showStudentResources: false,
            evaluationContentInitialPrompts: {
                introduction: "<p><strong>Sujet de dissertation :</strong></p><p>Sur la base de vos connaissances, et à l'aide d'un plan structuré, traitez le sujet suivant...</p>",
                blocks: [],
                consignes: "Votre rédaction devra être claire et précise. Respectez la structure d'une synthèse/dissertation (introduction, développement, conclusion)."
            }
        }
    },
    {
        key: "recherche_documentaire_etude_cas",
        label: "Recherche Documentaire / Étude de Cas",
        modalities: [15, 3, 5],
        suggestions: {
            grilleCorrectionPlaceholder: "Critères d'évaluation de la capacité à extraire des informations, à les analyser et à les synthétiser. Qualité de la présentation des résultats.",
            showStudentResources: true,
            evaluationContentInitialPrompts: {
                introduction: "<p>Vous trouverez ci-dessous ou en annexe des documents. Analysez-les pour répondre aux questions.</p>",
                blocks: [
                    { id: `block-${Date.now()}-doc1`, type: 'image', order: 0,
                      media_url: "",
                      media_alt_text: "Insérer l'URL de l'image/schéma du document 1",
                      media_position: 'center'
                    },
                    { id: `block-${Date.now()}-doc1_q`, type: 'question', order: 1,
                      text_content_html: "<p>1. Décrivez le phénomène présenté dans le document 1.</p>"
                    }
                ],
                consignes: "Organisez votre réponse de manière logique. Citez les documents pertinents pour étayer vos arguments."
            }
        }
    },
    {
        key: "compte_rendu_tp_manipulation",
        label: "Compte-Rendu / TP (Manipulation)",
        modalities: [11, 7, 12],
        suggestions: {
            grilleCorrectionPlaceholder: "Critères d'évaluation de la compréhension du protocole, de la rigueur de la manipulation, de la qualité des observations et de l'analyse des résultats.",
            showStudentResources: true,
            evaluationContentInitialPrompts: {
                introduction: "<p>Vous allez réaliser une manipulation en laboratoire. Votre compte-rendu devra reprendre les étapes clés et les résultats obtenus.</p>",
                blocks: [
                    { id: `block-${Date.now()}-protocole`, type: 'paragraph', order: 0,
                      text_content_html: "<p><strong>Protocole expérimental :</strong> Décrivez ici les étapes de la manipulation.</p>"
                    },
                    { id: `block-${Date.now()}-observation`, type: 'question', order: 1,
                      text_content_html: "<p>1. Notez vos observations (dessins, tableaux de mesures...).</p>"
                    }
                ],
                consignes: "Le compte-rendu doit inclure le titre, les objectifs, le matériel, le protocole, les résultats et l'analyse/conclusion."
            }
        }
    }
];

// Composant réutilisable pour les champs de saisie de média
interface MediaInputProps {
    label: string;
    url: string;
    altText: string;
    position: ContentBlockData['media_position'];
    onUrlChange: (url: string) => void;
    onAltTextChange: (alt: string) => void;
    onPositionChange: (pos: ContentBlockData['media_position']) => void;
}

const MediaInput: React.FC<MediaInputProps> = ({
    label,
    url,
    altText,
    position,
    onUrlChange,
    onAltTextChange,
    onPositionChange,
}) => (
    <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2 text-sm"
            placeholder="Collez l'URL de l'image/schéma ici..."
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
        />
        <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2 text-sm"
            placeholder="Légende / Texte alternatif du média"
            value={altText}
            onChange={(e) => onAltTextChange(e.target.value)}
        />
        <select
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            value={position || 'none'}
            onChange={(e) => onPositionChange(e.target.value as ContentBlockData['media_position'])}
        >
            <option value="none">Position du média : Par défaut</option>
            <option value="left">Aligner à gauche (texte autour)</option>
            <option value="right">Aligner à droite (texte autour)</option>
            <option value="center">Centrer (bloc)</option>
            <option value="full-width">Pleine largeur</option>
        </select>
    </div>
);


const EditEvaluationForm: React.FC<EditEvaluationFormProps> = ({ evaluationId, onSaveSuccess, onCancel }) => {
    const navigate = useNavigate();

    // 1. États du Composant
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [evaluationData, setEvaluationData] = useState<EvaluationData>({
        titre_evaluation: "",
        chapitre_id: null,
        competence_ids: [], // Not directly used but kept for historical context
        objectifs: [],
        modalite_evaluation_ids: [],
        modalite_evaluation_autre_texte: null,
        grille_correction: null,
        introduction_activite: "<p></p>", // Default empty TinyMCE content
        contenu_blocs: [],
        consignes_specifiques: null, // Default empty TinyMCE content
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
        sequence_id: null, // Not used for evaluations
        activite_id: null, // Not used for evaluations
    });

    // États pour l'affichage de la position hiérarchique
    const [niveauOption, setNiveauOption] = useState<{ niveau: string; option: string } | null>(null);
    const [uniteChapitre, setUniteChapitre] = useState<{ unite: string; chapitre: string } | null>(null);

    // État local pour gérer les suggestions et la personnalisation du formulaire
    const [formSuggestions, setFormSuggestions] = useState<FormSuggestions>({});
    // État pour la clé de la forme rapide sélectionnée dans la liste déroulante
    const [selectedQuickFormKey, setSelectedQuickFormKey] = useState<string>("");

    // Internal states for EvaluationContentEditor part
    const [contentBlocks, setContentBlocks] = useState<ContentBlockData[]>([]);
    const [consignes, setConsignes] = useState<string>('');
    const [showAddBlockMenu, setShowAddBlockMenu] = useState<boolean>(false);
    const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null); // Controls which block is expanded

    // References for TinyMCE instances
    const consignesEditorRef = useRef<any>(null);
    const blockEditorRefs = useRef<{ [key: string]: any }>({});
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);


    const setFormError = useCallback((message: string | null) => {
        setError(message);
        if (message) setSuccessMessage(null);
    }, []);

    // --- Debounce mechanism for content editor changes ---
    const triggerUpdateContentDebounce = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            const currentConsignes = consignes;
            const currentContentBlocks = contentBlocks;

            const cleanedConsignes = currentConsignes === '<p>&nbsp;</p>' ? '' : currentConsignes;

            const introBlock = currentContentBlocks.find(block => block.type === 'introduction');
            const cleanedIntroduction = introBlock?.text_content_html === '<p>&nbsp;</p>' ? '' : introBlock?.text_content_html || '';

            // Filter out the introduction block before passing to parent, and re-order.
            const mainContentBlocks = currentContentBlocks
                .filter(block => block.type !== 'introduction')
                .sort((a, b) => a.order - b.order)
                .map((block, index) => ({ ...block, order: index })); // Ensure sequential order

            // Update the main evaluationData state in EditEvaluationForm
            setEvaluationData(prevData => ({
                ...prevData,
                introduction_activite: cleanedIntroduction,
                contenu_blocs: mainContentBlocks,
                consignes_specifiques: cleanedConsignes,
            }));
            console.log("DEBUG: Main evaluationData updated from content editor via debounce.");
        }, 500); // Debounce delay
    }, [contentBlocks, consignes]); // Dependencies are the internal states

    // --- Content Editor specific handlers ---

    const handleConsignesChange = useCallback((content: string) => {
        setConsignes(content);
        triggerUpdateContentDebounce();
    }, [triggerUpdateContentDebounce]);

    const handleBlockChange = useCallback((id: string, updatedFields: Partial<ContentBlockData>) => {
        setContentBlocks(prevBlocks => {
            const newBlocks = prevBlocks.map(block => {
                if (block.id === id) {
                    const updatedBlock = { ...block, ...updatedFields };
                    // Normalize TinyMCE empty paragraphs
                    if (updatedBlock.text_content_html === '<p>&nbsp;</p>') {
                        updatedBlock.text_content_html = '';
                    }
                    if (updatedBlock.questions_html === '<p>&nbsp;</p>') {
                        updatedBlock.questions_html = '';
                    }
                    return updatedBlock;
                }
                return block;
            });
            return newBlocks;
        });
        triggerUpdateContentDebounce();
    }, [triggerUpdateContentDebounce]);

    const addBlock = useCallback((type: ContentBlockData['type']) => {
        const newBlock: ContentBlockData = {
            id: uuidv4(),
            type: type,
            order: contentBlocks.length,
            text_content_html: (type === 'paragraph' || type === 'question' || type === 'paragraph_with_media' || type === 'introduction') ? '' : undefined,
            media_url: (type === 'image' || type === 'table' || type === 'paragraph_with_media') ? '' : undefined,
            media_alt_text: (type === 'image' || type === 'table' || type === 'paragraph_with_media') ? '' : undefined,
            media_position: (type === 'image' || type === 'table' || type === 'paragraph_with_media') ? 'none' : undefined,
            questions_html: (type === 'paragraph_with_media') ? '' : undefined,
        };
        setContentBlocks(prevBlocks => {
            const updatedBlocks = [...prevBlocks, newBlock].map((block, idx) => ({ ...block, order: idx }));
            return updatedBlocks;
        });
        triggerUpdateContentDebounce();
        setShowAddBlockMenu(false);
        setExpandedBlockId(newBlock.id);
    }, [contentBlocks, triggerUpdateContentDebounce]);

    const removeBlock = useCallback((idToRemove: string) => {
        const indexToRemove = contentBlocks.findIndex(block => block.id === idToRemove);
        if (indexToRemove === -1 || contentBlocks[indexToRemove].type === 'introduction') {
            console.warn("Cannot delete this block (not found or it's the introduction block).");
            return;
        }

        setContentBlocks(prevBlocks => {
            const newBlocks = prevBlocks.filter(block => block.id !== idToRemove);
            const reorderedBlocks = newBlocks.map((block, idx) => ({ ...block, order: idx }));
            return reorderedBlocks;
        });
        triggerUpdateContentDebounce();
        setExpandedBlockId(null);
    }, [contentBlocks, triggerUpdateContentDebounce]);

    const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
        if (index === 0 && direction === 'up') {
            return;
        }
        if (index === 1 && direction === 'up' && contentBlocks[0].type === 'introduction') {
            return;
        }

        setContentBlocks(prevBlocks => {
            const newBlocks = [...prevBlocks];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;

            if (targetIndex >= 0 && targetIndex < newBlocks.length) {
                const [movedBlock] = newBlocks.splice(index, 1);
                newBlocks.splice(targetIndex, 0, movedBlock);
                const reorderedBlocks = newBlocks.map((block, idx) => ({ ...block, order: idx }));
                return reorderedBlocks;
            }
            return prevBlocks;
        });
        triggerUpdateContentDebounce();
    }, [contentBlocks, triggerUpdateContentDebounce]);

    const blockTypeLabels: { [key in ContentBlockData['type']]: string } = {
        introduction: "Introduction (Situation d'évaluation)",
        paragraph: "Paragraphe de Texte",
        image: "Image / Schéma",
        table: "Tableau (Image ou Texte)",
        question: "Question Simple",
        paragraph_with_media: "Paragraphe + Média + Questions",
    };

    const blockTypeIcons: { [key in ContentBlockData['type']]: string } = {
        introduction: "📖",
        paragraph: "📄",
        image: "🖼️",
        table: "📊",
        question: "❓",
        paragraph_with_media: "📝🖼️❓",
    };


    // 2. Chargement des données de l'évaluation
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
                    const chapterData = evaluationDataDB.chapitre as ChapterHierarchyDB;
                    const uniteData = chapterData?.unite;
                    const optionData = uniteData?.option;
                    const niveauData = optionData?.niveau;

                    const niveauId = niveauData?.id ?? null;
                    const optionId = optionData?.id ?? null;
                    const uniteId = uniteData?.id ?? null;
                    const extractedChapitreId = chapterData?.id ?? null;

                    const specificCompetenceId = (evaluationDataDB.evaluation_competences as CompetenceWithTypeDB[]).find(
                        (comp) => comp.competence?.type_competence === 'spécifique'
                    )?.competence.id || null;
                    const generalCompetenceIds = (evaluationDataDB.evaluation_competences as CompetenceWithTypeDB[])
                        .filter((comp) => comp.competence?.type_competence === 'générale')
                        .map((comp) => comp.competence.id);

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

                    const parsedProfessorUrls = evaluationDataDB.ressource_urls_json ? JSON.stringify(evaluationDataDB.ressource_urls_json) : null;
                    const parsedStudentUrls = evaluationDataDB.ressources_eleve_urls ? JSON.stringify(evaluationDataDB.ressources_eleve_urls) : null;

                    // Initialize contentBlocks and consignes internal states directly from fetched data
                    const normalizedInitialIntroduction = evaluationDataDB.introduction_activite === '<p>&nbsp;</p>' ? '' : evaluationDataDB.introduction_activite || '';
                    const normalizedInitialConsignes = evaluationDataDB.consignes_specifiques === '<p>&nbsp;</p>' ? '' : evaluationDataDB.consignes_specifiques || '';

                    const sortedContentBlocks = (evaluationDataDB.evaluation_content_blocks as EvaluationContentBlockDB[])
                        .sort((a, b) => a.block_order - b.block_order)
                        .map(block => ({
                            id: block.id ? String(block.id) : uuidv4(), // Ensure client-side ID is string
                            order: block.block_order,
                            type: block.block_type,
                            text_content_html: block.text_content_html,
                            questions_html: block.questions_html,
                            media_url: block.media_url,
                            media_alt_text: block.media_alt_text,
                            media_position: block.media_position,
                        }));
                    
                    // Ensure the introduction block exists as the first block in contentBlocks state
                    let initialBlocksArray: ContentBlockData[] = [];
                    const introBlockFound = sortedContentBlocks.find(block => block.type === 'introduction');

                    if (!introBlockFound) {
                      initialBlocksArray = [{
                          id: 'intro-block', // Fixed ID for intro block
                          type: 'introduction',
                          text_content_html: normalizedInitialIntroduction,
                          order: 0,
                      }, ...sortedContentBlocks.map((block, i) => ({ ...block, order: i + 1 }))]; // Re-order other blocks
                    } else {
                        initialBlocksArray = sortedContentBlocks.map(block =>
                            block.type === 'introduction'
                                ? { ...block, order: 0, id: 'intro-block', text_content_html: normalizedInitialIntroduction }
                                : block
                        ).sort((a, b) => a.order - b.order);
                    }
                    setContentBlocks(initialBlocksArray);
                    setConsignes(normalizedInitialConsignes);
                    setExpandedBlockId(initialBlocksArray[0]?.id || null); // Expand the first block by default

                    // Set the main evaluationData state
                    setEvaluationData({
                        id: evaluationId,
                        titre_evaluation: evaluationDataDB.titre_evaluation || "",
                        type_evaluation: evaluationDataDB.type_evaluation || null,
                        modalite_evaluation_ids: selectedModaliteIds,
                        modalite_evaluation_autre_texte: evaluationDataDB.modalite_evaluation_autre_texte || null,
                        grille_correction: evaluationDataDB.grille_correction || null,
                        introduction_activite: normalizedInitialIntroduction, // Set from normalized value
                        contenu_blocs: sortedContentBlocks, // Set from sorted value (will be filtered before saving)
                        consignes_specifiques: normalizedInitialConsignes, // Set from normalized value
                        ressource_urls: parsedProfessorUrls,
                        ressources_eleve_urls: parsedStudentUrls,
                        niveau_id: niveauId,
                        option_id: optionId,
                        unite_id: uniteId,
                        chapitre_id: extractedChapitreId,
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
                    
                    // Determine selected quick form
                    const sortedInitialModaliteIds = [...selectedModaliteIds].sort((a, b) => a - b);
                    const matchingForm = QUICK_FORMS_CONFIG.find(form => {
                        const sortedFormModalities = [...form.modalities].sort((a, b) => a - b);
                        return JSON.stringify(sortedInitialModaliteIds) === JSON.stringify(sortedFormModalities);
                    });
                    if (matchingForm) {
                        setSelectedQuickFormKey(matchingForm.key);
                        setFormSuggestions(matchingForm.suggestions);
                    } else {
                        setSelectedQuickFormKey("");
                        setFormSuggestions({});
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
    const handleUpdateEvaluationData = useCallback((updatedFields: Partial<EvaluationData>) => {
        setEvaluationData(prevData => ({ ...prevData, ...updatedFields }));
    }, []);

    // 4. Fonction de Sauvegarde des données
    const handleSave = async () => {
        setError(null);
        setSuccessMessage(null);
        const toastId = toast.loading("Sauvegarde en cours...");
        setSaving(true); // Set saving state at the beginning of save

        // Client-side validation
        if (!evaluationData.titre_evaluation || evaluationData.titre_evaluation.trim() === "") {
            setFormError("Le titre de l'évaluation est obligatoire.");
            toast.error("Le titre de l'évaluation est obligatoire.", { id: toastId });
            setSaving(false); return;
        }
        if (!evaluationData.chapitre_id) {
            setFormError("Veuillez sélectionner un chapitre.");
            toast.error("Veuillez sélectionner un chapitre.", { id: toastId });
            setSaving(false); return;
        }

        const hasSpecificCompetence = evaluationData.selected_competence_id !== null;
        const hasGeneralCompetences = (evaluationData.selected_general_competence_ids && evaluationData.selected_general_competence_ids.length > 0);
        if (!hasSpecificCompetence && !hasGeneralCompetences) {
            setFormError("Veuillez sélectionner au moins une compétence (spécifique ou générale).");
            toast.error("Veuillez sélectionner au moins une compétence (spécifique ou générale).", { id: toastId });
            setSaving(false); return;
        }

        const hasSelectedConnaissances = (evaluationData.selected_connaissance_ids && evaluationData.selected_connaissance_ids.length > 0);
        const hasNewConnaissanceText = (evaluationData.new_connaissance_text && evaluationData.new_connaissance_text.trim() !== '');
        if (evaluationData.chapitre_id && !hasSelectedConnaissances && !hasNewConnaissanceText) {
            setFormError("Veuillez sélectionner au moins une connaissance ou ajouter une nouvelle notion si un chapitre est sélectionné.");
            toast.error("Veuillez sélectionner au moins une connaissance ou ajouter une nouvelle notion si un chapitre est sélectionné.", { id: toastId });
            setSaving(false); return;
        }

        const hasSelectedModalites = (evaluationData.modalite_evaluation_ids && evaluationData.modalite_evaluation_ids.length > 0);
        const hasAutreModaliteText = (evaluationData.modalite_evaluation_autre_texte && evaluationData.modalite_evaluation_autre_texte.trim() !== '');
        if (!hasSelectedModalites && !hasAutreModaliteText) {
            setFormError("Veuillez sélectionner au moins une modalité d'évaluation ou spécifier une nouvelle modalité.");
            toast.error("Veuillez sélectionner au moins une modalité d'évaluation ou spécifier une nouvelle modalité.", { id: toastId });
            setSaving(false); return;
        }

        // Validate introduction and content blocks from internal states
        const introBlock = contentBlocks.find(block => block.type === 'introduction');
        if (!introBlock || !introBlock.text_content_html || introBlock.text_content_html.trim() === "" || introBlock.text_content_html === "<p><br></p>") {
            setFormError("La section 'Situation d'évaluation / Introduction' est obligatoire.");
            toast.error("La section 'Situation d'évaluation / Introduction' est obligatoire.", { id: toastId });
            setSaving(false); return;
        }
        const mainContentBlocks = contentBlocks.filter(block => block.type !== 'introduction');
        if (!mainContentBlocks || mainContentBlocks.length === 0) {
            setFormError("Veuillez ajouter au moins un bloc de contenu (paragraphe, image, etc.) pour le corps de l'activité.");
            toast.error("Veuillez ajouter au moins un bloc de contenu (paragraphe, image, etc.) pour le corps de l'activité.", { id: toastId });
            setSaving(false); return;
        }

        try {
            // Destructure evaluationData, taking into account which fields are for the main table
            // and which are for join tables or temporary.
            const {
                id, niveau_id, option_id, unite_id, // Hierarchy is handled by chapter_id
                objectifs, // Handled as M2M
                competence_ids, // Handled by selected_competence_id & selected_general_competence_ids
                selected_competence_id, selected_general_competence_ids, // Handled as M2M
                selected_connaissance_ids, new_connaissance_text, // Handled as M2M & new insertion
                selected_capacite_habilete_ids, // Handled as M2M
                ressource_urls, ressources_eleve_urls, // Handled as JSONB conversion
                contenu_blocs, // Handled separately for evaluation_content_blocks
                modalite_evaluation_ids, // Handled as M2M
                ...fieldsToUpdate // Remaining fields for the main 'evaluations' table
            } = evaluationData;

            // Ensure introduction_activite and consignes_specifiques are taken from internal states
            const finalFieldsToUpdate: any = {
                ...fieldsToUpdate,
                introduction_activite: introBlock.text_content_html, // Use current content from internal state
                consignes_specifiques: consignes === '<p>&nbsp;</p>' ? null : consignes, // Use current content from internal state
                ressource_urls_json: ressource_urls ? JSON.parse(ressource_urls) : null,
                ressources_eleve_urls: ressources_eleve_urls ? JSON.parse(ressources_eleve_urls) : null,
                date_mise_a_jour: new Date().toISOString()
            };

            // Update main evaluation table
            const { error: updateEvaluationError } = await supabase
                .from("evaluations")
                .update(finalFieldsToUpdate)
                .eq("id", evaluationId);

            if (updateEvaluationError) {
                throw updateEvaluationError;
            }

            // Handle new knowledge insertion
            let finalConnaissanceIds = [...(selected_connaissance_ids || [])];
            if (new_connaissance_text && new_connaissance_text.trim() !== '') {
                const { data: newConnaissanceData, error: newConnaissanceError } = await supabase
                    .from('connaissances')
                    .insert({
                        titre_connaissance: new_connaissance_text.trim(),
                        chapitre_id: evaluationData.chapitre_id,
                        description_connaissance: '', // Default empty
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

            // Synchronize many-to-many tables
            // Objectives
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

            // Competences
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

            // Knowledges (Connaissances)
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

            // Modalities
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

            // Capacités/Habilités
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

            // Content Blocks (evaluation_content_blocks)
            await supabase.from("evaluation_content_blocks").delete().eq("evaluation_id", evaluationId);
            if (mainContentBlocks && mainContentBlocks.length > 0) { // Only save non-introduction blocks
                const contentBlocksToInsert = mainContentBlocks.map(block => ({
                    evaluation_id: evaluationId,
                    block_order: block.order,
                    block_type: block.type,
                    text_content_html: block.text_content_html === '' ? null : block.text_content_html, // Ensure empty strings are null in DB
                    questions_html: block.questions_html === '' ? null : block.questions_html,
                    media_url: block.media_url === '' ? null : block.media_url,
                    media_alt_text: block.media_alt_text === '' ? null : block.media_alt_text,
                    media_position: block.media_position === 'none' ? null : block.media_position,
                }));
                const { error: contentBlocksError } = await supabase.from("evaluation_content_blocks").insert(contentBlocksToInsert);
                if (contentBlocksError) throw contentBlocksError;
            }

            toast.success("Évaluation mise à jour avec succès !", { id: toastId });
            setSuccessMessage("Évaluation mise à jour avec succès.");
            onSaveSuccess(evaluationId); // Notify parent with the updated ID

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
                    onClick={onCancel} // Use onCancel prop to close modal
                    className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Fermer
                </button>
            </div>
        );
    }

    // Fonction utilitaire pour parser les URLs stockées en JSON
    const parseUrls = (urlsString: string | null | undefined): string[] => {
      if (!urlsString) return [];
      try {
        const parsed = JSON.parse(urlsString);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Erreur lors du parsing des URLs :", e);
        return [];
      }
    };


    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-semibold text-gray-800 mb-8 text-center">
                Modifier une Évaluation Maître
            </h1>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md border border-red-200" role="alert">
                    <p className="font-medium">Erreur :</p>
                    <p>{error}</p>
                </div>
            )}
            {successMessage && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md border border-green-200" role="alert">
                    <p className="font-medium">Succès :</p>
                    <p>{successMessage}</p>
                </div>
            )}

            {/* Section : Position de l'évaluation */}
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

            {/* Bloc : Contexte Pédagogique Général */}
            <div className="max-w-3xl mx-auto p-6 bg-blue-50 rounded-lg shadow-xl mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Contexte Pédagogique Général</h3>
                <HierarchicalSelector
                    onChange={handleUpdateEvaluationData} // Directement mis à jour dans evaluationData
                    initialNiveauId={evaluationData.niveau_id}
                    initialOptionId={evaluationData.option_id}
                    initialUniteId={evaluationData.unite_id}
                    initialChapitreId={evaluationData.chapitre_id}
                    initialObjectifIds={evaluationData.objectifs}
                    showChapitre={true}
                    showCompetences={false}
                    showObjectifs={true}
                />
            </div>

            {/* Bloc : Compétences, Capacités et Connaissances Évaluées */}
            <div className="max-w-3xl mx-auto p-6 bg-green-50 rounded-lg shadow-xl mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Compétences, Capacités et Connaissances Évaluées</h3>
                <CompetenceSelector
                    onSelectionChange={handleUpdateEvaluationData} // Directement mis à jour dans evaluationData
                    initialSpecificCompetenceId={evaluationData.selected_competence_id}
                    initialGeneralCompetenceIds={evaluationData.selected_general_competence_ids}
                    initialConnaissanceIds={evaluationData.selected_connaissance_ids}
                    initialNewConnaissanceText={evaluationData.new_connaissance_text || ''}
                    initialCapaciteHabileteIds={evaluationData.selected_capacite_habilete_ids}
                    chapitreId={evaluationData.chapitre_id}
                    uniteId={evaluationData.unite_id}
                />
            </div>

            {/* Bloc : Détails de l'Évaluation */}
            <div className="max-w-3xl mx-auto p-6 bg-blue-100 rounded-lg shadow-xl mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Détails de l'Évaluation</h3>
                <div className="mb-5">
                    <label htmlFor="titre_evaluation" className="block font-semibold mb-1 text-gray-700">
                        Titre de l’évaluation <span className="text-red-600">*</span>
                    </label>
                    <input
                        id="titre_evaluation"
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={evaluationData.titre_evaluation || ""}
                        onChange={(e) => handleUpdateEvaluationData({ titre_evaluation: e.target.value })}
                        placeholder="Ex: Évaluation sommative - Le cycle de l'eau"
                        required
                    />
                </div>

                <div className="mb-5">
                    <label htmlFor="type_evaluation" className="block font-semibold mb-1 text-gray-700">
                        Type d'évaluation
                    </label>
                    <select
                        id="type_evaluation"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={evaluationData.type_evaluation || ""}
                        onChange={(e) => handleUpdateEvaluationData({ type_evaluation: e.target.value || null })}
                    >
                        <option value="">Sélectionner un type</option>
                        <option value="diagnostique">Diagnostique</option>
                        <option value="formative">Formative</option>
                        <option value="sommative">Sommative</option>
                        <option value="certificative">Certificative</option>
                    </select>
                </div>

                {/* Section : Formes d'Évaluation Rapides - MODIFIÉ EN LISTE DÉROULANTE */}
                <div className="mb-5 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <label htmlFor="quick-form-selector" className="block font-semibold text-gray-800 mb-3">
                        Choisir une forme d'évaluation rapide
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                        Sélectionnez une option pour pré-remplir les natures d'activité les plus courantes et pré-personnaliser le formulaire.
                    </p>
                    <select
                        id="quick-form-selector"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={selectedQuickFormKey}
                        onChange={handleQuickFormSelectionFromDropdown}
                    >
                        <option value="">Sélectionner une forme rapide</option>
                        {QUICK_FORMS_CONFIG.map((formConfig) => (
                            <option key={formConfig.key} value={formConfig.key}>
                                {formConfig.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Intégration du ModaliteSelector */}
                <div className="mb-5">
                    <h4 className="block font-semibold mb-1 text-gray-700">
                        Nature(s) de l'activité d'évaluation <span className="text-red-600">*</span>
                    </h4>
                    <ModaliteSelector
                        onSelectionChange={handleUpdateEvaluationData} // Directement mis à jour dans evaluationData
                        initialSelectedModaliteIds={evaluationData.modalite_evaluation_ids}
                        initialAutreModaliteText={evaluationData.modalite_evaluation_autre_texte}
                    />
                </div>

                <div className="mb-5">
                    <label htmlFor="grille_correction" className="block font-semibold mb-1 text-gray-700">
                        Grille de correction / Critères
                    </label>
                    <textarea
                        id="grille_correction"
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={evaluationData.grille_correction || ""}
                        onChange={(e) => handleUpdateEvaluationData({ grille_correction: e.target.value })}
                        placeholder={formSuggestions.grilleCorrectionPlaceholder || "Détaillez les critères d'évaluation ou la grille de correction."}
                    />
                </div>
            </div>

            {/* Bloc : Contenu de l'activité (Situation, Blocs de contenu, Consignes globales) - Integrated from EvaluationContentEditor */}
            <div className="max-w-3xl mx-auto p-6 bg-yellow-50 rounded-lg shadow-xl mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Contenu de l'Activité d'Évaluation
                </h3>

                {/* Section: Blocs de Contenu Dynamiques (Corps de l'activité, incluant l'introduction) */}
                <section className="mb-8 p-6 bg-white rounded-lg shadow-xl border border-gray-200">
                    <h4 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                        Éléments de l'activité
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                        Construisez l'activité en ajoutant et organisant différents types de blocs de contenu. Le **premier bloc est l'introduction** et ne peut pas être déplacé ou supprimé.
                    </p>

                    <div className="space-y-4">
                        {contentBlocks.sort((a, b) => a.order - b.order).map((block, index) => (
                            <div key={block.id} className="border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
                                {/* En-tête de la carte du bloc */}
                                <div className="flex items-center justify-between p-4 bg-gray-100 border-b border-gray-200">
                                    <h5 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                        {blockTypeIcons[block.type]}
                                        {block.type === 'introduction' ? 'Introduction (obligatoire)' : `Bloc ${index + 1} : ${blockTypeLabels[block.type]}`}
                                        {block.type === 'introduction' && <span className="text-red-600 text-sm">(Obligatoire)</span>}
                                    </h5>

                                    {/* Boutons d'action sur la carte */}
                                    <div className="flex space-x-1">
                                        {/* Désactiver les boutons de déplacement pour l'introduction */}
                                        {block.type !== 'introduction' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => moveBlock(index, 'up')}
                                                    className="p-1 text-gray-500 hover:text-blue-600 transition duration-150 ease-in-out"
                                                    title="Déplacer vers le haut"
                                                    disabled={index === 0 || (index === 1 && contentBlocks[0].type === 'introduction')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveBlock(index, 'down')}
                                                    className="p-1 text-gray-500 hover:text-blue-600 transition duration-150 ease-in-out"
                                                    title="Déplacer vers le bas"
                                                    disabled={index === contentBlocks.length - 1}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}

                                        {/* Désactiver le bouton de suppression pour l'introduction */}
                                        {block.type !== 'introduction' && (
                                            <button
                                                type="button"
                                                onClick={() => removeBlock(block.id)}
                                                className="p-1 text-red-500 hover:bg-red-100 rounded-full transition duration-150 ease-in-out"
                                                title="Supprimer ce bloc"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H8z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setExpandedBlockId(expandedBlockId === block.id ? null : block.id)}
                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded-full transition duration-150 ease-in-out"
                                            title={expandedBlockId === block.id ? "Réduire ce bloc" : "Modifier ce bloc"}
                                        >
                                            {expandedBlockId === block.id ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Contenu détaillé du bloc (affiché si déplié) */}
                                {expandedBlockId === block.id && (
                                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                                        {/* Tous les blocs ayant un contenu textuel (incluant 'introduction') */}
                                        {(block.type === 'introduction' || block.type === 'paragraph' || block.type === 'question' || block.type === 'paragraph_with_media') && (
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {block.type === 'introduction' ? 'Texte de l\'introduction' :
                                                    block.type === 'question' ? 'Texte de la question' : 'Texte du paragraphe / Données'}
                                                </label>
                                                <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-400">
                                                    <Editor
                                                        apiKey="b959nzjl6vuv8x0qapxkk7ky2259t66o43vg7lvuyjmia2a9"
                                                        onInit={(evt, editor) => blockEditorRefs.current[block.id] = editor}
                                                        value={block.text_content_html || ''}
                                                        onEditorChange={(content) => handleBlockChange(block.id, { text_content_html: content })}
                                                        init={{
                                                            height: block.type === 'introduction' ? 200 : 150,
                                                            menubar: false,
                                                            plugins: [
                                                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                                                                'anchor', 'searchreplace', 'visualblocks', 'code',
                                                                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                                            ],
                                                            toolbar: 'undo redo | blocks | ' +
                                                                'bold italic forecolor | alignleft aligncenter ' +
                                                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                                                'link image table | removeformat | help',
                                                            image_advtab: true,
                                                            image_title: true,
                                                            automatic_uploads: false,
                                                            file_picker_types: 'image',
                                                            content_style: 'body { font-family: Inter, Arial, sans-serif; font-size: 14px; } ' +
                                                                'table { border-collapse: collapse; width: 100%; } ' +
                                                                'table, th, td { border: 1px solid #ddd; } ' +
                                                                'th, td { padding: 8px; text-align: left; } ' +
                                                                'img { max-width: 100%; height: auto; display: block; margin-left: auto; margin-right: auto; }'
                                                        }}
                                                    />
                                                </div>
                                                {block.type === 'introduction' && <p className="text-sm text-gray-600 mt-1">Décrivez le contexte de l'évaluation ou introduisez le sujet général. Ce texte apparaît au début de l'activité.</p>}
                                                {block.type === 'question' && <p className="text-sm text-gray-600 mt-1">Saisissez ici la question posée à l'élève.</p>}
                                                {block.type === 'paragraph_with_media' && <p className="text-sm text-gray-600 mt-1">Décrivez les données ou le contexte associé au média ci-dessous.</p>}
                                                {block.type === 'paragraph' && <p className="text-sm text-gray-600 mt-1">Ajoutez ici des informations, des faits, ou des explications nécessaires à l'activité.</p>}
                                            </div>
                                        )}

                                        {/* Blocs avec média (image, tableau, paragraphe_avec_média) */}
                                        {(block.type === 'image' || block.type === 'table' || block.type === 'paragraph_with_media') && (
                                            <MediaInput
                                                label={block.type === 'image' ? 'Image/Schéma (URL)' : block.type === 'table' ? 'Tableau (Image URL)' : 'Média Associé (URL)'}
                                                url={block.media_url || ''}
                                                altText={block.media_alt_text || ''}
                                                position={block.media_position || 'none'}
                                                onUrlChange={(url) => handleBlockChange(block.id, { media_url: url })}
                                                onAltTextChange={(alt) => handleBlockChange(block.id, { media_alt_text: alt })}
                                                onPositionChange={(pos) => handleBlockChange(block.id, { media_position: pos })}
                                            />
                                        )}

                                        {/* Questions intégrées (pour paragraphe_avec_média) */}
                                        {block.type === 'paragraph_with_media' && (
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Questions liées au média ci-dessus
                                                </label>
                                                <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-400">
                                                    <Editor
                                                        apiKey="b959nzjl6vuv8x0qapxkk7ky2259t66o43vg7lvuyjmia2a9"
                                                        onInit={(evt, editor) => blockEditorRefs.current[`${block.id}-questions`] = editor}
                                                        value={block.questions_html || ''}
                                                        onEditorChange={(content) => handleBlockChange(block.id, { questions_html: content })}
                                                        init={{
                                                            height: 150,
                                                            menubar: false,
                                                            plugins: [
                                                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                                                                'anchor', 'searchreplace', 'visualblocks', 'code',
                                                                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                                            ],
                                                            toolbar: 'undo redo | blocks | ' +
                                                                'bold italic forecolor | alignleft aligncenter ' +
                                                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                                                'link image table | removeformat | help',
                                                            image_advtab: true,
                                                            image_title: true,
                                                            automatic_uploads: false,
                                                            file_picker_types: 'image',
                                                            content_style: 'body { font-family: Inter, Arial, sans-serif; font-size: 14px; } ' +
                                                                'table { border-collapse: collapse; width: 100%; } ' +
                                                                'table, th, td { border: 1px solid #ddd; } ' +
                                                                'th, td { padding: 8px; text-align: left; } ' +
                                                                'img { max-width: 100%; height: auto; display: block; margin-left: auto; margin-right: auto; }'
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">Saisissez les questions qui se réfèrent spécifiquement au média ou au paragraphe ci-dessus.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Bouton pour ajouter un nouveau bloc */}
                    <div className="mt-6 text-center">
                        <button
                            type="button"
                            onClick={() => setShowAddBlockMenu(!showAddBlockMenu)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Ajouter un élément à l'activité
                        </button>

                        {showAddBlockMenu && (
                            <div className="mt-4 p-4 bg-gray-100 rounded-md shadow-inner grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(blockTypeLabels).filter(([type]) => type !== 'introduction').map(([type, label]) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => addBlock(type as ContentBlockData['type'])}
                                        className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
                                    >
                                        {blockTypeIcons[type as ContentBlockData['type']]} <span className="ml-2">{label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Section: Consignes Spécifiques Globales */}
                <section className="p-6 bg-white rounded-lg shadow-xl border border-gray-200">
                    <h4 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                        Consignes Générales de l'Évaluation
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                        Ajoutez ici les consignes globales pour l'élève (temps imparti, matériel autorisé, attentes générales, etc.).
                    </p>
                    <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-400">
                        <Editor
                            apiKey="b959nzjl6vuv8x0qapxkk7ky2259t66o43vg7lvuyjmia2a9"
                            onInit={(evt, editor) => consignesEditorRef.current = editor}
                            value={consignes || ''}
                            onEditorChange={(content) => handleConsignesChange(content)}
                            init={{
                                height: 250,
                                menubar: false,
                                plugins: [
                                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                                    'anchor', 'searchreplace', 'visualblocks', 'code',
                                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                ],
                                toolbar: 'undo redo | blocks | ' +
                                    'bold italic forecolor | alignleft aligncenter ' +
                                    'alignright alignjustify | bullist numlist outdent indent | ' +
                                    'link image table | removeformat | help',
                                image_advtab: true,
                                image_title: true,
                                automatic_uploads: false,
                                file_picker_types: 'image',
                                content_style: 'body { font-family: Inter, Arial, sans-serif; font-size: 14px; } ' +
                                    'table { border-collapse: collapse; width: 100%; } ' +
                                    'table, th, td { border: 1px solid #ddd; } ' +
                                    'th, td { padding: 8px; text-align: left; } ' +
                                    'img { max-width: 100%; height: auto; display: block; margin-left: auto; margin-right: auto; }'
                            }}
                        />
                    </div>
                </section>
            </div>


            {/* Bloc : Ressources Mises à Disposition de l'Élève */}
            {(formSuggestions.showStudentResources !== false) && (
                <div className="max-w-3xl mx-auto p-6 bg-blue-50 rounded-lg shadow-xl mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Ressources Mises à Disposition de l'Élève</h3>
                    <StudentResourceUploader
                        onUploadComplete={(urls) => handleUpdateEvaluationData({ ressources_eleve_urls: urls ? JSON.stringify(urls) : null })}
                        disabled={saving}
                        initialUrls={parseUrls(evaluationData.ressources_eleve_urls)}
                    />
                </div>
            )}

            {/* Bloc : Ressources Associées (Pour le Professeur - Optionnel) */}
            {(formSuggestions.showProfessorResources !== false) && (
                <div className="mb-6 border-t pt-6 border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Ressources Associées (Pour le Professeur - Optionnel)</h3>
                    <MultiFileUpload
                        onUploadComplete={(urls) => handleUpdateEvaluationData({ ressource_urls: urls ? JSON.stringify(urls) : null })}
                        disabled={saving}
                        initialUrls={parseUrls(evaluationData.ressource_urls)}
                    />
                </div>
            )}

            {/* Section : Boutons d'Action et Messages de Statut */}
            <div className="flex justify-between mt-8">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                >
                    Annuler
                </button>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-8 py-3 rounded-md text-white font-semibold shadow-md ${
                        saving
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    } transition duration-150 ease-in-out`}
                >
                    {saving ? "Enregistrement en cours..." : "Enregistrer l'évaluation"}
                </button>
            </div>
        </div>
    );
};

export default EditEvaluationForm;
