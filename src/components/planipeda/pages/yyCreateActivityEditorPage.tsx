// 📁 CreateActivityEditorPage.tsx
// 🔧 Page pour créer une nouvelle activité pédagogique
// 📍 Chemin : src/components/planipeda/pages/CreateActivityEditorPage.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Important : Nous devrons modifier CreateActivityEditor.tsx pour qu'il accepte les props
// 'initialData' et 'onUpdate' comme un composant contrôlé.
import CreateActivityEditor from "@/components/planipeda/ScenarioEditor/CreateActivityEditor";
import { supabase } from "@/backend/config/supabase";

// ---
// ✅ Interface locale représentant une activité pédagogique
// Les noms des champs doivent correspondre aux noms exacts des colonnes dans votre table 'activites'
// ---
interface ActivityData {
  id?: number; // L'ID sera généré par Supabase, donc optionnel à l'insertion
  chapitre_id: number | null; // Ajouté pour la sélection hiérarchique
  titre_activite: string; // Nom exact de la colonne dans Supabase
  description: string; // Nom exact de la colonne
  role_enseignant: string; // Nom exact de la colonne
  materiel: string; // Nom exact de la colonne
  duree_minutes: number | null; // Nom exact de la colonne, type number | null
  modalite_deroulement: string; // Nom exact de la colonne
  modalite_evaluation: string; // Nom exact de la colonne
  commentaires: string; // Nom exact de la colonne
  ressource_urls: string[]; // CORRECTION MAJEURE ICI : Nom au pluriel et type tableau de chaînes
  objectifs: number[]; // Liste des IDs des objectifs associés
}

const CreateActivityEditorPage: React.FC = () => {
  const navigate = useNavigate();

  // ---
  // 📌 État local contenant les données de la nouvelle activité à créer
  // Initialisation avec des valeurs par défaut correspondant à l'interface
  // ---
  const [activity, setActivity] = useState<ActivityData>({
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

  // ---
  // 🔄 Mise à jour de l'état local 'activity'
  // Cette fonction sera passée au composant enfant (CreateActivityEditor)
  // pour qu'il puisse notifier le parent des changements dans le formulaire.
  // ---
  const handleUpdate = (updatedFields: Partial<ActivityData>) => {
    setActivity((prevActivity) => ({
      ...prevActivity,
      ...updatedFields,
    }));
  };

  // ---
  // 💾 Fonction pour sauvegarder l’activité dans la base Supabase
  // Cette fonction est appelée lorsque CreateActivityEditor signale qu'il est prêt à sauvegarder
  // (via le prop onSaved, qui est déclenché par un bouton de soumission dans CreateActivityEditor)
  // ---
// Dans CreateActivityEditorPage.tsx

const handleSave = async () => {
    console.log("🟡 Début de la fonction handleSave.");
    console.log("🟡 État actuel de 'activity' avant validation :", activity);

    // Validation des champs côté parent, en complément de celle de l'enfant
    if (!activity.chapitre_id) {
        alert("Veuillez sélectionner un chapitre.");
        console.warn("🚫 Validation échouée : Chapitre non sélectionné.");
        return;
    }
    if (activity.objectifs.length === 0) {
        alert("Veuillez sélectionner au moins un objectif.");
        console.warn("🚫 Validation échouée : Aucun objectif sélectionné.");
        return;
    }
    if (!activity.titre_activite.trim()) {
        alert("Le titre de l’activité est obligatoire.");
        console.warn("🚫 Validation échouée : Titre de l'activité vide.");
        return;
    }

    console.log("✅ Validation initiale réussie.");

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
            // C'est le point clé : s'assurer que ressource_urls est bien un tableau de strings
            ressource_urls: activity.ressource_urls && activity.ressource_urls.length > 0
                ? activity.ressource_urls
                : null,
            created_at: new Date().toISOString(),
        };

        console.log("🔵 Données prêtes pour l'insertion dans 'activites' :", dataToInsert);
        console.log("🔵 Valeur de ressource_urls dans dataToInsert :", dataToInsert.ressource_urls);


        // 1. Insertion de l'activité dans la table `activites`
        const { data, error } = await supabase
            .from("activites")
            .insert(dataToInsert)
            .select()
            .single();

        if (error) {
            console.error("❌ Erreur Supabase lors de l'insertion de l'activité :", error);
            throw error;
        }
        if (!data) {
            console.error("❌ Erreur : Aucune donnée retournée après l'insertion de l'activité.");
            throw new Error("Erreur lors de la création de l'activité. ID non retourné.");
        }

        console.log("🟢 Activité insérée avec succès. Données retournées par Supabase :", data);
        console.log("🟢 ID de la nouvelle activité :", data.id);

        // 2. Insertion des liens vers les objectifs dans la table de jointure `activite_objectifs`
        if (activity.objectifs.length > 0) {
            const relations = activity.objectifs.map((objectif_id) => ({
                activite_id: data.id, // Utilise l'ID de l'activité nouvellement créée
                objectif_id: objectif_id,
            }));

            console.log("🔵 Relations objectifs-activité à insérer :", relations);

            const { error: linkError } = await supabase
                .from("activite_objectifs")
                .insert(relations);

            if (linkError) {
                console.error("❌ Erreur Supabase lors de l'insertion des liens objectifs :", linkError);
                throw linkError;
            }
            console.log("🟢 Liens objectifs-activité insérés avec succès.");
        } else {
            console.log("ℹ️ Aucun objectif à lier (le tableau 'objectifs' est vide).");
        }

        // ✅ Redirection vers la page de liste des activités après succès
        console.log("🎉 Activité sauvegardée avec succès ! Redirection vers /activites...");
        navigate("/activites");

    } catch (err: any) {
        console.error("🔥 Erreur globale lors de la sauvegarde de l’activité :", err);
        alert("Erreur lors de la sauvegarde : " + (err.message || "Une erreur inconnue est survenue."));
    }
};

  // ---
  // ⬅️ Gestion de l'annulation
  // ---
  const handleCancel = () => {
    navigate(-1); // Revenir à la page précédente
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Créer une nouvelle activité</h1>

      {/* 🧩 Composant de formulaire de création d’activité */}
      {/* Nous lui passons l'état actuel et le callback pour le mettre à jour. */}
      <CreateActivityEditor
        initialData={activity} // Passe l'état actuel de l'activité au formulaire
        onUpdate={handleUpdate} // Permet au formulaire de mettre à jour l'état du parent
        onSaveTrigger={handleSave} // Renommé pour éviter la confusion avec le "onSaved" de l'enfant qui signale le succès
        onCancel={handleCancel}
      />
    </div>
  );
};

export default CreateActivityEditorPage;