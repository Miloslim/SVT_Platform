// ============================================================
// Titre : CreateActivityEditor
// Chemin : src/components/planipeda/ScenarioEditor/CreateActivityEditor.tsx
// Fonctionnalités :
//    - Formulaire complet pour la création d'une activité pédagogique (maintenant contrôlé par le parent).
//    - Intégration de la sélection hiérarchique (niveau > option > unité > chapitre > objectifs).
//    - Utilise le composant MultiFileUpload pour gérer l'upload de MULTIPLES fichiers ressources.
//    - Envoie les données mises à jour au parent via `onUpdate`.
//    - Déclenche la sauvegarde du parent via `onSaveTrigger`.
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HierarchicalSelector from "./HierarchicalSelector";
import MultiFileUpload from "./MultiFileUpload";
// Importez l'interface ActivityData depuis le fichier parent ou un fichier commun
// Par exemple : import { ActivityData } from "@/components/planipeda/pages/CreateActivityEditorPage";
// Si ActivityData est définie localement dans CreateActivityEditorPage.tsx, vous devrez l'exporter ou la dupliquer ici.
// Pour cet exemple, je la duplique pour que le fichier soit autonome, mais une seule définition partagée est préférable.

// --- DÉBUT : Définition de l'interface ActivityData (à idéalement partager) ---
interface ActivityData {
  id?: number;
  chapitre_id: number | null;
  titre_activite: string;
  description: string;
  role_enseignant: string;
  materiel: string;
  duree_minutes: number | null;
  modalite_deroulement: string;
  modalite_evaluation: string;
  commentaires: string;
  ressource_urls: string[];
  objectifs: number[];
}
// --- FIN : Définition de l'interface ActivityData ---


// ---
// @section Sous-composant : LongTextField (inchangé)
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
// @section Types pour la sélection hiérarchique (inchangé)
// ---
interface SelectionType {
  niveauId: number | null;
  optionId: number | null;
  uniteId: number | null;
  chapitreId?: number | null;
  objectifIds?: number[];
}

// ---
// @section Propriétés du composant CreateActivityEditor
// MISES À JOUR pour un composant contrôlé
// ---
interface CreateActivityEditorProps {
  initialData: ActivityData; // Données initiales fournies par le parent
  onUpdate: (updatedFields: Partial<ActivityData>) => void; // Callback pour mettre à jour l'état du parent
  onSaveTrigger: () => void; // Callback pour demander au parent de sauvegarder
  onCancel?: () => void; // Callback pour annulation ou retour
  saving?: boolean; // Ajouté pour contrôler l'état de sauvegarde du parent
  error?: string | null; // Pour afficher les erreurs du parent
  successMessage?: string | null; // Pour afficher les messages de succès du parent
}

// ============================================================
// @section Composant principal : CreateActivityEditor
// Formulaire de création d'activités avec intégration des sous-composants.
// ============================================================
const CreateActivityEditor: React.FC<CreateActivityEditorProps> = ({
  initialData,
  onUpdate,
  onSaveTrigger,
  onCancel,
  saving = false, // Valeur par défaut
  error = null, // Valeur par défaut
  successMessage = null, // Valeur par défaut
}) => {
  const navigate = useNavigate();

  // ---
  // @subsection Gestionnaire de changement pour la sélection hiérarchique
  // Met à jour les IDs du chapitre et des objectifs dans l'état du parent.
  // ---
  const handleSelectionChange = (selection: SelectionType) => {
    onUpdate({
      chapitre_id: selection.chapitreId ?? null,
      objectifs: selection.objectifIds ?? [],
    });
  };

  // ---
  // @subsection Callback pour la réception des URLs de ressources
  // Met à jour le tableau d'URLs dans l'état du parent.
  // ---
  const handleResourceUploadComplete = (urls: string[] | null) => {
    onUpdate({ ressource_urls: urls || [] });
  };

  // ---
  // @subsection Gestion de l'annulation/retour
  // ---
  const handleBack = () => {
    if (onCancel) onCancel();
    else navigate(-1); // Retour à la page précédente si onCancel n'est pas fourni
  };

  // ============================================================
  // @section Rendu JSX principal du formulaire
  // ============================================================
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
        Créer une nouvelle activité d’apprentissage
      </h2>

      {/* Sélecteur hiérarchique */}
      <div className="mb-6 border-b pb-6 border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Contexte Pédagogique</h3>
        <HierarchicalSelector
          onChange={handleSelectionChange}
          // Si HierarchicalSelector peut aussi recevoir une `initialSelection`, il faudrait la passer ici
          // initialSelection={{ chapitreId: initialData.chapitre_id, objectifIds: initialData.objectifs }}
        />
      </div>

      {/* Champ Titre de l'activité */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Détails de l'Activité</h3>
        <label htmlFor="titre_activite" className="block font-semibold mb-1 text-gray-700">
          Titre de l’activité <span className="text-red-600">*</span>
        </label>
        <input
          id="titre_activite" // Utilise le nom de colonne exact
          type="text"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={initialData.titre_activite} // Utilisez la valeur du prop initialData
          onChange={(e) => onUpdate({ titre_activite: e.target.value })} // Met à jour l'état du parent
          placeholder="Ex: Atelier sur la Photosynthèse"
          required
        />
      </div>

      {/* Champs de texte longs - Mis à jour pour utiliser initialData et onUpdate */}
      <LongTextField
        label="Description"
        id="description"
        value={initialData.description}
        onChange={(val) => onUpdate({ description: val })}
        placeholder="Décrivez brièvement l'activité, ses objectifs spécifiques, etc."
      />
      <LongTextField
        label="Rôle de l'enseignant"
        id="role_enseignant" // Nom de colonne exact
        value={initialData.role_enseignant}
        onChange={(val) => onUpdate({ role_enseignant: val })}
        placeholder="Décrivez les actions de l'enseignant pendant l'activité."
      />
      <LongTextField
        label="Matériel"
        id="materiel" // Nom de colonne exact
        value={initialData.materiel}
        onChange={(val) => onUpdate({ materiel: val })}
        placeholder="Liste du matériel nécessaire (feuilles, crayons, ordinateur, etc.)."
      />

      {/* Champ Durée (en minutes) - Mis à jour pour utiliser initialData et onUpdate */}
      <div className="mb-5">
        <label
          htmlFor="duree_minutes" // Nom de colonne exact
          className="block font-semibold mb-1 text-gray-700"
        >
          Durée estimée (en minutes)
        </label>
        <input
          id="duree_minutes"
          type="number"
          min={0}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={initialData.duree_minutes === null ? "" : initialData.duree_minutes} // Gère null ou nombre
          onChange={(e) => {
            const val = e.target.value;
            onUpdate({ duree_minutes: val === "" ? null : Math.max(0, parseInt(val, 10)) });
          }}
          placeholder="Ex: 60"
        />
      </div>

      <LongTextField
        label="Modalités de déroulement"
        id="modalite_deroulement" // Nom de colonne exact
        value={initialData.modalite_deroulement}
        onChange={(val) => onUpdate({ modalite_deroulement: val })}
        placeholder="Comment l'activité se déroule-t-elle étape par étape ?"
      />
      <LongTextField
        label="Modalités d’évaluation"
        id="modalite_evaluation" // Nom de colonne exact
        value={initialData.modalite_evaluation}
        onChange={(val) => onUpdate({ modalite_evaluation: val })}
        placeholder="Comment les apprentissages seront-ils évalués ?"
      />
      <LongTextField
        label="Commentaires additionnels"
        id="commentaires" // Nom de colonne exact
        value={initialData.commentaires}
        onChange={(val) => onUpdate({ commentaires: val })}
        placeholder="Notes supplémentaires ou considérations particulières."
      />

      {/* Section Upload de ressources multiples */}
      <div className="mb-6 border-t pt-6 border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Ressources Associées (Optionnel)</h3>
        <MultiFileUpload
          onUploadComplete={handleResourceUploadComplete}
          disabled={saving} // Utilise le prop 'saving' du parent
        />

        {initialData.ressource_urls.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">URLs des fichiers chargés :</p>
            <ul className="list-disc list-inside text-sm text-blue-600 break-all">
              {initialData.ressource_urls.map((url, index) => (
                <li key={index} className="mb-1">
                  <a href={url} target="_blank" rel="noreferrer" className="hover:underline">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Messages d’erreur / succès (maintenant reçus du parent) */}
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

      {/* Boutons d’action */}
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
          onClick={onSaveTrigger} // Appelle la fonction de sauvegarde du parent
          disabled={saving}
          className={`px-8 py-3 rounded-md text-white font-semibold shadow-md ${
            saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          } transition duration-150 ease-in-out`}
        >
          {saving ? "Enregistrement en cours..." : "Enregistrer l'activité"}
        </button>
      </div>
    </div>
  );
};

export default CreateActivityEditor;