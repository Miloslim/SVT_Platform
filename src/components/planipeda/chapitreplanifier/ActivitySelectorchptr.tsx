// Nom du fichier: ActivitySelector.tsx
// Chemin: src/components/planipeda/ScenarioEditor/ActivitySelector.tsx

// Fonctionnalités:
// Ce composant permet à l'utilisateur de rechercher et de sélectionner une activité existante.
// Il filtre les activités par Niveau, Option, Unité, Chapitre (si fournis) et par un terme de recherche.
// Les filtres hiérarchiques sont appliqués via des jointures implicites dans Supabase.
// Il affiche les activités sous forme de tableau, similaire à ActivitesPage.tsx, pour une meilleure vue d'ensemble.
// Il renvoie l'activité sélectionnée à son parent via un callback, incluant désormais la description et les objectifs.

import React, { useState, useEffect } from 'react';
import { supabase } from "@/backend/config/supabase";

import { ActivityData } from '@/types/activity'; // Pour l'interface ActivityData de base

// Interface pour les données de l'activité formatées pour l'affichage en tableau
// C'est cette structure qui sera passée en aval.
interface ActivityDisplayData {
  id: number;
  titre_activite: string;
  description: string;
  niveauOption: string;
  unite: string;
  chapitre: string;
  objectifs: string[]; // Tableau des descriptions d'objectifs
}

interface ActivitySelectorProps {
  // MODIFIÉ : onActivitySelected passe désormais la description et les objectifs
  onActivitySelected: (activityId: number, activityTitle: string, description: string, objectifs: string[]) => void;
  onCancel: () => void;
  chapitreId?: number | null;
  niveauId?: number | null;
  optionId?: number | null;
  uniteId?: number | null;
}

const ActivitySelector: React.FC<ActivitySelectorProps> = ({ onActivitySelected, onCancel, chapitreId, niveauId, optionId, uniteId }) => {
  const [activities, setActivities] = useState<ActivityDisplayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<ActivityDisplayData | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let query = supabase.from('activites')
          .select(`
            id,
            titre_activite,
            description,
            chapitre:chapitre_id!inner(
              id,
              titre_chapitre,
              unite:unite_id!inner(
                id,
                titre_unite,
                option:option_id!inner(
                  id,
                  nom_option,
                  niveau:niveau_id!inner(
                    id,
                    nom_niveau
                  )
                )
              )
            ),
            activite_objectifs(
              objectifs:objectifs(
                description_objectif
              )
            )
          `);

        if (niveauId) {
          query = query.eq('chapitre.unite.option.niveau.id', niveauId);
        }
        if (optionId) {
          query = query.eq('chapitre.unite.option.id', optionId);
        }
        if (uniteId) {
          query = query.eq('chapitre.unite.id', uniteId);
        }
        if (chapitreId) {
          query = query.eq('chapitre_id', chapitreId);
        }

        if (searchTerm) {
          query = query.or(`titre_activite.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query.order('titre_activite', { ascending: true });

        if (error) {
          throw error;
        }

        const formattedActivities: ActivityDisplayData[] = data.map((item: any) => {
          const chapitre = item.chapitre;
          const unite = chapitre?.unite;
          const option = unite?.option;
          const niveau = option?.niveau;

          const niveauOption = `${niveau?.nom_niveau ?? "-"} - ${option?.nom_option ?? "-"}`;

          const objectifsArr =
            item.activite_objectifs?.map((ao: any) => ao.objectifs?.description_objectif).filter(Boolean) || [];
          const objectifs = objectifsArr.length > 0 ? objectifsArr : ["Aucun objectif"];

          return {
            id: item.id,
            titre_activite: item.titre_activite ?? "-",
            description: item.description ?? "",
            niveauOption: niveauOption,
            unite: unite?.titre_unite ?? "-",
            chapitre: chapitre?.titre_chapitre ?? "-",
            objectifs: objectifs,
          };
        });

        setActivities(formattedActivities);
      } catch (err: any) {
        console.error("Erreur lors du chargement des activités:", err);
        setError("Échec du chargement des activités: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceFetch = setTimeout(() => {
      fetchActivities();
    }, 300);

    return () => clearTimeout(debounceFetch);
  }, [searchTerm, chapitreId, niveauId, optionId, uniteId]);

  const handleSelectActivity = (activity: ActivityDisplayData) => {
    setSelectedActivity(activity);
    setError(null);
  };

  const handleInsertSelected = () => {
    if (selectedActivity) {
      // MODIFIÉ : Passe la description et les objectifs
      onActivitySelected(
        selectedActivity.id,
        selectedActivity.titre_activite,
        selectedActivity.description,
        selectedActivity.objectifs
      );
    } else {
      setError("Veuillez sélectionner une activité à insérer.");
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Sélectionner une Activité Existante</h3>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par titre ou description..."
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading && <p className="text-blue-500 text-center py-4">Chargement des activités...</p>}
      {error && <p className="text-red-500 text-center py-4">Erreur: {error}</p>}

      {!isLoading && activities.length === 0 && !error && (
        <p className="text-gray-500 text-center py-4">Aucune activité trouvée pour cette recherche ou ces filtres.</p>
      )}

      {!isLoading && activities.length > 0 && (
        <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre de l’activité</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Niveau & Option</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unité</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chapitre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objectifs</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sélection</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr
                  key={activity.id}
                  className={`cursor-pointer hover:bg-gray-100 ${selectedActivity?.id === activity.id ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSelectActivity(activity)}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {activity.titre_activite}
                    <p className="text-xs text-gray-500 truncate" style={{maxWidth: '150px'}}>{activity.description}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {activity.niveauOption}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {activity.unite}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {activity.chapitre}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <ul className="list-disc list-inside space-y-0.5">
                      {activity.objectifs.map((obj, index) => (
                        <li key={index} className="truncate" style={{maxWidth: '200px'}}>
                            {obj}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <input
                      type="radio"
                      name="selectedActivity"
                      checked={selectedActivity?.id === activity.id}
                      onChange={() => handleSelectActivity(activity)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleInsertSelected}
          disabled={!selectedActivity}
          className={`px-4 py-2 rounded-md text-white font-semibold shadow-md ${
            !selectedActivity ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
          } transition duration-150 ease-in-out`}
        >
          Insérer l'activité sélectionnée
        </button>
      </div>
    </div>
  );
};

export default ActivitySelector;
