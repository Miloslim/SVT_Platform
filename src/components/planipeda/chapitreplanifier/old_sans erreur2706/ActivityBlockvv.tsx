import React, { useState, useEffect, forwardRef } from 'react';
import { supabase } from '@/backend/config/supabase';
import { SequenceItem } from '@/types/sequences'; // adapte selon ton type
import { Activity } from 'lucide-react';

interface MasterActivityDetails {
  titre: string;
  description: string;
  modalites: string;
  ressources: string;
  role_enseignant: string;
  modalite_evaluation: string;
  commentaires: string;
  objectifs: string[];
}

interface ActivityBlockProps {
  activity: SequenceItem;
  onUpdate: (updatedActivity: SequenceItem) => void;
  onDelete: () => void;
  onEditMasterActivity?: (activityId: number, localActivityId: string) => void;
  refreshTrigger: number;
}

const ActivityBlock = forwardRef<HTMLDivElement, ActivityBlockProps>(
  ({ activity, onUpdate, onDelete, onEditMasterActivity, refreshTrigger }, ref) => {
    const [masterDetails, setMasterDetails] = useState<MasterActivityDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isMasterLinked = typeof activity.sourceId === 'number';

    useEffect(() => {
      if (!isMasterLinked) {
        setIsLoading(false);
        setError(null);
        setMasterDetails(null);
        return;
      }

      const fetchMasterActivityDetails = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const { data, error: fetchError } = await supabase
            .from('activities')
            .select(`
              id,
              titre,
              description,
              modalites,
              ressources,
              role_enseignant,
              modalite_evaluation,
              commentaires,
              objectifs(description_objectif)
            `)
            .eq('id', activity.sourceId)
            .single();

          if (fetchError) throw fetchError;

          setMasterDetails({
            titre: data.titre || '',
            description: data.description || '',
            modalites: data.modalites || '',
            ressources: data.ressources || '',
            role_enseignant: data.role_enseignant || '',
            modalite_evaluation: data.modalite_evaluation || '',
            commentaires: data.commentaires || '',
            objectifs: data.objectifs?.map((o: any) => o.description_objectif).filter(Boolean) || [],
          });
        } catch (err: any) {
          console.error('Erreur chargement activité maître:', err);
          setError(err.message || 'Erreur inconnue');
        } finally {
          setIsLoading(false);
        }
      };

      fetchMasterActivityDetails();
    }, [activity.sourceId, isMasterLinked, refreshTrigger]);

    const handleDeleteClick = () => {
      if (
        window.confirm(
          `Êtes-vous sûr de vouloir supprimer l'activité "${masterDetails?.titre || 'cette activité'}" ?`
        )
      ) {
        onDelete();
      }
    };

    const handleEditMasterActivity = () => {
      if (isMasterLinked && activity.sourceId && onEditMasterActivity) {
        onEditMasterActivity(activity.sourceId, activity.id);
      } else {
        alert("Impossible de modifier : activité non liée ou callback manquant.");
      }
    };

    if (isLoading) {
      return (
        <div
          ref={ref}
          className="bg-white p-4 rounded-lg shadow-md mb-4 border-l-4 border-green-500 text-center text-gray-700"
        >
          Chargement de l'activité...
        </div>
      );
    }

    if (error && isMasterLinked) {
      return (
        <div
          ref={ref}
          className="bg-red-100 p-4 rounded-lg shadow-md mb-4 border-l-4 border-red-500 text-center text-red-700"
        >
          Erreur : {error}
        </div>
      );
    }

return (
  <div ref={ref} className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-green-500">
    {/* En-tête avec titre et bouton supprimer */}
    <div className="flex justify-between items-center mb-5">
      <h3 className="text-2xl font-bold text-gray-800">{masterDetails?.titre || 'Activité non liée'}</h3>
      <button
        onClick={handleDeleteClick}
        title="Supprimer l'activité"
        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
      >
        🗑️
      </button>
    </div>

    {/* Objectifs spécifiques */}
    <section className="mb-6">
      <h4 className="text-lg font-semibold text-green-800 mb-2">🎯 Objectifs spécifiques</h4>
      {masterDetails?.objectifs.length ? (
        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
          {masterDetails.objectifs.map((obj, i) => (
            <li key={i}>{obj}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 text-sm">Aucun objectif spécifique associé.</p>
      )}
    </section>

    {/* Rôles et durée en grille */}
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Rôle de l’apprenant = Modalités */}
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-2">🎓 Rôle de l'apprenant (modalités)</h4>
        <p className="text-gray-700 whitespace-pre-wrap">{masterDetails?.modalites || 'Non renseigné.'}</p>
      </div>

      {/* Rôle de l’enseignant */}
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-2">👩‍🏫 Rôle de l’enseignant</h4>
        <p className="text-gray-700 whitespace-pre-wrap">{masterDetails?.role_enseignant || 'Non renseigné.'}</p>
      </div>

      {/* Durée estimée */}
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-2">⏱️ Durée estimée (minutes)</h4>
        <p className="text-gray-700">{activity.dureeEstimeeMinutes ?? 'Non renseigné.'}</p>
      </div>
    </section>

    {/* Bouton modifier */}
    <div>
      <button
        onClick={handleEditMasterActivity}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition"
      >
        Modifier l'activité maître
      </button>
    </div>
  </div>
);

  }
);

export default ActivityBlock;
