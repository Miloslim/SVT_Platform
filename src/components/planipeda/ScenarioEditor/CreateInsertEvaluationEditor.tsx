// Nom du fichier: CreateInsertEvaluationEditor.tsx
// Chemin: src/components/planipeda/ScenarioEditor/CreateInsertEvaluationEditor.tsx
// Fonctionnalités :
//   - Composant principal de saisie et modification des données d'une évaluation.
//   - Harmonisé avec les libellés, variables et la structure de "CreateInsertActivityEditor.tsx".
//   - UTILISE LE COMPOSANT HierarchicalSelector pour la sélection hiérarchique.
//   - Les sélecteurs Niveau, Option, Unité, Chapitre sont DÉSACTIVÉS si pré-remplis par les props parentales.
//   - La section des objectifs déjà liés est déplacée en bas et est non-interactive.
//   - La sélection des objectifs via cases à cocher dans HierarchicalSelector reste interactive.
//   - Utilise le sous-composant LongTextField pour les champs textuels étendus.
//   - Utilise MultiFileUpload et StudentResourceUploader pour la gestion des ressources (adapté pour JSON stringifié si nécessaire).
//   - La gestion des données est entièrement déléguée au parent via initialData et onUpdate, en utilisant le typage EvaluationDatacrt.
//   - Le mécanisme de soumission du formulaire est aligné sur celui de CreateInsertActivityEditor.tsx:
//     Le composant utilise un `div` au lieu d'un `<form>` et le bouton appelle directement une fonction de validation locale
//     qui, en cas de succès, appelle `onSaveTrigger` du parent.

import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
// Importation des sous-composants nécessaires
import HierarchicalSelector from "./HierarchicalSelector";
import MultiFileUpload from "./MultiFileUpload";
import CompetenceSelector from "./CompetenceSelector";
import ModaliteSelector from "./ModaliteSelector";
import EvaluationContentEditor, { ContentBlockData } from "./EvaluationContent/EvaluationContentEditor";
import StudentResourceUploader from "./EvaluationContent/StudentResourceUploader";

// Importation de l'interface de données de l'évaluation spécifique (EvaluationDatacrt)
import { EvaluationDatacrt as EvaluationData } from "@/types/evaluation";

// Importations spécifiques à Supabase et aux notifications
import { supabase } from "@/backend/config/supabase";
import toast from "react-hot-toast";

// --- Interface locale pour les objectifs liés affichés ---
interface ObjectifDisplay { id: number; description_objectif: string; }

// --- Définir l'interface pour les suggestions de formulaire ---
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
                introduction: "<p></p>",
                blocks: [
                    { id: `block-${Date.now()}-exo1`, type: 'paragraph_with_media', order: 0,
                      text_content_html: "<p>Insérez ici les données (texte, graphique, image) à analyser pour la première partie de l'exercice.</p>",
                      questions_html: "<p>1. Analysez les données et répondez à la question...</p>"
                    }
                ],
                consignes: "<p></p>"
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

// ---
// Sous-composant : LongTextField (pour les champs textarea)
// ---
interface LongTextFieldProps {
  label: string;
  id: string;
  value: string | null; // Value can be string or null as per EvaluationData in src/types/evaluation.ts
  onChange: (val: string) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}

const LongTextField: React.FC<LongTextFieldProps> = ({
  label,
  id,
  value,
  onChange,
  rows = 4,
  placeholder = "",
  required = false,
}) => (
  <div className="mb-5">
    <label htmlFor={id} className="block font-semibold mb-1 text-gray-700">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    <textarea
      id={id}
      rows={rows}
      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={value || ""} // Convert null to empty string for textarea value
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || `Entrez ${label.toLowerCase()}...`}
      required={required}
    />
  </div>
);


// ---
// Propriétés (Props) du composant CreateInsertEvaluationEditor
// ---
interface CreateInsertEvaluationEditorProps {
  initialData: Partial<EvaluationData>; // Use Partial<EvaluationData> for form state
  onUpdate: (updatedFields: Partial<EvaluationData>) => void;
  onSaveTrigger: () => void;
  onCancel?: () => void;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  onSuccessRedirectPath?: string;
  setFormError: (message: string | null) => void;

  // PROPS pour les IDs parent (utilisés pour pré-remplir et désactiver les sélecteurs hiérarchiques)
  niveauIdParent?: number | null;
  optionIdParent?: number | null;
  uniteIdParent?: number | null;
  chapitreIdParent?: number | null;
}

// ============================================================
// Composant principal : CreateInsertEvaluationEditor
// ============================================================
const CreateInsertEvaluationEditor: React.FC<CreateInsertEvaluationEditorProps> = ({
  initialData,
  onUpdate,
  onSaveTrigger,
  onCancel,
  saving,
  error,
  successMessage,
  onSuccessRedirectPath,
  setFormError,
  niveauIdParent,
  optionIdParent,
  uniteIdParent,
  chapitreIdParent
}) => {
  const navigate = useNavigate();

  // L'état local est maintenu UNIQUEMENT pour les descriptions des objectifs déjà liés
  const [initialObjectiveDescriptions, setInitialObjectiveDescriptions] = useState<ObjectifDisplay[]>([]);
  // État local pour gérer les suggestions et la personnalisation du formulaire des formes rapides
  const [formSuggestions, setFormSuggestions] = useState<FormSuggestions>({});
  // État pour la clé de la forme rapide sélectionnée dans la liste déroulante
  const [selectedQuickFormKey, setSelectedQuickFormKey] = useState<string>("");


  // Déterminez si les sélecteurs hiérarchiques doivent être désactivés par le parent
  const disableNiveauSelectByParent = niveauIdParent !== null && niveauIdParent !== undefined;
  const disableOptionSelectByParent = optionIdParent !== null && optionIdParent !== undefined;
  const disableUniteSelectByParent = uniteIdParent !== null && uniteIdParent !== undefined;
  const disableChapitreSelectByParent = chapitreIdParent !== null && chapitreIdParent !== undefined;


  // Effet pour la redirection après succès de la sauvegarde
  useEffect(() => {
    if (successMessage && onSuccessRedirectPath && !saving) {
      const timer = setTimeout(() => {
        navigate(onSuccessRedirectPath);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [successMessage, onSuccessRedirectPath, saving, navigate]);

  // Effet pour charger les descriptions des objectifs initiaux (pour la section du bas)
  useEffect(() => {
    const fetchInitialObjectiveDescriptions = async () => {
      // initialData.objectifs is `number[] | undefined` in EvaluationDatacrt
      if (initialData.objectifs && initialData.objectifs.length > 0) {
        try {
          const { data: objectivesData, error: objectivesError } = await supabase
            .from('objectifs')
            .select('id, description_objectif')
            .in('id', initialData.objectifs);

          if (objectivesError) {
            throw objectivesError;
          }
          setInitialObjectiveDescriptions(objectivesData || []);
        } catch (error: any) {
          console.error("Erreur lors du chargement des descriptions des objectifs initiaux:", error);
          setInitialObjectiveDescriptions([]);
        }
      } else {
        setInitialObjectiveDescriptions([]);
      }
    };
    fetchInitialObjectiveDescriptions();
  }, [initialData.objectifs]);


  // Effet pour déterminer la forme rapide sélectionnée lorsque initialData.modalite_evaluation_ids change
  useEffect(() => {
    // initialData.modalite_evaluation_ids is `number[] | undefined` in EvaluationDatacrt
    if (initialData.modalite_evaluation_ids && initialData.modalite_evaluation_ids.length > 0) {
      const sortedInitialIds = [...initialData.modalite_evaluation_ids].sort((a, b) => a - b);
      const matchingForm = QUICK_FORMS_CONFIG.find(form => {
        const sortedFormModalities = [...form.modalities].sort((a, b) => a - b);
        return JSON.stringify(sortedInitialIds) === JSON.stringify(sortedFormModalities);
      });
      if (matchingForm) {
        setSelectedQuickFormKey(matchingForm.key);
        setFormSuggestions(matchingForm.suggestions);
      } else {
        setSelectedQuickFormKey(""); // Aucune forme rapide ne correspond
        setFormSuggestions({});
      }
    } else {
      setSelectedQuickFormKey("");
      setFormSuggestions({});
    }
  }, [initialData.modalite_evaluation_ids]);


  // --- Section : Gestionnaires de Changement (Callbacks) ---

  // Gestionnaire de changement pour le sélecteur hiérarchique
  const handleHierarchicalSelectionChange = useCallback((selection: {
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
    chapitreId?: number | null;
    objectifIds?: number[];
  }) => {
    onUpdate({
      niveau_id: selection.niveauId,
      option_id: selection.optionId,
      unite_id: selection.uniteId,
      chapitre_id: selection.chapitreId,
      objectifs: selection.objectifIds || [], // Ensure it's an array if empty
      // Réinitialisation des connaissances et capacités lors du changement de chapitre/unité
      selected_connaissance_ids: [], // Should be an array based on EvaluationDatacrt
      new_connaissance_text: null, // Can be null
      selected_capacite_habilete_ids: [], // Should be an array
    });
  }, [onUpdate]);

  // Gestionnaire de changement pour le sélecteur de compétences
  const handleCompetenceSelectionChange = useCallback((selection: {
    selectedSpecificCompetenceId: number | null;
    selectedGeneralCompetenceIds: number[];
    selectedConnaissanceIds: number[];
    newConnaissanceText: string;
    selectedCapaciteHabileteIds: number[];
  }) => {
    onUpdate({
      selected_competence_id: selection.selectedSpecificCompetenceId,
      selected_general_competence_ids: selection.selectedGeneralCompetenceIds, // Keep as array
      selected_connaissance_ids: selection.selectedConnaissanceIds, // Keep as array
      new_connaissance_text: selection.newConnaissanceText || null, // Can be null
      selected_capacite_habilete_ids: selection.selectedCapaciteHabileteIds, // Keep as array
    });
  }, [onUpdate]);

  // Gestionnaire de changement pour le sélecteur de modalités
  const handleModaliteSelectionChange = useCallback((selection: {
    selectedModaliteIds: number[];
    autreModaliteText: string;
  }) => {
    onUpdate({
      modalite_evaluation_ids: selection.selectedModaliteIds, // Keep as array
      modalite_evaluation_autre_texte: selection.autreModaliteText || null, // Can be null
    });

    const sortedSelectedIds = [...selection.selectedModaliteIds].sort((a, b) => a - b);
    const selectedForm = QUICK_FORMS_CONFIG.find(form => {
        const sortedFormModalities = [...form.modalities].sort((a, b) => a - b);
        return JSON.stringify(sortedSelectedIds) === JSON.stringify(sortedFormModalities);
    });

    if (selectedForm) {
        setFormSuggestions(selectedForm.suggestions);
        setSelectedQuickFormKey(selectedForm.key);
    } else {
        // Règle générale si aucune forme rapide ne correspond (ou si l'option "Sélectionner une forme rapide" est choisie)
        onUpdate({
            modalite_evaluation_ids: [], // Keep as array
            modalite_evaluation_autre_texte: null,
            introduction_activite: "<p></p>", // Is `string` in EvaluationDatacrt
            contenu_blocs: [], // Is `ContentBlockData[]` in EvaluationDatacrt
            consignes_specifiques: null, // Can be null
        });
        setFormSuggestions({});
    }
  }, [onUpdate]);


  // Gestionnaire de mise à jour du contenu de l'évaluation
  const handleEvaluationContentUpdate = useCallback((updatedContent: {
    introduction_activite?: string;
    contenu_blocs?: ContentBlockData[];
    consignes_specifiques?: string;
  }) => {
    onUpdate({
        introduction_activite: updatedContent.introduction_activite || "<p></p>", // Is `string` in EvaluationDatacrt
        contenu_blocs: updatedContent.contenu_blocs || [], // Is `ContentBlockData[]` in EvaluationDatacrt
        consignes_specifiques: updatedContent.consignes_specifiques || null, // Can be null
    });
  }, [onUpdate]);

  // Gestionnaire d'upload de ressources pour l'élève
  const handleStudentResourceUploadComplete = useCallback((urls: string[] | null) => {
    // ressources_eleve_urls est `string | null` dans EvaluationDatacrt, nécessite JSON.stringify
    onUpdate({ ressources_eleve_urls: (urls && urls.length > 0) ? JSON.stringify(urls) : null });
  }, [onUpdate]);

  // Gestionnaire d'upload de ressources pour le professeur
  const handleProfessorResourceUploadComplete = useCallback((urls: string[] | null) => {
    // ressource_urls est `string | null` dans EvaluationDatacrt, nécessite JSON.stringify
    onUpdate({ ressource_urls: (urls && urls.length > 0) ? JSON.stringify(urls) : null });
  }, [onUpdate]);

  // Gestionnaire du bouton "Annuler"
  const handleBack = () => {
    if (onCancel) onCancel();
    else navigate(-1);
  };

  // Gestionnaire de sélection d'une forme rapide (appelé par la liste déroulante)
  const handleQuickFormSelectionFromDropdown = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = e.target.value;
    setSelectedQuickFormKey(selectedKey);

    const formConfig = QUICK_FORMS_CONFIG.find(form => form.key === selectedKey);
    if (formConfig) {
      onUpdate({
        modalite_evaluation_ids: formConfig.modalities, // Keep as array
        modalite_evaluation_autre_texte: null,
        introduction_activite: formConfig.suggestions.evaluationContentInitialPrompts?.introduction || "<p></p>", // Is `string` in EvaluationDatacrt
        contenu_blocs: formConfig.suggestions.evaluationContentInitialPrompts?.blocks || [], // Is `ContentBlockData[]` in EvaluationDatacrt
        consignes_specifiques: formConfig.suggestions.evaluationContentInitialPrompts?.consignes || null, // Can be null
      });
      setFormSuggestions(formConfig.suggestions);
    } else {
        // Règle générale si aucune forme rapide ne correspond (ou si l'option "Sélectionner une forme rapide" est choisie)
        onUpdate({
            modalite_evaluation_ids: [], // Keep as array
            modalite_evaluation_autre_texte: null,
            introduction_activite: "<p></p>", // Is `string` in EvaluationDatacrt
            contenu_blocs: [], // Is `ContentBlockData[]` in EvaluationDatacrt
            consignes_specifiques: null, // Can be null
        });
        setFormSuggestions({});
    }
  }, [onUpdate]);


  // --- Section : Gestionnaire de Soumission Locale (Validation côté client) ---
  // Ce gestionnaire est appelé directement par le bouton via onClick
  const handleLocalSubmit = useCallback(() => { // Plus besoin de 'e: React.FormEvent'
    console.log("🔥 DEBUG (CreateInsertEvaluationEditor): handleLocalSubmit function triggered!"); // <--- LOG IMPORTANT
    setFormError(null); // Réinitialiser les erreurs précédentes

    // Validation du titre (non-nullable dans EvaluationDatacrt)
    if (!initialData.titre_evaluation || initialData.titre_evaluation.trim() === "") {
      setFormError("Le titre de l'évaluation est obligatoire.");
      return;
    }

    // Validation du chapitre (obligatoire)
    if (initialData.chapitre_id === null || initialData.chapitre_id === undefined) {
        setFormError("Le chapitre est obligatoire pour l'évaluation.");
        return;
    }

    // Validation des compétences
    const hasSpecificCompetence = initialData.selected_competence_id !== null && initialData.selected_competence_id !== undefined;
    const hasGeneralCompetences = (initialData.selected_general_competence_ids && initialData.selected_general_competence_ids.length > 0);
    // Compétences sont obligatoires si le chapitre est sélectionné
    if (!hasSpecificCompetence && !hasGeneralCompetences) {
      setFormError("Veuillez sélectionner au moins une compétence (spécifique ou générale).");
      return;
    }

    // Validation des connaissances
    const hasSelectedConnaissances = (initialData.selected_connaissance_ids && initialData.selected_connaissance_ids.length > 0);
    const hasNewConnaissanceText = (initialData.new_connaissance_text && initialData.new_connaissance_text.trim() !== '');
    // Connaissances sont obligatoires si le chapitre est sélectionné
    if (!hasSelectedConnaissances && !hasNewConnaissanceText) {
      setFormError("Veuillez sélectionner au moins une connaissance ou ajouter une nouvelle notion.");
      return;
    }

    // Validation des capacités/habiletés
    // selected_capacite_habilete_ids est `number[]` dans EvaluationDatacrt
    if (!initialData.selected_capacite_habilete_ids || initialData.selected_capacite_habilete_ids.length === 0) {
      setFormError("Veuillez sélectionner au moins une capacité/habileté.");
      return;
    }

    // Validation des modalités
    const hasSelectedModalites = (initialData.modalite_evaluation_ids && initialData.modalite_evaluation_ids.length > 0);
    const hasAutreModaliteText = (initialData.modalite_evaluation_autre_texte && initialData.modalite_evaluation_autre_texte.trim() !== '');
    if (!hasSelectedModalites && !hasAutreModaliteText) {
      setFormError("Veuillez sélectionner au moins une modalité d'évaluation ou spécifier une nouvelle modalité.");
      return;
    }

    // Validation des champs de contenu de l'évaluation (TinyMCE)
    // introduction_activite est `string` dans EvaluationDatacrt
    const isIntroductionEmpty = !initialData.introduction_activite || initialData.introduction_activite.trim() === "" || initialData.introduction_activite === "<p></p>" || initialData.introduction_activite === "<p><br></p>";
    // contenu_blocs est `ContentBlockData[]` dans EvaluationDatacrt
    const isContenuBlocksEmpty = !initialData.contenu_blocs || initialData.contenu_blocs.length === 0;

    if (isIntroductionEmpty && isContenuBlocksEmpty) {
        setFormError("La section 'Situation d'évaluation / Introduction' ou au moins un 'Bloc de contenu' est obligatoire.");
        return;
    }

    onSaveTrigger(); // Déclenche la sauvegarde par le parent
  }, [initialData, onSaveTrigger, setFormError]);


  // Fonction utilitaire pour parser les URLs stockées.
  // Décode une chaîne JSON en tableau de strings, ou retourne un tableau vide.
  const parseUrls = (urlsData: string | null | undefined): string[] => {
    if (typeof urlsData === 'string' && urlsData) {
      try {
        const parsed = JSON.parse(urlsData);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Erreur lors du parsing des URLs :", e);
        return [];
      }
    }
    return [];
  };


  // --- Section : Rendu du Composant (JSX) ---
  return (
    // REMARQUE: La balise <form> est retirée ici pour aligner le mécanisme de soumission sur CreateInsertActivityEditor.tsx.
    // La validation et le déclenchement de la sauvegarde se font via onClick du bouton.
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-8 text-center">
        Saisir et Modifier les Éléments d'une Évaluation
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
      {initialData.formError && ( // Affiche l'erreur de validation passée par initialData
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md border border-red-200" role="alert">
          <p className="font-medium">Validation :</p>
          <p>{initialData.formError}</p>
        </div>
      )}


      {/* Bloc : Contexte Pédagogique Général */}
      <div className="max-w-3xl mx-auto p-6 bg-blue-50 rounded-lg shadow-xl mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Contexte Pédagogique Général</h3>
        <HierarchicalSelector
          onChange={handleHierarchicalSelectionChange}
          // Utilise les props parentes en priorité, sinon initialData
          initialNiveauId={niveauIdParent || initialData.niveau_id}
          initialOptionId={optionIdParent || initialData.option_id}
          initialUniteId={uniteIdParent || initialData.unite_id}
          initialChapitreId={chapitreIdParent || initialData.chapitre_id}
          initialObjectifIds={initialData.objectifs || []} // HierarchicalSelector attend un tableau (number[])
          showChapitre={true}
          showCompetences={false} // Pas de sélecteur de compétences ici
          showObjectifs={true}
          // Désactivation des sélecteurs si les props parentes sont présentes
          disableNiveau={disableNiveauSelectByParent}
          disableOption={disableOptionSelectByParent}
          disableUnite={disableUniteSelectByParent}
          disableChapitre={disableChapitreSelectByParent}
        />
      </div>

      {/* Bloc : Compétences, Capacités et Connaissances Évaluées */}
      <div className="max-w-3xl mx-auto p-6 bg-green-50 rounded-lg shadow-xl mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Compétences, Capacités et Connaissances Évaluées</h3>
        <CompetenceSelector
          onSelectionChange={handleCompetenceSelectionChange}
          initialSpecificCompetenceId={initialData.selected_competence_id}
          initialGeneralCompetenceIds={initialData.selected_general_competence_ids || []} // CompetenceSelector attend un tableau
          initialConnaissanceIds={initialData.selected_connaissance_ids || []} // CompetenceSelector attend un tableau
          initialNewConnaissanceText={initialData.new_connaissance_text || ""} // CompetenceSelector attend une chaîne
          initialCapaciteHabileteIds={initialData.selected_capacite_habilete_ids || []} // CompetenceSelector attend un tableau
          chapitreId={initialData.chapitre_id} // Passer le chapitre_id pour filtrer les connaissances
          uniteId={initialData.unite_id} // Passer l'unite_id pour filtrer les connaissances
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
            value={initialData.titre_evaluation || ""} // titre_evaluation est string, pas string|null
            onChange={(e) => onUpdate({ titre_evaluation: e.target.value })}
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
            value={initialData.type_evaluation || ""}
            onChange={(e) => onUpdate({ type_evaluation: e.target.value })}
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
            onSelectionChange={handleModaliteSelectionChange}
            initialSelectedModaliteIds={initialData.modalite_evaluation_ids || []} // ModaliteSelector attend un tableau
            initialAutreModaliteText={initialData.modalite_evaluation_autre_texte || ""} // ModaliteSelector attend une chaîne
          />
        </div>

        <LongTextField
          label="Grille de correction / Critères"
          id="grille_correction"
          value={initialData.grille_correction}
          onChange={(val) => onUpdate({ grille_correction: val })}
          rows={4}
          placeholder={formSuggestions.grilleCorrectionPlaceholder || "Détaillez les critères d'évaluation ou la grille de correction."}
        />
      </div>

      {/* Bloc : Contenu de l'activité (Situation, Blocs de contenu, Consignes globales) */}
      <EvaluationContentEditor
        initialIntroduction={initialData.introduction_activite || ""} // introduction_activite est string
        initialContentBlocks={initialData.contenu_blocs || []} // contenu_blocs est ContentBlockData[]
        initialConsignes={initialData.consignes_specifiques || ""} // consignes_specifiques est string | null
        onUpdateContent={handleEvaluationContentUpdate}
      />

      {/* Bloc : Ressources Mises à Disposition de l'Élève */}
      {(formSuggestions.showStudentResources !== false) && (
        <div className="max-w-3xl mx-auto p-6 bg-blue-50 rounded-lg shadow-xl mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Ressources Mises à Disposition de l'Élève</h3>
          <StudentResourceUploader
            onUploadComplete={handleStudentResourceUploadComplete}
            disabled={saving}
            initialUrls={parseUrls(initialData.ressources_eleve_urls)} // Utilise parseUrls ici
          />
        </div>
      )}

      {/* Bloc : Ressources Associées (Pour le Professeur - Optionnel) */}
      {(formSuggestions.showProfessorResources !== false) && (
        <div className="mb-6 border-t pt-6 border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Ressources Associées (Pour le Professeur - Optionnel)</h3>
          <MultiFileUpload
            onUploadComplete={handleProfessorResourceUploadComplete}
            disabled={saving}
            initialUrls={parseUrls(initialData.ressource_urls)} // Utilise parseUrls ici
          />
        </div>
      )}

      {/* Section : Boutons d'Action et Messages de Statut */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={handleBack}
          disabled={saving}
          className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          Annuler
        </button>

        <button
          type="button" // Type "button" car nous ne sommes plus dans une balise <form> native
          onClick={handleLocalSubmit} // Appelle la fonction de validation locale
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

      {/* Section: Objectifs déjà liés à cette évaluation (non interactifs), en bas */}
      {(initialObjectiveDescriptions.length > 0) && (
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-md space-y-4 mt-8">
          <h3 className="font-bold text-gray-800 text-xl border-b border-gray-200 pb-3">Objectifs déjà liés à cette évaluation :</h3>
          <ul className="list-disc pl-7 space-y-2 text-gray-700">
            {initialObjectiveDescriptions.map(obj => (
              <li key={obj.id} className="text-base leading-relaxed">
                {obj.description_objectif}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CreateInsertEvaluationEditor;
