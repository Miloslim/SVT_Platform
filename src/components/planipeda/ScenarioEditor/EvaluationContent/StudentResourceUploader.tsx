// ============================================================
// Titre : StudentResourceUploader
// Chemin : src/components/planipeda/ScenarioEditor/EvaluationContent/StudentResourceUploader.tsx
// Fonctionnalités :
//    - Permet l'upload de MULTIPLES fichiers ressources spécifiquement destinés à l'élève.
//    - Affiche la liste des URLs des fichiers déjà téléchargés.
//    - Gère l'ajout et la suppression des fichiers (via URLs).
//    - Notifie le composant parent des URLs mises à jour via `onUploadComplete`.
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';

interface StudentResourceUploaderProps {
  // Fonction de callback appelée lorsque les URLs des fichiers sont mises à jour
  onUploadComplete: (urls: string[] | null) => void;
  // Indique si le composant est désactivé (par exemple, pendant une sauvegarde)
  disabled: boolean;
  // URLs initiales des fichiers (pour le mode édition)
  initialUrls?: string[];
}

const StudentResourceUploader: React.FC<StudentResourceUploaderProps> = ({
  onUploadComplete,
  disabled,
  initialUrls = [],
}) => {
  // État local pour stocker les URLs des fichiers uploadés
  const [fileUrls, setFileUrls] = useState<string[]>(initialUrls);
  // État local pour le champ de saisie d'une nouvelle URL
  const [newUrl, setNewUrl] = useState<string>('');
  // État local pour le message d'erreur/succès
  const [message, setMessage] = useState<string | null>(null);

  // Synchronise l'état local avec les URLs initiales si elles changent (mode édition)
  useEffect(() => {
    setFileUrls(initialUrls);
  }, [initialUrls]);

  // Fonction pour ajouter une URL à la liste
  const handleAddUrl = useCallback(() => {
    if (newUrl.trim() && !fileUrls.includes(newUrl.trim())) {
      const updatedUrls = [...fileUrls, newUrl.trim()];
      setFileUrls(updatedUrls);
      onUploadComplete(updatedUrls); // Notifie le parent
      setNewUrl(''); // Vide le champ de saisie
      setMessage('URL ajoutée avec succès !');
      setTimeout(() => setMessage(null), 3000);
    } else if (newUrl.trim() && fileUrls.includes(newUrl.trim())) {
      setMessage('Cette URL est déjà dans la liste.');
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage('Veuillez entrer une URL valide.');
      setTimeout(() => setMessage(null), 3000);
    }
  }, [newUrl, fileUrls, onUploadComplete]);

  // Fonction pour supprimer une URL de la liste
  const handleRemoveUrl = useCallback((urlToRemove: string) => {
    const updatedUrls = fileUrls.filter(url => url !== urlToRemove);
    setFileUrls(updatedUrls);
    onUploadComplete(updatedUrls); // Notifie le parent
    setMessage('URL supprimée.');
    setTimeout(() => setMessage(null), 3000);
  }, [fileUrls, onUploadComplete]);

  // Placeholder pour la logique d'upload de fichier (nécessite un backend)
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Pour un vrai upload, vous enverriez ce fichier à votre backend.
      // Le backend stockerait le fichier et renverrait son URL.
      // Pour cet exemple, nous allons simuler un upload avec une URL temporaire.
      setMessage("Upload en cours (fonctionnalité backend requise pour l'upload réel)...");
      const simulatedUrl = `https://placehold.co/100x100/A0E7E5/000000?text=${files[0].name.substring(0, 10)}`; // URL de simulation
      
      setTimeout(() => {
        if (!fileUrls.includes(simulatedUrl)) {
            const updatedUrls = [...fileUrls, simulatedUrl];
            setFileUrls(updatedUrls);
            onUploadComplete(updatedUrls);
            setMessage(`'${files[0].name}' uploadé et ajouté.`);
        } else {
            setMessage(`'${files[0].name}' est déjà dans la liste.`);
        }
        e.target.value = ''; // Réinitialise l'input file
        setTimeout(() => setMessage(null), 3000);
      }, 1500); // Simule le temps d'upload
    }
  }, [fileUrls, onUploadComplete]);

  return (
    <div className="border border-gray-300 rounded-md p-4 bg-white shadow-sm">
      <p className="text-gray-700 mb-3 font-semibold">Ajouter des ressources pour l'élève (documents, images, etc.) :</p>
      
      {/* Section pour ajouter une URL directement */}
      <div className="mb-4">
        <label htmlFor="student-resource-url" className="block text-gray-700 text-sm font-bold mb-2">
          Ajouter une URL externe :
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="student-resource-url"
            className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Ex: https://exemple.com/document.pdf"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={disabled}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            Ajouter URL
          </button>
        </div>
      </div>

      {/* Section pour l'upload de fichier (nécessite backend) */}
      <div className="mb-4">
        <label htmlFor="student-file-upload" className="block text-gray-700 text-sm font-bold mb-2">
          Uploader un fichier (PDF, image, etc.) :
        </label>
        <input
          type="file"
          id="student-file-upload"
          className="w-full text-gray-700 p-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0 file:text-sm file:font-semibold
                      file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          onChange={handleFileUpload}
          disabled={disabled}
          multiple // Permet de sélectionner plusieurs fichiers si le backend le supporte
        />
        <p className="text-xs text-gray-500 mt-1">
          L'upload direct de fichiers nécessite une configuration de stockage côté serveur.
        </p>
      </div>

      {/* Affichage des messages */}
      {message && (
        <div className={`mb-3 p-2 text-sm rounded-md ${message.includes('succès') || message.includes('ajouté') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Liste des URLs des ressources */}
      {fileUrls.length > 0 && (
        <div className="mt-4 border-t pt-4 border-gray-200">
          <h5 className="font-semibold text-gray-700 mb-2">Ressources actuelles pour l'élève :</h5>
          <ul className="list-disc list-inside text-gray-800">
            {fileUrls.map((url, index) => (
              <li key={index} className="flex items-center justify-between mb-1">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                  {url.length > 70 ? `${url.substring(0, 67)}...` : url}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(url)}
                  disabled={disabled}
                  className="ml-2 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition duration-150 ease-in-out"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StudentResourceUploader;
