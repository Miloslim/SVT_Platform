// src/components/planipeda/chapitreplanifier/ActivityBlock_v1.tsx

import React, { useState, useEffect, forwardRef } from 'react';
import { PlanActivity } from '@/types/planificationTypes';
import { supabase } from '@/backend/config/supabase';
import { ActiviteDb } from '@/types/dbTypes';
import { useNavigate } from 'react-router-dom';

/**
 * Interface pour les données de l'activité maître, récupérées pour l'affichage.
 */
interface MasterActivityDetails {
  titre_activite: string;
  description: string | null;
  duree_minutes: number | null;
  modalite_deroulement: string | null;
  role_enseignant: string | null;
  materiel: string | null;
  ressource_urls: string[] | null;
  modalite_evaluation: string | null;
  commentaires: string | null;
  objectifs_specifiques: { id: number; description: string }[];
}

interface ActivityBlockProps {
  activity: PlanActivity;
  onUpdate: (updatedActivity: PlanActivity) => void;
  onDelete: () => void;
}

const ActivityBlock = forwardRef<HTMLDivElement, ActivityBlockProps>(({ activity, onUpdate, onDelete }, ref) => {
  const [masterDetails, setMasterDetails] = useState<MasterActivityDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMasterActivityDetails = async () => {
      if (!activity.sourceId) {
        setError("L'activité n'a pas d'ID source valide pour récupérer ses détails.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('activites')
          .select(`
            id,
            titre_activite,
            description,
            duree_minutes,
            modalite_deroulement,
            role_enseignant,
            materiel,
            ressource_urls,
            modalite_evaluation,
            commentaires,
            activite_objectifs(
              objectifs(
                id,
                description_objectif
              )
            )
          `)
          .eq('id', activity.sourceId)
          .single<ActiviteDb & { activite_objectifs: { objectifs: { id: number; description_objectif: string; } | null }[] }>();

        if (error) {
          throw error;
        }

        if (data) {
          const objectives = (data.activite_objectifs || [])
            .map((ao: any) => ({
              id: ao.objectifs?.id,
              description: ao.objectifs?.description_objectif,
            }))
            .filter((obj): obj is { id: number; description: string } => obj.id !== null && obj.description !== null);

          setMasterDetails({
            titre_activite: data.titre_activite ?? "",
            description: data.description ?? null,
            duree_minutes: data.duree_minutes ?? null,
            modalite_deroulement: data.modalite_deroulement ?? null,
            role_enseignant: data.role_enseignant ?? null,
            materiel: data.materiel ?? null,
            ressource_urls: data.ressource_urls ?? null,
            modalite_evaluation: data.modalite_evaluation ?? null,
            commentaires: data.commentaires ?? null,
            objectifs_specifiques: objectives,
          });
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement des détails de l'activité maître:", err);
        setError("Échec du chargement des détails de l'activité: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMasterActivityDetails();
  }, [activity.sourceId]);

  const handleDeleteClick = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'activité "${masterDetails?.titre_activite || 'cette activité'}" de la planification ?`)) {
      onDelete();
    }
  };

  const handleManageObjectives = () => {
    alert("Les objectifs sont gérés dans le tableau de bord des activités maîtresses. Ici, ils sont en lecture seule.");
    console.log("Objectifs de l'activité maître (IDs):", masterDetails?.objectifs_specifiques.map(o => o.id));
  };

  const handleEditActivity = () => {
    if (activity.sourceId && activity.chapficheId) {
      navigate(`/planipeda/activites/${activity.sourceId}/edit`, {
        state: { 
          fromChapitreFicheId: activity.chapficheId,
          editedPlanActivityId: activity.id 
        }
      });
    } else {
      alert("Impossible de modifier: l'activité ou la fiche de chapitre n'a pas d'ID valide.");
    }
  };

  if (isLoading) {
    return <div className="bg-white p-4 rounded-lg shadow-md mb-4 border-l-4 border-green-500 text-center text-gray-700">Chargement de l'activité...</div>;
  }

  if (error) {
    return <div className="bg-red-100 p-4 rounded-lg shadow-md mb-4 border-l-4 border-red-500 text-center text-red-700">Erreur: {error}</div>;
  }

  if (!masterDetails) {
    return <div className="bg-yellow-100 p-4 rounded-lg shadow-md mb-4 border-l-4 border-yellow-500 text-center text-yellow-700">Aucune donnée trouvée pour cette activité. Vérifiez l'ID source.</div>;
  }

  return (
    <div ref={ref} className="bg-white p-4 rounded-lg shadow-md mb-4 border-l-4 border-green-500">
      <div className="flex justify-between items-center mb-3">
        <div className="flex-grow">
          <label htmlFor={`titre-${activity.id}`} className="block text-lg font-semibold text-gray-800 mb-1">
            Titre de l'activité:
          </label>
          <input
            id={`titre-${activity.id}`}
            type="text"
            name="titre_activite"
            value={masterDetails.titre_activite || ''}
            className="text-lg font-semibold w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            readOnly
          />
        </div>
        <div className="ml-4 flex-shrink-0 w-32">
          <label htmlFor={`duree-${activity.id}`} className="block text-gray-700 font-bold mb-1">
            Durée (min):
          </label>
          <input
            id={`duree-${activity.id}`}
            type="text"
            name="duree_minutes"
            value={masterDetails.duree_minutes ?? ''}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
            readOnly
          />
        </div>
        <button
          onClick={handleDeleteClick}
          className="ml-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-150 ease-in-out flex-shrink-0"
          title="Supprimer l'activité de la planification"
        >
          🗑️
        </button>
      </div>

      <div className="mb-3">
        <label htmlFor={`objectifs-${activity.id}`} className="block text-gray-700 font-bold mb-1">
          Objectifs d'apprentissage:
        </label>
        <div id={`objectifs-${activity.id}`} className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm">
          {masterDetails.objectifs_specifiques.length === 0 ? (
            <p className="text-gray-600">Aucun objectif associé.</p>
          ) : (
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              {masterDetails.objectifs_specifiques.map((obj) => (
                <li key={obj.id}>{obj.description}</li>
              ))}
            </ul>
          )}
          <button
            onClick={handleManageObjectives}
            className="mt-2 mr-2 bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded text-xs focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            Voir/Gérer les objectifs maîtres
          </button>
          <button
            onClick={handleEditActivity}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            Modifier l'activité maître
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <label htmlFor={`role-apprenant-${activity.id}`} className="block text-gray-700 font-bold mb-1">
            Déroulement (Rôle Apprenant):
          </label>
          <textarea
            id={`role-apprenant-${activity.id}`}
            name="modalite_deroulement"
            value={masterDetails.modalite_deroulement || ''}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-sm resize-y"
            readOnly
          />
        </div>
        <div>
          <label htmlFor={`role-enseignant-${activity.id}`} className="block text-gray-700 font-bold mb-1">
            Rôle de l'Enseignant:
          </label>
          <textarea
            id={`role-enseignant-${activity.id}`}
            name="role_enseignant"
            value={masterDetails.role_enseignant || ''}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-sm resize-y"
            readOnly
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <label htmlFor={`materiel-${activity.id}`} className="block text-gray-700 font-bold mb-1">
            Matériel Nécessaire:
          </label>
          <textarea
            id={`materiel-${activity.id}`}
            name="materiel"
            value={masterDetails.materiel || ''}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-sm resize-y"
            readOnly
          />
        </div>
        <div>
          <label htmlFor={`ressources-${activity.id}`} className="block text-gray-700 font-bold mb-1">
            Ressources Numériques:
          </label>
          <textarea
            id={`ressources-${activity.id}`}
            name="ressource_urls"
            value={(masterDetails.ressource_urls ? masterDetails.ressource_urls.join('\n') : '') || ''}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-sm resize-y"
            readOnly
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <label htmlFor={`eval-modalite-${activity.id}`} className="block text-gray-700 font-bold mb-1">
            Modalité d'Évaluation:
          </label>
          <input
            id={`eval-modalite-${activity.id}`}
            type="text"
            name="modalite_evaluation"
            value={masterDetails.modalite_evaluation || ''}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
            readOnly
          />
        </div>
        <div>
          <label htmlFor={`commentaires-${activity.id}`} className="block text-gray-700 font-bold mb-1">
            Commentaires:
          </label>
          <textarea
            id={`commentaires-${activity.id}`}
            name="commentaires"
            value={masterDetails.commentaires || ''}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-sm resize-y"
            readOnly
          />
        </div>
      </div>
    </div>
  );
});

export default ActivityBlock;
