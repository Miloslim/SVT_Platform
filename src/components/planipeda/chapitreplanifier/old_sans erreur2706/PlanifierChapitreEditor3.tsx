// src/components/planipeda/chapitreplanifier/PlanifierChapitreEditor.tsx

/**
 * Nom du Fichier: PlanifierChapitreEditor.tsx
 * Chemin: src/components/planipeda/chapitreplanifier/PlanifierChapitreEditor.tsx
 *
 * Fonctionnalités:
 * - Fournit une interface utilisateur pour la création et l'édition de fiches de planification de chapitre.
 * - Gère l'état global d'un chapitre (titre, objectifs généraux, séquences).
 * - Utilise le composant `ChapterTargetSelector` pour la sélection de la position hiérarchique du chapitre (niveau, option, unité, chapitre de référence).
 * - **Pré-remplit automatiquement le titre et les objectifs (qui sont les "objectifs généraux" du chapitre)
 * du chapitre de planification basés sur le chapitre de référence sélectionné.**
 * - Permet d'ajouter de nouvelles séquences à un chapitre.
 * - Affiche et gère les modifications individuelles des séquences via le composant SequenceBlock.
 * - Permet la suppression de séquences.
 * - Inclut un placeholder pour la fonction de sauvegarde du chapitre (persistance des données).
 * - Servira de conteneur principal pour les futurs ActivityBlock et EvaluationBlock à travers SequenceBlock.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { PlanChapitre, PlanSequence } from '@/types/planificationTypes';
import SequenceBlock from './SequenceBlock';
import ChapterTargetSelector from "./ChapterTargetSelector";
import { supabase } from "@/backend/config/supabase";
// Importez le nouveau type qui reflète la relation directe avec la table 'objectifs'
import { ChapitreWithDirectObjectifsDb } from '@/types/dbTypes';

const PlanifierChapitreEditor: React.FC = () => {
  // Section 1: Gestion de l'État Local du Chapitre
  // ----------------------------------------------
  const [chapitre, setChapitre] = useState<PlanChapitre>({
    id: null,
    titreChapitre: '',
    objectifsGeneraux: '', // Ce champ sera rempli par les descriptions des objectifs du chapitre
    niveauId: null,
    optionId: null,
    uniteId: null,
    chapitreReferenceId: null,
    objectifsReferencesIds: [], // Cette liste contiendra les IDs des objectifs du chapitre de référence
    sequences: [],
  });

  // NOUVEL ÉTAT (maintenu) : Pour stocker l'ID et la description des objectifs de référence pour l'affichage
  const [referenceObjectifsDetails, setReferenceObjectifsDetails] = useState<{ id: number; description: string }[]>([]);

  // Section 2: Fonctions de Gestion des Événements
  // ------------------------------------------------
  const handleChapitreTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChapitre(prevChapitre => ({
      ...prevChapitre,
      [name]: value,
    }));
  };

  const handleTargetSelectionChange = useCallback((selection: {
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
    chapitreReferenceId: number | null;
    chapitreReferenceTitle: string | null; // Assurez-vous que ChapterTargetSelector passe ce prop
  }) => {
    console.log("[PlanifierChapitreEditor] ChapterTargetSelector a remonté la sélection:", selection);
    setChapitre(prevChapitre => ({
      ...prevChapitre,
      niveauId: selection.niveauId,
      optionId: selection.optionId,
      uniteId: selection.uniteId,
      chapitreReferenceId: selection.chapitreReferenceId,
      // Pré-remplir le titre du chapitre à planifier si un chapitre de référence est choisi
      titreChapitre: selection.chapitreReferenceId ? (selection.chapitreReferenceTitle || '') : '',
    }));
  }, []);

  // --- EFFET POUR LE PRÉ-REMPLISSAGE AUTOMATIQUE ET LA RÉCUPÉRATION DES OBJECTIFS ---
  useEffect(() => {
    const fetchChapitreReferenceDetails = async () => {
      const chapitreRefId = chapitre.chapitreReferenceId;

      if (!chapitreRefId) {
        console.log("[PlanifierChapitreEditor] Aucun chapitre de référence sélectionné. Réinitialisation des champs du formulaire et des objectifs.");
        setChapitre(prevChapitre => ({
          ...prevChapitre,
          titreChapitre: '',
          objectifsGeneraux: '',
          objectifsReferencesIds: [],
        }));
        setReferenceObjectifsDetails([]);
        return;
      }

      console.log(`[PlanifierChapitreEditor] Tentative de récupération des détails pour chapitreReferenceId: ${chapitreRefId}`);

      // **********************************************************************
      // Jointure directe sur la table 'objectifs' via sa colonne 'chapitre_id'.
      // Note: 'objectifs_generaux' est supprimé du select car il n'existe pas dans la table 'chapitres'.
      // **********************************************************************
      const { data, error } = await supabase
        .from('chapitres')
        .select<ChapitreWithDirectObjectifsDb>(` // Utilisation du type rectifié
          id,
          titre_chapitre,
          objectifs (         // Jointure directe sur la table 'objectifs'
            id,               // L'ID de l'objectif
            description_objectif // La description de l'objectif
          )
        `)
        .eq('id', chapitreRefId)
        .single();

      if (error) {
        console.error("[PlanifierChapitreEditor] Erreur Supabase lors de la récupération des détails du chapitre de référence:", error.message);
        if (error.code === 'PGRST116') {
            console.warn(`[PlanifierChapitreEditor] Chapitre de référence avec ID ${chapitreRefId} introuvable dans la base de données. Les champs seront vides.`);
        }
        // Réinitialiser les champs en cas d'erreur
        setChapitre(prevChapitre => ({
          ...prevChapitre,
          titreChapitre: '',
          objectifsGeneraux: '',
          objectifsReferencesIds: [],
        }));
        setReferenceObjectifsDetails([]); // Réinitialise aussi les détails d'affichage
      } else if (data) {
        console.log("[PlanifierChapitreEditor] Détails du chapitre de référence récupérés avec succès:", data);

        // Extraction des IDs des objectifs
        const objectifsIds = (data.objectifs || [])
                                .map(obj => obj.id)
                                .filter((id): id is number => id !== null);

        // Extraction des descriptions des objectifs pour le champ "objectifsGeneraux"
        // et pour l'affichage détaillé.
        const extractedObjectifsDetails = (data.objectifs || [])
                                            .map(obj => ({
                                                id: obj.id,
                                                description: obj.description_objectif || 'Aucune description'
                                            }));
        setReferenceObjectifsDetails(extractedObjectifsDetails); // Met à jour l'état pour l'affichage détaillé

        // Concatène les descriptions des objectifs pour le champ "Objectifs généraux du chapitre"
        const formattedObjectifsGeneraux = extractedObjectifsDetails
                                            .map(obj => `${obj.id}. ${obj.description}`)
                                            .join('\n\n'); // Séparer par des doubles sauts de ligne pour la lisibilité

        setChapitre(prevChapitre => ({
          ...prevChapitre,
          titreChapitre: data.titre_chapitre || '',
          objectifsGeneraux: formattedObjectifsGeneraux, // Rempli avec les descriptions concaténées
          objectifsReferencesIds: objectifsIds, // Maintient la liste des IDs
        }));
      }
    };

    fetchChapitreReferenceDetails();
  }, [chapitre.chapitreReferenceId]);

  const handleAjouterSequence = () => {
    const newSeq: PlanSequence = {
      id: Date.now(),
      titre: '', // Correction pour correspondre à PlanSequence
      description: '',
      activites: [], // Correction pour correspondre à PlanSequence
      evaluations: [], // Correction pour correspondre à PlanSequence
    };
    setChapitre(prevChapitre => ({
      ...prevChapitre,
      sequences: [...prevChapitre.sequences, newSeq],
    }));
  };

  const handleUpdateSequence = (updatedSeq: PlanSequence) => {
    setChapitre(prevChapitre => ({
      ...prevChapitre,
      sequences: prevChapitre.sequences.map(seq =>
        seq.id === updatedSeq.id ? updatedSeq : seq
      ),
    }));
  };

  // RECTIFICATION ICI: le paramètre sequenceId peut être 'number' ou 'null'
  const handleRemoveSequence = (sequenceId: number | null) => {
    setChapitre(prevChapitre => ({
      ...prevChapitre,
      sequences: prevChapitre.sequences.filter(seq => seq.id !== sequenceId),
    }));
  };

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

      {/* --- SECTION 1: Ciblage du Chapitre (ENTÊTE) --- */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ciblage du Chapitre dans la Progression</h2>
        <ChapterTargetSelector
          onChange={handleTargetSelectionChange}
          initialNiveauId={chapitre.niveauId}
          initialOptionId={chapitre.optionId}
          initialUniteId={chapitre.uniteId}
          initialChapitreReferenceId={chapitre.chapitreReferenceId}
        />
      </div>
      {/* --- FIN DE LA SECTION 1 --- */}
      <hr className="my-6 border-gray-200" /> {/* Ligne de séparation */}

      {/* --- SECTION 2: Informations Générales du Chapitre (Pré-remplies si chapitre de référence sélectionné) --- */}
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
          readOnly // Rendre ce champ en lecture seule car il est auto-généré par le selector
        />

        <label htmlFor="objectifsGeneraux" className="block text-gray-700 text-sm font-bold mb-2">
          Objectifs du chapitre (à planifier) :
        </label>
        <textarea
          id="objectifsGeneraux"
          name="objectifsGeneraux"
          placeholder="Les objectifs de ce chapitre s'afficheront ici si un chapitre de référence est sélectionné..."
          value={chapitre.objectifsGeneraux}
          onChange={handleChapitreTextChange}
          rows={6} // Augmentez la taille pour plus de lisibilité
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y"
          readOnly // Rendre ce champ en lecture seule s'il est auto-généré
        />

        {/* Affichage des IDs et descriptions des objectifs de référence liés - C'est une liste détaillée. */}
        {referenceObjectifsDetails.length > 0 && (
          <div className="mt-4 p-3 bg-gray-100 border border-gray-200 rounded-md">
            <h3 className="text-md font-semibold text-gray-700 mb-2">Détail des objectifs de référence :</h3>
            <ul className="list-disc list-inside text-gray-600">
              {referenceObjectifsDetails.map(obj => (
                <li key={obj.id} className="text-sm">
                  <strong>Objectif {obj.id}:</strong> {obj.description}
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-500 mt-2">
              Note : Ces objectifs proviennent du chapitre de référence que vous avez choisi.
            </p>
          </div>
        )}

      </div>
      {/* --- FIN DE LA SECTION 2 --- */}
      <hr className="my-6 border-gray-200" /> {/* Ligne de séparation */}


      {/* Sous-section: Gestion et Affichage des Séquences */}
      <div className="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Séquences Pédagogiques du Chapitre</h2>

        {chapitre.sequences.length === 0 ? (
          <p className="text-gray-600 mb-4">Ajoutez votre première séquence pour commencer à planifier le déroulement du chapitre.</p>
        ) : (
          <div className="space-y-6">
            {chapitre.sequences.map(seq => (
              <SequenceBlock
                key={seq.id || `new-seq-${Date.now() + Math.random()}`}
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