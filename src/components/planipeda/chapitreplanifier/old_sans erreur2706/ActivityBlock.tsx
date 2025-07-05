// src/components/planipeda/chapitreplanifier/ActivityBlock.tsx

import React, { useEffect, useState, forwardRef } from 'react';
import { Clock, Edit, Trash2 } from 'lucide-react';
import { PlanActivity } from '@/types/planificationTypes';
import { activitesService } from '@/services/activitesService';

interface ActivityBlockProps {
  activity: PlanActivity;
  onUpdate: (updatedActivity: PlanActivity) => void;
  onDelete: () => void;
  onEditMasterActivity?: (activityId: number, planActivityId: string) => void;
  activityRefreshTrigger: number;
}

const ActivityBlock = forwardRef<HTMLDivElement, ActivityBlockProps>(({
  activity,
  onUpdate,
  onDelete,
  onEditMasterActivity,
  activityRefreshTrigger,
}, ref) => {
  const [titre, setTitre] = useState<string>('Activité sans titre');
  const [duree, setDuree] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isLinked = typeof activity.sourceId === 'number' && activity.sourceId > 0;

  useEffect(() => {
    const fetchData = async () => {
      if (!isLinked) {
        setError("Activité non liée à une activité maître.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await activitesService.getActivityById(activity.sourceId);

      if (error) {
        setError("Erreur de chargement de l'activité.");
      } else if (data) {
        setTitre(data.titre_activite || 'Sans titre');
        setDuree(data.duree_minutes ?? null);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [activity.sourceId, activityRefreshTrigger]);

  const handleDelete = () => {
    if (confirm(`Supprimer l'activité "${titre}" ?`)) onDelete();
  };

  const handleEdit = () => {
    if (onEditMasterActivity && activity.sourceId) {
      onEditMasterActivity(activity.sourceId, activity.id as string);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded shadow border-l-4 border-green-500 animate-pulse">
        <p className="text-center text-green-700">Chargement de l’activité...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded shadow border-l-4 border-red-500">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="bg-white p-4 rounded shadow border-l-4 border-green-500 mb-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{titre}</h3>
          {duree !== null && (
            <p className="text-sm text-green-600 flex items-center mt-1">
              <Clock className="w-4 h-4 mr-1" /> {duree} min
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isLinked && onEditMasterActivity && (
            <button
              onClick={handleEdit}
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              title="Modifier activité maître"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
            title="Supprimer cette activité"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default ActivityBlock;
