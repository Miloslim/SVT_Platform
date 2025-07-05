// 📁 src/components/planipeda/ScenarioEditor/MultiFileUpload.tsx
// 📌 Composant : MultiFileUpload
// 🎯 Fonctionnalités :
// - Permet la sélection de MULTIPLES fichiers locaux par l'utilisateur.
// - Affiche la liste des fichiers sélectionnés avec leur statut (en attente, en cours, succès, erreur).
// - **Initialise l'état avec des URLs de ressources existantes (`initialUrls`).**
// - Gère l'upload de CHAQUE nouveau fichier sélectionné vers Supabase Storage (bucket 'upload-activites').
// - **Permet de supprimer des fichiers déjà uploadés de Supabase Storage et de la liste.**
// - Récupère l'URL publique pour chaque fichier uploadé.
// - Notifie le composant parent avec un tableau des URLs publiques **finales** des fichiers (après ajouts/suppressions) via 'onUploadComplete'.
// - Gère et affiche les erreurs d'upload pour chaque fichier.

import React, { useState, useEffect, useRef } from "react"; // Ajout de useEffect et useRef
import { supabase } from "@/backend/config/supabase"; // Assurez-vous que le chemin est correct

// ============================================================
// @section Interfaces de Types
// Définit la structure des props du composant et l'état interne d'un fichier.
// ============================================================

interface MultiFileUploadProps {
  // Callback appelé quand l'upload est terminé (succès ou échec), retourne un tableau d'URLs ou null
  onUploadComplete: (urls: string[] | null) => void;
  // Optionnel: Désactiver l'input/bouton d'upload depuis le parent (ex: pendant la sauvegarde de l'activité)
  disabled?: boolean;
  // NOUVEAU: URLs des fichiers déjà existants (par exemple, chargés depuis la DB)
  initialUrls: string[] | null;
}

// Interface pour un fichier géré en interne par le composant
interface UploadFileState {
  // Le File object est null pour les URLs initiales car il n'est pas nécessaire
  file: File | null;
  status: "pending" | "uploading" | "completed" | "error";
  url: string | null;
  errorMessage: string | null;
  isInitial: boolean; // NOUVEAU: Indique si ce fichier provient des initialUrls
}

// ============================================================
// @section Composant Principal : MultiFileUpload
// Gère la sélection et l'upload de multiples fichiers.
// ============================================================

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  onUploadComplete,
  disabled = false,
  initialUrls, // Réception des URLs initiales
}) => {
  // État pour stocker la liste des fichiers sélectionnés et leur statut d'upload
  // Contient maintenant aussi les fichiers initialement chargés
  const [filesToUpload, setFilesToUpload] = useState<UploadFileState[]>([]);
  // État général d'upload pour désactiver les contrôles globaux pendant l'upload.
  const [isAnyUploading, setIsAnyUploading] = useState(false);

  // Utilisation de useRef pour suivre si les URLs initiales ont déjà été traitées.
  // Cela évite que useEffect ne tourne en boucle ou ne re-traite les URLs inutilement.
  const initialUrlsProcessed = useRef(false);

  /**
   * @section useEffect pour initialiser les fichiers
   * S'exécute une seule fois au montage du composant pour charger les initialUrls dans l'état.
   * Assure que les fichiers existants sont affichés correctement.
   */
  useEffect(() => {
    // Vérifie si initialUrls existe, n'est pas vide et n'a pas déjà été traité
    if (initialUrls && initialUrls.length > 0 && !initialUrlsProcessed.current) {
      const initialFileStates: UploadFileState[] = initialUrls.map((url) => ({
        file: null, // Pas de File object pour les URLs existantes
        status: "completed", // Elles sont déjà "complétées"
        url: url,
        errorMessage: null,
        isInitial: true, // Marque ce fichier comme initial
      }));
      setFilesToUpload(initialFileStates);
      initialUrlsProcessed.current = true; // Marque comme traité
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrls]); // Dépend de initialUrls pour se déclencher si elles changent (moins courant mais sécurisant)


  /**
   * @section Gestion de la sélection de fichiers
   * Gère le changement d'état lorsque l'utilisateur sélectionne un ou plusieurs fichiers via l'input `type="file"`.
   * Ajoute les nouveaux fichiers à la liste `filesToUpload` avec un statut "pending".
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convertit la FileList en un tableau d'objets UploadFileState
      const newFiles: UploadFileState[] = Array.from(e.target.files).map(file => ({
        file,
        status: "pending", // Statut initial : en attente d'upload
        url: null,
        errorMessage: null,
        isInitial: false, // Ce sont de nouveaux fichiers
      }));
      // Ajoute les nouveaux fichiers à la liste existante des fichiers à uploader
      setFilesToUpload(prevFiles => [...prevFiles, ...newFiles]);
      // Réinitialise la valeur de l'input file pour permettre de re-sélectionner les mêmes fichiers
      e.target.value = '';
    }
  };

  /**
   * @section Suppression d'un fichier de la liste et de Supabase Storage (si déjà uploadé)
   * Permet à l'utilisateur de retirer un fichier de la liste des uploads,
   * que ce soit avant l'upload, pour le dé-sélectionner après un upload réussi,
   * ou pour supprimer un fichier initialement chargé.
   */
  const handleRemoveFile = async (indexToRemove: number) => {
    const fileToRemove = filesToUpload[indexToRemove];

    if (fileToRemove.url && fileToRemove.status === "completed") {
      // Si le fichier a une URL et est "completed", tenter de le supprimer de Supabase Storage
      try {
        // Extraire le chemin du fichier de l'URL publique
        // Exemple d'URL : https://[projet_id].supabase.co/storage/v1/object/public/upload-activites/ressources/nom_du_fichier.ext
        const urlParts = fileToRemove.url.split("/");
        // Le chemin relatif à Supabase Storage est généralement après 'public/[bucket_name]/'
        // Ici, il est `ressources/nom_du_fichier.ext`
        const fileNameInStorage = urlParts.slice(urlParts.indexOf("public") + 2).join("/");

        // S'assurer que le chemin est correct pour la suppression.
        // Si votre URL publique ne contient pas 'ressources/', ajustez la logique ici.
        // Par exemple, si l'URL est directement 'bucket_name/file_name.ext'
        // const fileNameInStorage = urlParts[urlParts.length - 1]; // Ou plus complexe si des dossiers sont là

        console.log("Tentative de suppression de:", fileNameInStorage);

        const { error: deleteError } = await supabase.storage
          .from("upload-activites") // Cible le bucket spécifique
          .remove([fileNameInStorage]); // Le chemin doit être un tableau d'un ou plusieurs chemins de fichier

        if (deleteError && deleteError.message !== "The resource was not found") {
          // Gérer l'erreur de suppression, sauf si le fichier n'existe déjà plus (pas trouvé)
          throw deleteError;
        }
        console.log("Fichier supprimé de Supabase Storage (ou déjà absent):", fileNameInStorage);
      } catch (err: any) {
        console.log("Erreur lors de la suppression du fichier de Supabase Storage:", err);
        // On pourrait ajouter un message d'erreur à l'utilisateur ici si la suppression échoue,
        // mais pour l'instant, on se contente de le loguer et de le retirer de la liste locale.
      }
    }

    setFilesToUpload(prevFiles => {
      const updatedFiles = prevFiles.filter((_, index) => index !== indexToRemove);
      // Notifie le parent avec la liste finale des URLs après la suppression locale
      const completedUrls = updatedFiles
        .filter(f => f.status === "completed" && f.url !== null)
        .map(f => f.url!);
      onUploadComplete(completedUrls.length > 0 ? completedUrls : null);
      return updatedFiles;
    });
  };

  /**
   * @section Logique d'upload pour un fichier individuel
   * Fonction asynchrone qui gère l'upload d'un seul fichier vers Supabase Storage
   * et la récupération de son URL publique. Met à jour le statut du fichier.
   */
  const uploadSingleFile = async (fileState: UploadFileState, index: number) => {
    // Si le fichier n'est pas un nouveau fichier (vient des initialUrls) ou s'il n'y a pas de File object,
    // il n'y a rien à uploader. On retourne son URL existante s'il y en a une.
    if (fileState.isInitial || !fileState.file) {
      return fileState.url;
    }

    // 1. Met à jour le statut du fichier à "uploading" et réinitialise les erreurs.
    setFilesToUpload(prevFiles => {
      const newFiles = [...prevFiles];
      newFiles[index] = { ...newFiles[index], status: "uploading", errorMessage: null };
      return newFiles;
    });

    const file = fileState.file;

    // --- @subsection Logique de construction du nom de fichier unique et propre ---
    const fileExt = file.name.split(".").pop();
    const originalFileNameWithoutLastExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const cleanBaseName = originalFileNameWithoutLastExt.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${Date.now()}-${cleanBaseName}.${fileExt}`;
    const filePath = `ressources/${fileName}`; // Chemin de stockage dans le bucket

    // --- @subsection Processus d'upload vers Supabase Storage ---
    try {
      // 🆙 Étape 1 : Upload du fichier vers le bucket 'upload-activites'
      const { error: uploadError } = await supabase.storage
        .from("upload-activites") // Cible le bucket spécifique
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 🌐 Étape 2 : Récupération de l'URL publique du fichier uploadé
      const { data, error: urlError } = supabase.storage
        .from("upload-activites")
        .getPublicUrl(filePath);

      if (urlError) {
        throw urlError;
      }
      if (!data?.publicUrl) {
        throw new Error("Impossible d'obtenir l'URL publique après l'upload.");
      }

      // Met à jour le statut du fichier à "completed" avec l'URL publique obtenue.
      setFilesToUpload(prevFiles => {
        const newFiles = [...prevFiles];
        newFiles[index] = { ...newFiles[index], status: "completed", url: data.publicUrl };
        return newFiles;
      });
      return data.publicUrl; // Retourne l'URL pour la gestion globale des callbacks
    } catch (err: any) {
      // Gère les erreurs et met à jour l'état d'erreur du fichier spécifique.
      setFilesToUpload(prevFiles => {
        const newFiles = [...prevFiles];
        newFiles[index] = { ...newFiles[index], status: "error", errorMessage: `Erreur: ${err.message}` };
        return newFiles;
      });
      return null; // Retourne null en cas d'échec de l'upload ou de l'obtention de l'URL
    }
  };

  /**
   * @section Déclencheur global d'upload pour tous les fichiers
   * Lance l'upload de tous les fichiers actuellement dans la liste qui sont en attente ou en erreur.
   */
  const handleUploadAll = async () => {
    setIsAnyUploading(true); // Active l'état global pour indiquer que des uploads sont en cours.

    // Créer une copie de `filesToUpload` pour l'itération afin d'éviter les problèmes
    // si `setFilesToUpload` est appelé à l'intérieur de `uploadSingleFile`
    const currentFiles = [...filesToUpload];

    // Crée une promesse pour chaque fichier à uploader ou re-tenter (pending ou error)
    // Nous utilisons `Promise.allSettled` pour que même si un upload échoue, les autres continuent.
    const uploadPromises = currentFiles.map((fileState, index) =>
      fileState.status === "pending" || fileState.status === "error"
        ? uploadSingleFile(fileState, index)
        : Promise.resolve(fileState.url) // Si déjà complété, on garde son URL
    );

    await Promise.allSettled(uploadPromises); // Attend que toutes les promesses soient terminées

    // Après que tous les uploads (tentés) soient terminés, collecte toutes les URLs qui ont été uploadées avec succès.
    // Il est important de recalculer à partir de l'état final, car `uploadSingleFile` a mis à jour `filesToUpload`.
    setFilesToUpload(prevFiles => {
      const completedUrls = prevFiles
        .filter(f => f.status === "completed" && f.url !== null)
        .map(f => f.url!);

      setIsAnyUploading(false); // Désactive l'état global d'upload.
      // Notifie le composant parent avec le tableau de toutes les URLs des fichiers uploadés avec succès.
      onUploadComplete(completedUrls.length > 0 ? completedUrls : null);
      return prevFiles; // Retourne l'état mis à jour
    });
  };

  // ============================================================
  // @section Rendu de l'interface utilisateur
  // Affiche l'input de fichier, la liste des fichiers avec leur statut,
  // et les boutons d'action.
  // ============================================================

  return (
    <div className="flex flex-col space-y-4 p-4 border rounded-lg bg-gray-50">
      <label htmlFor="multiFileUpload" className="block text-sm font-medium text-gray-700">
        Ajouter ou modifier des ressources (fichiers multiples)
      </label>

      {/* Input de sélection de fichiers */}
      <input
        type="file"
        id="multiFileUpload"
        multiple // Permet la sélection de plusieurs fichiers à la fois
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv" // Types de fichiers acceptés
        onChange={handleFileChange}
        disabled={isAnyUploading || disabled} // Désactivé pendant l'upload ou si le parent le désactive
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {/* Affichage de la liste des fichiers sélectionnés / existants */}
      {filesToUpload.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <p className="text-base font-semibold text-gray-800 mb-2">Ressources actuelles :</p>
          <ul className="space-y-2">
            {filesToUpload.map((fileState, index) => (
              <li key={index} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md shadow-sm text-sm">
                <span className="font-medium text-gray-900 truncate flex-grow mr-2">
                  {fileState.file ? fileState.file.name : fileState.url?.split('/').pop() || "Fichier inconnu"}
                  {/* Lien "Voir" pour les fichiers déjà uploadés ou existants */}
                  {fileState.url && (
                    <a href={fileState.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                      (Voir)
                    </a>
                  )}
                </span>
                {/* Indicateur de statut de l'upload */}
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  fileState.status === "pending" ? "bg-gray-200 text-gray-700" :
                  fileState.status === "uploading" ? "bg-yellow-100 text-yellow-800 animate-pulse" :
                  fileState.status === "completed" ? "bg-green-100 text-green-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {fileState.status === "pending" && "En attente"}
                  {fileState.status === "uploading" && "En cours..."}
                  {fileState.status === "completed" && (fileState.isInitial ? "Existante" : "Terminé")}
                  {fileState.status === "error" && "Erreur"}
                </span>
                {/* Bouton pour supprimer un fichier de la liste (et de Supabase si complété) */}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="ml-3 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Supprimer ce fichier de la liste"
                  disabled={isAnyUploading || disabled} // Désactivé pendant l'upload ou si le parent le désactive
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bouton d'upload général (visible si des fichiers sont en attente ou en erreur) */}
      {filesToUpload.filter(f => f.status === "pending" || f.status === "error").length > 0 && (
        <button
          type="button"
          onClick={handleUploadAll}
          disabled={isAnyUploading || disabled}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {isAnyUploading ? "Upload de tous les fichiers..." : "Uploader tous les fichiers"}
        </button>
      )}

      {/* Affichage des messages d'erreur généraux */}
      {filesToUpload.some(f => f.errorMessage) && (
        <div className="text-red-600 text-sm mt-2">
          Certains fichiers ont rencontré une erreur :
          <ul>
            {filesToUpload.filter(f => f.errorMessage).map((f, i) => (
              <li key={i}>{f.file ? f.file.name : f.url?.split('/').pop()}: {f.errorMessage}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiFileUpload;