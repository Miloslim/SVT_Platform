// 📁 src/components/planipeda/chapitreplanifier/PlanifierChapitreEditor.tsx

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
 * via leurs composants respectifs (SequenceBlock, ActivityBlock, EvaluationBlock) dans une VUE DÉTAILLÉE.
 * - Permet la suppression des éléments de la progression.
 * - Utilise `planificationService` pour la persistance des données dans Supabase.
 * - NOUVEAU: Implémentation d'un constructeur de progression visuel avec glisser-déposer (Drag-and-Drop)
 * en utilisant `react-beautiful-dnd`, affichant des cartes compactes dans une colonne dédiée.
 * - NOUVEAU: Layout à 3 colonnes:
 * - Gauche: Boutons d'ajout.
 * - Milieu: Vue détaillée de l'élément de progression sélectionné.
 * - Droite: Liste glissable d'éléments de progression compacts.
 */
// 📁 src/components/planipeda/chapitreplanifier/PlanifierChapitreEditor.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
//import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical, FlaskConical, Lightbulb, BookText } from 'lucide-react'; // Icônes pour les cartes compactes
import SortableList from "./SortableList"; // Ajuste le chemin selon ton architecture réelle
import {
  PlanChapitre,
  PlanActivity,
  PlanSequence,
  PlanEvaluation,
  PlanChapterProgressionItem,
  SequenceDisplayData,
  EvaluationData,
  ActivityDisplayData // Assurez-vous que tous les types sont importés
} from '@/types/planificationTypes';

import { supabase } from '@/backend/config/supabase';

import ChapterPlanningHeader from './ChapterPlanningHeader';

// Importez les composants de bloc (pour la vue détaillée)
import ActivityBlock from './ActivityBlock';
import EvaluationBlock from './EvaluationBlock';
import SequenceBlock from './SequenceBlock';

import CustomModal from '@/components/common/CustomModal';

// Les sélecteurs d'activités et d'évaluations
import ActivitySelector from './ActivitySelectorchptr';
import EvaluationSelector from './EvaluationSelectorchptr';
import SequenceSelector from './SequenceSelectorchptr';

// Importation du service de planification
import { planificationService } from '@/services/planificationService';

// Importez les formulaires d'édition maîtres
import EditActivityForm from './EditActivityForm';
import EditEvaluationForm from './EditEvaluationForm';
import EditSequenceForm from './EditSequenceForm';

// Enum-like constant pour les statuts
const StatutFiche = {
  BROUILLON: 'Brouillon',
  VALIDE: 'Finalisé',
  ARCHIVE: 'Archivé',
} as const;

type StatutFicheType = typeof StatutFiche[keyof typeof StatutFiche];

// Nouveau composant pour les cartes compactes (sera créé ensuite)
interface ProgressionCompactCardProps {
    item: PlanChapterProgressionItem;
    index: number;
    onDelete: (itemId: string) => void;
    onSelect: (item: PlanChapterProgressionItem) => void;
    onEditMasterActivity?: (activityId: number, planActivityId: string) => void;
    onEditMasterEvaluation?: (evaluationId: number, planEvaluationId: string) => void;
    onEditMasterSequence?: (sequenceId: number, planSequenceId: string) => void;
    // Les triggers de refresh ne sont pas passés ici car la carte est une vue statique, les blocs détaillés les gèrent.
}

// Composant pour la carte compacte (déplacé dans un fichier séparé par la suite)
const ProgressionCompactCard: React.FC<ProgressionCompactCardProps> = ({
    item,
    index,
    onDelete,
    onSelect,
    onEditMasterActivity,
    onEditMasterEvaluation,
    onEditMasterSequence,
}) => {
    const IconComponent = item.type === 'activity' ? Lightbulb : (item.type === 'evaluation' ? BookText : FlaskConical);
    const borderColor = item.type === 'activity' ? 'border-green-400' : (item.type === 'evaluation' ? 'border-purple-400' : 'border-blue-400');
    const bgColor = item.type === 'activity' ? 'bg-green-50' : (item.type === 'evaluation' ? 'bg-purple-50' : 'bg-blue-50');
    const textColor = item.type === 'activity' ? 'text-green-800' : (item.type === 'evaluation' ? 'text-purple-800' : 'text-blue-800');
    const iconColor = item.type === 'activity' ? 'text-green-600' : (item.type === 'evaluation' ? 'text-purple-600' : 'text-blue-600');

    const displayTitle = (item as PlanSequence | PlanActivity | PlanEvaluation).titre || `Nouvel ${item.type}`; // Assumer titre existe sur PlanItem
    const isMasterLinked = typeof item.sourceId === 'number';

    const handleEditMaster = () => {
        if (!isMasterLinked || !item.sourceId) return;

        if (item.type === 'activity' && onEditMasterActivity) {
            onEditMasterActivity(item.sourceId, item.id);
        } else if (item.type === 'evaluation' && onEditMasterEvaluation) {
            onEditMasterEvaluation(item.sourceId, item.id);
        } else if (item.type === 'sequence' && onEditMasterSequence) {
            onEditMasterSequence(item.sourceId, item.id);
        }
    };


};


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
  statut: StatutFiche.BROUILLON, // usage enum constant
  nomFichePlanification: '', // ✅ AJOUT
  createdBy: 'current_user_id',
});

    //passer le clic des item vers affichage du bloc
  const [selectedProgressionItem, setSelectedProgressionItem] = useState<PlanChapterProgressionItem | null>(null);
  const handleSelectItem = useCallback((item: PlanChapterProgressionItem) => {
      setSelectedProgressionItem(item);
    }, []);
    //=================
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

  const [showEditSequenceModal, setShowEditSequenceModal] = useState(false);
  const [editingMasterSequenceId, setEditingMasterSequenceId] = useState<number | null>(null);
  const [editingPlanSequenceId, setEditingPlanSequenceId] = useState<string | null>(null);


  // États pour déclencher le rafraîchissement des blocs
  const [activityRefreshTrigger, setActivityRefreshTrigger] = useState(0);
  const [sequenceRefreshTrigger, setSequenceRefreshTrigger] = useState(0);
  const [evaluationRefreshTrigger, setEvaluationRefreshTrigger] = useState(0);


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
        try {
          const loadedChapitreData = await planificationService.loadPlanChapitre(chapterFicheIdFromUrl);
          if (loadedChapitreData) {
            setChapitre(loadedChapitreData);
            if (loadedChapitreData.progressionItems.length > 0) {
              setSelectedProgressionItem(loadedChapitreData.progressionItems.sort((a, b) => a.ordre - b.ordre)[0]);
            }
          } else {
            setChapitre((prev) => ({
              ...prev,
              id: null,
              progressionItems: [],
              statut: StatutFiche.BROUILLON,
              createdBy: 'current_user_id',
            }));
            setSelectedProgressionItem(null);
          }
        } catch (error) {
          alert("Erreur lors du chargement de la fiche: " + (error as Error).message);
        } finally {
          setIsSavingOrLoading(false);
        }
      } else {
        setChapitre((prev) => ({
          ...prev,
          id: null,
          progressionItems: [],
          statut: StatutFiche.BROUILLON,
          createdBy: 'current_user_id',
        }));
        setSelectedProgressionItem(null);
      }
    };
    loadExistingChapFiche();
  }, [chapterFicheIdFromUrl]);


  // Section 3: Fonctions de Gestion des Éléments de Progression
  const getNextOrder = useCallback((): number => {
    // Commence le comptage à partir de 1
    if (chapitre.progressionItems.length === 0) return 1;
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
        // Add minimal display properties from sequenceDetails
        titre: sequenceDetails.titre_sequence,
        description: sequenceDetails.description,
      };

      setChapitre((prevChapitre) => {
        const updatedItems = [...prevChapitre.progressionItems, newSequence];
        // S'assurer que le nouvel item est sélectionné
        setSelectedProgressionItem(newSequence);
        return {
          ...prevChapitre,
          progressionItems: updatedItems,
        };
      });
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
        // Add minimal display properties from activityDetails
        titre: activityDetails.titre_activite,
        description: activityDetails.description,
      };

      setChapitre((prevChapitre) => {
        const updatedItems = [...prevChapitre.progressionItems, newActivity];
        setSelectedProgressionItem(newActivity);
        return {
          ...prevChapitre,
          progressionItems: updatedItems,
        };
      });
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
    async (sourceId: number, evaluationDetails: Omit<EvaluationData, 'id'>) => { // Utilisez EvaluationData ici
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
        // Add minimal display properties from evaluationDetails
        titre: evaluationDetails.titre_evaluation,
        type_evaluation: evaluationDetails.type_evaluation,
        // Description from evaluationDetails (e.g., introduction_activite or consignes_specifiques)
        description: evaluationDetails.introduction_activite || evaluationDetails.consignes_specifiques || null,
      };

      setChapitre((prevChapitre) => {
        const updatedItems = [...prevChapitre.progressionItems, newEvaluation];
        setSelectedProgressionItem(newEvaluation);
        return {
          ...prevChapitre,
          progressionItems: updatedItems,
        };
      });
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
    setChapitre((prevChapitre) => {
      const newProgressionItems = prevChapitre.progressionItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      );

      return {
        ...prevChapitre,
        progressionItems: newProgressionItems,
      };
    });

    // Toujours sélectionner l'élément mis à jour
    setSelectedProgressionItem(updatedItem);

    console.log(
      `[PlanifierChapitreEditor] Élément mis à jour (${updatedItem.type}):`,
      updatedItem
    );
  },
  []
);

const handleRemoveProgressionItem = useCallback(
  (type: 'activity' | 'evaluation' | 'sequence', itemId: string) => {
    setChapitre((prev) => ({
      ...prev,
      progressionItems: prev.progressionItems.filter(item => item.id !== itemId)
    }));

    if (selectedProgressionItem?.id === itemId) {
      setSelectedProgressionItem(null);
    }
  },
  [selectedProgressionItem]
);

const handleReorderProgression = useCallback(
  (reorderedItems: PlanChapterProgressionItem[]) => {
    setChapitre((prev) => ({
      ...prev,
      progressionItems: reorderedItems.map((item, index) => ({
        ...item,
        ordre: index + 1
      }))
    }));
  },
  []
);
//Redirection après sauvegarde
const navigate = useNavigate();

 const handleSave = async () => {
    if (!chapitre.chapitreReferenceId) {
      alert("Veuillez sélectionner un chapitre de référence avant d'enregistrer.");
      return;
    }
    setIsSavingOrLoading(true);
    try {
      const savedChapitre = await planificationService.savePlanChapitre(chapitre);
      setChapitre(savedChapitre);
      alert("Fiche enregistrée avec succès !");
      setTimeout(() => {
        navigate('/planipeda');
      }, 500);
    } catch (error) {
      alert("Erreur lors de l'enregistrement: " + (error as Error).message);
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
    setActivityRefreshTrigger(prev => prev + 1); // Incrémente le trigger pour ActivityBlock
    // Force la re-sélection de l'item courant pour rafraîchir ses détails
    if (selectedProgressionItem && selectedProgressionItem.type === 'activity' && selectedProgressionItem.id === editingPlanActivityId) {
        // Crée une nouvelle référence pour l'objet afin de forcer la mise à jour
        setSelectedProgressionItem({ ...selectedProgressionItem });
    }
  }, [selectedProgressionItem, editingPlanActivityId]);

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
    setEvaluationRefreshTrigger(prev => prev + 1); // Incrémente le trigger pour EvaluationBlock
    if (selectedProgressionItem && selectedProgressionItem.type === 'evaluation' && selectedProgressionItem.id === editingPlanEvaluationId) {
        setSelectedProgressionItem({ ...selectedProgressionItem });
    }
  }, [selectedProgressionItem, editingPlanEvaluationId]);

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
        setSequenceRefreshTrigger(prev => prev + 1); // Incrémente le trigger pour SequenceBlock
        if (selectedProgressionItem && selectedProgressionItem.type === 'sequence' && selectedProgressionItem.id === editingPlanSequenceId) {
            setSelectedProgressionItem({ ...selectedProgressionItem });
        }
    }, [selectedProgressionItem, editingPlanSequenceId]);


  // Fonction de gestion de la fin du glisser-déposer
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) {
      return;
    }
    if (result.destination.index === result.source.index) {
      return;
    }

    const reorderedItems = Array.from(chapitre.progressionItems);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    const updatedProgressionItems = reorderedItems.map((item, index) => ({
      ...item,
      ordre: index + 1, // Ordre commence à 1
    }));

    setChapitre(prevChapitre => ({
      ...prevChapitre,
      progressionItems: updatedProgressionItems,
    }));

    console.log('[PlanifierChapitreEditor] Éléments réordonnés:', updatedProgressionItems);

  }, [chapitre.progressionItems]);


// src/components/planipeda/chapitreplanifier/ChapterPlanningPage.tsx (Contexte parent)


return (
  <div className="w-full p-6 bg-gray-100 min-h-screen font-inter">

    {/* === Titre Principal === */}
    <header className="mb-8 text-center">
      <h1 className="text-3xl font-extrabold text-gray-900">
        Composer une Fiche de Planification de Chapitre
      </h1>
    </header>

    {/* === Bloc Paramètres de la fiche === */}
    <div className="bg-white shadow-xl rounded-lg p-6 mb-6 border border-gray-200">
      <ChapterPlanningHeader
        chapitreReferenceId={chapitre.chapitreReferenceId}
        niveauId={chapitre.niveauId}
        optionId={chapitre.optionId}
        uniteId={chapitre.uniteId}
        titreChapitre={chapitre.titreChapitre}
        objectifsGeneraux={chapitre.objectifsGeneraux}
        nomFichePlanification={chapitre.nomFichePlanification}
        statutFiche={chapitre.statut}
        onTargetSelectionChange={handleTargetSelectionChange}
        onUpdateChapitreDetails={handleUpdateChapitreDetails}
      />

      {/* Nom + Statut + Sauvegarde */}
      <div className="mt-6 p-4 rounded-md bg-white shadow border-l-4 border-indigo-500 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
          <div className="flex flex-col w-[32rem]">
            <label htmlFor="nomFiche" className="text-sm font-medium text-gray-700">
              Nom de la fiche
            </label>
            <input
              type="text"
              id="nomFiche"
              value={chapitre.nomFichePlanification}
              onChange={(e) => setChapitre(prev => ({ ...prev, nomFichePlanification: e.target.value }))}
              placeholder="Titre de la fiche"
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="statut" className="text-sm font-medium text-gray-700">
              Statut
            </label>
            <select
              id="statut"
              value={chapitre.statut}
              onChange={(e) => setChapitre(prev => ({ ...prev, statut: e.target.value }))}
              className="mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Brouillon">Brouillon</option>
              <option value="Finalisé">Finalisé</option>
              <option value="Archivé">Archivé</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg shadow-md transition duration-150 ease-in-out self-end md:self-auto"
        >
          Enregistrer le Chapitre
        </button>
      </div>
    </div>

    {/* === Grille Principale === */}
    <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_2.4fr_0.8fr] gap-6">

      {/* Colonne Gauche */}
      <aside className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 h-fit sticky top-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-5 text-center">Ajouter un élément</h2>
        <div className="flex flex-col space-y-4">
          <button onClick={handleOpenSequenceSelector} className="btn-blue">+ Séquence</button>
          <button onClick={handleOpenActivitySelector} className="btn-green">+ Activité</button>
          <button onClick={handleOpenEvaluationSelector} className="btn-purple">+ Évaluation</button>
        </div>
      </aside>

      {/* Colonne Centrale */}
      <section className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-5 text-center">Détails de l'Élément Sélectionné</h2>
        {selectedProgressionItem ? (
          <>
            {selectedProgressionItem.type === 'sequence' && (
              <SequenceBlock
                sequence={selectedProgressionItem}
                onUpdate={handleUpdateProgressionItem}
                onDelete={() => handleRemoveProgressionItem(selectedProgressionItem.id)}
                onEditMasterSequence={handleEditMasterSequence}
                sequenceRefreshTrigger={sequenceRefreshTrigger}
              />
            )}
            {selectedProgressionItem.type === 'activity' && (
              <ActivityBlock
                activity={selectedProgressionItem}
                onUpdate={handleUpdateProgressionItem}
                onDelete={() => handleRemoveProgressionItem(selectedProgressionItem.id)}
                onEditMasterActivity={handleEditMasterActivity}
                activityRefreshTrigger={activityRefreshTrigger}
              />
            )}
            {selectedProgressionItem.type === 'evaluation' && (
              <EvaluationBlock
                evaluation={selectedProgressionItem}
                onUpdate={handleUpdateProgressionItem}
                onDelete={() => handleRemoveProgressionItem(selectedProgressionItem.id)}
                onEditMasterEvaluation={handleEditMasterEvaluation}
                evaluationRefreshTrigger={evaluationRefreshTrigger}
              />
            )}
          </>
        ) : (
          <div className="text-center text-gray-500">
            Sélectionnez un élément dans la progression à droite pour voir ses détails ici.
          </div>
        )}
      </section>

      {/* Colonne Droite */}
      <aside className="col-span-1 bg-white p-6 rounded-lg shadow-lg border border-gray-200 min-w-[300px] lg:min-w-[400px]">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Progression du Chapitre</h2>
        {chapitre.progressionItems.length === 0 ? (
          <p className="text-gray-600 text-center p-4 border border-dashed rounded-md bg-gray-50">
            Aucun élément dans la progression. Ajoutez-en un !
          </p>
        ) : (
          <div className="overflow-auto max-h-[600px] rounded-lg border border-gray-100 mt-4">
            <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="w-12 py-2 text-center font-normal">Ordre</th>
                  <th className="w-16 py-2 text-center font-normal">Type</th>
                  <th className="py-2 font-normal text-gray-800">Titre</th>
                  <th className="w-24 py-2 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                <SortableList
                  items={chapitre.progressionItems}
                  selectedItemId={selectedProgressionItem?.id ?? null}
                  onSelectItem={handleSelectItem}
                  onRemove={handleRemoveProgressionItem}
                  onReorder={handleReorderProgression}
                />
              </tbody>
            </table>
          </div>
        )}
      </aside>
    </div>

    {/* === Overlay de chargement === */}
    {isSavingOrLoading && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded-lg shadow-xl flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-700">Enregistrement en cours...</p>
        </div>
      </div>
    )}

    {/* --- Modales (inchangées) --- */}
    <CustomModal isOpen={showActivitySelectorModal} onClose={() => setShowActivitySelectorModal(false)} title="Sélectionner une Activité existante">
      <ActivitySelector
        onActivitySelected={handleActivitySelectedFromModal}
        onCancel={() => setShowActivitySelectorModal(false)}
        niveauId={chapitre.niveauId}
        optionId={chapitre.optionId}
        uniteId={chapitre.uniteId}
        chapitreReferenceId={chapitre.chapitreReferenceId}
      />
      <div className="flex justify-center mt-4 text-gray-600 text-sm">
        Pour créer une nouvelle activité, utilisez le tableau de bord des activités.
      </div>
    </CustomModal>

    <CustomModal isOpen={showEvaluationSelectorModal} onClose={() => setShowEvaluationSelectorModal(false)} title="Sélectionner une Évaluation existante">
      <EvaluationSelector
        onEvaluationSelected={handleEvaluationSelectedFromModal}
        onCancel={() => setShowEvaluationSelectorModal(false)}
        niveauId={chapitre.niveauId}
        optionId={chapitre.optionId}
        uniteId={chapitre.uniteId}
        chapitreReferenceId={chapitre.chapitreReferenceId}
      />
      <div className="flex justify-center mt-4 text-gray-600 text-sm">
        Pour créer une nouvelle évaluation, utilisez le tableau de bord des évaluations.
      </div>
    </CustomModal>

    <CustomModal isOpen={showSequenceSelectorModal} onClose={() => setShowSequenceSelectorModal(false)} title="Sélectionner une Séquence existante">
      <SequenceSelector
        onSequenceSelected={handleSequenceSelectedFromModal}
        onCancel={() => setShowSequenceSelectorModal(false)}
        niveauId={chapitre.niveauId}
        optionId={chapitre.optionId}
        uniteId={chapitre.uniteId}
        chapitreReferenceId={chapitre.chapitreReferenceId}
      />
      <div className="flex justify-center mt-4 text-gray-600 text-sm">
        Pour créer une nouvelle séquence, utilisez le tableau de bord des séquences.
      </div>
    </CustomModal>

    {/* --- Modales d'édition --- */}
    <CustomModal isOpen={showEditActivityModal} onClose={handleMasterActivitySaved} title="Modifier l'Activité Maître">
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

    <CustomModal isOpen={showEditEvaluationModal} onClose={handleMasterEvaluationSaved} title="Modifier l'Évaluation Maître">
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

    <CustomModal isOpen={showEditSequenceModal} onClose={handleMasterSequenceSaved} title="Modifier la Séquence Maître">
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

    {/* === Boutons style JSX === */}
    <style jsx>{`
      .btn-blue {
        background-color: #2563eb;
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 0.5rem;
        font-weight: bold;
        transition: background-color 0.2s ease;
      }
      .btn-blue:hover {
        background-color: #1d4ed8;
      }
      .btn-green {
        background-color: #16a34a;
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 0.5rem;
        font-weight: bold;
        transition: background-color 0.2s ease;
      }
      .btn-green:hover {
        background-color: #15803d;
      }
      .btn-purple {
        background-color: #9333ea;
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 0.5rem;
        font-weight: bold;
        transition: background-color 0.2s ease;
      }
      .btn-purple:hover {
        background-color: #7e22ce;
      }
    `}</style>
  </div>
);

};

export default PlanifierChapitreEditor;
