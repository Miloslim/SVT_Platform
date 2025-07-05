// src/components/planipeda/ScenarioEditor/ActivityEditorModify.tsx
import React, { useEffect, useState } from "react";
import ActivityEditor from "../ActivityEditor";
import { supabase } from "@/backend/config/supabase";

interface Activity {
  id: number;
  chapitre_id: number | null;
  titre: string;
  description: string;
  roleEnseignant: string;
  materiel: string;
  duree_minutes: number | null;
  modaliteDeroulement: string;
  modaliteEvaluation: string;
  commentaires: string;
  objectifIds: number[];
}

const ActivityEditorModify: React.FC<{ activityId: number; onSaved?: () => void }> = ({
  activityId,
  onSaved,
}) => {
  const [initialData, setInitialData] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: activityData, error: errorActivity } = await supabase
          .from("activites")
          .select(
            `id, chapitre_id, titre_activite, description, role_enseignant, materiel, duree_minutes, modalite_deroulement, modalite_evaluation, commentaires`
          )
          .eq("id", activityId)
          .single();

        if (errorActivity) throw errorActivity;
        if (!activityData) throw new Error("Activité non trouvée.");

        const { data: objectifsData, error: errorObjectifs } = await supabase
          .from("activite_objectifs")
          .select("objectif_id")
          .eq("activite_id", activityId);

        if (errorObjectifs) throw errorObjectifs;

        const objectifIds = objectifsData ? objectifsData.map((obj) => obj.objectif_id) : [];

        const mappedData: Activity = {
          id: activityData.id,
          chapitre_id: activityData.chapitre_id,
          titre: activityData.titre_activite,
          description: activityData.description,
          roleEnseignant: activityData.role_enseignant,
          materiel: activityData.materiel,
          duree_minutes: activityData.duree_minutes,
          modaliteDeroulement: activityData.modalite_deroulement,
          modaliteEvaluation: activityData.modalite_evaluation,
          commentaires: activityData.commentaires,
          objectifIds,
        };

        setInitialData(mappedData);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement de l'activité.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId]);

  if (loading) return <p>Chargement de l'activité...</p>;
  if (error) return <p className="text-red-600">Erreur : {error}</p>;
  if (!initialData) return null;

  return <ActivityEditor initialData={initialData} onSaved={onSaved} />;
};

export default ActivityEditorModify;
