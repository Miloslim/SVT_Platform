// 📁 src/components/planipeda/ScenarioEditor/FileUpload.tsx
// 📌 Composant : FileUpload
// 🎯 Fonctionnalités :
// - Permet la sélection d'un fichier local par l'utilisateur.
// - Gère l'upload du fichier sélectionné vers Supabase Storage dans le bucket 'upload-activites'.
// - Récupère l'URL publique du fichier uploadé.
// - Notifie le composant parent de l'URL publique via la prop 'onUploadComplete'.
// - Gère et affiche les erreurs d'upload pour l'utilisateur.
// - Fournit un retour visuel pendant le processus d'upload.

import React, { useState } from "react";
import { supabase } from "@/backend/config/supabase"; // Assurez-vous que le chemin est correct

// ============================================================
// @section Interfaces de Types
// Définit la structure des props du composant FileUpload.
// ============================================================

interface FileUploadProps {
  // Callback appelé quand l'upload est terminé (succès ou échec), retourne l'URL ou null.
  onUploadComplete: (url: string | null) => void;
  // Optionnel: Désactive l'input/bouton d'upload depuis le composant parent.
  disabled?: boolean;
}

// ============================================================
// @section Composant Principal : FileUpload
// Gère la sélection et l'upload d'un unique fichier.
// ============================================================

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, disabled = false }) => {
  // État pour suivre si un upload est en cours.
  const [uploading, setUploading] = useState(false);
  // État pour stocker et afficher les messages d'erreur.
  const [error, setError] = useState<string | null>(null);
  // État pour conserver le fichier que l'utilisateur a sélectionné.
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  /**
   * @section Gestion de la sélection de fichier
   * Met à jour l'état `selectedFile` lorsque l'utilisateur choisit un fichier.
   * Réinitialise également tout message d'erreur précédent.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null); // Efface les erreurs précédentes.
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]); // Stocke le premier fichier sélectionné.
    } else {
      setSelectedFile(null); // Si aucun fichier n'est sélectionné, l'état est null.
      onUploadComplete(null); // Notifie le parent qu'il n'y a plus de fichier ou que l'upload a été annulé.
    }
  };

  /**
   * @section Logique d'upload vers Supabase Storage
   * Fonction asynchrone qui gère l'upload du fichier sélectionné,
   * la génération d'un nom de fichier unique et la récupération de son URL publique.
   */
  const uploadFile = async () => {
    if (!selectedFile) {
      setError("Veuillez choisir un fichier avant d’uploader.");
      return;
    }

    setUploading(true); // Active l'état d'upload en cours.
    setError(null);     // Réinitialise les erreurs.

    // --- @subsection Logique de construction du nom de fichier unique et propre ---
    // Cette section est cruciale pour éviter les problèmes de doubles extensions
    // et garantir des noms de fichiers valides pour le stockage cloud.

    // 1. Récupère l'extension du fichier original (ex: "pdf" pour "document.pdf").
    const fileExt = selectedFile.name.split(".").pop();

    // 2. Récupère le nom du fichier sans sa dernière extension.
    //    Gère les cas complexes comme "archive.tar.gz" -> "archive.tar".
    //    Si aucune extension n'est présente, utilise le nom complet du fichier.
    const originalFileNameWithoutLastExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;

    // 3. Nettoie le nom de base : remplace les caractères non alphanumériques,
    //    non-tirets, non-underscores par un underscore. Cela assure un nom de fichier propre
    //    et compatible avec les systèmes de stockage.
    const cleanBaseName = originalFileNameWithoutLastExt.replace(/[^a-zA-Z0-9_-]/g, '_');

    // 4. Construit le nom de fichier final pour Supabase Storage.
    //    Un timestamp est ajouté au début pour garantir l'unicité et éviter les collisions,
    //    suivi du nom de base nettoyé et de l'extension.
    const fileName = `${Date.now()}-${cleanBaseName}.${fileExt}`;

    // Le chemin complet où le fichier sera stocké dans le bucket 'upload-activites'.
    const filePath = `ressources/${fileName}`;

    // --- @subsection Processus d'upload vers Supabase Storage ---
    try {
      // 🆙 Étape 1 : Upload du fichier vers le bucket 'upload-activites'.
      const { error: uploadError } = await supabase.storage
        .from("upload-activites") // Spécifie le bucket cible.
        .upload(filePath, selectedFile, {
          cacheControl: "3600", // Le fichier sera mis en cache pendant 1 heure.
          upsert: false, // Ne remplace pas un fichier existant (le nom généré est déjà unique).
          contentType: selectedFile.type, // Définit le type MIME du fichier.
        });

      if (uploadError) {
        throw uploadError; // En cas d'erreur d'upload, l'erreur est propagée.
      }

      // 🌐 Étape 2 : Récupération de l'URL publique du fichier fraîchement uploadé.
      const { data, error: urlError } = supabase.storage
        .from("upload-activites")
        .getPublicUrl(filePath);

      if (urlError) {
        throw urlError; // En cas d'erreur lors de l'obtention de l'URL, l'erreur est propagée.
      }
      if (!data?.publicUrl) {
        throw new Error("Impossible d'obtenir l'URL publique après l'upload.");
      }

      // Notifie le composant parent avec l'URL publique du fichier uploadé.
      onUploadComplete(data.publicUrl);
    } catch (err: any) {
      // Gère toutes les erreurs survenues pendant le processus et les affiche à l'utilisateur.
      console.error("Erreur d'upload de fichier:", err);
      setError(`Erreur lors de l'upload : ${err.message || "Une erreur inconnue est survenue."}`);
      onUploadComplete(null); // Notifie le parent d'un échec d'upload.
    } finally {
      setUploading(false); // L'opération d'upload est terminée, qu'elle soit réussie ou non.
    }
  };

  /**
   * @section Rendu de l'interface utilisateur
   * Affiche l'input de sélection de fichier, le nom du fichier sélectionné,
   * un bouton pour déclencher l'upload et des messages d'erreur.
   */
  return (
    <div className="flex flex-col space-y-2">
      <label htmlFor="fileUpload" className="block text-sm font-medium text-gray-700">
        Sélectionner une ressource
      </label>

      {/* Input pour la sélection de fichiers */}
      <input
        type="file"
        id="fileUpload"
        // Liste des types de fichiers acceptés par le navigateur.
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt,.csv"
        onChange={handleFileChange}
        // Désactive l'input si un upload est en cours ou si le parent le désactive.
        disabled={uploading || disabled}
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {/* Affiche le nom du fichier sélectionné pour confirmation. */}
      {selectedFile && (
        <p className="text-sm text-gray-600">
          Fichier sélectionné : <span className="font-semibold">{selectedFile.name}</span>
        </p>
      )}

      {/* Bouton pour déclencher l'upload. */}
      <button
        type="button"
        onClick={uploadFile}
        // Le bouton est désactivé si l'upload est en cours, aucun fichier n'est sélectionné, ou si le parent le désactive.
        disabled={uploading || !selectedFile || disabled}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {uploading ? "Chargement en cours..." : "Uploader la ressource"}
      </button>

      {/* Affiche les messages d'erreur si présents. */}
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
};

export default FileUpload;