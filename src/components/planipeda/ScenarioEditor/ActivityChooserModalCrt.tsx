// Nom du fichier: ActivityChooserModal.tsx
// Chemin: src/components/planipeda/ScenarioEditor/ActivityChooserModal.tsx

// Fonctionnalités:
// Ce composant sert de "hub" ou de "gestionnaire" pour l'ajout d'activités à une séquence.
// Il permet à l'utilisateur de choisir entre deux modes:
// 1. Créer une nouvelle activité: Affiche le formulaire CreateInsertActivityEditor.
// 2. Sélectionner une activité existante: Affiche le composant ActivitySelector (pour la recherche et la sélection).
// Il gère la logique de sauvegarde des nouvelles activités vers Supabase et transmet
// les activités choisies (nouvelles ou existantes) à son composant parent (CreateSequenceEditor),
// incluant désormais plus de détails (description, objectifs).

import React, { useState, useEffect } from 'react';
import CreateInsertActivityEditor from './CreateInsertActivityEditor';
import ActivitySelector from './ActivitySelector';
import { supabase } from '@/backend/config/supabase';
import { ActivityData } from '@/types/activity'; // Assurez-vous que ce type est correctement défini

// Interface pour les données des objectifs (utilisée pour la récupération des descriptions)
interface ObjectiveDescription {
  id: number;
  description_objectif: string;
}

interface ActivityChooserModalCrtProps {
  // MODIFIÉ : onActivityAdded passe désormais la description et les objectifs pour les activités
  onActivityAdded: (activityId: number, activityTitle: string, description: string, objectifs: string[]) => void;
  onClose: () => void;
  chapitreId?: number | null;
  niveauId?: number | null;
  optionId?: number | null;
  uniteId?: number | null;
}

const ActivityChooserModalCrt: React.FC<ActivityChooserModalCrtProps> = ({
  onActivityAdded,
  onClose,
  chapitreId,
  niveauId,
  optionId,
  uniteId
}) => {
  const [currentView, setCurrentView] = useState<'create' | 'select'>('create');

  const [newActivityData, setNewActivityData] = useState<Partial<ActivityData>>({
    titre_activite: '',
    description: "",
    role_enseignant: "",
    modalite_deroulement: "",
    materiel: "",
    duree_minutes: null,
    modalite_evaluation: "",
    commentaires: "",
    ressource_urls: [],
    objectifs: [], // Cet état contient les IDs des objectifs
    niveau_id: niveauId,
    option_id: optionId,
    unite_id: uniteId,
    chapitre_id: chapitreId,
  });
  const [isSavingNewActivity, setIsSavingNewActivity] = useState(false);
  const [newActivityError, setNewActivityError] = useState<string | null>(null);
  const [newActivitySuccess, setNewActivitySuccess] = useState<string | null>(null);

  const handleNewActivityUpdate = (updatedFields: Partial<ActivityData>) => {
    setNewActivityData(prev => ({ ...prev, ...updatedFields }));
    setNewActivityError(null);
    setNewActivitySuccess(null);
  };

  const handleNewActivitySaveTrigger = async () => {
    setIsSavingNewActivity(true);
    setNewActivityError(null);
    setNewActivitySuccess(null);

    try {
      if (!newActivityData.chapitre_id) {
        throw new Error("Veuillez sélectionner un chapitre.");
      }
      if (!newActivityData.titre_activite || newActivityData.titre_activite.trim() === "") {
        throw new Error("Le titre de l’activité est obligatoire.");
      }
      if (!newActivityData.objectifs || newActivityData.objectifs.length === 0) {
          throw new Error("Veuillez sélectionner au moins un objectif.");
      }

      const dataToInsert = {
        chapitre_id: newActivityData.chapitre_id,
        titre_activite: newActivityData.titre_activite.trim(),
        description: newActivityData.description?.trim() || null,
        role_enseignant: newActivityData.role_enseignant?.trim() || null,
        materiel: newActivityData.materiel?.trim() || null,
        duree_minutes: newActivityData.duree_minutes,
        modalite_deroulement: newActivityData.modalite_deroulement?.trim() || null,
        modalite_evaluation: newActivityData.modalite_evaluation?.trim() || null,
        commentaires: newActivityData.commentaires?.trim() || null,
        ressource_urls: (newActivityData.ressource_urls && newActivityData.ressource_urls.length > 0)
                              ? newActivityData.ressource_urls
                              : null,
        created_at: new Date().toISOString(),
      };

      const { data: newActivity, error: insertError } = await supabase
        .from("activites")
        .insert(dataToInsert)
        .select()
        .single();

      if (insertError) {
        console.error("❌ Erreur Supabase lors de l'insertion de l'activité :", insertError);
        throw insertError;
      }
      if (!newActivity || !newActivity.id) {
        console.error("❌ Erreur : Aucune donnée ou ID non retourné après l'insertion de l'activité.");
        throw new Error("Erreur lors de la création de l'activité. ID non retourné.");
      }

      // Récupérer les descriptions des objectifs après la création de l'activité
      let objectiveDescriptions: string[] = [];
      if (newActivityData.objectifs && newActivityData.objectifs.length > 0) {
        const { data: objectivesData, error: objectivesError } = await supabase
          .from('objectifs')
          .select('description_objectif')
          .in('id', newActivityData.objectifs);

        if (objectivesError) {
          console.error("Erreur lors de la récupération des descriptions d'objectifs:", objectivesError);
          // Ne pas bloquer la création de l'activité, mais noter l'erreur
        } else {
          objectiveDescriptions = objectivesData?.map(obj => obj.description_objectif) || [];
        }
      }

      // 2. Insertion des liens vers les objectifs dans la table de jointure `activite_objectifs`
      if (newActivityData.objectifs && newActivityData.objectifs.length > 0) {
        const relations = newActivityData.objectifs.map((objectif_id) => ({
          activite_id: newActivity.id,
          objectif_id: objectif_id,
        }));

        const { error: relError } = await supabase
          .from("activite_objectifs")
          .insert(relations);

        if (relError) {
          console.error("❌ Erreur Supabase lors de l'insertion des liens objectifs :", relError);
          throw relError;
        }
      }

      setNewActivitySuccess("Activité enregistrée avec succès !");
      // MODIFIÉ : Passe la description et les objectifs (descriptions)
      onActivityAdded(newActivity.id, newActivity.titre_activite, newActivity.description || "", objectiveDescriptions);

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error("🔥 Erreur globale lors de la sauvegarde de l’activité :", err);
      setNewActivityError(err.message || "Une erreur inconnue est survenue lors de l'enregistrement.");
    } finally {
      setIsSavingNewActivity(false);
    }
  };

  useEffect(() => {
    if (newActivitySuccess) {
      const timer = setTimeout(() => setNewActivitySuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [newActivitySuccess]);

  // MODIFIÉ : handleExistingActivitySelected accepte la description et les objectifs
  const handleExistingActivitySelected = (activityId: number, activityTitle: string, description: string, objectifs: string[]) => {
    onActivityAdded(activityId, activityTitle, description, objectifs); // Passe les paramètres supplémentaires
    onClose();
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Ajouter une Activité</h2>

      <div className="flex justify-center gap-4 mb-6">
        <button
          type="button" // <<<< C'est la CORRECTION ici !
          className={`px-6 py-2 rounded-md transition-colors font-medium ${
            currentView === 'create' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setCurrentView('create')}
        >
          Créer une nouvelle activité
        </button>
        <button
          type="button" // <<<< Et ici aussi !
          className={`px-6 py-2 rounded-md transition-colors font-medium ${
            currentView === 'select' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setCurrentView('select')}
        >
          Sélectionner une activité existante
        </button>
      </div>

      {currentView === 'create' && (
        <CreateInsertActivityEditor
          initialData={newActivityData}
          onUpdate={handleNewActivityUpdate}
          onSaveTrigger={handleNewActivitySaveTrigger}
          onCancel={onClose}
          saving={isSavingNewActivity}
          error={newActivityError}
          successMessage={newActivitySuccess}
          onSuccessRedirectPath={undefined}
          niveauIdParent={niveauId}
          optionIdParent={optionId}
          uniteIdParent={uniteId}
          chapitreIdParent={chapitreId}
        />
      )}

      {currentView === 'select' && (
        <ActivitySelector
          onActivitySelected={handleExistingActivitySelected}
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

export default ActivityChooserModalCrt;
