// =========================================================
// 📌 Fichier : activities.tsx
// 🎯 Objectif :
//   - Afficher et gérer les activités pédagogiques.
//   - Fonctionnalités : lecture, ajout, modification, suppression.
// =========================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../../backend/config/supabase';// Connexion à Supabase

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({
    titre_activite: '',
    description: '',
    sequence_id: ''
  });

  // 🔹 Charger les activités depuis Supabase
  const fetchActivities = async () => {
    const { data, error } = await supabase.from('activities').select('*');
    if (error) {
      console.error("❌ Erreur lors de la récupération des activités :", error);
      return;
    }
    setActivities(data);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // 🔹 Ajouter une nouvelle activité
  const addActivity = async () => {
    const { titre_activite, description, sequence_id } = newActivity;

    const { data, error } = await supabase.from('activities').insert([
      { titre_activite, description, sequence_id }
    ]);
    if (error) {
      console.error("❌ Erreur lors de l'ajout de l'activité :", error);
      return;
    }
    setActivities([...activities, ...data]);
    setNewActivity({ titre_activite: '', description: '', sequence_id: '' });
  };

  // 🔹 Modifier une activité existante
  const updateActivity = async (id, updatedFields) => {
    const { data, error } = await supabase
      .from('activities')
      .update(updatedFields)
      .eq('id', id);

    if (error) {
      console.error("❌ Erreur lors de la modification de l'activité :", error);
      return;
    }

    setActivities(
      activities.map((activity) =>
        activity.id === id ? { ...activity, ...updatedFields } : activity
      )
    );
  };

  // 🔹 Supprimer une activité
  const deleteActivity = async (id) => {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) {
      console.error("❌ Erreur lors de la suppression de l'activité :", error);
      return;
    }

    setActivities(activities.filter((activity) => activity.id !== id));
  };

  return (
    <div>
      <h1>Gestion des Activités</h1>

      {/* 🔹 Formulaire pour ajouter une activité */}
      <div>
        <input
          type="text"
          placeholder="Titre de l'activité"
          value={newActivity.titre_activite}
          onChange={(e) =>
            setNewActivity({ ...newActivity, titre_activite: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Description"
          value={newActivity.description}
          onChange={(e) =>
            setNewActivity({ ...newActivity, description: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="ID de la séquence"
          value={newActivity.sequence_id}
          onChange={(e) =>
            setNewActivity({ ...newActivity, sequence_id: e.target.value })
          }
        />
        <button onClick={addActivity}>Ajouter</button>
      </div>

      {/* 🔹 Tableau des activités */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Titre</th>
            <th>Description</th>
            <th>Séquence ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr key={activity.id}>
              <td>{activity.id}</td>
              <td>{activity.titre_activite}</td>
              <td>{activity.description}</td>
              <td>{activity.sequence_id}</td>
              <td>
                <button
                  onClick={() =>
                    updateActivity(activity.id, { titre_activite: 'Modifié' })
                  }
                >
                  Modifier
                </button>
                <button onClick={() => deleteActivity(activity.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Activities;
