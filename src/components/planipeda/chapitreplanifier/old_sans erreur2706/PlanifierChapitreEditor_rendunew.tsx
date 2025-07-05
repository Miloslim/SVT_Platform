// src/components/planipeda/chapitreplanifier/PlanifierChapitreEditor_rendunew.tsx

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
 * - Permet d'ajouter des Séquences, des Activités (via sélection d'existantes ou création) et des Évaluations (via sélection d'existantes ou création) directement à la progression du chapitre.
 * - Affiche et gère les modifications individuelles des Séquences, Activités et Évaluations
 * via leurs composants respectifs (SequenceBlock, ActivityBlock, EvaluationBlock).
 * - Permet la suppression des éléments de la progression.
 * - Gère l'ouverture et la fermeture d'une modale pour l'édition des activités et évaluations maîtresses.
 * - Affiche une "vue résumé" de la progression (tableau épinglé) avec des contrôles de réordonnancement et de visibilité.
 * - Permet d'épingler/désépingler les blocs détaillés.
 * - OPTIMISATION: Mise à jour directe des données de l'activité/évaluation après modification de la maître.
 * - CORRECTION: Ajustement des icônes de dépliement et résolution de la flèche "vers le haut".
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import CustomModal from '@/components/common/CustomModal';

// Composants de sélection et d'édition d'activité
import ActivitySelector, { ActivityDisplayData } from '@/components/planipeda/ScenarioEditor/ActivitySelectorchptr';
import EditActivityForm from '@/components/planipeda/ScenarioEditor/EditActivityForm';

// NOUVEAU: Composant de sélection d'évaluation
import EvaluationSelector, { EvaluationDisplayData } from '@/components/planipeda/ScenarioEditor/EvaluationSelectorchptr';
import EditEvaluationForm from '@/components/planipeda/ScenarioEditor/EditEvaluationForm'; // NOUVEAU: Pour l'édition maître d'évaluation

// Composant pour les éléments du tableau de progression résumé
import ProgressionItemSummary from './ProgressionItemSummary';
import { planificationService } from '@/services/planificationService';


const PlanifierChapitreEditor: React.FC = () => {
  const { id: chapterFicheIdFromUrl } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [chapitre, setChapitre] = useState<PlanChapitre>({
    id: chapterFicheIdFromUrl === 'new' ? null : chapterFicheIdFromUrl, // Assurez-vous que l'ID est null si c'est 'new'
    titreChapitre: '',
    objectifsGeneraux: '',
    objectifsReferencesIds: [],
    chapitreReferenceId: null,
    niveauId: null,
    optionId: null,
    uniteId: null,
    progressionItems: [],
    statut: 'Brouillon',
    createdBy: 'current_user_id', // Placeholder, à remplacer par l'ID utilisateur réel
  });

  const [referenceObjectifsDetails, setReferenceObjectifsDetails] = useState<
    { id: number; description: string }[]
  >([]);

  const [showActivitySelectorModal, setShowActivitySelectorModal] = useState(false);
  const [showEvaluationSelectorModal, setShowEvaluationSelectorModal] = useState(false); // État pour la modale d'évaluation
  const [isSavingOrLoading, setIsSavingOrLoading] = useState(false);

  // États pour la modale d'édition d'activité maître
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  const [activityToEditMasterId, setActivityToEditMasterId] = useState<number | null>(null);
  const [planActivityToScrollToId, setPlanActivityToScrollToId] = useState<string | null>(null); // L'ID du PlanActivity pour le défilement

  // États pour la modale d'édition d'évaluation maître
  const [showEditEvaluationModal, setShowEditEvaluationModal] = useState(false);
  const [evaluationToEditMasterId, setEvaluationToEditMasterId] = useState<number | null>(null);
  const [planEvaluationToScrollToId, setPlanEvaluationToScrollToId] = useState<string | null>(null); // L'ID du PlanEvaluation pour le défilement

  // Références pour le défilement
  const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const setItemRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      itemRefs.current.set(id, element);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);


  // --- Effet pour le chargement initial de la fiche ou le rechargement forcé ---
  useEffect(() => {
    const loadFicheAndScroll = async () => {
      const isNewFicheFromUrl = chapterFicheIdFromUrl === 'new';
      // Vérifie si chapterFicheIdFromUrl est une chaîne non vide et peut être convertie en nombre
      const isNumericId = chapterFicheIdFromUrl && !isNaN(Number(chapterFicheIdFromUrl));

      // Détermine si un chargement est nécessaire ou si c'est un ID invalide
      // On tente de charger uniquement si l'ID de l'URL est différent de l'ID actuel ET s'il est numérique.
      const shouldAttemptLoad = chapterFicheIdFromUrl && chapterFicheIdFromUrl !== chapitre.id && isNumericId;

      if (isNewFicheFromUrl) {
        // C'est une nouvelle fiche, initialise l'état sans tenter de charger depuis le service
        setChapitre({
          id: null,
          titreChapitre: '',
          objectifsGeneraux: '',
          objectifsReferencesIds: [],
          chapitreReferenceId: null,
          niveauId: null,
          optionId: null,
          uniteId: null,
          progressionItems: [],
          statut: 'Brouillon',
          createdBy: 'current_user_id',
        });
        setIsSavingOrLoading(false);
      } else if (shouldAttemptLoad) {
        // C'est un ID existant et valide (non 'new' et numérique), tente de charger la fiche
        setIsSavingOrLoading(true);
        try {
          const loadedChapitreData = await planificationService.loadPlanChapitre(chapterFicheIdFromUrl);
          
          if (loadedChapitreData) {
            // S'assurer que chaque item a isExpanded par défaut si non défini
            const itemsWithExpansionState = loadedChapitreData.progressionItems.map(item => ({
                ...item,
                isExpanded: item.isExpanded ?? false // Replié par défaut au chargement pour une meilleure vue d'ensemble
            }));
            setChapitre({ ...loadedChapitreData, progressionItems: itemsWithExpansionState });
          } else {
            console.warn(`Fiche de planification avec ID ${chapterFicheIdFromUrl} introuvable. Redirection pour créer une nouvelle fiche.`);
            alert(`Fiche de planification avec ID ${chapterFicheIdFromUrl} introuvable. Vous serez redirigé pour créer une nouvelle fiche.`);
            navigate('/planipeda/chapitre/planifier/new', { replace: true });
          }
        } catch (error) {
          console.error("Erreur lors du chargement de la fiche existante:", error);
          alert("Erreur lors du chargement de la fiche de planification: " + (error as Error).message + ". Vous serez redirigé pour créer une nouvelle fiche.");
          navigate('/planipeda/chapitre/planifier/new', { replace: true });
        } finally {
          setIsSavingOrLoading(false);
        }
      } else if (chapterFicheIdFromUrl && chapterFicheIdFromUrl !== chapitre.id && !isNumericId) {
          // Gère les cas où l'ID de l'URL est présent mais n'est ni 'new' ni numérique valide
          console.error(`L'ID d'URL "${chapterFicheIdFromUrl}" est non-numérique ou invalide.`);
          alert("L'ID de la fiche de planification dans l'URL est invalide. Vous serez redirigé pour créer une nouvelle fiche.");
          navigate('/planipeda/chapitre/planifier/new', { replace: true });
      } else if (!chapterFicheIdFromUrl && !chapitre.id) {
          // Gère le cas où l'URL n'a pas d'ID (ex: /planipeda/chapitre/planifier) et l'état n'a pas d'ID.
          // C'est un point d'entrée pour commencer une nouvelle fiche vide.
          setChapitre((prev) => ({ ...prev, id: null, progressionItems: [], statut: 'Brouillon', createdBy: 'current_user_id' }));
          setReferenceObjectifsDetails([]);
          setIsSavingOrLoading(false);
      }


      // Logique de défilement : s'exécute si scrollToItemId est présent
      const scrollToItemId = location.state?.scrollToItemId;
      if (scrollToItemId) {
        navigate(location.pathname, { replace: true, state: {} }); // Nettoie l'état de navigation

        setTimeout(() => {
          const element = itemRefs.current.get(scrollToItemId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    };

    loadFicheAndScroll();
  }, [chapterFicheIdFromUrl, chapitre.id, navigate, location.state?.scrollToItemId]);


  // --- Effet pour charger les détails du chapitre de référence (titre, objectifs) ---
  useEffect(() => {
    const fetchChapitreReferenceDetails = async () => {
      const chapitreRefId = chapitre.chapitreReferenceId;

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
            id, titre_chapitre, objectifs_generaux, 
            unite:unite_id(
              id, titre_unite,
              option:option_id(
                id, nom_option,
                niveau:niveau_id(
                  id,
                  nom_niveau
                )
              )
            ),
            objectifs(id, description_objectif)
            `
          )
          .eq('id', chapitreRefId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.warn(`[PlanifierChapitreEditor] Chapitre de référence avec ID ${chapitreRefId} introuvable.`);
          }
          setChapitre((prevChapitre) => ({
            ...prevChapitre, titreChapitre: '', objectifsGeneraux: '', objectifsReferencesIds: [],
          }));
          setReferenceObjectifsDetails([]);
        } else if (data) {
          const objectifsIds = (data.objectifs || []).map((obj) => obj.id).filter((id): id is number => id !== null);
          const extractedObjectifsDetails = (data.objectifs || []).map((obj) => ({
            id: obj.id, description: obj.description_objectif || 'Aucune description',
          }));
          setReferenceObjectifsDetails(extractedObjectifsDetails);
          // Le champ objectifs_generaux de la DB est un string, pas un JSON. Convertir les objectifs en string.
          const formattedObjectifsGeneraux = data.objectifs_generaux || extractedObjectifsDetails.map((obj) => `${obj.id}. ${obj.description}`).join('\n\n');

          setChapitre((prevChapitre) => ({
            ...prevChapitre,
            titreChapitre: data.titre_chapitre || '',
            objectifsGeneraux: formattedObjectifsGeneraux, // Utilisation du champ directement ou conversion
            objectifsReferencesIds: objectifsIds,
            niveauId: data.unite?.option?.niveau?.id || null,
            optionId: data.unite?.option?.id || null, 
            uniteId: data.unite?.id || null,
          }));
        }
      } catch (err) {
        console.error("Erreur inattendue lors du chargement des détails du chapitre de référence:", err);
      }
    };
    fetchChapitreReferenceDetails();
  }, [chapitre.chapitreReferenceId]);

  // --- Fonctions de Gestion des Événements du Chapitre ---
  const handleTargetSelectionChange = useCallback(
    (selection: {
      niveauId: number | null; optionId: number | null; uniteId: number | null;
      chapitreReferenceId: number | null; chapitreReferenceTitle: string | null;
    }) => {
      setChapitre((prevChapitre) => ({
        ...prevChapitre,
        niveauId: selection.niveauId, optionId: selection.optionId, uniteId: selection.uniteId,
        chapitreReferenceId: selection.chapitreReferenceId,
        titreChapitre: selection.chapitreReferenceId ? selection.chapitreReferenceTitle || '' : '',
      }));
    }, []
  );

  const getNextOrder = (): number => {
    if (chapitre.progressionItems.length === 0) return 0;
    const maxOrder = Math.max(...chapitre.progressionItems.map(item => item.ordre));
    return maxOrder + 1;
  };

  // --- Gestion de l'ajout d'éléments de progression ---
  const handleAddSequence = async () => {
    // Si pas de chapitre de référence, on ne peut pas créer de séquence liée.
    if (!chapitre.chapitreReferenceId) {
      alert("Veuillez sélectionner un chapitre de référence avant d'ajouter une séquence.");
      return;
    }

    // Récupérer une séquence vierge ou via un sélecteur (pour l'instant, c'est juste un placeholder)
    // Idéalement, cela ouvrirait un modal SequenceSelector.
    alert("TODO: Implémenter la sélection/création d'une séquence maître pour l'ajouter ici.");
  };


  const handleOpenActivitySelector = () => {
    if (!chapitre.chapitreReferenceId) {
      alert("Veuillez d'abord sélectionner un chapitre de référence pour filtrer les activités.");
      return;
    }
    setShowActivitySelectorModal(true);
  };

  const handleActivitySelectedFromModal = useCallback(
    async (selectedActivityData: Omit<PlanActivity, 'id' | 'type' | 'ordre' | 'isExpanded'>) => {
      // S'assurer que la fiche de planification existe avant d'ajouter un élément qui doit la référencer
      let currentChapficheId = chapitre.id;
      if (!currentChapficheId) {
        setIsSavingOrLoading(true);
        try {
          const tempChapitreToSave: PlanChapitre = {
            ...chapitre,
            id: null, // Force la création d'une nouvelle fiche si pas d'ID
            progressionItems: [] // On ne sauvegarde pas les items en même temps pour cette "pre-save"
          };
          const savedChapitre = await planificationService.savePlanChapitre(tempChapitreToSave);
          currentChapficheId = savedChapitre.id;
          setChapitre(savedChapitre); // Met à jour l'état du chapitre avec le nouvel ID
        } catch (error) {
          console.error("Erreur lors de la sauvegarde initiale de la fiche:", error);
          alert("Échec de la sauvegarde initiale de la fiche: " + (error as Error).message);
          setIsSavingOrLoading(false);
          return;
        } finally {
          setIsSavingOrLoading(false);
        }
      }

      // Création de l'activité planifiée avec l'ID maître comme sourceId
      const newActivity: PlanActivity = {
        id: crypto.randomUUID(), // ID unique pour cette instance dans la progression
        type: 'activity',
        sourceId: selectedActivityData.sourceId!, // L'ID de l'activité maître depuis la DB
        ordre: getNextOrder(),
        isExpanded: true, // Dépliée par défaut
        
        // Copier les données de l'activité maître sélectionnée pour les mettre en cache
        titre: selectedActivityData.titre,
        description: selectedActivityData.description,
        dureeEstimeeMinutes: selectedActivityData.dureeEstimeeMinutes,
        modalites: selectedActivityData.modalites,
        ressources: selectedActivityData.ressources,
        objectifsSpecifiques: selectedActivityData.objectifsSpecifiques,
        roleEnseignant: selectedActivityData.roleEnseignant,
        modaliteEvaluation: selectedActivityData.modaliteEvaluation,
        commentaires: selectedActivityData.commentaires,
      };

      setChapitre((prevChapitre) => ({
        ...prevChapitre,
        progressionItems: [...prevChapitre.progressionItems, newActivity],
      }));
      setShowActivitySelectorModal(false);

      // Défilement vers le nouvel élément
      setTimeout(() => {
        const element = itemRefs.current.get(newActivity.id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    },
    [chapitre, getNextOrder]
  );

  // Fonctions pour la sélection et l'ajout d'évaluations
  const handleOpenEvaluationSelector = () => {
    if (!chapitre.chapitreReferenceId) {
      alert("Veuillez d'abord sélectionner un chapitre de référence pour filtrer les évaluations.");
      return;
    }
    setShowEvaluationSelectorModal(true);
  };

  const handleEvaluationSelectedFromModal = useCallback(
    async (selectedEvaluationData: Omit<PlanEvaluation, 'id' | 'type' | 'ordre' | 'isExpanded'>) => {
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
        sourceId: selectedEvaluationData.sourceId!,
        ordre: getNextOrder(),
        isExpanded: true, // Dépliée par défaut
        
        // Copier les données de l'évaluation maître sélectionnée pour les mettre en cache
        titre: selectedEvaluationData.titre,
        description: selectedEvaluationData.description,
        typeEvaluation: selectedEvaluationData.typeEvaluation,
        modalites: selectedEvaluationData.modalites,
        dureeEstimeeMinutes: selectedEvaluationData.dureeEstimeeMinutes,
        baremeTotal: selectedEvaluationData.baremeTotal,
        objectifsEvalues: selectedEvaluationData.objectifsEvalues,
        criteresEvaluation: selectedEvaluationData.criteresEvaluation,
        commentaires: selectedEvaluationData.commentaires,
      };

      setChapitre((prevChapitre) => ({
        ...prevChapitre,
        progressionItems: [...prevChapitre.progressionItems, newEvaluation],
      }));
      setShowEvaluationSelectorModal(false);

      // Défilement vers le nouvel élément
      setTimeout(() => {
        const element = itemRefs.current.get(newEvaluation.id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    },
    [chapitre, getNextOrder]
  );


  // --- Gestion des mises à jour et suppressions d'éléments de progression ---
  const handleUpdateProgressionItem = useCallback(
    (updatedItem: PlanChapterProgressionItem) => {
      setChapitre((prevChapitre) => ({
        ...prevChapitre,
        progressionItems: prevChapitre.progressionItems.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        ),
      }));
    }, []
  );

  const handleRemoveProgressionItem = useCallback((itemId: string) => {
    setChapitre((prevChapitre) => {
      const updatedItems = prevChapitre.progressionItems.filter(
        (item) => item.id !== itemId
      );
      itemRefs.current.delete(itemId); // Nettoie la référence pour le défilement
      // Réindexer les ordres après suppression
      const reorderedItems = updatedItems.map((item, idx) => ({ ...item, ordre: idx }));
      return { ...prevChapitre, progressionItems: reorderedItems };
    });
  }, []);

  // --- Fonctions de réordonnancement ---
  const handleMoveItem = useCallback((id: string, direction: 'up' | 'down') => {
    setChapitre(prevChapitre => {
      // Créer une copie et trier par ordre pour s'assurer de l'index correct
      const items = [...prevChapitre.progressionItems].sort((a, b) => a.ordre - b.ordre);
      const index = items.findIndex(item => item.id === id);

      if (index === -1) {
        return prevChapitre; // Item not found
      }

      const newIndex = direction === 'up' ? index - 1 : index + 1;

      if (newIndex < 0 || newIndex >= items.length) {
        return prevChapitre; // Cannot move out of bounds
      }

      // Échanger les éléments en utilisant splice
      const [movedItem] = items.splice(index, 1); // Retire l'élément à l'index actuel
      items.splice(newIndex, 0, movedItem); // Insère l'élément à la nouvelle position

      // Réassigner les ordres de manière séquentielle après le déplacement
      const reorderedItems = items.map((item, idx) => ({ ...item, ordre: idx }));
      
      return { ...prevChapitre, progressionItems: reorderedItems };
    });
  }, []);

  // --- Basculer l'expansion/contraction d'un bloc détaillé ---
  const handleToggleExpand = useCallback((itemId: string) => {
    setChapitre(prevChapitre => ({
      ...prevChapitre,
      progressionItems: prevChapitre.progressionItems.map(item => 
        item.id === itemId ? { ...item, isExpanded: !item.isExpanded } : item
      ),
    }));
  }, []);


  // --- Fonctions pour la modale d'édition d'activité maître ---
  const handleOpenEditActivityModal = useCallback((masterActivityId: number, planActivityId: string) => {
    setActivityToEditMasterId(masterActivityId);
    setPlanActivityToScrollToId(planActivityId);
    setShowEditActivityModal(true);
  }, []);

  const handleCloseEditActivityModal = useCallback(() => {
    setShowEditActivityModal(false);
    setActivityToEditMasterId(null);
    setPlanActivityToScrollToId(null); // Réinitialiser après utilisation
  }, []);

  // OPTIMISÉ: Mise à jour directe de l'activité dans l'état, sans rechargement complet
  const handleEditActivitySaveSuccess = useCallback(async (updatedMasterActivityId: number) => {
    setShowEditActivityModal(false);
    setActivityToEditMasterId(null);
    
    if (planActivityToScrollToId) { // S'assurer qu'il y a un élément à mettre à jour
        setIsSavingOrLoading(true); // Afficher le spinner pendant la mise à jour des données
        try {
            // 1. Récupérer les données fraîches de l'activité maître depuis la DB
            const freshMasterActivityData = await planificationService.fetchSingleMasterActivityDetails(updatedMasterActivityId);

            if (freshMasterActivityData) {
              setChapitre(prevChapitre => {
                  const updatedProgressionItems = prevChapitre.progressionItems.map(item => {
                      // Chercher l'activité spécifique à mettre à jour par son ID client-side
                      if (item.id === planActivityToScrollToId && item.type === 'activity') {
                          // Mettre à jour les champs du PlanActivity avec les données fraîches
                          // (freshMasterActivityData est déjà un Partial<PlanActivity>)
                          return {
                              ...item,
                              ...freshMasterActivityData, // Cela va écraser les champs communs mis en cache
                          } as PlanActivity;  
                      }
                      return item;
                  });

                  return { ...prevChapitre, progressionItems: updatedProgressionItems };
              });

              // Défilement vers l'élément mis à jour
              setTimeout(() => {
                  const element = itemRefs.current.get(planActivityToScrollToId);
                  if (element) {
                    // Utiliser scrollIntoView sans options pour un défilement par défaut ou avec un comportement spécifique.
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
              }, 100);
            } else {
                console.warn(`Impossible de récupérer les détails de l'activité maître ID ${updatedMasterActivityId}.`);
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour directe de l'activité:", error);
            alert("Erreur lors du rafraîchissement des données de l'activité: " + (error as Error).message);
        } finally {
            setIsSavingOrLoading(false);
        }
    }
  }, [planActivityToScrollToId]);

  // Fonctions pour la modale d'édition d'évaluation maître
  const handleOpenEditEvaluationModal = useCallback((masterEvaluationId: number, planEvaluationId: string) => {
    setEvaluationToEditMasterId(masterEvaluationId);
    setPlanEvaluationToScrollToId(planEvaluationId);
    setShowEditEvaluationModal(true);
  }, []);

  const handleCloseEditEvaluationModal = useCallback(() => {
    setShowEditEvaluationModal(false);
    setEvaluationToEditMasterId(null);
    setPlanEvaluationToScrollToId(null);
  }, []);

  const handleEditEvaluationSaveSuccess = useCallback(async (updatedMasterEvaluationId: number) => {
    setShowEditEvaluationModal(false);
    setEvaluationToEditMasterId(null);

    if (planEvaluationToScrollToId) {
      setIsSavingOrLoading(true);
      try {
        const freshMasterEvaluationData = await planificationService.fetchSingleMasterEvaluationDetails(updatedMasterEvaluationId);

        if (freshMasterEvaluationData) {
          setChapitre(prevChapitre => {
            const updatedProgressionItems = prevChapitre.progressionItems.map(item => {
              if (item.id === planEvaluationToScrollToId && item.type === 'evaluation') {
                return {
                  ...item,
                  ...freshMasterEvaluationData,
                } as PlanEvaluation;
              }
              return item;
            });
            return { ...prevChapitre, progressionItems: updatedProgressionItems };
          });

          setTimeout(() => {
            const element = itemRefs.current.get(planEvaluationToScrollToId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        } else {
          console.warn(`Impossible de récupérer les détails de l'évaluation maître ID ${updatedMasterEvaluationId}.`);
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour directe de l'évaluation:", error);
        alert("Erreur lors du rafraîchissement des données de l'évaluation: " + (error as Error).message);
      } finally {
        setIsSavingOrLoading(false);
      }
    }
  }, [planEvaluationToScrollToId]);


  // --- Sauvegarde globale de la fiche ---
  const handleSave = async () => {
    if (!chapitre.chapitreReferenceId) {
      alert("Veuillez sélectionner un chapitre de référence avant d'enregistrer la fiche de planification.");
      return;
    }

    // Assigner les ordres finaux avant la sauvegarde
    const finalProgressionItems = chapitre.progressionItems.map((item, index) => ({
      ...item,
      ordre: index // S'assurer que l'ordre est séquentiel et correct
    }));

    const chapToSave: PlanChapitre = {
        ...chapitre,
        progressionItems: finalProgressionItems
    };

    setIsSavingOrLoading(true);
    try {
      const savedChapitre = await planificationService.savePlanChapitre(chapToSave);
      setChapitre(savedChapitre);

      alert("Fiche de planification enregistrée avec succès !");

      // Redirection si c'est une nouvelle fiche
      if (!chapterFicheIdFromUrl && savedChapitre.id) {
        navigate(`/planipeda/chapitre/planifier/${savedChapitre.id}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la fiche de planification:', error);
      alert('Échec de l\'enregistrement de la fiche de planification: ' + (error as Error).message);
    } finally {
        setIsSavingOrLoading(false);
    }
  };


  if (isSavingOrLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Chargement ou sauvegarde en cours...</p>
        </div>
      </div>
    );
  }

  // Cette condition est la clé :
  // Si chapterFicheIdFromUrl existe (n'est ni null ni undefined)
  // ET ce n'est PAS 'new' (donc on s'attend à un ID existant)
  // ET chapitre.id est toujours null (cela signifie que loadPlanChapitre n'a pas pu charger une fiche existante)
  // ALORS on affiche le message d'erreur.
  if (chapterFicheIdFromUrl && chapterFicheIdFromUrl !== 'new' && chapitre.id === null) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-xl">
          <p className="text-lg text-red-600 mb-4">Une erreur est survenue ou la fiche n'existe pas. Il est possible que la fiche avec l'ID spécifié n'existe pas.</p>
          <button
            onClick={() => navigate('/planipeda/chapitre/planifier/new')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 ease-in-out"
          >
            Créer une nouvelle fiche de planification
          </button>
        </div>
      </div>
    );
  }

  // Sinon (si c'est 'new', ou si l'ID est null sans chapterFicheIdFromUrl, ou si une fiche a été chargée),
  // on affiche l'éditeur principal.
  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-50 min-h-screen shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center border-b-2 pb-4">
        Planification du Chapitre
        {chapitre.titreChapitre && `: ${chapitre.titreChapitre}`}
      </h1>

      {/* Section de sélection de la cible du chapitre */}
      <section className="bg-white p-6 rounded-lg shadow-md mb-8 border border-blue-200">
        <h2 className="text-2xl font-semibold text-blue-700 mb-4 flex items-center">
          <span className="mr-2">🎯</span>Cible du Chapitre
        </h2>
        <ChapterTargetSelector
          selectedNiveauId={chapitre.niveauId}
          selectedOptionId={chapitre.optionId}
          selectedUniteId={chapitre.uniteId}
          selectedChapitreId={chapitre.chapitreReferenceId}
          onChange={handleTargetSelectionChange}
          isDisabled={!!chapitre.id && chapitre.progressionItems.length > 0} // Désactiver si déjà sauvegardé et a des items
        />
        {chapitre.id && chapitre.progressionItems.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            La cible ne peut pas être modifiée si des éléments de progression existent déjà dans cette fiche.
          </p>
        )}
      </section>

      {/* Informations générales du chapitre (auto-remplies par la sélection) */}
      <section className="bg-white p-6 rounded-lg shadow-md mb-8 border border-green-200">
        <h2 className="text-2xl font-semibold text-green-700 mb-4 flex items-center">
          <span className="mr-2">ℹ️</span>Informations Générales du Chapitre
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-bold mb-1">Titre du Chapitre Planifié:</label>
            <input
              type="text"
              value={chapitre.titreChapitre}
              readOnly
              className="w-full p-2 border border-gray-300 bg-gray-50 rounded-md focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-1">Statut:</label>
            <select
              value={chapitre.statut}
              onChange={(e) => setChapitre({ ...chapitre, statut: e.target.value as 'Brouillon' | 'Validé' | 'Archivé' })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Brouillon">Brouillon</option>
              <option value="Validé">Validé</option>
              <option value="Archivé">Archivé</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-gray-700 font-bold mb-1">Objectifs Généraux du Chapitre de Référence:</label>
          <textarea
            value={chapitre.objectifsGeneraux}
            readOnly
            rows={6}
            className="w-full p-2 border border-gray-300 bg-gray-50 rounded-md focus:outline-none resize-y"
          ></textarea>
        </div>
      </section>

      {/* Section de la progression pédagogique */}
      <section className="bg-white p-6 rounded-lg shadow-md mb-8 border border-purple-200">
        <h2 className="text-2xl font-semibold text-purple-700 mb-4 flex items-center">
          <span className="mr-2">📚</span>Progression Pédagogique
        </h2>

        {/* Boutons d'ajout d'éléments */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <button
            onClick={handleAddSequence}
            className="px-6 py-3 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition duration-150 ease-in-out shadow-md flex items-center"
          >
            <span className="mr-2">📝</span>Ajouter Séquence
          </button>
          <button
            onClick={handleOpenActivitySelector}
            className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-150 ease-in-out shadow-md flex items-center"
          >
            <span className="mr-2">💡</span>Ajouter Activité (Modèle)
          </button>
          <button
            onClick={() => { /* TODO: Implémenter l'ajout d'activité vierge */ alert("TODO: Implémenter l'ajout d'une activité vierge."); }}
            className="px-6 py-3 bg-green-400 text-white rounded-md hover:bg-green-500 transition duration-150 ease-in-out shadow-md flex items-center"
          >
            <span className="mr-2">➕</span>Ajouter Activité (Vierge)
          </button>
          <button
            onClick={handleOpenEvaluationSelector}
            className="px-6 py-3 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition duration-150 ease-in-out shadow-md flex items-center"
          >
            <span className="mr-2">📊</span>Ajouter Évaluation (Modèle)
          </button>
          <button
            onClick={() => { /* TODO: Implémenter l'ajout d'évaluation vierge */ alert("TODO: Implémenter l'ajout d'une évaluation vierge."); }}
            className="px-6 py-3 bg-purple-400 text-white rounded-md hover:bg-purple-500 transition duration-150 ease-in-out shadow-md flex items-center"
          >
            <span className="mr-2">➕</span>Ajouter Évaluation (Vierge)
          </button>
        </div>

        {/* Tableau de progression résumé */}
        <div className="mb-6 border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">Vue d'ensemble de la Progression</h3>
          </div>
          <div className="relative overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Ordre</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre de l'Élément</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chapitre.progressionItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-sm text-gray-500">Aucun élément de progression ajouté.</td>
                  </tr>
                ) : (
                  chapitre.progressionItems.map((item, index) => (
                    <ProgressionItemSummary
                      key={item.id}
                      item={item}
                      index={index}
                      totalItems={chapitre.progressionItems.length}
                      onMoveUp={handleMoveItem}
                      onMoveDown={handleMoveItem}
                      onDelete={handleRemoveProgressionItem}
                      onToggleExpand={handleToggleExpand}
                      onOpenEditActivityModal={handleOpenEditActivityModal}
                      onOpenEditEvaluationModal={handleOpenEditEvaluationModal}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Blocs détaillés de la progression */}
        <div className="space-y-6">
          {chapitre.progressionItems
            .filter(item => item.isExpanded) // Filtrer pour afficher seulement les éléments dépliés
            .map((item) => (
              <div key={item.id} ref={(el) => setItemRef(item.id, el)}>
                {item.type === 'sequence' && (
                  <SequenceBlock
                    key={item.id}
                    sequence={item}
                    onUpdate={handleUpdateProgressionItem}
                    onDelete={() => handleRemoveProgressionItem(item.id)}
                    onToggleExpand={handleToggleExpand}
                  />
                )}
                {item.type === 'activity' && (
                  <ActivityBlock
                    key={item.id}
                    activity={item}
                    onUpdate={handleUpdateProgressionItem}
                    onDelete={() => handleRemoveProgressionItem(item.id)}
                    onEditMasterActivity={handleOpenEditActivityModal}
                    onToggleExpand={handleToggleExpand}
                  />
                )}
                {item.type === 'evaluation' && (
                  <EvaluationBlock
                    key={item.id}
                    evaluation={item}
                    onUpdate={handleUpdateProgressionItem}
                    onDelete={() => handleRemoveProgressionItem(item.id)}
                    onEditMasterEvaluation={handleOpenEditEvaluationModal}
                    onToggleExpand={handleToggleExpand}
                  />
                )}
              </div>
            ))}
        </div>
      </section>

      {/* Boutons d'action principaux */}
      <div className="flex justify-end gap-4 mt-8 p-4 bg-white rounded-lg shadow-md border-t border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-150 ease-in-out shadow-sm"
          disabled={isSavingOrLoading}
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 ease-in-out shadow-md"
          disabled={isSavingOrLoading}
        >
          {isSavingOrLoading ? 'Sauvegarde...' : 'Enregistrer la Planification'}
        </button>
      </div>

      {/* Modale de sélection d'activité (pour ajouter des activités existantes) */}
      {showActivitySelectorModal && (
        <CustomModal
          isOpen={showActivitySelectorModal}
          onClose={() => setShowActivitySelectorModal(false)}
          title="Sélectionner ou Créer une Activité"
        >
          <ActivitySelector
            onActivitySelected={(selectedActivityId, selectedActivityDetails) => {
              if (selectedActivityDetails) {
                 const activityDataWithSourceId = {
                    ...selectedActivityDetails,
                    sourceId: selectedActivityId // Assurez-vous que sourceId est bien l'ID maître
                 } as Omit<PlanActivity, 'id' | 'type' | 'ordre' | 'isExpanded'>;
                 handleActivitySelectedFromModal(activityDataWithSourceId);
              } else {
                 alert("Aucune activité sélectionnée ou données manquantes.");
              }
            }}
            onCancel={() => setShowActivitySelectorModal(false)}
            // Passage des IDs pour le filtrage
            chapitreReferenceId={chapitre.chapitreReferenceId}
            niveauId={chapitre.niveauId}
            optionId={chapitre.optionId}
            uniteId={chapitre.uniteId}
          />
          <div className="flex justify-center mt-4 text-gray-600 text-sm">
            Pour créer une nouvelle activité vierge directement :
            <button
              onClick={() => {
                const newActivity: PlanActivity = {
                  id: crypto.randomUUID(),
                  type: 'activity',
                  sourceId: null, // C'est une activité vierge
                  titre: 'Nouvelle Activité Vierge',
                  description: '',
                  dureeEstimeeMinutes: null,
                  objectifsSpecifiques: [], // Vide pour une nouvelle activité vierge
                  modalites: '',
                  ressources: '',
                  ordre: getNextOrder(),
                  isExpanded: true,
                  roleEnseignant: null,
                  modaliteEvaluation: null,
                  commentaires: null,
                };
                setChapitre((prevChapitre) => ({
                  ...prevChapitre,
                  progressionItems: [...prevChapitre.progressionItems, newActivity],
                }));
                setShowActivitySelectorModal(false);
                // Défilement vers le nouvel élément
                setTimeout(() => {
                  const element = itemRefs.current.get(newActivity.id);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
              }}
              className="ml-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-md focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
            >
              + Ajouter Vierge
            </button>
          </div>
        </CustomModal>
      )}

      {/* Modale de sélection d'évaluation (pour ajouter des évaluations existantes) */}
      {showEvaluationSelectorModal && (
        <CustomModal
          isOpen={showEvaluationSelectorModal}
          onClose={() => setShowEvaluationSelectorModal(false)}
          title="Sélectionner ou Créer une Évaluation"
        >
          <EvaluationSelector
            onEvaluationSelected={(selectedEvaluationId, selectedEvaluationDetails) => {
              if (selectedEvaluationDetails) {
                 const evaluationDataWithSourceId = {
                    ...selectedEvaluationDetails,
                    sourceId: selectedEvaluationId // Assurez-vous que sourceId est bien l'ID maître
                 } as Omit<PlanEvaluation, 'id' | 'type' | 'ordre' | 'isExpanded'>;
                 handleEvaluationSelectedFromModal(evaluationDataWithSourceId);
              } else {
                 alert("Aucune évaluation sélectionnée ou données manquantes.");
              }
            }}
            onCancel={() => setShowEvaluationSelectorModal(false)}
            // Passage des IDs pour le filtrage
            chapitreReferenceId={chapitre.chapitreReferenceId}
            niveauId={chapitre.niveauId}
            optionId={chapitre.optionId}
            uniteId={chapitre.uniteId}
          />
          <div className="flex justify-center mt-4 text-gray-600 text-sm">
            Pour créer une nouvelle évaluation vierge directement :
            <button
              onClick={() => {
                const newEvaluation: PlanEvaluation = {
                  id: crypto.randomUUID(),
                  type: 'evaluation',
                  sourceId: null, // C'est une évaluation vierge
                  titre: 'Nouvelle Évaluation Vierge',
                  description: '',
                  typeEvaluation: null,
                  modalites: '',
                  dureeEstimeeMinutes: null,
                  baremeTotal: null,
                  objectifsEvalues: [],
                  criteresEvaluation: '',
                  ordre: getNextOrder(),
                  isExpanded: true,
                  commentaires: null,
                };
                setChapitre((prevChapitre) => ({
                  ...prevChapitre,
                  progressionItems: [...prevChapitre.progressionItems, newEvaluation],
                }));
                setShowEvaluationSelectorModal(false);
                // Défilement vers le nouvel élément
                setTimeout(() => {
                  const element = itemRefs.current.get(newEvaluation.id);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
              }}
              className="ml-2 bg-purple-500 hover:bg-purple-600 text-white font-bold py-1 px-3 rounded-md focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
            >
              + Ajouter Vierge
            </button>
          </div>
        </CustomModal>
      )}

      {/* Modale d'édition d'activité maître */}
      {showEditActivityModal && activityToEditMasterId && (
        <CustomModal
          isOpen={showEditActivityModal}
          onClose={handleCloseEditActivityModal}
          title="Modifier l'Activité Maître"
          size="large"
        >
          <EditActivityForm
            activityId={activityToEditMasterId}
            onSaveSuccess={handleEditActivitySaveSuccess}
            onCancel={handleCloseEditActivityModal}
          />
        </CustomModal>
      )}

      {/* Modale d'édition d'évaluation maître */}
      {showEditEvaluationModal && evaluationToEditMasterId && (
        <CustomModal
          isOpen={showEditEvaluationModal}
          onClose={handleCloseEditEvaluationModal}
          title="Modifier l'Évaluation Maître"
          size="large"
        >
          <EditEvaluationForm
            evaluationId={evaluationToEditMasterId}
            onSaveSuccess={handleEditEvaluationSaveSuccess}
            onCancel={handleCloseEditEvaluationModal}
          />
        </CustomModal>
      )}
    </div>
  );
};

export default PlanifierChapitreEditor;
