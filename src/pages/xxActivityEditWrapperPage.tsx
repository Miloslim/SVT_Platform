// src/pages/ActivityEditWrapperPage.tsx

import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import EditActivityEditor from "@/components/planipeda/ScenarioEditor/EditActivityEditor";

/**
 * Composant wrapper pour l'édition d'une activité maître.
 * Il détermine le chemin de redirection après sauvegarde en fonction de l'origine de la navigation.
 */
const ActivityEditWrapperPage: React.FC = () => {
  const { id: activityIdParam } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const activityId = activityIdParam ? parseInt(activityIdParam, 10) : undefined;

  const { fromChapitreFicheId, editedPlanActivityId } = (location.state as { fromChapitreFicheId?: string; editedPlanActivityId?: string }) || {};

  if (activityId === undefined || isNaN(activityId)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur :</strong>
          <span className="block sm:inline"> ID d'activité non valide ou manquant pour l'édition.</span>
          <button onClick={() => navigate(-1)} className="ml-4 text-red-700 hover:text-red-900 font-bold">
            Retour
          </button>
        </div>
      </div>
    );
  }

  const handleActivitySaved = () => {
    if (fromChapitreFicheId && editedPlanActivityId) {
      navigate(`/planipeda/chapitre/planifier/${fromChapitreFicheId}`, {
        state: { 
          scrollToItemId: editedPlanActivityId, 
          justEditedActivity: true 
        } 
      });
    } else {
      navigate("/planipeda/activites");
    }
  };

  const handleActivityCancel = () => {
    if (fromChapitreFicheId) {
      navigate(`/planipeda/chapitre/planifier/${fromChapitreFicheId}`);
    } else {
      navigate("/planipeda/activites");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Édition de l'Activité Maître
      </h1>
      <EditActivityEditor
        activityId={activityId}
        onSaved={handleActivitySaved}
        onCancel={handleActivityCancel}
      />
    </div>
  );
};

export default ActivityEditWrapperPage;
