// 📁 CreateActivityEditorPage.tsx
// 🔧 Page pour créer une nouvelle activité pédagogique
// 📍 Chemin : src/components/planipeda/pages/CreateActivityEditorPage.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateActivityEditor from "@/components/planipeda/ScenarioEditor/CreateActivityEditor";
import { supabase } from "@/backend/config/supabase";
import { ActivityData } from "@/types/activity"; // Import de l'interface partagée

const CreateActivityEditorPage: React.FC = () => {
  const navigate = useNavigate();

  // 📌 État local contenant les données de la nouvelle activité à créer
  const [activity, setActivity] = useState<ActivityData>({
    niveau_id: null, // Ajouté car utilisé dans l'interface ActivityData
    option_id: null, // Ajouté car utilisé dans l'interface ActivityData
    unite_id: null, // Ajouté car utilisé dans l'interface ActivityData
    chapitre_id: null,
    titre_activite: "",
    description: "",
    role_enseignant: "",
    materiel: "",
    duree_minutes: null,
    modalite_deroulement: "",
    modalite_evaluation: "",
    commentaires: "",
    ressource_urls: [], // Initialisé comme un tableau vide
    objectifs: [],
  });

  // États pour les messages de succès/erreur de la page parente
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ---
  // 🔄 Fonction de mise à jour de l'état 'activity'
  // Passée au composant enfant pour qu'il puisse notifier le parent des changements.
  // ---
  const handleUpdate = (updatedFields: Partial<ActivityData>) => {
    setActivity((prevActivity) => ({
      ...prevActivity,
      ...updatedFields,
    }));
  };

  // ---
  // 💾 Fonction pour sauvegarder l’activité dans la base Supabase
  // Déclenchée par le composant enfant via onSaveTrigger
  // ---
  const handleSave = async () => {
    // Réinitialise les messages d'erreur et de succès au début de la sauvegarde
    setError(null);
    setSuccessMessage(null);

    // ---
    // @subsection Validation des champs obligatoires
    // ---
    if (!activity.chapitre_id) {
      setError("Veuillez sélectionner un chapitre.");
      console.warn("🚫 Validation échouée : Chapitre non sélectionné."); // Garder ce warning
      return;
    }
    if (activity.objectifs.length === 0) {
      setError("Veuillez sélectionner au moins un objectif.");
      console.warn("🚫 Validation échouée : Aucun objectif sélectionné."); // Garder ce warning
      return;
    }
    if (!activity.titre_activite.trim()) {
      setError("Le titre de l’activité est obligatoire.");
      console.warn("🚫 Validation échouée : Titre de l'activité vide."); // Garder ce warning
      return;
    }

    setSaving(true); // Active l'état de sauvegarde

    try {
      // Préparation des données pour l'insertion
      const dataToInsert = {
        chapitre_id: activity.chapitre_id,
        titre_activite: activity.titre_activite.trim(),
        description: activity.description.trim() || null,
        role_enseignant: activity.role_enseignant.trim() || null,
        materiel: activity.materiel.trim() || null,
        duree_minutes: activity.duree_minutes,
        modalite_deroulement: activity.modalite_deroulement.trim() || null,
        modalite_evaluation: activity.modalite_evaluation.trim() || null,
        commentaires: activity.commentaires.trim() || null,
        ressource_urls: activity.ressource_urls.length > 0 ? activity.ressource_urls : null,
        created_at: new Date().toISOString(),
      };

      // 1. Insertion de l'activité dans la table `activites`
      const { data: newActivity, error: insertError } = await supabase
        .from("activites")
        .insert(dataToInsert)
        .select()
        .single();

      if (insertError) {
        console.error("❌ Erreur Supabase lors de l'insertion de l'activité :", insertError); // Garder cette erreur critique
        throw insertError;
      }
      if (!newActivity || !newActivity.id) {
        console.error("❌ Erreur : Aucune donnée ou ID non retourné après l'insertion de l'activité."); // Garder cette erreur critique
        throw new Error("Erreur lors de la création de l'activité. ID non retourné.");
      }

      // 2. Insertion des liens vers les objectifs dans la table de jointure `activite_objectifs`
      if (activity.objectifs.length > 0) {
        const relations = activity.objectifs.map((objectif_id) => ({
          activite_id: newActivity.id, // Utilise l'ID de l'activité nouvellement créée
          objectif_id: objectif_id,
        }));

        const { error: relError } = await supabase
          .from("activite_objectifs")
          .insert(relations);

        if (relError) {
          console.error("❌ Erreur Supabase lors de l'insertion des liens objectifs :", relError); // Garder cette erreur critique
          throw relError;
        }
      }

      // ✅ Succès de la sauvegarde
      setSuccessMessage("Activité enregistrée avec succès !");

      // La redirection sera gérée par le composant enfant CreateActivityEditor
      // grâce à la prop `onSuccessRedirectPath`.
      // Donc, nous retirons le setTimeout ici pour éviter une double redirection
      // ou un conflit si le parent gère aussi une redirection.
      // setTimeout(() => navigate("/planipeda/activites"), 1500); // Suppression

    } catch (err: any) {
      console.error("🔥 Erreur globale lors de la sauvegarde de l’activité :", err); // Garder cette erreur globale
      setError("Erreur : " + (err.message || "Une erreur inconnue est survenue."));
    } finally {
      setSaving(false); // La sauvegarde est terminée
    }
  };

  // Effet pour dissiper le message de succès après un délai
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000); // 3 secondes
      return () => clearTimeout(timer); // Nettoyage du timer
    }
  }, [successMessage]);

  // ---
  // ⬅️ Gestion de l'annulation
  // ---
  const handleCancel = () => {
    navigate("/planipeda/activites"); // Rediriger directement vers la page principale
  };

  return (
  <div className="p-6 space-y-8">
    {/* 🔙 Bouton Retour */}
    <div className="flex items-center mb-6">
      <button onClick={() => window.history.back()} 
         className="btn-outline mb-6 flex items-center gap-1">
        ← Retour à la liste des activités
      </button>
    </div>

    <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
      Créer une nouvelle activité d'apprentissage
    </h1>

    {/* Messages d’erreur / succès globaux */}
    {error && (
      <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md border border-red-200">
        <p className="font-medium">Erreur :</p>
        <p>{error}</p>
      </div>
    )}
    {successMessage && (
      <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md border border-green-200">
        <p className="font-medium">Succès :</p>
        <p>{successMessage}</p>
      </div>
    )}

    {/* 🧩 Formulaire de création d’activité */}
    <CreateActivityEditor
      initialData={activity}
      onUpdate={handleUpdate}
      onSaveTrigger={handleSave}
      onCancel={handleCancel}
      saving={saving}
      error={error}
      successMessage={successMessage}
      onSuccessRedirectPath="/planipeda/activites"
    />
  </div>
);

};

export default CreateActivityEditorPage;