// 📁 src/components/planipeda/ScenarioEditor/MultiFileUpload.tsx version insert reussie
// 📌 Composant : MultiFileUpload
// 🎯 Fonctionnalités :
// - Permet la sélection de MULTIPLES fichiers locaux par l'utilisateur.
// - Affiche la liste des fichiers sélectionnés avec leur statut (en attente, en cours, succès, erreur).
// - Gère l'upload de CHAQUE fichier sélectionné vers Supabase Storage (bucket 'upload-activites').
// - Récupère l'URL publique pour chaque fichier uploadé.
// - Notifie le composant parent avec un tableau des URLs publiques des fichiers uploadés via 'onUploadComplete'.
// - Gère et affiche les erreurs d'upload pour chaque fichier.
// - Permet de visualiser les fichiers déjà uploadés et de les supprimer (dé-sélectionner).

import React, { useState } from "react";
import { supabase } from "@/backend/config/supabase";

// Interface pour les props du composant
interface MultiFileUploadProps {
  // Callback appelé quand l'upload est terminé (succès ou échec), retourne un tableau d'URLs ou null
  onUploadComplete: (urls: string[] | null) => void;
  // Optionnel: Désactiver l'input/bouton d'upload depuis le parent
  disabled?: boolean;
}

// Interface pour un fichier interne géré par le composant
interface UploadFileState {
  file: File;
  status: "pending" | "uploading" | "completed" | "error";
  url: string | null;
  errorMessage: string | null;
}

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({ onUploadComplete, disabled = false }) => {
  // État pour stocker la liste des fichiers sélectionnés et leur statut d'upload
  const [filesToUpload, setFilesToUpload] = useState<UploadFileState[]>([]);
  // État général d'upload pour désactiver les contrôles globaux
  const [isAnyUploading, setIsAnyUploading] = useState(false);

  /**
   * @section Gestion de la sélection de fichiers
   * Gère le changement d'état lors de la sélection de plusieurs fichiers via l'input.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convertit FileList en tableau d'objets UploadFileState
      const newFiles: UploadFileState[] = Array.from(e.target.files).map(file => ({
        file,
        status: "pending",
        url: null,
        errorMessage: null,
      }));
      setFilesToUpload(prevFiles => [...prevFiles, ...newFiles]); // Ajoute les nouveaux fichiers à la liste existante
      e.target.value = ''; // Réinitialise l'input file pour permettre la sélection des mêmes fichiers à nouveau si nécessaire
    }
  };

  /**
   * @section Suppression d'un fichier de la liste
   * Permet de retirer un fichier avant l'upload ou de le dé-sélectionner après.
   */
  const handleRemoveFile = (indexToRemove: number) => {
    setFilesToUpload(prevFiles => {
      const updatedFiles = prevFiles.filter((_, index) => index !== indexToRemove);
      // Si un fichier supprimé était uploadé, cela pourrait nécessiter une mise à jour de l'URL dans le parent
      // Pour l'instant, on se base sur la liste finale des URLs complétées.
      const completedUrls = updatedFiles
        .filter(f => f.status === "completed" && f.url !== null)
        .map(f => f.url!);
      onUploadComplete(completedUrls.length > 0 ? completedUrls : null);
      return updatedFiles;
    });
  };

  /**
   * @section Logique d'upload pour un fichier individuel
   * Fonction asynchrone pour uploader un fichier spécifique.
   */
  const uploadSingleFile = async (fileState: UploadFileState, index: number) => {
    // Met à jour le statut du fichier à "uploading"
    setFilesToUpload(prevFiles => {
      const newFiles = [...prevFiles];
      newFiles[index] = { ...newFiles[index], status: "uploading", errorMessage: null };
      return newFiles;
    });

    const file = fileState.file;
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}.${fileExt}`;
    const filePath = `ressources/${fileName}`;

    try {
      // 🆙 Étape 1 : Upload du fichier vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("upload-activites")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 🌐 Étape 2 : Récupération de l'URL publique
      const { data, error: urlError } = supabase.storage
        .from("upload-activites")
        .getPublicUrl(filePath);

      if (urlError) {
        throw urlError;
      }
      if (!data?.publicUrl) {
        throw new Error("Impossible d'obtenir l'URL publique.");
      }

      // Met à jour le statut du fichier à "completed" avec l'URL
      setFilesToUpload(prevFiles => {
        const newFiles = [...prevFiles];
        newFiles[index] = { ...newFiles[index], status: "completed", url: data.publicUrl };
        return newFiles;
      });
      return data.publicUrl; // Retourne l'URL pour la gestion globale
    } catch (err: any) {
      // Met à jour le statut du fichier à "error" avec le message d'erreur
      setFilesToUpload(prevFiles => {
        const newFiles = [...prevFiles];
        newFiles[index] = { ...newFiles[index], status: "error", errorMessage: `Erreur: ${err.message}` };
        return newFiles;
      });
      return null; // Retourne null en cas d'échec
    }
  };

  /**
   * @section Déclencheur global d'upload pour tous les fichiers en attente
   */
  const handleUploadAll = async () => {
    setIsAnyUploading(true); // Active l'état global d'upload
    const uploadPromises = filesToUpload
      .filter(f => f.status === "pending" || f.status === "error") // On réessaie les fichiers en attente ou en erreur
      .map((fileState, originalIndex) =>
        // Trouver l'index original car .filter() peut changer les index
        uploadSingleFile(fileState, filesToUpload.indexOf(fileState))
      );

    const uploadedUrls = await Promise.all(uploadPromises);

    // Filtrer les URLs valides (non nulles)
    const completedUrls = filesToUpload
      .filter(f => f.status === "completed" && f.url !== null)
      .map(f => f.url!);

    setIsAnyUploading(false); // Désactive l'état global d'upload

    // Notifie le composant parent avec toutes les URLs complétées
    onUploadComplete(completedUrls.length > 0 ? completedUrls : null);
  };

  /**
   * @section Rendu de l'interface utilisateur
   * Affiche l'input de fichier, la liste des fichiers, les boutons et les messages.
   */
  return (
    <div className="flex flex-col space-y-4 p-4 border rounded-lg bg-gray-50">
      <label htmlFor="multiFileUpload" className="block text-sm font-medium text-gray-700">
        Ajouter des ressources (fichiers multiples)
      </label>

      <input
        type="file"
        id="multiFileUpload"
        multiple // Permet la sélection de plusieurs fichiers
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv"
        onChange={handleFileChange}
        disabled={isAnyUploading || disabled}
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {filesToUpload.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <p className="text-base font-semibold text-gray-800 mb-2">Fichiers à uploader :</p>
          <ul className="space-y-2">
            {filesToUpload.map((fileState, index) => (
              <li key={index} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md shadow-sm text-sm">
                <span className="font-medium text-gray-900 truncate flex-grow mr-2">
                  {fileState.file.name}
                  {fileState.url && (
                    <a href={fileState.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                      (Voir)
                    </a>
                  )}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  fileState.status === "pending" ? "bg-gray-200 text-gray-700" :
                  fileState.status === "uploading" ? "bg-yellow-100 text-yellow-800 animate-pulse" :
                  fileState.status === "completed" ? "bg-green-100 text-green-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {fileState.status === "pending" && "En attente"}
                  {fileState.status === "uploading" && "En cours..."}
                  {fileState.status === "completed" && "Terminé"}
                  {fileState.status === "error" && "Erreur"}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="ml-3 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Supprimer ce fichier de la liste"
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

      {filesToUpload.filter(f => f.status === "pending" || f.status === "error").length > 0 && (
        <button
          type="button"
          onClick={handleUploadAll}
          disabled={isAnyUploading || disabled}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {isAnyUploading ? "Upload de tous les fichiers..." : "Uploader tous les fichiers sélectionnés"}
        </button>
      )}

      {filesToUpload.some(f => f.errorMessage) && (
        <div className="text-red-600 text-sm mt-2">
          Certains fichiers ont rencontré une erreur :
          <ul>
            {filesToUpload.filter(f => f.errorMessage).map((f, i) => (
              <li key={i}>{f.file.name}: {f.errorMessage}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiFileUpload;