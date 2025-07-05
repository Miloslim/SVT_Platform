// src/components/planipeda/chapitreplanifier/PlanifierChapitreEditor_complx.tsx

/**
 * Nom du Fichier: PlanifierChapitreEditor.tsx
 * Chemin: src/components/planipeda/chapitreplanifier/PlanifierChapitreEditor.tsx
 *
 * Fonctionnalités:
 * - Fournit une interface utilisateur pour la création et l'édition de fiches de planification de chapitre.
 * - Gère l'état global d'un chapitre (titre, objectifs généraux, et la progression pédagogique).
 * - Utilise le composant `ChapterTargetSelector` pour la selection de la position hiérarchique du chapitre
 * (niveau, option, unité, chapitre de référence).
 * - Pré-remplit automatiquement le titre et les objectifs (objectifs généraux du chapitre)
 * du chapitre de planification basés sur le chapitre de référence sélectionné.
 * - Permet d'ajouter des Séquences, des Activités (via selection d'existantes) et des Évaluations (via selection d'existantes) directement à la progression du chapitre.
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
import { useParams } from 'react-router-dom';
import {
  PlanChapitre,
  PlanActivity,
  PlanSequence,
  PlanEvaluation,
  PlanChapterProgressionItem,
  SequenceDisplayData,
  EvaluationData,
} from '@/types/planificationTypes';

import { supabase } from '@/backend/config/supabase';

import ChapterPlanningHeader from './ChapterPlanningHeader';

// Importez les composants de bloc
import ActivityBlock from './ActivityBlock';
import EvaluationBlock from './EvaluationBlock';
import SequenceBlock from './SequenceBlock'; // NOUVEAU: Import de SequenceBlock

import CustomModal from '@/components/common/CustomModal';

// Les sélecteurs d'activités et d'évaluations
import ActivitySelector, { ActivityDisplayData } from './ActivitySelectorchptr';
import EvaluationSelector, { EvaluationDisplayData } from './EvaluationSelectorchptr';
import SequenceSelector from './SequenceSelectorchptr'; // NOUVEAU: Import de SequenceSelector

// Importation du service de planification
import { planificationService } from '@/services/planificationService';

// Importez les formulaires d'édition maîtres
import EditActivityForm from './EditActivityForm';
import EditEvaluationForm from './EditEvaluationForm';
import EditSequenceForm from './EditSequenceForm'; // NOUVEAU: Import de EditSequenceForm

const PlanifierChapitreEditor: React.FC = () => {
  const { id: chapterFicheIdFromUrl } = useParams<{ id: string }>();

  const [chapitre, setChapitre] = useState<PlanChapitre>({
    id: chapterFicheIdFromUrl || null,
    titreChapitre: '',
    objectifsGeneraux: '',
    objectifsReferencesIds: [],
    chapitreReferenceId: null,
    niveauId: null,
    optionId: null,
    uniteId: null,
    progressionItems: [],
    statut: 'Brouillon',
    createdBy: 'current_user_id', // TODO: Remplacer par l'ID de l'utilisateur connecté dynamiquement
  });

  // États pour contrôler la visibilité des modales de sélection
  const [showActivitySelectorModal, setShowActivitySelectorModal] = useState(false);
  const [showEvaluationSelectorModal, setShowEvaluationSelectorModal] = useState(false);
  const [showSequenceSelectorModal, setShowSequenceSelectorModal] = useState(false);

  // États pour les modales d'édition d'activités/évaluations/séquences maîtres
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  const [editingMasterActivityId, setEditingMasterActivityId] = useState<number | null>(null);
  const [editingPlanActivityId, setEditingPlanActivityId] = useState<string | null>(null);

  const [showEditEvaluationModal, setShowEditEvaluationModal] = useState(false);
  const [editingMasterEvaluationId, setEditingMasterEvaluationId] = useState<number | null>(null);
  const [editingPlanEvaluationId, setEditingPlanEvaluationId] = useState<string | null>(null);

  const [showEditSequenceModal, setShowEditSequenceModal] = useState(false); // NOUVEAU
  const [editingMasterSequenceId, setEditingMasterSequenceId] = useState<number | null>(null); // NOUVEAU
  const [editingPlanSequenceId, setEditingPlanSequenceId] = useState<string | null>(null); // NOUVEAU

  // États pour déclencher le rafraîchissement des blocs
  const [activityRefreshTrigger, setActivityRefreshTrigger] = useState(0);
  const [evaluationRefreshTrigger, setEvaluationRefreshTrigger] = useState(0);
  const [sequenceRefreshTrigger, setSequenceRefreshTrigger] = useState(0); // NOUVEAU

  // Gère la sélection des cibles (niveau, option, unité, chapitre de référence)
  const handleTargetSelectionChange = useCallback(
    (selection: {
      niveauId: number | null;
      optionId: number | null;
      uniteId: number | null;
      chapitreReferenceId: number | null;
      chapitreReferenceTitle: string | null;
    }) => {
      console.log(
        '[PlanifierChapitreEditor] ChapterTargetSelector a remonté la sélection via Header:',
        selection
      );
      setChapitre((prevChapitre) => ({
        ...prevChapitre,
        niveauId: selection.niveauId,
        optionId: selection.optionId,
        uniteId: selection.uniteId,
        chapitreReferenceId: selection.chapitreReferenceId,
      }));
    },
    []
  );

  const handleUpdateChapitreDetails = useCallback(
    (details: {
      titreChapitre: string;
      objectifsGeneraux: string;
      objectifsReferencesIds: number[];
      niveauId: number | null;
      optionId: number | null;
      uniteId: number | null;
    }) => {
      setChapitre((prevChapitre) => ({
        ...prevChapitre,
        titreChapitre: details.titreChapitre,
        objectifsGeneraux: details.objectifsGeneraux,
        objectifsReferencesIds: details.objectifsReferencesIds,
        niveauId: details.niveauId,
        optionId: details.optionId,
        uniteId: details.uniteId,
      }));
    },
    []
  );

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
            setChapitre((prev) => ({
              ...prev,
              id: null,
              progressionItems: [],
              statut: 'Brouillon',
              createdBy: 'current_user_id',
            }));
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
      }
    };

    loadExistingChapFiche();
  }, [chapterFicheIdFromUrl]);


  // Section 3: Fonctions de Gestion des Éléments de Progression
  const getNextOrder = useCallback((): number => {
    if (chapitre.progressionItems.length === 0) return 0;
    const maxOrder = Math.max(...chapitre.progressionItems.map(item => item.ordre));
    return maxOrder + 1;
  }, [chapitre.progressionItems]);

  const handleOpenSequenceSelector = () => {
    if (!chapitre.chapitreReferenceId) {
      alert("Veuillez d'abord sélectionner un chapitre de référence pour filtrer les séquences.");
      return;
    }
    setShowSequenceSelectorModal(true);
  };

  const handleSequenceSelectedFromModal = useCallback(
    async (sourceId: number, sequenceDetails: Omit<SequenceDisplayData, 'id'>) => {
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
          console.log("Fiche de planification initialement sauvegardée (pour séquence) avec l'ID:", currentChapficheId);
        } catch (error) {
          console.error("Erreur lors de la sauvegarde initiale de la fiche (pour séquence):", error);
          alert("Échec de la sauvegarde initiale de la fiche (pour séquence): " + (error as Error).message);
          setIsSavingOrLoading(false);
          return;
        } finally {
          setIsSavingOrLoading(false);
        }
      }

      const newSequence: PlanSequence = {
        id: crypto.randomUUID(),
        type: 'sequence',
        sourceId: sourceId,
        ordre: getNextOrder(),
        chapficheId: Number(currentChapficheId),
      };

      setChapitre((prevChapitre) => ({
        ...prevChapitre,
        progressionItems: [...prevChapitre.progressionItems, newSequence],
      }));
      console.log(
        '[PlanifierChapitreEditor] Séquence existante sélectionnée et ajoutée:',
        newSequence
      );
      setShowSequenceSelectorModal(false);
    },
    [chapitre, getNextOrder]
  );

  const handleOpenActivitySelector = () => {
    if (!chapitre.chapitreReferenceId) {
      alert("Veuillez d'abord sélectionner un chapitre de référence pour filtrer les activités.");
      return;
    }
    setShowActivitySelectorModal(true);
  };

  const handleActivitySelectedFromModal = useCallback(
    async (sourceId: number, activityDetails: Omit<ActivityDisplayData, 'id'>) => {
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
          console.log("Fiche de planification initialement sauvegardée avec l'ID:", currentChapficheId);
        } catch (error) {
          console.error("Erreur lors de la sauvegarde initiale de la fiche:", error);
          alert("Échec de la sauvegarde initiale de la fiche: " + (error as Error).message);
          setIsSavingOrLoading(false);
          return;
        } finally {
          setIsSavingOrLoading(false);
        }
      }

      const newActivity: PlanActivity = {
        id: crypto.randomUUID(),
        type: 'activity',
        sourceId: sourceId,
        ordre: getNextOrder(),
        chapficheId: Number(currentChapficheId),
      };

      setChapitre((prevChapitre) => ({
        ...prevChapitre,
        progressionItems: [...prevChapitre.progressionItems, newActivity],
      }));
      console.log(
        '[PlanifierChapitreEditor] Activité existante sélectionnée et ajoutée:',
        newActivity
      );
      setShowActivitySelectorModal(false);
    },
    [chapitre, getNextOrder]
  );

  const handleOpenEvaluationSelector = () => {
    if (!chapitre.chapitreReferenceId) {
      alert("Veuillez d'abord sélectionner un chapitre de référence pour filtrer les évaluations.");
      return;
    }
    setShowEvaluationSelectorModal(true);
  };

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
        id: crypto.randomUUID(),
        type: 'evaluation',
        sourceId: sourceId,
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
      setShowEvaluationSelectorModal(false);
    },
    [chapitre, getNextOrder]
  );

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

  const handleRemoveProgressionItem = useCallback((itemId: string) => {
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

    setIsSavingOrLoading(true);
    try {
      const savedChapitre = await planificationService.savePlanChapitre(chapitre);
      setChapitre(savedChapitre);
      alert("Fiche de planification enregistrée avec succès !");
      console.log('Fiche de planification enregistrée:', savedChapitre);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la fiche de planification:', error);
      alert('Échec de l\'enregistrement de la fiche de planification: ' + (error as Error).message);
    } finally {
      setIsSavingOrLoading(false);
    }
  };

  // Fonction pour gérer l'ouverture de la modale d'édition d'activité maître
  const handleEditMasterActivity = useCallback((masterId: number, planActivityId: string) => {
    setEditingMasterActivityId(masterId);
    setEditingPlanActivityId(planActivityId);
    setShowEditActivityModal(true);
  }, []);

  // Callback appelé après la sauvegarde réussie de l'activité maître
  const handleMasterActivitySaved = useCallback(() => {
    setShowEditActivityModal(false);
    setEditingMasterActivityId(null);
    setEditingPlanActivityId(null);
    setActivityRefreshTrigger(prev => prev + 1); // Incrémente le trigger pour forcer le re-chargement
  }, []);


  // Fonction pour gérer l'ouverture de la modale d'édition d'évaluation maître
  const handleEditMasterEvaluation = useCallback((masterId: number, planEvaluationId: string) => {
    setEditingMasterEvaluationId(masterId);
    setEditingPlanEvaluationId(planEvaluationId);
    setShowEditEvaluationModal(true);
  }, []);

  // Callback appelé après la sauvegarde réussie de l'évaluation maître
  const handleMasterEvaluationSaved = useCallback(() => {
    setShowEditEvaluationModal(false);
    setEditingMasterEvaluationId(null);
    setEditingPlanEvaluationId(null);
    setEvaluationRefreshTrigger(prev => prev + 1); // Incrémente le trigger pour forcer le re-chargement
  }, []);

  // NOUVEAU: Fonction pour gérer l'ouverture de la modale d'édition de séquence maître
  const handleEditMasterSequence = useCallback((masterId: number, planSequenceId: string) => {
    setEditingMasterSequenceId(masterId);
    setEditingPlanSequenceId(planSequenceId);
    setShowEditSequenceModal(true);
  }, []);

  // NOUVEAU: Callback appelé après la sauvegarde réussie de la séquence maître
  const handleMasterSequenceSaved = useCallback(() => {
    setShowEditSequenceModal(false);
    setEditingMasterSequenceId(null);
    setEditingPlanSequenceId(null);
    setSequenceRefreshTrigger(prev => prev + 1); // Incrémente le trigger pour forcer le re-chargement
  }, []);


  // Section 4: Rendu de l'Interface Utilisateur
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

      <ChapterPlanningHeader
        chapitreReferenceId={chapitre.chapitreReferenceId}
        niveauId={chapitre.niveauId}
        optionId={chapitre.optionId}
        uniteId={chapitre.uniteId}
        titreChapitre={chapitre.titreChapitre}
        objectifsGeneraux={chapitre.objectifsGeneraux}
        onTargetSelectionChange={handleTargetSelectionChange}
        onUpdateChapitreDetails={handleUpdateChapitreDetails}
      />

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
              if (item.type === 'sequence') {
                return (
                  <SequenceBlock
                    key={item.id}
                    sequence={item}
                    onUpdate={handleUpdateProgressionItem}
                    onDelete={() => handleRemoveProgressionItem(item.id)}
                    onEditMasterSequence={handleEditMasterSequence} // NOUVEAU: Passe le callback
                    sequenceRefreshTrigger={sequenceRefreshTrigger} // NOUVEAU: Passe le trigger
                  />
                );
              } else if (item.type === 'activity') {
                return (
                  <ActivityBlock
                    key={item.id}
                    activity={item}
                    onUpdate={handleUpdateProgressionItem}
                    onDelete={() => handleRemoveProgressionItem(item.id)}
                    onEditMasterActivity={handleEditMasterActivity}
                    activityRefreshTrigger={activityRefreshTrigger}
                  />
                );
              } else if (item.type === 'evaluation') {
                return (
                  <EvaluationBlock
                    key={item.id}
                    evaluation={item}
                    onUpdate={handleUpdateProgressionItem}
                    onDelete={() => handleRemoveProgressionItem(item.id)}
                    onEditMasterEvaluation={handleEditMasterEvaluation}
                    evaluationRefreshTrigger={evaluationRefreshTrigger}
                  />
                );
              }
              return null;
            })}
          </div>
        )}

        <div className="flex space-x-4 mt-6">
          <button
            onClick={handleOpenSequenceSelector}
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
          <button
            onClick={handleOpenEvaluationSelector}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            + Ajouter une Évaluation
          </button>
        </div>

      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        >
          Enregistrer le Chapitre
        </button>
      </div>

      {/* Modale de sélection d'activité */}
      <CustomModal
        isOpen={showActivitySelectorModal}
        onClose={() => setShowActivitySelectorModal(false)}
        title="Sélectionner une Activité existante"
      >
        <ActivitySelector
          onActivitySelected={handleActivitySelectedFromModal}
          onCancel={() => setShowActivitySelectorModal(false)}
          niveauId={chapitre.niveauId}
          optionId={chapitre.optionId}
          uniteId={chapitre.uniteId}
          chapitreReferenceId={chapitre.chapitreReferenceId}
        />
        <div className="flex justify-center mt-4 text-gray-600 text-sm">
          Pour créer une nouvelle activité, veuillez utiliser le tableau de bord dédié aux activités.
        </div>
      </CustomModal>

      {/* Modale de sélection d'évaluation */}
      <CustomModal
        isOpen={showEvaluationSelectorModal}
        onClose={() => setShowEvaluationSelectorModal(false)}
        title="Sélectionner une Évaluation existante"
      >
        <EvaluationSelector
          onEvaluationSelected={handleEvaluationSelectedFromModal}
          onCancel={() => setShowEvaluationSelectorModal(false)}
          niveauId={chapitre.niveauId}
          optionId={chapitre.optionId}
          uniteId={chapitre.uniteId}
          chapitreReferenceId={chapitre.chapitreReferenceId}
        />
        <div className="flex justify-center mt-4 text-gray-600 text-sm">
          Pour créer une nouvelle évaluation, veuillez utiliser le tableau de bord dédié aux évaluations.
        </div>
      </CustomModal>

      {/* Modale de sélection de séquence */}
      <CustomModal
        isOpen={showSequenceSelectorModal}
        onClose={() => setShowSequenceSelectorModal(false)}
        title="Sélectionner une Séquence existante"
      >
        <SequenceSelector
          onSequenceSelected={handleSequenceSelectedFromModal}
          onCancel={() => setShowSequenceSelectorModal(false)}
          niveauId={chapitre.niveauId}
          optionId={chapitre.optionId}
          uniteId={chapitre.uniteId}
          chapitreReferenceId={chapitre.chapitreReferenceId}
        />
        <div className="flex justify-center mt-4 text-gray-600 text-sm">
          Pour créer une nouvelle séquence, veuillez utiliser le tableau de bord dédié aux séquences.
        </div>
      </CustomModal>

      {/* Modale pour l'édition d'une activité maître */}
      <CustomModal
        isOpen={showEditActivityModal}
        onClose={handleMasterActivitySaved}
        title="Modifier l'Activité Maître"
      >
        {editingMasterActivityId && (
          <EditActivityForm
            activityId={editingMasterActivityId}
            onSaveSuccess={handleMasterActivitySaved}
            onCancel={() => {
              setShowEditActivityModal(false);
              setEditingMasterActivityId(null);
              setEditingPlanActivityId(null);
            }}
          />
        )}
      </CustomModal>

      {/* Modale pour l'édition d'une évaluation maître */}
      <CustomModal
        isOpen={showEditEvaluationModal}
        onClose={handleMasterEvaluationSaved}
        title="Modifier l'Évaluation Maître"
      >
        {editingMasterEvaluationId && (
          <EditEvaluationForm
            evaluationId={editingMasterEvaluationId}
            onSaveSuccess={handleMasterEvaluationSaved}
            onCancel={() => {
              setShowEditEvaluationModal(false);
              setEditingMasterEvaluationId(null);
              setEditingPlanEvaluationId(null);
            }}
          />
        )}
      </CustomModal>

      {/* NOUVEAU: Modale pour l'édition d'une séquence maître */}
      <CustomModal
        isOpen={showEditSequenceModal}
        onClose={handleMasterSequenceSaved}
        title="Modifier la Séquence Maître"
      >
        {editingMasterSequenceId && (
          <EditSequenceForm
            sequenceId={editingMasterSequenceId}
            onSaveSuccess={handleMasterSequenceSaved}
            onCancel={() => {
              setShowEditSequenceModal(false);
              setEditingMasterSequenceId(null);
              setEditingPlanSequenceId(null);
            }}
          />
        )}
      </CustomModal>
    </div>
  );
};

export default PlanifierChapitreEditor;
