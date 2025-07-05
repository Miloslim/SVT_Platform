// Nom du fichier: CreateInsertActivityEditor.tsx
// Chemin: src/components/planipeda/ScenarioEditor/CreateInsertActivityEditor.tsx
// Fonctionnalités :
// - Formulaire complet pour la création/édition d'une activité pédagogique.
// - Harmonisé avec les libellés, variables et la structure de "CreateActivityEditor.tsx" (ancienne référence).
// - UTILISE LE COMPOSANT HierarchicalSelector pour la sélection hiérarchique.
// - Les sélecteurs Niveau, Option, Unité, Chapitre sont DÉSACTIVÉS si pré-remplis par les props parentales.
// - La section des objectifs déjà liés est déplacée en bas et est non-interactive.
// - La sélection des objectifs via cases à cocher dans HierarchicalSelector reste interactive.
// - Utilise le sous-composant LongTextField pour les champs textuels étendus.
// - Utilise MultiFileUpload pour la gestion des ressources.
// - La gestion des données est entièrement déléguée au parent via initialData et onUpdate.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Nécessaire si onCancel est null et qu'on navigue en cas de succès
import HierarchicalSelector from './HierarchicalSelector';
import MultiFileUpload from './MultiFileUpload'; // Assurez-vous que ce composant existe
import { ActivityData } from '@/types/activity'; // Import de l'interface partagée
import { supabase } from '@/backend/config/supabase'; // Pour charger les descriptions des objectifs initiaux

interface Objectif { id: number; description: string; } // Interface locale pour les objectifs

// ---
// Sous-composant : LongTextField (issu de votre référence)
// ---
interface LongTextFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean; // Ajouté pour la cohérence
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
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || `Entrez ${label.toLowerCase()}...`}
      required={required}
    />
  </div>
);


// ---
// Propriétés du composant CreateInsertActivityEditor
// ---
interface CreateInsertActivityEditorProps {
  initialData: Partial<ActivityData>; // Garde Partial car la création peut avoir des champs vides
  onUpdate: (updatedFields: Partial<ActivityData>) => void;
  onSaveTrigger: () => void;
  onCancel?: () => void; // Optionnel
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  onSuccessRedirectPath?: string;

  // PROPS pour les IDs parent (utilisés pour désactiver les sélecteurs hiérarchiques)
  niveauIdParent?: number | null;
  optionIdParent?: number | null;
  uniteIdParent?: number | null;
  chapitreIdParent?: number | null;
}

// ============================================================
// Composant principal : CreateInsertActivityEditor
// ============================================================
const CreateInsertActivityEditor: React.FC<CreateInsertActivityEditorProps> = ({
  initialData,
  onUpdate,
  onSaveTrigger,
  onCancel,
  saving,
  error,
  successMessage,
  onSuccessRedirectPath,
  niveauIdParent,
  optionIdParent,
  uniteIdParent,
  chapitreIdParent
}) => {
  const navigate = useNavigate();
  // L'état local est maintenu UNIQUEMENT pour les descriptions des objectifs déjà liés
  const [initialObjectiveDescriptions, setInitialObjectiveDescriptions] = useState<Objectif[]>([]);

  // Déterminez si les sélecteurs doivent être désactivés par le parent
  const disableNiveauSelectByParent = niveauIdParent !== null && niveauIdParent !== undefined;
  const disableOptionSelectByParent = optionIdParent !== null && optionIdParent !== undefined;
  const disableUniteSelectByParent = uniteIdParent !== null && uniteIdParent !== undefined;
  const disableChapitreSelectByParent = chapitreIdParent !== null && chapitreIdParent !== undefined;

  // Effet pour la redirection après succès (comme dans votre référence)
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
      if (initialData.objectifs && initialData.objectifs.length > 0) {
        try {
          const { data: objectivesData, error: objectivesError } = await supabase
            .from('objectifs')
            .select('id, description_objectif')
            .in('id', initialData.objectifs);

          if (objectivesError) {
            throw objectivesError;
          }
          setInitialObjectiveDescriptions(objectivesData?.map(obj => ({ id: obj.id, description: obj.description_objectif })) || []);
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


  // Gestionnaire de changement pour la sélection hiérarchique
  const handleSelectionChange = (selection: {
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
    chapitreId?: number | null;
    objectifIds?: number[];
  }) => {
    console.log("🔵 HierarchicalSelector - Sélection mise à jour reçue par CreateInsertActivityEditor:", selection);
    onUpdate({
      niveau_id: selection.niveauId,
      option_id: selection.optionId,
      unite_id: selection.uniteId,
      chapitre_id: selection.chapitreId,
      objectifs: selection.objectifIds || [], // S'assurer que les objectifs sont toujours un tableau
    });
  };

  // Callback pour la réception des URLs de ressources
  const handleResourceUploadComplete = (urls: string[] | null) => {
    console.log("🔵 MultiFileUpload - URLs reçues et passées à onUpdate :", urls);
    onUpdate({ ressource_urls: urls || [] });
  };

  // Gestion de l'annulation/retour (comme dans votre référence)
  const handleBack = () => {
    console.log("ℹ️ Bouton Annuler cliqué.");
    if (onCancel) onCancel();
    else navigate(-1);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-2xl font-semibold mb-8 text-center text-gray-900">
        Saisir et modifier les éléments d'une activité d’apprentissage
      </h1>

      {/* Messages d’erreur / succès (déplacés en haut pour visibilité) */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md border border-green-200" role="alert">
          <p className="font-medium">Succès :</p>
          <p>{successMessage}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md border border-red-200" role="alert">
          <p className="font-medium">Erreur :</p>
          <p>{error}</p>
        </div>
      )}

      {/* Section : Contexte Pédagogique (Sélecteur hiérarchique) */}
      <div className="p-6 bg-blue-50 rounded-lg shadow-xl mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Contexte Pédagogique</h3>
        <HierarchicalSelector
          onChange={handleSelectionChange}
          // Passer les props initiales depuis initialData ou les props parentales pour l'édition/création contrainte
          initialNiveauId={niveauIdParent || initialData.niveau_id}
          initialOptionId={optionIdParent || initialData.option_id}
          initialUniteId={uniteIdParent || initialData.unite_id}
          initialChapitreId={chapitreIdParent || initialData.chapitre_id}
          initialObjectifIds={initialData.objectifs}
          showChapitre={true}
          showObjectifs={true}
          // Passage des props de désactivation pour les sélecteurs hiérarchiques
          disableNiveau={disableNiveauSelectByParent}
          disableOption={disableOptionSelectByParent}
          disableUnite={disableUniteSelectByParent}
          disableChapitre={disableChapitreSelectByParent}
        />
      </div>

      {/* Section : Détails de l'Activité (avec LongTextFields et Inputs standards) */}
      <div className="p-6 bg-blue-100 rounded-lg shadow-xl mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Détails de l'Activité</h3>
        
        {/* Titre de l'activité (Input standard) */}
        <div className="mb-5">
            <label htmlFor="titre_activite" className="block font-semibold mb-1 text-gray-700">
                Titre de l’activité <span className="text-red-600">*</span>
            </label>
            <input
                id="titre_activite"
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={initialData.titre_activite || ""}
                onChange={(e) => onUpdate({ titre_activite: e.target.value })}
                placeholder="Ex: Atelier sur la Photosynthèse"
                required
            />
        </div>

        {/* Description (LongTextField) */}
        <LongTextField
          label="Description"
          id="description"
          value={initialData.description || ""}
          onChange={(val) => onUpdate({ description: val })}
          rows={3} // Taille ajustée pour mieux coller à la description
          placeholder="Décrivez brièvement l'activité, ses objectifs spécifiques, etc."
        />

        {/* Rôle de l'enseignant (LongTextField) */}
        <LongTextField
          label="Rôle de l'enseignant"
          id="role_enseignant"
          value={initialData.role_enseignant || ""}
          onChange={(val) => onUpdate({ role_enseignant: val })}
          rows={2} // Taille ajustée
          placeholder="Décrivez les actions de l'enseignant pendant l'activité."
        />

        {/* Modalités de déroulement (LongTextField) */}
        <LongTextField
          label="Modalités de déroulement"
          id="modalite_deroulement"
          value={initialData.modalite_deroulement || ""}
          onChange={(val) => onUpdate({ modalite_deroulement: val })}
          rows={2} // Taille ajustée
          placeholder="Comment l'activité se déroule-t-elle étape par étape ?"
        />
      </div>

      {/* Section : Logistique de l'Activité (Matériel et Durée) */}
      <div className="p-6 bg-blue-50 rounded-lg shadow-xl mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Logistique de l'Activité</h3>
        
        {/* Matériel (LongTextField) */}
        <LongTextField
          label="Matériel"
          id="materiel"
          value={initialData.materiel || ""}
          onChange={(val) => onUpdate({ materiel: val })}
          rows={2} // Taille ajustée
          placeholder="Liste du matériel nécessaire (feuilles, crayons, ordinateur, etc.)."
        />

        {/* Durée (Input standard - comme dans votre référence) */}
        <div className="mb-5">
          <label htmlFor="duree_minutes" className="block font-semibold mb-1 text-gray-700">
            Durée estimée (en minutes)
          </label>
          <input
            id="duree_minutes"
            type="number"
            min={0}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={initialData.duree_minutes === null || initialData.duree_minutes === undefined ? "" : initialData.duree_minutes}
            onChange={(e) => {
              const val = e.target.value;
              onUpdate({ duree_minutes: val === "" ? null : Math.max(0, parseInt(val, 10)) });
            }}
            placeholder="Ex: 60"
          />
        </div>
      </div>

      {/* Section : Informations Complémentaires (Évaluation et Commentaires) */}
      <div className="p-6 bg-blue-100 rounded-lg shadow-xl mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Informations Complémentaires</h3>
        
        {/* Modalités d’évaluation (LongTextField) */}
        <LongTextField
          label="Modalités d’évaluation"
          id="modalite_evaluation"
          value={initialData.modalite_evaluation || ""}
          onChange={(val) => onUpdate({ modalite_evaluation: val })}
          rows={2} // Taille ajustée
          placeholder="Comment les apprentissages seront-ils évalués ?"
        />

        {/* Commentaires additionnels (LongTextField) */}
        <LongTextField
          label="Commentaires additionnels"
          id="commentaires"
          value={initialData.commentaires || ""}
          onChange={(val) => onUpdate({ commentaires: val })}
          rows={3} // Taille ajustée
          placeholder="Notes supplémentaires ou considérations particulières."
        />
      </div>

      {/* Section : Ressources Associées */}
      <div className="mb-6 p-6 bg-blue-50 rounded-lg shadow-xl border-t border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Ressources Associées (Optionnel)</h3>
        <MultiFileUpload
          onUploadComplete={handleResourceUploadComplete}
          disabled={saving}
          initialUrls={initialData.ressource_urls}
        />
      </div>

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
          onClick={onSaveTrigger}
          disabled={saving || !initialData.titre_activite || !initialData.chapitre_id} // Utilise initialData pour la validation
          className={`px-8 py-3 rounded-md text-white font-semibold shadow-md ${
            saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          } transition duration-150 ease-in-out`}
        >
          {saving ? "Enregistrement en cours..." : "Enregistrer l'activité"}
        </button>
      </div>

      {/* Section: Objectifs déjà liés à cette activité (non interactifs), en bas */}
      {(initialObjectiveDescriptions.length > 0) && (
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-md space-y-4 mt-8">
          <h3 className="font-bold text-gray-800 text-xl border-b border-gray-200 pb-3">Objectifs déjà liés à cette activité :</h3>
          <ul className="list-disc pl-7 space-y-2 text-gray-700">
            {initialObjectiveDescriptions.map(obj => (
              <li key={obj.id} className="text-base leading-relaxed">
                {obj.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CreateInsertActivityEditor;