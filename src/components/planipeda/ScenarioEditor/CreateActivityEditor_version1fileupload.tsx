// ============================================================
// Titre : CreateActivityEditor_version qui inert 1 seul url dans la table, mais tjr le chargement  e passe
// Chemin : src/components/planipeda/ScenarioEditor/CreateActivityEditor.tsx
// Fonctionnalités :
//   - Formulaire complet pour la création d'une activité pédagogique.
//   - Intégration de la sélection hiérarchique (niveau > option > unité > chapitre > objectifs).
//   - Utilise le composant MultiFileUpload pour gérer l'upload de MULTIPLES fichiers ressources.
//   - Sauvegarde l'activité (et un tableau d'URLs de ressources) et ses liens avec les objectifs
//     dans les tables Supabase (`activites`, `activite_objectifs`).
//   - Gère l'état de sauvegarde, les messages d'erreur et de succès.
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HierarchicalSelector from "./HierarchicalSelector"; // Assurez-vous que ce composant existe
import MultiFileUpload from "./MultiFileUpload"; // <-- Changement : Importation du nouveau composant MultiFileUpload
import { supabase } from "@/backend/config/supabase"; // Assurez-vous que le chemin est correct

// ---
// @section Sous-composant : LongTextField
// Composant réutilisable pour les champs de texte longs (textarea).
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
// @section Types pour la sélection hiérarchique
// Définit la structure des données de sélection provenant du HierarchicalSelector.
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
// Définit les props optionnelles pour les callbacks de sauvegarde et d'annulation.
// ---
interface CreateActivityEditorProps {
  onSaved?: () => void; // Callback après sauvegarde réussie
  onCancel?: () => void; // Callback pour annulation ou retour
}

// ============================================================
// @section Composant principal : CreateActivityEditor
// Formulaire de création d'activités avec intégration des sous-composants.
// ============================================================
const CreateActivityEditor: React.FC<CreateActivityEditorProps> = ({
  onSaved,
  onCancel,
}) => {
  const navigate = useNavigate(); // Hook pour la navigation

  // ---
  // @subsection États pour les champs principaux du formulaire
  // ---
  const [titre, setTitre] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [roleEnseignant, setRoleEnseignant] = useState<string>("");
  const [materiel, setMateriel] = useState<string>("");
  const [dureeMinutes, setDureeMinutes] = useState<number | "">("");
  const [modaliteDeroulement, setModaliteDeroulement] = useState<string>("");
  const [modaliteEvaluation, setModaliteEvaluation] = useState<string>("");
  const [commentaires, setCommentaires] = useState<string>("");

  // ---
  // @subsection États pour la hiérarchie et les objectifs
  // Reçoivent les valeurs du HierarchicalSelector.
  // ---
  const [chapitreId, setChapitreId] = useState<number | null>(null);
  const [objectifIds, setObjectifIds] = useState<number[]>([]);

  // ---
  // @subsection État pour les URLs des ressources uploadées (tableau)
  // Cette liste d'URLs est reçue du composant MultiFileUpload.
  // ---
  const [ressourceUrls, setRessourceUrls] = useState<string[]>([]); // <-- Changement : C'est un tableau d'URLs

  // ---
  // @subsection États généraux du formulaire (sauvegarde, erreurs, succès)
  // ---
  const [saving, setSaving] = useState<boolean>(false); // Indique si la sauvegarde est en cours
  const [error, setError] = useState<string | null>(null); // Message d'erreur
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Message de succès

  /**
   * @section Gestionnaire de changement pour la sélection hiérarchique
   * Met à jour les IDs du chapitre et des objectifs en fonction de la sélection.
   */
  const handleSelectionChange = (selection: SelectionType) => {
    setChapitreId(selection.chapitreId ?? null);
    setObjectifIds(selection.objectifIds ?? []);
  };

  /**
   * @section Callback pour la réception des URLs de ressources
   * Mis à jour pour recevoir un tableau d'URLs.
   */
  const handleResourceUploadComplete = (urls: string[] | null) => {
    // Si des URLs sont fournies, les stocke, sinon réinitialise à un tableau vide
    setRessourceUrls(urls || []);
  };

  /**
   * @section Réinitialisation du formulaire
   * Remet tous les champs et états à leurs valeurs initiales après une sauvegarde réussie.
   */
  const resetForm = () => {
    setTitre("");
    setDescription("");
    setRoleEnseignant("");
    setMateriel("");
    setDureeMinutes("");
    setModaliteDeroulement("");
    setModaliteEvaluation("");
    setCommentaires("");
    setChapitreId(null);
    setObjectifIds([]);
    setRessourceUrls([]); // <-- Changement : Réinitialise le tableau d'URLs
    setError(null);
    setSuccessMessage(null);
  };

  /**
   * @section Sauvegarde complète de l’activité
   * Gère la validation des données, l'insertion dans Supabase et la liaison avec les objectifs.
   */
  const handleSave = async () => {
    setError(null); // Réinitialise les messages
    setSuccessMessage(null);

    // ---
    // @subsection Validation des champs obligatoires
    // ---
    if (!chapitreId) {
      setError("Veuillez sélectionner un chapitre.");
      return;
    }
    if (objectifIds.length === 0) {
      setError("Veuillez sélectionner au moins un objectif.");
      return;
    }
    if (!titre.trim()) {
      setError("Le titre de l’activité est obligatoire.");
      return;
    }

    setSaving(true); // Active l'état de sauvegarde

    try {
      // ---
      // @subsection Insertion dans la table `activites`
      // Le champ `ressource_urls` (nouvelle colonne) est maintenant un tableau de chaînes de caractères.
      // ---
      const { data: newActivity, error: insertError } = await supabase
        .from("activites")
        .insert({
          chapitre_id: chapitreId,
          titre_activite: titre.trim(),
          description: description.trim() || null,
          role_enseignant: roleEnseignant.trim() || null,
          materiel: materiel.trim() || null,
          duree_minutes:
            typeof dureeMinutes === "number" && dureeMinutes >= 0
              ? dureeMinutes
              : null,
          modalite_deroulement: modaliteDeroulement.trim() || null,
          modalite_evaluation: modaliteEvaluation.trim() || null,
          commentaires: commentaires.trim() || null,
          ressource_urls: ressourceUrls.length > 0 ? ressourceUrls : null, // <-- Changement : Utilisez le tableau d'URLs
        })
        .select() // Demande les données de l'activité nouvellement insérée
        .single(); // S'attend à un seul enregistrement

      if (insertError) {
        throw insertError; // Propage l'erreur d'insertion
      }
      if (!newActivity || !newActivity.id) {
        throw new Error("Erreur lors de la création de l'activité. ID non retourné.");
      }

      // ---
      // @subsection Liaison activité - objectifs dans la table de jointure `activite_objectifs`
      // Crée des entrées pour chaque objectif sélectionné lié à la nouvelle activité.
      // ---
      const relations = objectifIds.map((id) => ({
        activite_id: newActivity.id,
        objectif_id: id,
      }));

      const { error: relError } = await supabase
        .from("activite_objectifs")
        .insert(relations);

      if (relError) {
        throw relError; // Propage l'erreur de liaison
      }

      // ---
      // @subsection Succès de la sauvegarde
      // ---
      setSuccessMessage("Activité enregistrée avec succès !");
      resetForm(); // Réinitialise le formulaire
      if (onSaved) onSaved(); // Appelle le callback parent
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde de l'activité :", err);
      setError("Erreur : " + (err.message || "Une erreur inconnue est survenue."));
    } finally {
      setSaving(false); // La sauvegarde est terminée
    }
  };

  /**
   * @section Effet : Dissipation du message de succès
   * Masque le message de succès après quelques secondes.
   */
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000); // 3 secondes
      return () => clearTimeout(timer); // Nettoyage du timer
    }
  }, [successMessage]);

  /**
   * @section Gestion de l'annulation/retour
   * Appelle le callback `onCancel` ou navigue en arrière.
   */
  const handleBack = () => {
    if (onCancel) onCancel();
    else navigate(-1); // Retour à la page précédente
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
        <HierarchicalSelector onChange={handleSelectionChange} />
      </div>

      {/* Champ Titre de l'activité */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Détails de l'Activité</h3>
        <label htmlFor="titre" className="block font-semibold mb-1 text-gray-700">
          Titre de l’activité <span className="text-red-600">*</span>
        </label>
        <input
          id="titre"
          type="text"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Ex: Atelier sur la Photosynthèse"
          required // Indique que le champ est obligatoire
        />
      </div>

      {/* Champs de texte longs */}
      <LongTextField
        label="Description"
        id="description"
        value={description}
        onChange={setDescription}
        placeholder="Décrivez brièvement l'activité, ses objectifs spécifiques, etc."
      />
      <LongTextField
        label="Rôle de l'enseignant"
        id="roleEnseignant"
        value={roleEnseignant}
        onChange={setRoleEnseignant}
        placeholder="Décrivez les actions de l'enseignant pendant l'activité."
      />
      <LongTextField
        label="Matériel"
        id="materiel"
        value={materiel}
        onChange={setMateriel}
        placeholder="Liste du matériel nécessaire (feuilles, crayons, ordinateur, etc.)."
      />

      {/* Champ Durée (en minutes) */}
      <div className="mb-5">
        <label
          htmlFor="duree"
          className="block font-semibold mb-1 text-gray-700"
        >
          Durée estimée (en minutes)
        </label>
        <input
          id="duree"
          type="number"
          min={0}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={dureeMinutes}
          onChange={(e) => {
            const val = e.target.value;
            // Convertit en nombre ou vide la valeur si elle est vide
            setDureeMinutes(val === "" ? "" : Math.max(0, parseInt(val, 10)));
          }}
          placeholder="Ex: 60"
        />
      </div>

      <LongTextField
        label="Modalités de déroulement"
        id="modaliteDeroulement"
        value={modaliteDeroulement}
        onChange={setModaliteDeroulement}
        placeholder="Comment l'activité se déroule-t-elle étape par étape ?"
      />
      <LongTextField
        label="Modalités d’évaluation"
        id="modaliteEvaluation"
        value={modaliteEvaluation}
        onChange={setModaliteEvaluation}
        placeholder="Comment les apprentissages seront-ils évalués ?"
      />
      <LongTextField
        label="Commentaires additionnels"
        id="commentaires"
        value={commentaires}
        onChange={setCommentaires}
        placeholder="Notes supplémentaires ou considérations particulières."
      />

      {/* Section Upload de ressources multiples */}
      <div className="mb-6 border-t pt-6 border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Ressources Associées (Optionnel)</h3>
        {/* Utilisation du composant MultiFileUpload. Il gère son propre upload et nous donne un tableau d'URLs. */}
        <MultiFileUpload
          onUploadComplete={handleResourceUploadComplete} // Le callback qui recevra le tableau d'URLs
          disabled={saving} // Désactive l'upload si la sauvegarde de l'activité est en cours
        />

        {ressourceUrls.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">URLs des fichiers chargés :</p>
            <ul className="list-disc list-inside text-sm text-blue-600 break-all">
              {ressourceUrls.map((url, index) => (
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

      {/* Messages d’erreur / succès */}
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
          onClick={handleSave}
          disabled={saving} // Désactivé si la sauvegarde est en cours
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