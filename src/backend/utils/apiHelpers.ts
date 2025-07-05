// Placeholder content
// ============================================================
// 📌 Fichier : apiHelpers.ts
// 🎯 Objectif :
//   - Fournir des fonctions utilitaires pour simplifier les appels API.
//   - Centraliser la gestion des requêtes HTTP avec gestion des erreurs.
// ============================================================

import { supabase } from '../config/supabase'; // Import de Supabase si nécessaire

// ============================================================
// 🔹 Fonction : fetchData
//   - Récupérer des données d'une table dans Supabase.
//   - Paramètres :
//       - tableName (string) : Le nom de la table à interroger.
//       - selectFields (string) : Les colonnes à récupérer.
//   - Retourne : Un tableau de données ou une erreur.
// ============================================================
export const fetchData = async (tableName: string, selectFields: string = '*') => {
  try {
    const { data, error } = await supabase.from(tableName).select(selectFields);

    if (error) {
      console.error(`❌ Erreur lors de la récupération de ${tableName} :`, error.message);
      throw error;
    }

    return data; // Données récupérées
  } catch (err) {
    throw new Error(`Erreur API : ${err.message}`);
  }
};

// ============================================================
// 🔹 Fonction : insertData
//   - Insérer des données dans une table Supabase.
//   - Paramètres :
//       - tableName (string) : Le nom de la table où insérer des données.
//       - payload (object) : Les données à insérer.
//   - Retourne : L'objet inséré ou une erreur.
// ============================================================
export const insertData = async (tableName: string, payload: object) => {
  try {
    const { data, error } = await supabase.from(tableName).insert(payload);

    if (error) {
      console.error(`❌ Erreur lors de l'insertion dans ${tableName} :`, error.message);
      throw error;
    }

    return data; // Données insérées
  } catch (err) {
    throw new Error(`Erreur API : ${err.message}`);
  }
};

// ============================================================
// 🔹 Fonction : updateData
//   - Mettre à jour des données dans une table Supabase.
//   - Paramètres :
//       - tableName (string) : Le nom de la table à mettre à jour.
//       - criteria (object) : Les critères de sélection (ex : { id: 1 }).
//       - updates (object) : Les nouvelles valeurs à appliquer.
//   - Retourne : Les données mises à jour ou une erreur.
// ============================================================
export const updateData = async (tableName: string, criteria: object, updates: object) => {
  try {
    const { data, error } = await supabase.from(tableName).update(updates).match(criteria);

    if (error) {
      console.error(`❌ Erreur lors de la mise à jour de ${tableName} :`, error.message);
      throw error;
    }

    return data; // Données mises à jour
  } catch (err) {
    throw new Error(`Erreur API : ${err.message}`);
  }
};

// ============================================================
// 🔹 Fonction : deleteData
//   - Supprimer des données dans une table Supabase.
//   - Paramètres :
//       - tableName (string) : Le nom de la table à supprimer.
//       - criteria (object) : Les critères de suppression (ex : { id: 1 }).
//   - Retourne : Les données supprimées ou une erreur.
// ============================================================
export const deleteData = async (tableName: string, criteria: object) => {
  try {
    const { data, error } = await supabase.from(tableName).delete().match(criteria);

    if (error) {
      console.error(`❌ Erreur lors de la suppression dans ${tableName} :`, error.message);
      throw error;
    }

    return data; // Données supprimées
  } catch (err) {
    throw new Error(`Erreur API : ${err.message}`);
  }
};

// ============================================================
// ℹ️ Notes :
//   - Ajoutez d'autres fonctions spécifiques à vos besoins API ici.
//   - Toutes les fonctions gèrent les erreurs pour une maintenance simplifiée.
// ============================================================
