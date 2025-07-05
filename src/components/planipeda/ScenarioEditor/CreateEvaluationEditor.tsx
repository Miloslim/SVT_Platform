// ============================================================
// Titre : CreateEvaluationEditor
// Chemin : src/components/planipeda/ScenarioEditor/CreateEvaluationEditor.tsx
// Fonctionnalités :
//   - Composant principal de saisie et modification des données d'une évaluation.
//   - Intègre divers sélecteurs (hiérarchique, compétences, modalités) et éditeurs de contenu.
//   - Gère les données du formulaire, les validations et l'appel à la logique de sauvegarde.
//   - Adapte la structure des données aux tables de la base de données.
//   - MODIFICATION: La section "Capacité / Habileté" est maintenant conçue pour des cases à cocher (sélection multiple).
//   - MODIFICATION: L'introduction et les consignes des formes rapides sont maintenant vides par défaut pour les champs TinyMCE.
// ============================================================

import React, { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
// Importation des sous-composants nécessaires
import HierarchicalSelector from "./HierarchicalSelector";
import MultiFileUpload from "./MultiFileUpload";
import CompetenceSelector, { CompetenceSelectorProps } from "./CompetenceSelector"; // Import du type de props
import ModaliteSelector from "./ModaliteSelector";
import EvaluationContentEditor, { ContentBlockData } from "./EvaluationContent/EvaluationContentEditor";
import StudentResourceUploader from "./EvaluationContent/StudentResourceUploader";
import { EvaluationDatacrt } from "@/types/evaluation";
// --- Interface : EvaluationData ---
// Définit la structure des données complètes d'une évaluation,
// telle que gérée par le formulaire et attendue par la base de données.

// --- Propriétés (Props) du composant CreateEvaluationEditor ---
interface CreateEvaluationEditorProps {
  initialData: EvaluationData;
  onUpdate: (updatedFields: Partial<EvaluationData>) => void;
  onSaveTrigger: () => void;
  onCancel?: () => void;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  onSuccessRedirectPath?: string;
  setFormError: (message: string | null) => void;
}

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
                introduction: "<p></p>", // Introduction vide par défaut pour cette forme rapide
                blocks: [
                    { id: `block-${Date.now()}-exo1`, type: 'paragraph_with_media', order: 0,
                      text_content_html: "<p>Insérez ici les données (texte, graphique, image) à analyser pour la première partie de l'exercice.</p>",
                      questions_html: "<p>1. Analysez les données et répondez à la question...</p>"
                    }
                ],
                consignes: "<p></p>" // MODIFIÉ: Consignes vides par défaut pour cette forme rapide
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


// ============================================================
// Composant principal : CreateEvaluationEditor
// ============================================================
const CreateEvaluationEditor: React.FC<CreateEvaluationEditorProps> = ({
  initialData,
  onUpdate,
  onSaveTrigger,
  onCancel,
  saving,
  error,
  successMessage,
  onSuccessRedirectPath,
  setFormError,
}) => {
  const navigate = useNavigate();

  // État local pour gérer les suggestions et la personnalisation du formulaire
  const [formSuggestions, setFormSuggestions] = useState<FormSuggestions>({});
  // État pour la clé de la forme rapide sélectionnée dans la liste déroulante
  const [selectedQuickFormKey, setSelectedQuickFormKey] = useState<string>("");

  // --- Section : Effets de Bord (useEffect) ---

  // Effet pour la redirection après succès de la sauvegarde
  useEffect(() => {
    if (successMessage && onSuccessRedirectPath && !saving) {
      const timer = setTimeout(() => {
        navigate(onSuccessRedirectPath);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [successMessage, onSuccessRedirectPath, saving, navigate]);

  // Effet pour déterminer la forme rapide sélectionnée lorsque initialData change (ex: chargement d'une évaluation)
  useEffect(() => {
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

  // Gestionnaire de changement pour le sélecteur hiérarchique (Niveau, Option, Unité, Chapitre, Objectifs)
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
      objectifs: selection.objectifIds || [],
      // Réinitialisation des connaissances et capacités lors du changement de chapitre/unité
      selected_connaissance_ids: [],
      new_connaissance_text: '',
      selected_capacite_habilete_ids: [], // Remplacé par un tableau vide
    });
  }, [onUpdate]);

  // Gestionnaire de changement pour le sélecteur de compétences (Spécifiques, Générales, Connaissances, Capacités)
  const handleCompetenceSelectionChange = useCallback((selection: {
    selectedSpecificCompetenceId: number | null;
    selectedGeneralCompetenceIds: number[];
    selectedConnaissanceIds: number[];
    newConnaissanceText: string;
    selectedCapaciteHabileteIds: number[]; // Attendre un tableau d'IDs
  }) => {
    onUpdate({
      selected_competence_id: selection.selectedSpecificCompetenceId,
      selected_general_competence_ids: selection.selectedGeneralCompetenceIds,
      selected_connaissance_ids: selection.selectedConnaissanceIds,
      new_connaissance_text: selection.newConnaissanceText,
      selected_capacite_habilete_ids: selection.selectedCapaciteHabileteIds, // Assigner le tableau
    });
  }, [onUpdate]);

  // Gestionnaire de changement pour le sélecteur de modalités
  const handleModaliteSelectionChange = useCallback((selection: {
    selectedModaliteIds: number[];
    autreModaliteText: string;
  }) => {
    onUpdate({
      modalite_evaluation_ids: selection.selectedModaliteIds,
      modalite_evaluation_autre_texte: selection.autreModaliteText,
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
        setFormSuggestions({});
        setSelectedQuickFormKey("");
        // Initialisation de l'introduction à vide lorsque aucune forme rapide n'est sélectionnée
        onUpdate({
            modalite_evaluation_ids: [],
            modalite_evaluation_autre_texte: null,
            introduction_activite: "<p></p>",
            contenu_blocs: [],
            consignes_specifiques: null,
        });
    }
  }, [onUpdate]);

  // Gestionnaire de mise à jour du contenu de l'évaluation
  const handleEvaluationContentUpdate = useCallback((updatedContent: {
    introduction_activite?: string;
    contenu_blocs?: ContentBlockData[];
    consignes_specifiques?: string;
  }) => {
    onUpdate(updatedContent);
  }, [onUpdate]);

  // Gestionnaire d'upload de ressources pour l'élève
  const handleStudentResourceUploadComplete = useCallback((urls: string[] | null) => {
    onUpdate({ ressources_eleve_urls: urls ? JSON.stringify(urls) : null });
  }, [onUpdate]);

  // Gestionnaire d'upload de ressources pour le professeur
  const handleProfessorResourceUploadComplete = useCallback((urls: string[] | null) => {
    onUpdate({ ressource_urls: urls ? JSON.stringify(urls) : null });
  }, [onUpdate]);

  // Gestionnaire du bouton "Annuler"
  const handleBack = () => {
    if (onCancel) onCancel();
    else navigate(-1);
  };

  // --- Section : Gestionnaire de Soumission du Formulaire ---
  const handleSubmit = () => {
    setFormError(null);

    if (!initialData.titre_evaluation || initialData.titre_evaluation.trim() === "") {
      setFormError("Le titre de l'évaluation est obligatoire.");
      return;
    }

    const hasSpecificCompetence = initialData.selected_competence_id !== null;
    const hasGeneralCompetences = (initialData.selected_general_competence_ids && initialData.selected_general_competence_ids.length > 0);
    if (!hasSpecificCompetence && !hasGeneralCompetences) {
      setFormError("Veuillez sélectionner au moins une compétence (spécifique ou générale).");
      return;
    }

    const hasSelectedConnaissances = (initialData.selected_connaissance_ids && initialData.selected_connaissance_ids.length > 0);
    const hasNewConnaissanceText = (initialData.new_connaissance_text && initialData.new_connaissance_text.trim() !== '');
    if (initialData.chapitre_id && !hasSelectedConnaissances && !hasNewConnaissanceText) {
      setFormError("Veuillez sélectionner au moins une connaissance ou ajouter une nouvelle notion si un chapitre est sélectionné.");
      return;
    }

    const hasSelectedModalites = (initialData.modalite_evaluation_ids && initialData.modalite_evaluation_ids.length > 0);
    const hasAutreModaliteText = (initialData.modalite_evaluation_autre_texte && initialData.modalite_evaluation_autre_texte.trim() !== '');
    if (!hasSelectedModalites && !hasAutreModaliteText) {
      setFormError("Veuillez sélectionner au moins une modalité d'évaluation ou spécifier une nouvelle modalité.");
      return;
    }

    if (!initialData.introduction_activite || initialData.introduction_activite.trim() === "" || initialData.introduction_activite === "<p><br></p>") {
      setFormError("La section 'Situation d'évaluation / Introduction' est obligatoire.");
      return;
    }
    if (!initialData.contenu_blocs || initialData.contenu_blocs.length === 0) {
      setFormError("Veuillez ajouter au moins un bloc de contenu (paragraphe, image, etc.) pour le corps de l'activité.");
      return;
    }

    onSaveTrigger();
  };

  // Gestionnaire de sélection d'une forme rapide (appelé par la liste déroulante)
  const handleQuickFormSelectionFromDropdown = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = e.target.value;
    setSelectedQuickFormKey(selectedKey);

    const formConfig = QUICK_FORMS_CONFIG.find(form => form.key === selectedKey);
    if (formConfig) {
      onUpdate({
        modalite_evaluation_ids: formConfig.modalities,
        modalite_evaluation_autre_texte: null,
        // Utilise l'introduction définie dans la configuration de la forme rapide (maintenant vide pour 'exercice_consignes')
        introduction_activite: formConfig.suggestions.evaluationContentInitialPrompts?.introduction || '',
        contenu_blocs: formConfig.suggestions.evaluationContentInitialPrompts?.blocks || [],
        consignes_specifiques: formConfig.suggestions.evaluationContentInitialPrompts?.consignes || '',
      });
      setFormSuggestions(formConfig.suggestions);
    } else {
        // Règle générale si aucune forme rapide ne correspond (ou si l'option "Sélectionner une forme rapide" est choisie)
        onUpdate({
            modalite_evaluation_ids: [],
            modalite_evaluation_autre_texte: null,
            introduction_activite: "<p></p>", // Ici aussi, on s'assure que c'est vide par défaut si aucune forme rapide n'est sélectionnée
            contenu_blocs: [],
            consignes_specifiques: null,
        });
        setFormSuggestions({});
    }
  }, [onUpdate]);

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

  // --- Section : Rendu du Composant (JSX) ---
  return (
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

      {/* Bloc : Contexte Pédagogique Général */}
      <div className="max-w-3xl mx-auto p-6 bg-blue-50 rounded-lg shadow-xl mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Contexte Pédagogique Général</h3>
        <HierarchicalSelector
          onChange={handleHierarchicalSelectionChange}
          initialNiveauId={initialData.niveau_id}
          initialOptionId={initialData.option_id}
          initialUniteId={initialData.unite_id}
          initialChapitreId={initialData.chapitre_id}
          initialObjectifIds={initialData.objectifs}
          showChapitre={true}
          showCompetences={false}
          showObjectifs={true}
        />
      </div>

      {/* Bloc : Compétences, Capacités et Connaissances Évaluées */}
      <div className="max-w-3xl mx-auto p-6 bg-green-50 rounded-lg shadow-xl mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Compétences, Capacités et Connaissances Évaluées</h3>
        <CompetenceSelector
          onSelectionChange={handleCompetenceSelectionChange}
          initialSpecificCompetenceId={initialData.selected_competence_id}
          initialGeneralCompetenceIds={initialData.selected_general_competence_ids}
          initialConnaissanceIds={initialData.selected_connaissance_ids}
          initialNewConnaissanceText={initialData.new_connaissance_text}
          initialCapaciteHabileteIds={initialData.selected_capacite_habilete_ids} // Passe le tableau d'IDs
          chapitreId={initialData.chapitre_id}
          uniteId={initialData.unite_id}
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
            value={initialData.titre_evaluation || ""}
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
            initialSelectedModaliteIds={initialData.modalite_evaluation_ids}
            initialAutreModaliteText={initialData.modalite_evaluation_autre_texte}
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
            value={initialData.grille_correction || ""}
            onChange={(e) => onUpdate({ grille_correction: e.target.value })}
            placeholder={formSuggestions.grilleCorrectionPlaceholder || "Détaillez les critères d'évaluation ou la grille de correction."}
          />
        </div>
      </div>

      {/* Bloc : Contenu de l'activité (Situation, Blocs de contenu, Consignes globales) */}
      <EvaluationContentEditor
        initialIntroduction={initialData.introduction_activite}
        initialContentBlocks={initialData.contenu_blocs}
        initialConsignes={initialData.consignes_specifiques}
        onUpdateContent={handleEvaluationContentUpdate}
      />

      {/* Bloc : Ressources Mises à Disposition de l'Élève */}
      {(formSuggestions.showStudentResources !== false) && (
        <div className="max-w-3xl mx-auto p-6 bg-blue-50 rounded-lg shadow-xl mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Ressources Mises à Disposition de l'Élève</h3>
          <StudentResourceUploader
            onUploadComplete={handleStudentResourceUploadComplete}
            disabled={saving}
            initialUrls={parseUrls(initialData.ressources_eleve_urls)}
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
            initialUrls={parseUrls(initialData.ressource_urls)}
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
          type="button"
          onClick={handleSubmit}
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

export default CreateEvaluationEditor;
