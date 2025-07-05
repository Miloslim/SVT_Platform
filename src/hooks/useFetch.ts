// ============================================================
// 📌 Fichier : UseFetch.ts
// 🎯 Objectif :
//   - Créer un hook React personnalisé pour effectuer des appels API.
//   - Gérer l'état de chargement, les erreurs, et les données reçues.
// ============================================================

import { useState, useEffect } from 'react';

// Typage des résultats du hook
interface UseFetchResult<T> {
  data: T | null; // Données récupérées
  loading: boolean; // Indicateur de chargement
  error: string | null; // Message d'erreur, si existant
}

// Typage des paramètres du hook
interface UseFetchParams {
  url: string; // URL pour effectuer l'appel API
  options?: RequestInit; // Options pour l'appel fetch (headers, method, etc.)
}

// ============================================================
// Hook personnalisé : useFetch
// Description :
// Ce hook effectue un appel fetch à l'API spécifiée et gère les états associés.
// ============================================================
function useFetch<T>({ url, options }: UseFetchParams): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null); // État pour stocker les données
  const [loading, setLoading] = useState<boolean>(true); // Indicateur de chargement
  const [error, setError] = useState<string | null>(null); // État pour gérer les erreurs

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null); // Réinitialiser l'état d'erreur

        const response = await fetch(url, options); // Effectuer l'appel fetch

        if (!response.ok) {
          throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const json = await response.json(); // Extraire les données JSON
        setData(json); // Mettre à jour les données
      } catch (err) {
        setError((err as Error).message); // Stocker le message d'erreur
      } finally {
        setLoading(false); // Désactiver l'indicateur de chargement
      }
    };

    fetchData(); // Appeler la fonction de récupération des données
  }, [url, options]); // Dépendances : relancer l'effet si elles changent

  return { data, loading, error }; // Retourner les états gérés par le hook
}

export default useFetch;
