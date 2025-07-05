// 📁 Fichier : ActivityEditorPage.tsx
// Charger une activité (édition)
// Créer une nouvelle activité
// Enregistrer une activité
// Supprimer une activité
//src\components\planipeda\pages\ActivityEditorPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ActivityEditor, { Activity } from "@/components/planipeda/ScenarioEditor/ActivityEditor";
import { supabase } from "@/backend/config/supabase";

const ActivityEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  // État local de l’activité
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
    objectifs: [],
  });

  // Chargement d’une activité existante (mode édition)
  useEffect(() => {
    if (!isEditMode || !id) {
      // Mode création : reset activity à l'état initial
      setActivity({
        id: 0,
        titre: "",
        consigne: "",
        support: "",
        duree: "",
        type: "",
        modalite: "",
        evaluation: "",
        roleEnseignement: "",
        objectifs: [],
      });
      return;
    }

    const fetchActivity = async () => {
      try {
        const { data: activiteData, error: activiteError } = await supabase
          .from("activites")
          .select("*")
          .eq("id", id)
          .single();

        if (activiteError) throw activiteError;
        if (!activiteData) throw new Error("Activité introuvable");

        const { data: objectifsData, error: objectifsError } = await supabase
          .from("activite_objectifs")
          .select("objectif_id")
          .eq("activite_id", id);

        if (objectifsError) throw objectifsError;

        const objectifIds = objectifsData?.map((o) => o.objectif_id) ?? [];

        setActivity({
          ...activiteData,
          objectifs: objectifIds,
        });
      } catch (error) {
        console.error("❌ Erreur chargement activité :", error);
        // Optionnel : afficher un message à l'utilisateur ou rediriger
      }
    };

    fetchActivity();
  }, [id, isEditMode]);

  // Mise à jour locale depuis <ActivityEditor>
  const handleUpdate = (updated: Activity) => {
    setActivity(updated);
  };

  // Enregistrement (création ou édition)
  const handleSave = async () => {
    try {
      let savedActivityId = activity.id;

      if (isEditMode) {
        const { error } = await supabase
          .from("activites")
          .update({
            titre: activity.titre,
            consigne: activity.consigne,
            support: activity.support,
            duree: activity.duree,
            type: activity.type,
            modalite: activity.modalite,
            evaluation: activity.evaluation,
            roleEnseignement: activity.roleEnseignement,
            updated_at: new Date().toISOString(),
          })
          .eq("id", activity.id);

        if (error) throw error;

        // Supprimer puis réinsérer les objectifs liés
        const { error: delError } = await supabase
          .from("activite_objectifs")
          .delete()
          .eq("activite_id", activity.id);
        if (delError) throw delError;
      } else {
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
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error("Erreur lors de l'insertion");

        savedActivityId = data.id;
      }

      // Ajout des liens vers les objectifs
      if (activity.objectifs && activity.objectifs.length > 0) {
        const objectifLinks = activity.objectifs.map((objectif_id) => ({
          activite_id: savedActivityId,
          objectif_id,
        }));

        const { error: linkError } = await supabase
          .from("activite_objectifs")
          .insert(objectifLinks);

        if (linkError) throw linkError;
      }

      navigate("/activites");
    } catch (error) {
      console.error("❌ Erreur sauvegarde activité :", error);
      // Optionnel : message d'erreur utilisateur
    }
  };

  // Suppression
  const handleDelete = async () => {
    if (window.confirm("🗑️ Supprimer cette activité ?")) {
      try {
        const { error } = await supabase
          .from("activites")
          .delete()
          .eq("id", activity.id);

        if (error) throw error;

        const { error: delObjError } = await supabase
          .from("activite_objectifs")
          .delete()
          .eq("activite_id", activity.id);

        if (delObjError) throw delObjError;

        navigate("/activites");
      } catch (error) {
        console.error("❌ Erreur suppression activité :", error);
      }
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? "Modifier l'activité" : "Créer une nouvelle activité"}
      </h1>

      <ActivityEditor
        initialData={activity}
        onSaved={handleSave}
        onDelete={isEditMode ? handleDelete : undefined}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default ActivityEditorPage;
