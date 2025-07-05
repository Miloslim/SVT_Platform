// src/components/planipeda/chapitreplanifier/PlanifierChapitreEditor.tsx version: ajout Activité 100%

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
 * - Permet d'ajouter des Séquences, des Activités (via sélection d'existantes ou création) et des Évaluations directement à la progression du chapitre.
 * - Affiche et gère les modifications individuelles des Séquences, Activités et Évaluations
 * via leurs composants respectifs (SequenceBlock, ActivityBlock, EvaluationBlock).
 * - Permet la suppression des éléments de la progression.
 * - Gère l'ouverture et la fermeture d'une modale pour l'édition des activités maîtresses.
 * - Affiche une "vue résumé" de la progression (tableau épinglé) avec des contrôles de réordonnancement et de visibilité.
 * - Permet d'épingler/désépingler les blocs détaillés.
 * - OPTIMISATION: Mise à jour directe des données de l'activité après modification de la maître.
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
import ActivitySelector, { ActivityDisplayData } from '@/components/planipeda/ScenarioEditor/ActivitySelector';
import EditActivityForm from '@/components/planipeda/ScenarioEditor/EditActivityForm';

// Composant pour les éléments du tableau de progression résumé
import ProgressionItemSummary from './ProgressionItemSummary';
import { planificationService } from '@/services/planificationService';


const PlanifierChapitreEditor: React.FC = () => {
  const { id: chapterFicheIdFromUrl } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

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
    createdBy: 'current_user_id', // Placeholder, à remplacer par l'ID utilisateur réel
  });

  const [referenceObjectifsDetails, setReferenceObjectifsDetails] = useState<
    { id: number; description: string }[]
  >([]);

  const [showActivitySelectorModal, setShowActivitySelectorModal] = useState(false);
  const [isSavingOrLoading, setIsSavingOrLoading] = useState(false);

  // États pour la modale d'édition d'activité maître
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  const [activityToEditMasterId, setActivityToEditMasterId] = useState<number | null>(null);
  const [planActivityToScrollToId, setPlanActivityToScrollToId] = useState<string | null>(null); // L'ID du PlanActivity pour le défilement

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
      // Détermine si un rechargement est nécessaire :
      // 1. Si l'ID de la fiche dans l'URL change (passage à une autre fiche ou mode édition initial).
      const shouldLoadFiche = chapterFicheIdFromUrl && chapterFicheIdFromUrl !== chapitre.id;

      if (shouldLoadFiche) {
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
            console.warn(`Fiche de planification avec ID ${chapterFicheIdFromUrl} introuvable. Initialisation d'une nouvelle fiche.`);
            setChapitre((prev) => ({ ...prev, id: null, progressionItems: [], statut: 'Brouillon', createdBy: 'current_user_id' }));
            setReferenceObjectifsDetails([]);
          }
        } catch (error) {
          console.error("Erreur lors du chargement de la fiche existante:", error);
          alert("Erreur lors du chargement de la fiche de planification: " + (error as Error).message);
        } finally {
          setIsSavingOrLoading(false);
        }
      } else if (!chapterFicheIdFromUrl && !chapitre.id) {
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
            id, titre_chapitre,
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
          const formattedObjectifsGeneraux = extractedObjectifsDetails.map((obj) => `${obj.id}. ${obj.description}`).join('\n\n');

          setChapitre((prevChapitre) => ({
            ...prevChapitre,
            titreChapitre: data.titre_chapitre || '',
            objectifsGeneraux: formattedObjectifsGeneraux,
            objectifsReferencesIds: objectifsIds,
            niveauId: data.unite?.option?.niveau?.id || null,
            optionId: data.unite?.option?.id || null, // Corrigé ici : option_id directement sous option
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


  const handleAddEvaluation = async () => {
    // Si pas de chapitre de référence, on ne peut pas créer d'évaluation liée.
    if (!chapitre.chapitreReferenceId) {
      alert("Veuillez sélectionner un chapitre de référence avant d'ajouter une évaluation.");
      return;
    }

    // Idéalement, cela ouvrirait un modal EvaluationSelector.
    alert("TODO: Implémenter la sélection/création d'une évaluation maître pour l'ajouter ici.");
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

      {/* SECTION 1: Ciblage du Chapitre (ENTÊTE) */}
      <div className="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
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

      {/* SECTION 2: Informations Générales du Chapitre */}
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
          readOnly // Cette entrée est en lecture seule car elle est pré-remplie à partir du chapitre de référence
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4 bg-gray-100"
        />
        <label htmlFor="objectifsGeneraux" className="block text-gray-700 text-sm font-bold mb-2">
          Objectifs du chapitre :
        </label>
        {referenceObjectifsDetails.length > 0 ? (
          <div className="mt-2 p-3 bg-blue-100 border border-gray-200 rounded-md">
            <ul className="list-disc list-inside text-gray-900 space-y-2">
              {referenceObjectifsDetails.map((obj, index) => (
                <li key={obj.id} className="text-sm">
                  <strong>Objectif {obj.id} :</strong> {obj.description}
                </li>
              ))}
            </ul>
          </div>
        ) : (
            <p className="text-gray-600 italic">Sélectionnez un chapitre de référence pour afficher ses objectifs.</p>
        )}
      </div>

      <hr className="my-6 border-gray-200" />

      {/* SECTION 3: Vue Résumé de la Progression (Tableau Épinglé) */}
      <div className="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Progression Détaillée du Chapitre
        </h2>
        
        {chapitre.progressionItems.length === 0 ? (
          <p className="text-gray-600 mb-4">
            Utilisez les boutons ci-dessous pour ajouter des éléments à la progression de votre chapitre.
          </p>
        ) : (
          <div className="overflow-x-auto shadow-md rounded-lg mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ordre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre de l'Élément</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chapitre.progressionItems.sort((a, b) => a.ordre - b.ordre).map((item, index) => (
                  <ProgressionItemSummary
                    key={item.id}
                    item={item}
                    index={index}
                    totalItems={chapitre.progressionItems.length}
                    onMoveUp={handleMoveItem}
                    onMoveDown={handleMoveItem}
                    onDelete={handleRemoveProgressionItem}
                    onToggleExpand={handleToggleExpand}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Boutons d'action pour ajouter de nouveaux éléments de progression */}
        <div className="flex space-x-4 mt-6 justify-center">
          <button
            onClick={handleAddSequence}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            + Ajouter une Séquence
          </button>
          <button
            onClick={handleOpenActivitySelector}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            + Ajouter une Activité (existante)
          </button>
          <button
            onClick={handleAddEvaluation}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            + Ajouter une Évaluation
          </button>
        </div>
      </div>

      <hr className="my-6 border-gray-200" />

      {/* SECTION 4: Blocs Détaillés des Éléments de Progression */}
      <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Détails des Éléments de la Progression
        </h2>
        {chapitre.progressionItems.length === 0 ? (
            <p className="text-gray-600">Aucun détail à afficher. Ajoutez des éléments à la progression.</p>
        ) : (
            <div className="space-y-6">
                {chapitre.progressionItems.sort((a, b) => a.ordre - b.ordre).map((item) => {
                    // Les blocs détaillés sont rendus seulement si isExpanded est true
                    if (item.isExpanded) {
                        if (item.type === 'sequence') {
                            return (
                                <SequenceBlock
                                    key={item.id}
                                    sequence={item}
                                    onUpdate={handleUpdateProgressionItem}
                                    onDelete={() => handleRemoveProgressionItem(item.id)}
                                    ref={(el) => setItemRef(item.id, el)}
                                />
                            );
                        } else if (item.type === 'activity') {
                            return (
                                <ActivityBlock
                                    key={item.id}
                                    activity={item}
                                    onUpdate={handleUpdateProgressionItem}
                                    onDelete={() => handleRemoveProgressionItem(item.id)}
                                    onEditMasterActivity={handleOpenEditActivityModal}
                                    ref={(el) => setItemRef(item.id, el)}
                                />
                            );
                        } else if (item.type === 'evaluation') {
                            return (
                                <EvaluationBlock
                                    key={item.id}
                                    evaluation={item}
                                    onUpdate={handleUpdateProgressionItem}
                                    onDelete={() => handleRemoveProgressionItem(item.id)}
                                    ref={(el) => setItemRef(item.id, el)}
                                />
                            );
                        }
                    }
                    return null; // Ne rend rien si non étendu ou type inconnu
                })}
            </div>
        )}
      </div>

      <div className="flex justify-end space-x-4 mt-8">
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        >
          Enregistrer la Fiche de Chapitre
        </button>
      </div>

      {/* Modale de sélection d'activité (pour ajouter des activités existantes) */}
      <CustomModal
        isOpen={showActivitySelectorModal}
        onClose={() => setShowActivitySelectorModal(false)}
        title="Sélectionner ou Créer une Activité"
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
            }}
            className="ml-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded-md focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            + Ajouter Vierge
          </button>
        </div>
      </CustomModal>

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
    </div>
  );
};

export default PlanifierChapitreEditor;
