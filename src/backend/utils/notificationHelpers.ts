// 📁 src/backend/utils/notificationHelpers.ts

/**
 * Ce fichier fournit des fonctions utilitaires pour afficher des notifications toast.
 * Il assure que les messages d'erreur sont toujours des chaînes de caractères lisibles,
 * même si l'entrée est un objet Error ou un objet générique complexe.
 */

import { toast } from "sonner"; // Importer 'toast' depuis sonner

/**
 * Affiche une notification de succès.
 * @param message Le message de succès à afficher.
 * @param title Le titre optionnel de la notification. Par défaut : "Succès !".
 */
export function notifySuccess(message: string, title?: string): void {
  toast({
    title: title || "Succès !",
    description: message,
    duration: 3000, // Durée par défaut pour les succès
  });
}

/**
 * Affiche une notification d'erreur.
 * Tente d'extraire un message textuel lisible (et un titre) à partir de diverses formes d'erreurs.
 * @param error L'erreur à afficher. Peut être une chaîne, une instance d'Error,
 * ou un objet générique (potentiellement avec des propriétés comme 'message', 'title', 'description').
 * @param defaultTitle Le titre par défaut si aucun titre n'est déduit de l'objet d'erreur.
 */
export function notifyError(
  error: string | Error | { message?: string; title?: string; description?: string; duration?: number; } | any,
  defaultTitle?: string
): void {
  let finalTitle: string = defaultTitle || "Erreur !";
  let finalDescription: string;

  if (typeof error === 'string') {
    // Cas où l'entrée est une simple chaîne de caractères
    finalDescription = error;
  } else if (error instanceof Error) {
    // Cas où l'entrée est une instance standard d'Error
    finalDescription = error.message;
  } else if (typeof error === 'object' && error !== null) {
    // Cas où l'entrée est un objet générique
    if (error.title && typeof error.title === 'string') {
      // Si l'objet a une propriété 'title', l'utiliser comme titre principal
      finalTitle = error.title;
      // La description peut venir de 'description' ou 'message' de l'objet, ou être générique
      finalDescription = (error.description && typeof error.description === 'string')
        ? error.description
        : (error.message && typeof error.message === 'string')
          ? error.message
          : "Une erreur est survenue.";
    } else if (error.message && typeof error.message === 'string') {
      // Si l'objet a une propriété 'message', l'utiliser comme description
      finalDescription = error.message;
    } else if (error.description && typeof error.description === 'string') {
      // Si l'objet a une propriété 'description'
      finalDescription = error.description;
    } else {
      // Si aucune propriété connue n'est trouvée, tenter de sérialiser l'objet complet
      try {
        finalDescription = JSON.stringify(error);
      } catch (e) {
        finalDescription = "Une erreur inattendue est survenue (objet non sérialisable).";
      }
    }
  } else {
    // Cas par défaut pour tout autre type d'entrée inattendu
    finalDescription = "Une erreur inattendue est survenue.";
  }

  // Affiche la notification toast via sonner
  toast({
    title: finalTitle,
    description: finalDescription,
    duration: 5000, // Durée plus longue pour les erreurs
  });
}
