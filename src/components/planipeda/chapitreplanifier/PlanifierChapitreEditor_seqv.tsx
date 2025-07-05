// src/components/planipeda/chapitreplanifier/PlanifierChapitreEditorv1.tsx

/**
 * Nom du Fichier: PlanifierChapitreEditor.tsx
 * Chemin: src/components/planipeda/chapitreplanifier/PlanifierChapitreEditor.tsx
 *
 * Fonctionnalités:
 * - Fournit une interface utilisateur pour la création et l'édition de fiches de planification de chapitre.
 * - Gère l'état global d'un chapitre (titre, objectifs généraux, séquences).
 * - **Utilise le composant `ChapterTargetSelector` pour la sélection de la position hiérarchique du chapitre (niveau, option, unité, chapitre de référence).**
 * - Permet d'ajouter de nouvelles séquences à un chapitre.
 * - Affiche et gère les modifications individuelles des séquences via le composant SequenceBlock.
 * - Permet la suppression de séquences.
 * - Inclut un placeholder pour la fonction de sauvegarde du chapitre (persistance des données).
 * - Servira de conteneur principal pour les futurs ActivityBlock et EvaluationBlock à travers SequenceBlock.
 */

import React, { useState, useCallback } from 'react';
import { PlanChapitre, PlanSequence } from '@/types/planificationTypes'; // Assurez-vous que PlanChapitre est mis à jour
import SequenceBlock from './SequenceBlock';
// Importation du nouveau composant de ciblage
import ChapterTargetSelector from "./ChapterTargetSelector";

const PlanifierChapitreEditor: React.FC = () => {
  // Section 1: Gestion de l'État Local du Chapitre
  // ----------------------------------------------
  // `chapitre` : stocke les données complètes du chapitre en cours d'édition.
  // `setChapitre` : fonction pour mettre à jour l'état du chapitre.
  const [chapitre, setChapitre] = useState<PlanChapitre>({
    id: null,
    titreChapitre: '',
    objectifsGeneraux: '',
    niveauId: null,       // ID du niveau sélectionné (initialisé à null)
    optionId: null,       // ID de l'option sélectionnée (initialisé à null)
    uniteId: null,        // ID de l'unité sélectionnée (initialisé à null)
    chapitreReferenceId: null, // ID du chapitre de référence (initialisé à null)
    // objectifsReferencesIds est maintenu ici, même s'il n'est pas rempli par ChapterTargetSelector,
    // car il pourrait l'être par d'autres moyens ou être un champ futur.
    objectifsReferencesIds: [],
    sequences: [],
  });

  // Section 2: Fonctions de Gestion des Événements
  // ------------------------------------------------

  /**
   * Gère les changements dans les champs de texte (input, textarea) des informations générales du chapitre.
   * Met à jour l'état `chapitre` en conséquence.
   */
  const handleChapitreTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChapitre(prevChapitre => ({
      ...prevChapitre,
      [name]: value,
    }));
  };

  /**
   * Gère les changements de sélection provenant du ChapterTargetSelector.
   * Met à jour les IDs de niveau, option, unité et chapitre de référence dans l'état du chapitre.
   */
  const handleTargetSelectionChange = useCallback((selection: {
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
    chapitreReferenceId: number | null;
  }) => {
    console.log("ChapterTargetSelector a remonté la sélection:", selection);
    setChapitre(prevChapitre => ({
      ...prevChapitre,
      niveauId: selection.niveauId,
      optionId: selection.optionId,
      uniteId: selection.uniteId,
      chapitreReferenceId: selection.chapitreReferenceId,
    }));
  }, []);


  /**
   * Ajoute une nouvelle séquence vide à la liste des séquences du chapitre.
   * Assigne un ID temporaire unique basé sur le timestamp.
   */
  const handleAjouterSequence = () => {
    const newSeq: PlanSequence = {
      id: Date.now(),
      title: '',
      description: '',
      activities: [],
      evaluations: [],
    };
    setChapitre(prevChapitre => ({
      ...prevChapitre,
      sequences: [...prevChapitre.sequences, newSeq],
    }));
  };

  /**
   * Met à jour une séquence spécifique dans l'état `chapitre`.
   * Cette fonction est passée en prop à chaque `SequenceBlock` pour permettre les mises à jour locales.
   * @param updatedSeq L'objet PlanSequence avec les données mises à jour.
   */
  const handleUpdateSequence = (updatedSeq: PlanSequence) => {
    setChapitre(prevChapitre => ({
      ...prevChapitre,
      sequences: prevChapitre.sequences.map(seq =>
        seq.id === updatedSeq.id ? updatedSeq : seq
      ),
    }));
  };

  /**
   * Supprime une séquence spécifique de l'état `chapitre` en fonction de son ID.
   * Cette fonction est passée en prop à chaque `SequenceBlock`.
   * @param sequenceId L'ID numérique de la séquence à supprimer.
   */
  const handleRemoveSequence = (sequenceId: number) => {
    setChapitre(prevChapitre => ({
      ...prevChapitre,
      sequences: prevChapitre.sequences.filter(seq => seq.id !== sequenceId),
    }));
  };

  /**
   * Gère l'action de sauvegarde du chapitre.
   * Pour l'instant, affiche les données dans la console. Plus tard, fera appel à un service API.
   */
  const handleSave = () => {
    console.log("Sauvegarde du chapitre :", chapitre);
    // TODO: Phase 5 - Implémenter l'appel à chapitresService.ts pour persister les données
    alert("Fonction de sauvegarde à implémenter (voir console) !");
  };

  // Section 3: Rendu de l'Interface Utilisateur
  // --------------------------------------------
  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-4xl mx-auto my-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Composer une Fiche de Planification de Chapitre</h1>

      {/* Sous-section: Informations Générales du Chapitre (Titre, Objectifs Généraux) */}
      <div className="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
        <label htmlFor="titreChapitre" className="block text-gray-700 text-sm font-bold mb-2">
          Titre du chapitre (à planifier) :
        </label>
        <input
          type="text"
          id="titreChapitre"
          name="titreChapitre"
          placeholder="Ex: Le cycle de l'eau"
          value={chapitre.titreChapitre}
          onChange={handleChapitreTextChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
        />

        <label htmlFor="objectifsGeneraux" className="block text-gray-700 text-sm font-bold mb-2">
          Objectifs généraux du chapitre (à planifier) :
        </label>
        <textarea
          id="objectifsGeneraux"
          name="objectifsGeneraux"
          placeholder="Ex: Comprendre les étapes du cycle de l'eau et son importance..."
          value={chapitre.objectifsGeneraux}
          onChange={handleChapitreTextChange}
          rows={4}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y"
        />
      </div>

      {/* Sous-section: Ciblage du Chapitre via ChapterTargetSelector */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ciblage du Chapitre dans la Progression</h2>
        <ChapterTargetSelector
          onChange={handleTargetSelectionChange}
          // On passe les valeurs initiales pour l'édition si le chapitre existe déjà
          initialNiveauId={chapitre.niveauId}
          initialOptionId={chapitre.optionId}
          initialUniteId={chapitre.uniteId}
          initialChapitreReferenceId={chapitre.chapitreReferenceId}
        />
      </div>

      {/* Sous-section: Gestion et Affichage des Séquences */}
      <div className="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Séquences Pédagogiques du Chapitre</h2>

        {chapitre.sequences.length === 0 ? (
          <p className="text-gray-600 mb-4">Ajoutez votre première séquence pour commencer à planifier le déroulement du chapitre.</p>
        ) : (
          <div className="space-y-6">
            {chapitre.sequences.map(seq => (
              <SequenceBlock
                key={seq.id}
                sequence={seq}
                onUpdate={handleUpdateSequence}
                onDelete={() => handleRemoveSequence(seq.id)}
              />
            ))}
          </div>
        )}

        <button
          onClick={handleAjouterSequence}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        >
          + Ajouter une Nouvelle Séquence
        </button>
      </div>

      {/* Sous-section: Actions Globales (Sauvegarde) */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        >
          Enregistrer le Chapitre
        </button>
      </div>
    </div>
  );
};

export default PlanifierChapitreEditor;