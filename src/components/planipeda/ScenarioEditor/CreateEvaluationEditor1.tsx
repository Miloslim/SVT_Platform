// ============================================================
// Titre : CreateEvaluationEditor1
// Chemin : src/components/planipeda/ScenarioEditor/CreateEvaluationEditor.tsx
// Fonctionnalités :
//    - Formulaire complet pour la création/modification d'une évaluation (contrôlé par le parent).
//    - Intégration de la sélection hiérarchique (niveau > option > unité > chapitre > objectifs).
//    - Intégration de la sélection via listes déroulantes de compétences, capacités/habiletés et connaissances.
//      Permet la sélection d'une compétence spécifique et de MULTIPLES compétences générales.
//      Permet la sélection de MULTIPLES connaissances et l'ajout d'une nouvelle connaissance textuelle.
//    - Utilise le composant MultiFileUpload pour gérer l'upload de MULTIPLES fichiers ressources.
//    - Envoie toutes les mises à jour des champs au parent via `onUpdate`.
//    - Déclenche la fonction de sauvegarde du parent via `onSaveTrigger` avec validation.
//    - Affiche les messages d'erreur/succès et l'état de sauvegarde reçus du parent.
// ============================================================

import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HierarchicalSelector from "./HierarchicalSelector";
import MultiFileUpload from "./MultiFileUpload";
import CompetenceSelector from "./CompetenceSelector";
import ModaliteSelector from "./ModaliteSelector"; // NOUVEAU : Importation du composant ModaliteSelector

// ---
// Interface : EvaluationData
// Cette interface définit la structure des données d'une évaluation telle qu'elle est gérée dans le formulaire.
// Elle inclut les champs directs de la table 'evaluations' et les IDs des éléments sélectionnés
// des tables de liaison (objectifs, compétences, capacités/habiletés, connaissances).
// ---
export interface EvaluationData {
  id?: number;
  titre_evaluation: string;
  date_creation?: string;
  chapitre_id: number | null;
  sequence_id: number | null;
  activite_id: number | null;
  ressource_urls: string | null;
  type_evaluation: string | null;
  // MODIFIÉ: Suppression de modalite_evaluation string | null
  // NOUVEAU: Ajout de champs pour la gestion des modalités multiples et "Autre"
  modalite_evaluation_ids?: number[];
  modalite_evaluation_autre_texte?: string | null;
  grille_correction: string | null;
  date_mise_a_jour?: string;

  objectifs?: number[]; 

  selected_specific_competence_id?: number | null;
  selected_general_competence_ids?: number[];
  
  // MODIFIÉ: selected_connaissance_ids est maintenant un tableau
  selected_connaissance_ids?: number[]; 
  // NOUVEAU: Champ pour le texte de la nouvelle connaissance
  new_connaissance_text?: string | null;

  selected_capacite_habilete_id?: number | null; // Reste une sélection unique pour cet exemple

  niveau_id?: number | null;
  option_id?: number | null;
  unite_id?: number | null;
}

// ---
// Sous-composant : LongTextField (inchangé)
// ---
interface LongTextFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  placeholder?: string;
}

const LongTextField: React.FC<LongTextFieldProps> = ({
  label,
  id,
  value,
  onChange,
  rows = 4,
  placeholder = "",
}) => (
  <div className="mb-5">
    <label htmlFor={id} className="block font-semibold mb-1 text-gray-700">
      {label}
    </label>
    <textarea
      id={id}
      rows={rows}
      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || `Entrez ${label.toLowerCase()}...`}
    />
  </div>
);

// ---
// Propriétés (Props) du composant CreateEvaluationEditor (inchangé sauf l'interface)
// ---
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

  useEffect(() => {
    if (successMessage && onSuccessRedirectPath && !saving) {
      const timer = setTimeout(() => {
        navigate(onSuccessRedirectPath);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [successMessage, onSuccessRedirectPath, saving, navigate]);

  // --- Gestionnaires d'événements mémoïsés avec `useCallback` ---

  const handleHierarchicalSelectionChange = useCallback((selection: {
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
    chapitreId?: number | null;
    objectifIds?: number[];
  }) => {
    console.log(
      "🔵 HierarchicalSelector - Sélection mise à jour reçue par CreateEvaluationEditor:",
      selection
    );
    onUpdate({
      niveau_id: selection.niveauId,
      option_id: selection.optionId,
      unite_id: selection.uniteId,
      chapitre_id: selection.chapitreId,
      objectifs: selection.objectifIds || [],
      // Quand le chapitre change, on réinitialise les connaissances sélectionnées
      // pour éviter que des connaissances d'un ancien chapitre restent cochées.
      selected_connaissance_ids: [],
      new_connaissance_text: '', // Réinitialise aussi le champ de texte
    });
  }, [onUpdate]);

  // MODIFIÉ: Gère les nouvelles propriétés pour les connaissances
  const handleCompetenceSelectionChange = useCallback((selection: {
    selectedSpecificCompetenceId: number | null;
    selectedGeneralCompetenceIds: number[];
    selectedConnaissanceIds: number[]; // MODIFIÉ
    newConnaissanceText: string;      // NOUVEAU
    selectedCapaciteHabileteId: number | null; // Reste une sélection unique
  }) => {
    console.log("🔵 CompetenceSelector - Sélection mise à jour reçue :", selection);
    onUpdate({
      selected_specific_competence_id: selection.selectedSpecificCompetenceId,
      selected_general_competence_ids: selection.selectedGeneralCompetenceIds,
      selected_connaissance_ids: selection.selectedConnaissanceIds, // Met à jour le tableau d'IDs
      new_connaissance_text: selection.newConnaissanceText,       // Met à jour le texte
      selected_capacite_habilete_id: selection.selectedCapaciteHabileteId,
    });
  }, [onUpdate]);

  // NOUVEAU: Gestionnaire pour les changements du ModaliteSelector
  const handleModaliteSelectionChange = useCallback((selection: {
    selectedModaliteIds: number[];
    autreModaliteText: string;
  }) => {
    console.log("🔵 ModaliteSelector - Sélection mise à jour reçue :", selection);
    onUpdate({
      modalite_evaluation_ids: selection.selectedModaliteIds,
      modalite_evaluation_autre_texte: selection.autreModaliteText,
    });
  }, [onUpdate]);


  const handleResourceUploadComplete = useCallback((urls: string[] | null) => {
    console.log("🔵 MultiFileUpload - URLs reçues et passées à onUpdate :", urls);
    onUpdate({ ressource_urls: urls ? urls.join('\n') : null });
  }, [onUpdate]);

  const handleBack = () => {
    console.log("ℹ️ Bouton Annuler cliqué.");
    if (onCancel) onCancel();
    else navigate(-1);
  };

  const handleSubmit = () => {
    setFormError(null);

    // Validation des champs obligatoires :
    if (!initialData.titre_evaluation || initialData.titre_evaluation.trim() === "") {
        setFormError("Le titre de l'évaluation est obligatoire.");
        return;
    }

    // Validation des compétences :
    const hasSpecificCompetence = initialData.selected_specific_competence_id !== null;
    const hasGeneralCompetences = (initialData.selected_general_competence_ids && initialData.selected_general_competence_ids.length > 0);

    if (!hasSpecificCompetence && !hasGeneralCompetences) {
        setFormError("Veuillez sélectionner au moins une compétence (spécifique ou générale).");
        return;
    }

    // NOUVEAU: Validation des connaissances
    const hasSelectedConnaissances = (initialData.selected_connaissance_ids && initialData.selected_connaissance_ids.length > 0);
    const hasNewConnaissanceText = (initialData.new_connaissance_text && initialData.new_connaissance_text.trim() !== '');

    // Si le chapitre est sélectionné, il doit y avoir au moins une connaissance sélectionnée ou une nouvelle connaissance proposée
    if (initialData.chapitre_id && !hasSelectedConnaissances && !hasNewConnaissanceText) {
        setFormError("Veuillez sélectionner au moins une connaissance ou ajouter une nouvelle notion si un chapitre est sélectionné.");
        return;
    }

    // NOUVEAU: Validation des modalités d'évaluation
    const hasSelectedModalites = (initialData.modalite_evaluation_ids && initialData.modalite_evaluation_ids.length > 0);
    const hasAutreModaliteText = (initialData.modalite_evaluation_autre_texte && initialData.modalite_evaluation_autre_texte.trim() !== '');

    if (!hasSelectedModalites && !hasAutreModaliteText) {
        setFormError("Veuillez sélectionner au moins une modalité d'évaluation ou spécifier une nouvelle modalité.");
        return;
    }
    
    // Si toutes les validations passent, déclenche la fonction de sauvegarde du parent.
    onSaveTrigger();
  };

  // --- Rendu du Composant (JSX) ---
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-2xl font-semibold text- mb-8 text-center">
        Saisir et modifier les éléments d'une Évaluation
      </h1>

      {/* Bloc pour le sélecteur hiérarchique */}
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

      {/* Bloc pour la sélection des Compétences, Capacités et Connaissances */}
      <div className="max-w-3xl mx-auto p-6 bg-green-50 rounded-lg shadow-xl mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Compétences, Capacités et Connaissances Évaluées</h3>
        <CompetenceSelector
          onSelectionChange={handleCompetenceSelectionChange}
          initialSpecificCompetenceId={initialData.selected_specific_competence_id}
          initialGeneralCompetenceIds={initialData.selected_general_competence_ids}
          // MODIFIÉ: Passe le tableau d'IDs des connaissances
          initialConnaissanceIds={initialData.selected_connaissance_ids}
          // NOUVEAU: Passe le texte de la nouvelle connaissance
          initialNewConnaissanceText={initialData.new_connaissance_text}
          initialCapaciteHabileteIds={initialData.selected_capacite_habilete_id ? [initialData.selected_capacite_habilete_id] : null}
          chapitreId={initialData.chapitre_id}
          uniteId={initialData.unite_id}
        />
      </div>

      {/* Bloc pour les détails de l'Évaluation */}
      <div className="max-w-3xl mx-auto p-6 bg-blue-100 rounded-lg shadow-xl mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Détails de l'Évaluation</h3>
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

        {/* NOUVEAU: Intégration du ModaliteSelector */}
        <div className="mb-5">
          <h4 className="block font-semibold mb-1 text-gray-700">
            Modalité(s) de l'évaluation <span className="text-red-600">*</span>
          </h4>
          <ModaliteSelector
            onSelectionChange={handleModaliteSelectionChange}
            initialSelectedModaliteIds={initialData.modalite_evaluation_ids}
            initialAutreModaliteText={initialData.modalite_evaluation_autre_texte}
          />
        </div>

        <LongTextField
          label="Grille de correction / Critères"
          id="grille_correction"
          value={initialData.grille_correction || ""}
          onChange={(val) => onUpdate({ grille_correction: val })}
          placeholder="Détaillez les critères d'évaluation ou la grille de correction."
        />
      </div>

      <div className="mb-6 border-t pt-6 border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Ressources Associées (Optionnel)</h3>
        <MultiFileUpload
          onUploadComplete={handleResourceUploadComplete}
          disabled={saving}
          initialUrls={
            initialData.ressource_urls
              ? initialData.ressource_urls.split('\n').filter(Boolean)
              : []
          }
        />
      </div>

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