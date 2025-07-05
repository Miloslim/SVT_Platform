// 📁 CreateActivityEditorPage_ancienneversion.tsx
// 🔧 Page pour créer une nouvelle activité pédagogique
// 📍 Chemin : src/components/planipeda/pages/CreateActivityEditorPage.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateActivityEditor from "@/components/planipeda/ScenarioEditor/CreateActivityEditor";
import { supabase } from "@/backend/config/supabase";

// ✅ Interface locale représentant une activité pédagogique
interface Activity {
  id: number;
  titre: string;
  consigne: string;
  support: string;
  duree: string;
  type: string;
  modalite: string;
  evaluation: string;
  roleEnseignement: string;
  ressource_url?: string; // 🌐 Optionnel : URL d'une ressource (fichier joint)
  objectifs: number[];     // 🧭 Liste des IDs des objectifs associés
}

const CreateActivityEditorPage: React.FC = () => {
  const navigate = useNavigate();

  // 📌 État local contenant les données de la nouvelle activité à créer
  const [activity, setActivity] = useState<Activity>({
    id: 0,
    titre: "",
    consigne: "",
    support: "",
    duree: "",
    type: "",
    modalite: "",
    evaluation: "",
    roleEnseignement: "",
    ressource_url: undefined, // ou "" si tu veux forcer une chaîne vide
    objectifs: [],
  });

  // 🔄 Mise à jour de l'état depuis le composant enfant (CreateActivityEditor)
  const handleUpdate = (updated: Activity) => {
    setActivity(updated);
  };

  // 💾 Fonction pour sauvegarder l’activité dans la base Supabase
  const handleSave = async () => {
    try {
      // 1. Insertion de l'activité dans la table `activites`
      const { data, error } = await supabase
        .from("activites")
        .insert([
          {
            titre: activity.titre,
            consigne: activity.consigne,
            support: activity.support,
            duree: activity.duree,
            type: activity.type,
            modalite: activity.modalite,
            evaluation: activity.evaluation,
            roleEnseignement: activity.roleEnseignement,
            ressource_url: activity.ressource_url ?? null,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Erreur lors de l'insertion");

      // 2. Insertion des liens vers les objectifs dans la table de jointure
      if (activity.objectifs.length > 0) {
        const objectifLinks = activity.objectifs.map((objectif_id) => ({
          activite_id: data.id,
          objectif_id,
        }));

        const { error: linkError } = await supabase
          .from("activite_objectifs")
          .insert(objectifLinks);

        if (linkError) throw linkError;
      }

      // ✅ Redirection vers la page de liste des activités
      navigate("/activites");
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde de l’activité :", error);
      // Optionnel : message d'erreur utilisateur via toast ou alerte
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Créer une nouvelle activité</h1>

      {/* 🧩 Composant de formulaire de création d’activité */}
      <CreateActivityEditor
        initialData={activity}
        onSaved={handleSave}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default CreateActivityEditorPage;
