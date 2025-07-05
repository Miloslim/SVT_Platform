// 📁 src/components/planipeda/chapitreplanifier/ActivityBlock.tsx

import React, { useState, useEffect, forwardRef } from 'react';
import { PlanActivity } from '@/types/planificationTypes';
import { supabase } from '@/backend/config/supabase';
import { ActiviteDb } from '@/types/dbTypes';
import { Lightbulb } from 'lucide-react';

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
  onEditMasterActivity?: (activityId: number, planActivityId: string) => void;
  activityRefreshTrigger: number; // Prop pour forcer le rafraîchissement
  // isMinimized?: boolean; // SUPPRIMÉ: Cette prop n'est plus nécessaire ici
}

const ActivityBlock = forwardRef<HTMLDivElement, ActivityBlockProps>(({ activity, onUpdate, onDelete, onEditMasterActivity, activityRefreshTrigger }, ref) => {
  const [masterDetails, setMasterDetails] = useState<MasterActivityDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Détermine si c'est une activité "liée à une maître" ou une activité "vierge"
  const isMasterLinked = typeof activity.sourceId === 'number';

  useEffect(() => {
    if (!isMasterLinked) {
      setIsLoading(false);
      setError(null);
      setMasterDetails(null); // Clear previous master details for unlinked items
      return;
    }

    const fetchMasterActivityDetails = async () => {
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
        } else {
            setError("Aucune activité maître trouvée pour cet ID source.");
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement des détails de l'activité maître:", err);
        setError("Échec du chargement des détails de l'activité: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMasterActivityDetails();
  }, [activity.sourceId, isMasterLinked, activityRefreshTrigger]); // Dépendance ajoutée pour forcer le rafraîchissement

  // Utilise masterDetails si disponible, sinon utilise les props de l'activité (pour les activités vierges)
  const displayTitle = isMasterLinked ? masterDetails?.titre_activite : (activity as any).titre;
  const displayDescription = isMasterLinked ? masterDetails?.description : (activity as any).description;
  const displayDuration = isMasterLinked ? masterDetails?.duree_minutes : (activity as any).dureeEstimeeMinutes;
  const displayModalites = isMasterLinked ? masterDetails?.modalite_deroulement : (activity as any).modalites;
  const displayRoleEnseignant = isMasterLinked ? masterDetails?.role_enseignant : null;
  const displayMateriel = isMasterLinked ? masterDetails?.materiel : (activity as any).ressources;
  const displayObjectifs = isMasterLinked ? masterDetails?.objectifs_specifiques.map(o => o.description) : (activity as any).objectifsSpecifiquesIds?.map((id: number) => `Objectif ID: ${id}`);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Ce handleChange est uniquement actif pour les activités non liées à une maître
    if (!isMasterLinked) {
      const { name, value } = e.target;
      const newValue: string | number | null = name === 'dureeEstimeeMinutes' ? (value === '' ? null : Number(value)) : value;
      onUpdate({ ...activity, [name]: newValue } as PlanActivity); // Cast pour permettre les champs "vierges"
    } else {
        console.warn("Tentative de modifier directement une activité liée à une maître. Veuillez utiliser le bouton 'Modifier l'activité maître'.");
    }
  };

  const handleDeleteClick = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'activité "${displayTitle || 'cette activité'}" de la planification ?`)) {
      onDelete();
    }
  };

  const handleManageObjectives = () => {
    alert("Les objectifs sont gérés via l'édition de l'activité maître pour les activités liées, ou directement dans le champ de saisie pour les activités vierges.");
    console.log("Objectifs de l'activité maître (IDs):", masterDetails?.objectifs_specifiques.map(o => o.id));
  };

  const handleEditActivity = () => {
    if (isMasterLinked && activity.sourceId && onEditMasterActivity) {
      onEditMasterActivity(activity.sourceId, activity.id as string);
    } else {
      alert("Impossible de modifier: l'activité n'est pas une activité maître ou le callback d'édition est manquant.");
    }
  };

  if (isLoading) {
    return <div className="bg-white p-4 rounded-lg shadow-md mb-4 border-l-4 border-green-500 text-center text-gray-700">Chargement de l'activité...</div>;
  }

  if (error && isMasterLinked) {
    return <div className="bg-red-100 p-4 rounded-lg shadow-md mb-4 border-l-4 border-red-500 text-center text-red-700">Erreur: {error}</div>;
  }

  // Rendu de la vue complète
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
            name="titre"
            value={displayTitle || ''}
            onChange={handleChange}
            placeholder="Titre de l'activité"
            className="text-lg font-semibold w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            readOnly={isMasterLinked}
          />
        </div>
        <div className="ml-4 flex-shrink-0 w-32">
          <label htmlFor={`duree-${activity.id}`} className="block text-gray-700 font-bold mb-1">
            Durée (min):
          </label>
          <input
            id={`duree-${activity.id}`}
            type="text"
            name="dureeEstimeeMinutes"
            value={displayDuration ?? ''}
            onChange={handleChange}
            placeholder="Durée (min)"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
            readOnly={isMasterLinked}
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
        <label htmlFor={`description-${activity.id}`} className="block text-gray-700 font-bold mb-1">
          Description:
        </label>
        <textarea
          id={`description-${activity.id}`}
          name="description"
          value={displayDescription || ''}
          onChange={handleChange}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-sm resize-y"
          readOnly={isMasterLinked}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <label htmlFor={`modalites-${activity.id}`} className="block text-gray-700 font-bold mb-1">
            Modalités:
          </label>
          <textarea
            id={`modalites-${activity.id}`}
            name="modalites"
            value={displayModalites || ''}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-sm resize-y"
            readOnly={isMasterLinked}
          />
        </div>
        <div>
          <label htmlFor={`ressources-${activity.id}`} className="block text-gray-700 font-bold mb-1">
            Ressources / Matériel:
          </label>
          <textarea
            id={`ressources-${activity.id}`}
            name="ressources"
            value={displayMateriel || ''}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-sm resize-y"
            readOnly={isMasterLinked}
          />
        </div>
      </div>
        {/* Rôle de l'enseignant et Modalité d'évaluation s'affichent uniquement si liée à une maître */}
        {isMasterLinked && masterDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                    <label htmlFor={`role-enseignant-${activity.id}`} className="block text-gray-700 font-bold mb-1">
                        Rôle de l'Enseignant:
                    </label>
                    <textarea
                        id={`role-enseignant-${activity.id}`}
                        name="role_enseignant"
                        value={masterDetails.role_enseignant || ''}
                        rows={2}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-sm resize-y"
                        readOnly
                    />
                </div>
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
            </div>
        )}
        {isMasterLinked && masterDetails && (
            <div className="mb-3">
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
        )}

      <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
        <h3 className="text-md font-medium text-green-800 mb-2">🎯 Objectifs spécifiques :</h3>
        {displayObjectifs && displayObjectifs.length === 0 ? (
          <p className="text-gray-600 text-sm mb-2">Aucun objectif spécifique n'est associé à cette activité.</p>
        ) : (
          <ul className="list-disc list-inside text-gray-700 text-sm mb-2 space-y-1">
            {displayObjectifs?.map((obj, index) => (
              <li key={index}>{obj}</li>
            ))}
          </ul>
        )}
        {isMasterLinked && (
            <button
              onClick={handleEditActivity}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
            >
              Modifier l'activité maître
            </button>
        )}
        {!isMasterLinked && (
            <button
              onClick={handleManageObjectives}
              className="mt-2 bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded text-sm focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
            >
              Gérer les objectifs (local)
            </button>
        )}
      </div>
    </div>
  );
});

export default ActivityBlock;
