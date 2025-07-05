// src/components/planipeda/chapitreplanifier/PlanifierChapitreEditor.tsx version , insert les évaluation!

/**
 * Nom du Fichier: PlanifierChapitreEditor.tsx
 * Chemin: src/components/planipeda/chapitreplanifier/PlanifierChapitreEditor.tsx
 *
 * Fonctionnalités:
 * - Fournit une interface utilisateur pour la création et l'édition de fiches de planification de chapitre.
 * - Gère l'état global d'un chapitre (titre, objectifs généraux, et la progression pédagogique).
 * - Utilise le composant `ChapterTargetSelector` pour la sélection de la position hiérarchique du chapitre
 * (niveau, option, unité, chapitre de référence).
 * - Pré-remplit automatiquement le titre et les objectifs (objectifs généraux du chapitre)
 * du chapitre de planification basés sur le chapitre de référence sélectionné.
 * - Permet d'ajouter des Séquences, des Activités (via sélection d'existantes) et des Évaluations (via sélection d'existantes) directement à la progression du chapitre.
 * - Affiche et gère les modifications individuelles des Séquences, Activités et Évaluations
 * via leurs composants respectifs (SequenceBlock, ActivityBlock, EvaluationBlock).
 * - Permet la suppression des éléments de la progression.
 * - Utilise `planificationService` pour la persistance des données dans Supabase.
 *
 * NOTE: Cette version est adaptée à une structure de base de données où les activités et évaluations
 * ne sont PAS physiquement imbriquées dans les séquences. Tous les éléments de progression (séquences,
 * activités, évaluations) sont traités comme des éléments de premier niveau sous la fiche de planification.
 * Leurs détails sont tirés de tables "maîtres" et sont en lecture seule dans cette interface.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Pour récupérer l'ID en mode édition
import {
  PlanChapitre,
  PlanActivity,
  PlanSequence,
  PlanEvaluation,
  PlanChapterProgressionItem,
} from '@/types/planificationTypes';
import SequenceBlock from './SequenceBlock';
import ChapterTargetSelector from './ChapterTargetSelector';
import { supabase } from '@/backend/config/supabase';
import { ChapitreWithDirectObjectifsDb } from '@/types/dbTypes';

// Importez les composants de bloc
import ActivityBlock from './ActivityBlock';
import EvaluationBlock from './EvaluationBlock';

// Importation de votre CustomModal.tsx
import CustomModal from '@/components/common/CustomModal';

// Les sélecteurs d'activités et d'évaluations
import ActivitySelector, { ActivityDisplayData } from '@/components/planipeda/ScenarioEditor/ActivitySelector';
import EvaluationSelector, { EvaluationDisplayData } from '@/components/planipeda/ScenarioEditor/EvaluationSelector'; // NOUVEAU: Importez EvaluationSelector

// Importation du service de planification
import { planificationService } from '@/services/planificationService';

const PlanifierChapitreEditor: React.FC = () => {
  const { id: chapterFicheIdFromUrl } = useParams<{ id: string }>(); // Récupère l'ID de la fiche de planification

  // Section 1: Gestion de l'État Local du Chapitre
  // ----------------------------------------------
  const [chapitre, setChapitre] = useState<PlanChapitre>({
    id: chapterFicheIdFromUrl || null,
    titreChapitre: '', // Sera rempli à partir du chapitre de référence
    objectifsGeneraux: '', // Sera rempli à partir des objectifs du chapitre de référence
    objectifsReferencesIds: [],
    chapitreReferenceId: null,
    niveauId: null,
    optionId: null,
    uniteId: null,
    progressionItems: [],
    statut: 'Brouillon', // CORRECTION ICI: 'Brouillon' en minuscules pour correspondre à la contrainte CHECK
    createdBy: 'current_user_id', // TODO: Remplacer par l'ID de l'utilisateur connecté dynamiquement
  });

  // ÉTAT pour stocker l'ID et la description des objectifs de référence pour l'affichage
  const [referenceObjectifsDetails, setReferenceObjectifsDetails] = useState<
    { id: number; description: string }[]
  >([]);

  // États pour contrôler la visibilité des modales
  const [showActivitySelectorModal, setShowActivitySelectorModal] = useState(false);
  const [showEvaluationSelectorModal, setShowEvaluationSelectorModal] = useState(false); // NOUVEAU: État pour la modale d'évaluation
  // TODO: const [showSequenceSelectorModal, setShowSequenceSelectorModal] = useState(false);


  // Section 2: Fonctions de Gestion des Événements du Chapitre
  // ---------------------------------------------------------

  // Pas de handleChapitreTextChange pour titreChapitre et objectifsGeneraux car ils sont en lecture seule.

  const handleTargetSelectionChange = useCallback(
    (selection: {
      niveauId: number | null;
      optionId: number | null;
      uniteId: number | null;
      chapitreReferenceId: number | null;
      chapitreReferenceTitle: string | null;
    }) => {
      console.log(
        '[PlanifierChapitreEditor] ChapterTargetSelector a remonté la sélection:',
        selection
      );
      setChapitre((prevChapitre) => ({
        ...prevChapitre,
        niveauId: selection.niveauId,
        optionId: selection.optionId,
        uniteId: selection.uniteId,
        chapitreReferenceId: selection.chapitreReferenceId,
        titreChapitre: selection.chapitreReferenceId
          ? selection.chapitreReferenceTitle || ''
          : '',
      }));
    },
    []
  );

  // --- EFFECT FOR AUTOMATIC PRE-FILLING (TITRE & OBJECTIFS) FROM REFERENCE CHAPTER ---
  useEffect(() => {
    const fetchChapitreReferenceDetails = async () => {
      const chapitreRefId = chapitre.chapitreReferenceId;

      // Si aucun chapitre de référence n'est sélectionné, réinitialise les champs.
      if (!chapitreRefId) {
        setChapitre((prevChapitre) => ({
          ...prevChapitre,
          titreChapitre: '',
          objectifsGeneraux: '',
          objectifsReferencesIds: [],
        }));
        setReferenceObjectifsDetails([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('chapitres')
          .select<ChapitreWithDirectObjectifsDb>(
            `
            id,
            titre_chapitre,
            unite:unite_id(
              id,
              titre_unite,
              option:option_id(
                id,
                nom_option,
                niveau:niveau_id(
                  id,
                  nom_niveau
                )
              )
            ),
            objectifs(
              id,
              description_objectif
            )
          `
          )
          .eq('id', chapitreRefId)
          .single();

        if (error) {
          console.error(
            '[PlanifierChapitreEditor] Erreur Supabase lors de la récupération des détails du chapitre de référence:',
            error.message
          );
          setChapitre((prevChapitre) => ({
            ...prevChapitre,
            titreChapitre: '',
            objectifsGeneraux: '',
            objectifsReferencesIds: [],
          }));
          setReferenceObjectifsDetails([]);
        } else if (data) {
          const objectifsIds = (data.objectifs || [])
            .map((obj) => obj.id)
            .filter((id): id is number => id !== null);

          const extractedObjectifsDetails = (data.objectifs || []).map((obj) => ({
            id: obj.id,
            description: obj.description_objectif || 'Aucune description',
          }));
          setReferenceObjectifsDetails(extractedObjectifsDetails);

          const formattedObjectifsGeneraux = extractedObjectifsDetails
            .map((obj) => `${obj.id}. ${obj.description}`)
            .join('\n\n');

          setChapitre((prevChapitre) => ({
            ...prevChapitre,
            titreChapitre: data.titre_chapitre || '',
            objectifsGeneraux: formattedObjectifsGeneraux,
            objectifsReferencesIds: objectifsIds,
            niveauId: data.unite?.option?.niveau?.id || null,
            optionId: data.unite?.option?.id || null,
            uniteId: data.unite?.id || null,
          }));
        }
      } catch (err) {
        console.error("[PlanifierChapitreEditor] Erreur inattendue lors du chargement des détails du chapitre de référence:", err);
      }
    };

    fetchChapitreReferenceDetails();
  }, [chapitre.chapitreReferenceId]);

  // État pour gérer le chargement lors de la sauvegarde initiale ou du chargement de la fiche
  const [isSavingOrLoading, setIsSavingOrLoading] = useState(false);

  // --- EFFECT FOR LOADING EXISTING FICHE IN EDIT MODE ---
  useEffect(() => {
    const loadExistingChapFiche = async () => {
      if (chapterFicheIdFromUrl) {
        setIsSavingOrLoading(true);
        console.log(`[PlanifierChapitreEditor] Mode édition: Chargement de la fiche avec ID: ${chapterFicheIdFromUrl}`);
        try {
          const loadedChapitreData = await planificationService.loadPlanChapitre(chapterFicheIdFromUrl);
          if (loadedChapitreData) {
            setChapitre(loadedChapitreData);
          } else {
            console.warn(`Fiche de planification avec ID ${chapterFicheIdFromUrl} introuvable. Initialisation d'une nouvelle fiche.`);
            // Si la fiche n'est pas trouvée, réinitialiser pour une nouvelle création
            setChapitre((prev) => ({
                ...prev,
                id: null,
                progressionItems: [],
                statut: 'Brouillon',
                createdBy: 'current_user_id',
            }));
            setReferenceObjectifsDetails([]);
          }
        } catch (error) {
          console.error("Erreur lors du chargement de la fiche existante:", error);
          alert("Erreur lors du chargement de la fiche de planification: " + (error as Error).message);
        } finally {
            setIsSavingOrLoading(false);
        }
      } else {
        console.log("[PlanifierChapitreEditor] Mode création: Aucun ID de fiche dans l'URL. Initialisation de la fiche vierge.");
        setChapitre((prev) => ({
          ...prev,
          id: null,
          progressionItems: [],
          statut: 'Brouillon',
          createdBy: 'current_user_id',
        }));
        setReferenceObjectifsDetails([]);
      }
    };

    loadExistingChapFiche();
  }, [chapterFicheIdFromUrl]);


  // Section 3: Fonctions de Gestion des Éléments de Progression
  // -----------------------------------------------------------

  const getNextOrder = (): number => {
    if (chapitre.progressionItems.length === 0) return 0;
    // Trouver l'ordre maximum existant et ajouter 1
    const maxOrder = Math.max(...chapitre.progressionItems.map(item => item.ordre));
    return maxOrder + 1;
  };

  const handleAddSequence = () => {
    alert("Pour ajouter une séquence, veuillez utiliser un sélecteur dédié (fonctionnalité à implémenter).");
  };

  const handleOpenActivitySelector = () => {
    if (!chapitre.chapitreReferenceId) {
      alert("Veuillez d'abord sélectionner un chapitre de référence pour filtrer les activités.");
      return;
    }
    setShowActivitySelectorModal(true);
  };

  // Fonction pour gérer l'activité sélectionnée depuis la modale
  const handleActivitySelectedFromModal = useCallback(
    async (sourceId: number, activityDetails: Omit<ActivityDisplayData, 'id'>) => {
      // 1. Si la fiche n'a pas encore d'ID (nouvelle fiche), la sauvegarder d'abord pour obtenir un ID
      let currentChapficheId = chapitre.id;
      if (!currentChapficheId) {
        setIsSavingOrLoading(true); // Active l'indicateur de chargement
        try {
          // Créer une copie du chapitre pour la sauvegarde initiale sans les items de progression
          const tempChapitreToSave: PlanChapitre = {
            ...chapitre,
            id: null, // S'assurer que l'ID est null pour la première insertion
            progressionItems: [] // Les items ne sont pas sauvegardés lors de cette étape initiale
          };
          const savedChapitre = await planificationService.savePlanChapitre(tempChapitreToSave);
          currentChapficheId = savedChapitre.id;
          setChapitre(savedChapitre); // Mettre à jour l'état du chapitre avec le nouvel ID
          console.log("Fiche de planification initialement sauvegardée avec l'ID:", currentChapficheId);
        } catch (error) {
          console.error("Erreur lors de la sauvegarde initiale de la fiche:", error);
          alert("Échec de la sauvegarde initiale de la fiche: " + (error as Error).message);
          setIsSavingOrLoading(false);
          return; // Arrêter le processus si la sauvegarde initiale échoue
        } finally {
          setIsSavingOrLoading(false); // Désactive l'indicateur de chargement
        }
      }

      // À ce stade, currentChapficheId est garanti d'être non-null
      const newActivity: PlanActivity = {
        id: crypto.randomUUID(), // ID unique généré côté client pour le 'key' prop de React
        type: 'activity',
        sourceId: sourceId, // L'ID de l'activité maître
        ordre: getNextOrder(),
        chapficheId: Number(currentChapficheId), // L'ID numérique de la chapfiche parente
      };

      setChapitre((prevChapitre) => ({
        ...prevChapitre,
        progressionItems: [...prevChapitre.progressionItems, newActivity],
      }));
      console.log(
        '[PlanifierChapitreEditor] Activité existante sélectionnée et ajoutée:',
        newActivity
      );
      setShowActivitySelectorModal(false); // Ferme la modale
    },
    [chapitre, getNextOrder] // Dépendances mises à jour pour inclure `chapitre` et `getNextOrder`
  );

  // NOUVEAU: Fonction pour ouvrir la modale de sélection d'évaluation
  const handleOpenEvaluationSelector = () => {
    if (!chapitre.chapitreReferenceId) {
      alert("Veuillez d'abord sélectionner un chapitre de référence pour filtrer les évaluations.");
      return;
    }
    setShowEvaluationSelectorModal(true);
  };

  // NOUVEAU: Fonction pour gérer l'évaluation sélectionnée depuis la modale
  const handleEvaluationSelectedFromModal = useCallback(
    async (sourceId: number, evaluationDetails: Omit<EvaluationDisplayData, 'id'>) => {
      let currentChapficheId = chapitre.id;
      if (!currentChapficheId) {
        setIsSavingOrLoading(true);
        try {
          const tempChapitreToSave: PlanChapitre = {
            ...chapitre,
            id: null,
            progressionItems: []
          };
          const savedChapitre = await planificationService.savePlanChapitre(tempChapitreToSave);
          currentChapficheId = savedChapitre.id;
          setChapitre(savedChapitre);
          console.log("Fiche de planification initialement sauvegardée (pour évaluation) avec l'ID:", currentChapficheId);
        } catch (error) {
          console.error("Erreur lors de la sauvegarde initiale de la fiche (pour évaluation):", error);
          alert("Échec de la sauvegarde initiale de la fiche (pour évaluation): " + (error as Error).message);
          setIsSavingOrLoading(false);
          return;
        } finally {
          setIsSavingOrLoading(false);
        }
      }

      const newEvaluation: PlanEvaluation = {
        id: crypto.randomUUID(), // ID unique généré côté client
        type: 'evaluation',
        sourceId: sourceId, // L'ID de l'évaluation maître
        ordre: getNextOrder(),
        chapficheId: Number(currentChapficheId),
      };

      setChapitre((prevChapitre) => ({
        ...prevChapitre,
        progressionItems: [...prevChapitre.progressionItems, newEvaluation],
      }));
      console.log(
        '[PlanifierChapitreEditor] Évaluation existante sélectionnée et ajoutée:',
        newEvaluation
      );
      setShowEvaluationSelectorModal(false); // Ferme la modale
    },
    [chapitre, getNextOrder] // Dépendances mises à jour
  );


  // Gestionnaire de mise à jour générique (pour l'ordre ou d'autres propriétés de PlanActivity/Sequence/Evaluation)
  const handleUpdateProgressionItem = useCallback(
    (updatedItem: PlanChapterProgressionItem) => {
      setChapitre((prevChapitre) => ({
        ...prevChapitre,
        progressionItems: prevChapitre.progressionItems.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        ),
      }));
      console.log(
        `[PlanifierChapitreEditor] Élément mis à jour (${updatedItem.type}):`,
        updatedItem
      );
    },
    []
  );

  // Gestionnaire de suppression générique pour n'importe quel type d'élément de progression
  const handleRemoveProgressionItem = useCallback((itemId: string) => { // ID est un string
    setChapitre((prevChapitre) => {
      const updatedItems = prevChapitre.progressionItems.filter(
        (item) => item.id !== itemId
      );
      console.log(
        `[PlanifierChapitreEditor] Suppression de l'élément avec l'ID: ${itemId}. Éléments restants:`,
        updatedItems
      );
      return {
        ...prevChapitre,
        progressionItems: updatedItems,
      };
    });
  }, []);

  const handleSave = async () => {
    if (!chapitre.chapitreReferenceId) {
      alert("Veuillez sélectionner un chapitre de référence avant d'enregistrer la fiche de planification.");
      return;
    }

    setIsSavingOrLoading(true); // Active l'indicateur de chargement
    try {
      const savedChapitre = await planificationService.savePlanChapitre(chapitre);
      setChapitre(savedChapitre); // Met à jour l'état avec l'ID de la DB si c'est une nouvelle insertion
      alert("Fiche de planification enregistrée avec succès !");
      console.log('Fiche de planification enregistrée:', savedChapitre);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la fiche de planification:', error);
      alert('Échec de l\'enregistrement de la fiche de planification: ' + (error as Error).message);
    } finally {
        setIsSavingOrLoading(false); // Désactive l'indicateur de chargement
    }
  };

  // Section 4: Rendu de l'Interface Utilisateur
  // -------------------------------------------
  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-4xl mx-auto my-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Composer une Fiche de Planification de Chapitre
      </h1>

      {isSavingOrLoading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-700">Enregistrement en cours...</p>
          </div>
        </div>
      )}

      {/* --- SECTION 1: Ciblage du Chapitre (ENTÊTE) --- */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Ciblage du Chapitre dans la Progression
        </h2>
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
        <label
          htmlFor="titreChapitre"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Titre du chapitre (à planifier) :
        </label>
        <input
          type="text"
          id="titreChapitre"
          name="titreChapitre"
          placeholder="Ex: Le cycle de l'eau"
          value={chapitre.titreChapitre}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
          readOnly // TOUJOURS EN LECTURE SEULE
        />
      </div>
      <div className="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
        <label
          htmlFor="objectifsGeneraux"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Objectifs du chapitre :
        </label>
        {referenceObjectifsDetails.length > 0 && (
          <div className="mt-4 p-3 bg-blue-100 border border-gray-200 rounded-md">
            <ul className="list-disc list-inside text-gray-900 space-y-2">
              {referenceObjectifsDetails.map((obj, index) => (
                <li key={obj.id} className="text-sm">
                  <strong>Objectif {index + 1} :</strong> {obj.description}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* --- FIN DE LA SECTION 2 --- */}
      <hr className="my-6 border-gray-200" /> {/* Ligne de séparation */}

      {/* --- SECTION 3: Gestion et Affichage des Éléments de Progression --- */}
      <div className="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Ajouter une entité pédagogique à la progression du chapitre
        </h2>

        {chapitre.progressionItems.length === 0 ? (
          <p className="text-gray-600 mb-4">
            Commencez par ajouter une séquence, une activité ou une évaluation pour
            planifier le déroulement du chapitre.
          </p>
        ) : (
          <div className="space-y-6">
            {chapitre.progressionItems.sort((a, b) => a.ordre - b.ordre).map((item) => {
              // Chaque item est maintenant un élément de premier niveau
              if (item.type === 'sequence') {
                return (
                  <SequenceBlock
                    key={item.id} // Utilise l'ID généré côté client
                    sequence={item}
                    onUpdate={handleUpdateProgressionItem}
                    onDelete={() => handleRemoveProgressionItem(item.id)}
                  />
                );
              } else if (item.type === 'activity') {
                return (
                  <ActivityBlock
                    key={item.id} // Utilise l'ID généré côté client
                    activity={item}
                    onUpdate={handleUpdateProgressionItem}
                    onDelete={() => handleRemoveProgressionItem(item.id)}
                  />
                );
              } else if (item.type === 'evaluation') {
                return (
                  <EvaluationBlock
                    key={item.id} // Utilise l'ID généré côté client
                    evaluation={item}
                    onUpdate={handleUpdateProgressionItem}
                    onDelete={() => handleRemoveProgressionItem(item.id)}
                  />
                );
              }
              return null;
            })}
          </div>
        )}

{/* Boutons d'action pour ajouter de nouveaux éléments de progression */}
<div className="flex space-x-4 mt-6">
  <button
    onClick={handleAddSequence}
    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
  >
    + Ajouter une Séquence
  </button>
  <button
    onClick={handleOpenActivitySelector}
    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
  >
    + Ajouter une Activité
  </button>
  {/* NOUVEAU: Déclenche la modale d'évaluation */}
  <button
    onClick={handleOpenEvaluationSelector}
    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
  >
    + Ajouter une Évaluation
  </button>
</div>

      </div>
      {/* --- FIN DE LA SECTION 3 --- */}

      {/* --- SECTION 4: Actions Globales (Sauvegarde) --- */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        >
          Enregistrer le Chapitre
        </button>
      </div>
      {/* --- FIN DE LA SECTION 4 --- */}

      {/* Modale de sélection d'activité */}
      <CustomModal
        isOpen={showActivitySelectorModal}
        onClose={() => setShowActivitySelectorModal(false)}
        title="Sélectionner une Activité existante"
      >
        <ActivitySelector
          onActivitySelected={handleActivitySelectedFromModal}
          onCancel={() => setShowActivitySelectorModal(false)}
          // Passage des IDs de filtre basés sur le chapitre courant
          niveauId={chapitre.niveauId}
          optionId={chapitre.optionId}
          uniteId={chapitre.uniteId}
          chapitreReferenceId={chapitre.chapitreReferenceId}
        />
         <div className="flex justify-center mt-4 text-gray-600 text-sm">
           Pour créer une nouvelle activité, veuillez utiliser le tableau de bord dédié aux activités.
         </div>
      </CustomModal>

      {/* NOUVEAU: Modale de sélection d'évaluation */}
      <CustomModal
        isOpen={showEvaluationSelectorModal}
        onClose={() => setShowEvaluationSelectorModal(false)}
        title="Sélectionner une Évaluation existante"
      >
        <EvaluationSelector
          onEvaluationSelected={handleEvaluationSelectedFromModal}
          onCancel={() => setShowEvaluationSelectorModal(false)}
          // Passage des IDs de filtre basés sur le chapitre courant
          niveauId={chapitre.niveauId}
          optionId={chapitre.optionId}
          uniteId={chapitre.uniteId}
          chapitreReferenceId={chapitre.chapitreReferenceId}
        />
         <div className="flex justify-center mt-4 text-gray-600 text-sm">
           Pour créer une nouvelle évaluation, veuillez utiliser le tableau de bord dédié aux évaluations.
         </div>
      </CustomModal>
    </div>
  );
};

export default PlanifierChapitreEditor;
