// 🌐 Chemin : src/components/planipeda/chapitreplanifier/EditSequenceForm.tsx
// 📄 Nom du fichier : EditSequenceForm.tsx
//
// 💡 Fonctionnalités :
//    - Charge une séquence existante depuis Supabase en utilisant son ID.
//    - Prépare les données de la séquence (y compris sa hiérarchie et ses activités/évaluations liées) pour le formulaire d'édition.
//    - Gère l'état de chargement, de sauvegarde, les erreurs et les messages de succès.
//    - Sert de composant parent au `SequenceForm` pour la logique de formulaire et la gestion de la soumission.
//    - Met à jour la séquence et toutes ses relations (activités, évaluations) dans Supabase lors de la sauvegarde.
//    - Fournit des mécanismes d'annulation et des callbacks de succès pour la modale parente.

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/backend/config/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import du composant de formulaire principal
import SequenceForm from "./SequenceFormchptr";

// Imports des services backend
import { sequencesServicechptr } from "@/services/sequencesServicechptr"; // Assurez-vous que c'est le bon service renommé
import { sequenceActiviteService } from "@/services/sequenceActiviteService";
import { sequenceEvaluationService } from "@/services/sequenceEvaluationService";

// Import des interfaces de types consolidés
import {
  SequenceFormData,
  SequenceItem,
  FetchedSequenceData, // Pour le chargement initial
  UpdateSequenceDb,
  ActivityLinkPayload,
  EvaluationLinkPayload,
} from "@/types/sequences";

// --- Interfaces de Props du Composant ---
interface EditSequenceFormProps {
  sequenceId: number;
  onSaveSuccess: () => void; // Callback après sauvegarde réussie (le rafraîchissement est géré par le parent)
  onCancel: () => void; // Callback pour annuler l'édition
}

// Définition des types pour la hiérarchie pédagogique (si non déjà dans un fichier global)
interface Niveau { id: number; nom_niveau: string; }
interface Option { id: number; nom_option: string; niveau_id: number; }
interface Unite { id: number; titre_unite: string; option_id: number; }
interface Chapitre { id: number; titre_chapitre: string; unite_id: number; }

const EditSequenceForm: React.FC<EditSequenceFormProps> = ({ sequenceId, onSaveSuccess, onCancel }) => {
  // --- États ---
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // États pour stocker les données de la séquence EN COURS D'ÉDITION (mis à jour par SequenceForm)
  const [currentSequenceData, setCurrentSequenceData] = useState<SequenceFormData>({
    titre_sequence: "",
    objectifs_specifiques: "",
    statut: "brouillon",
    description: null,
    duree_estimee: null,
    prerequis: null,
    chapitre_id: null,
    ordre: null,
  });
  const [currentSequenceItems, setCurrentSequenceItems] = useState<SequenceItem[]>([]);
  const [currentSelectedNiveauId, setCurrentSelectedNiveauId] = useState<number | null>(null);
  const [currentSelectedOptionId, setCurrentSelectedOptionId] = useState<number | null>(null);
  const [currentSelectedUniteId, setCurrentSelectedUniteId] = useState<number | null>(null);
  const [currentSelectedChapitreId, setCurrentSelectedChapitreId] = useState<number | null>(null);

  // --- Chargement initial de la séquence ---
  useEffect(() => {
    const fetchAllDataForEdit = async () => {
      setIsLoading(true);
      setLoadError(null);

      if (!sequenceId || isNaN(sequenceId)) {
        setLoadError("ID de séquence invalide ou manquant.");
        setIsLoading(false);
        return;
      }

      try {
        // Récupération complète de la séquence avec relations
        const { data: sequence, error: sequenceError } = await sequencesServicechptr.getSequenceById(sequenceId);

        if (sequenceError) {
          if (sequenceError.code === "PGRST116") {
            throw new Error("Séquence introuvable.");
          }
          throw sequenceError;
        }
        if (!sequence) {
          throw new Error("Séquence non trouvée (données vides).");
        }

        // Préparation des données principales pour le formulaire
        const loadedSequenceData: SequenceFormData = {
          id: sequence.id,
          titre_sequence: sequence.titre_sequence,
          objectifs_specifiques: sequence.objectifs_specifiques || "",
          description: sequence.description,
          duree_estimee: sequence.duree_estimee,
          prerequis: sequence.prerequis,
          statut: sequence.statut,
          chapitre_id: sequence.chapitre_id,
          ordre: sequence.ordre,
        };

        // Reconstruction des éléments séquence (activités + évaluations)
        const items: SequenceItem[] = [];

        // Activités
        for (const sa of sequence.sequence_activite || []) {
          const activity = sa.activites;
          if (activity && typeof activity.id === 'number') {
            const objectifsDescriptions = (activity.activite_objectifs || [])
              .map((ao: any) => ao.objectifs?.description_objectif)
              .filter(Boolean);
            items.push({
              id: activity.id,
              titre: activity.titre_activite,
              description: activity.description,
              objectifs: objectifsDescriptions,
              type: 'activity',
              order_in_sequence: sa.ordre,
              linkId: sa.id,
            });
          }
        }

        // Évaluations
        for (const se of sequence.sequence_evaluation || []) {
          const evaluation = se.evaluations;
          if (evaluation && typeof evaluation.id === 'number') {
            const connaissancesDescriptions = (evaluation.evaluation_connaissances || [])
              .map((ec: any) => ec.connaissances?.titre_connaissance)
              .filter(Boolean);
            const capacitesDescriptions = (evaluation.evaluation_capacite_habilete || [])
              .map((ech: any) => ech.capacites_habiletes?.titre_capacite_habilete)
              .filter(Boolean);
            items.push({
              id: evaluation.id,
              titre: evaluation.titre_evaluation,
              type_evaluation: evaluation.type_evaluation,
              description: evaluation.introduction_activite || evaluation.consignes_specifiques,
              connaissances: connaissancesDescriptions,
              capacitesEvaluees: capacitesDescriptions,
              type: 'evaluation',
              order_in_sequence: se.ordre,
              linkId: se.id,
            });
          }
        }

        // Tri des éléments par ordre
        items.sort((a, b) => (a.order_in_sequence || 0) - (b.order_in_sequence || 0));

        // Récupération des IDs hiérarchiques
        let nivId: number | null = null;
        let optId: number | null = null;
        let unitId: number | null = null;
        if (sequence.chapitre) {
          unitId = sequence.chapitre.unite?.id || null;
          if (sequence.chapitre.unite?.option) {
            optId = sequence.chapitre.unite.option.id;
            if (sequence.chapitre.unite.option.niveau) {
              nivId = sequence.chapitre.unite.option.niveau.id;
            }
          }
        }

        setCurrentSequenceData(loadedSequenceData);
        setCurrentSequenceItems(items);
        setCurrentSelectedNiveauId(nivId);
        setCurrentSelectedOptionId(optId);
        setCurrentSelectedUniteId(unitId);
        setCurrentSelectedChapitreId(sequence.chapitre_id);

      } catch (err: any) {
        setLoadError(err.message || "Erreur inconnue lors du chargement.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllDataForEdit();
  }, [sequenceId]);

  // --- Handlers pour mise à jour du state par SequenceForm ---
  const handleUpdateSequenceData = useCallback((updatedFields: Partial<SequenceFormData>) => {
    setCurrentSequenceData(prev => ({ ...prev, ...updatedFields }));
  }, []);

  const handleUpdateSequenceItems = useCallback((updatedItems: SequenceItem[]) => {
    setCurrentSequenceItems(updatedItems);
  }, []);

  const handleUpdateHierarchyIds = useCallback((niveauId: number | null, optionId: number | null, uniteId: number | null, chapitreId: number | null) => {
    setCurrentSelectedNiveauId(niveauId);
    setCurrentSelectedOptionId(optionId);
    setCurrentSelectedUniteId(uniteId);
    setCurrentSelectedChapitreId(chapitreId);
  }, []);

  // --- Sauvegarde complète de la séquence avec ses relations ---
  const handleSave = useCallback(async (
    data: SequenceFormData,
    chapitreId: number | null,
    sequenceItems: SequenceItem[],
    isEditing: boolean
  ) => {
    setIsSaving(true);
    let toastId: string | undefined;

    if (!sequenceId) {
      toast.error("ID de séquence manquant pour la mise à jour.");
      setIsSaving(false);
      return;
    }

    try {
      toastId = toast.loading("Sauvegarde des modifications de la séquence...", { id: "editSequenceToast" });

      // Préparation des données principales pour la mise à jour
      const sequenceToUpdate: UpdateSequenceDb = {
        titre_sequence: data.titre_sequence.trim(),
        objectifs_specifiques: data.objectifs_specifiques?.trim() || null,
        description: data.description?.trim() || null,
        duree_estimee: data.duree_estimee || null,
        prerequis: data.prerequis?.trim() || null,
        statut: data.statut || "brouillon",
        chapitre_id: chapitreId,
        ordre: data.ordre,
      };

      // Correction CRUCIALE : Les liens doivent utiliser 'id' et non 'activite_id' ou 'evaluation_id'
      const activityLinks = sequenceItems
        .filter(item => item.type === 'activity')
        .map((item, index) => {
          if (typeof item.id !== 'number' || isNaN(item.id)) {
            throw new Error("Une activité liée a un ID invalide.");
          }
          return {
            id: item.id,
            ordre: index + 1,
          };
        });

      const evaluationLinks = sequenceItems
        .filter(item => item.type === 'evaluation')
        .map((item, index) => {
          if (typeof item.id !== 'number' || isNaN(item.id)) {
            throw new Error("Une évaluation liée a un ID invalide.");
          }
          return {
            id: item.id,
            ordre: index + 1,
          };
        });

      // Appel du service de mise à jour avec relations
      const { error: updateRelationsError } = await sequencesServicechptr.updateSequenceWithRelations(
        { id: sequenceId, ...sequenceToUpdate },
        activityLinks,
        evaluationLinks
      );

      if (updateRelationsError) throw updateRelationsError;

      toast.success("Séquence et liaisons mises à jour avec succès !", { id: toastId });
      onSaveSuccess();

    } catch (err: any) {
      toast.error(`Échec de la sauvegarde : ${err.message || "Erreur inconnue"}`, { id: toastId, duration: 6000 });
    } finally {
      setIsSaving(false);
    }
  }, [sequenceId, onSaveSuccess]);

  // --- Rendu conditionnel ---
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-gray-50 rounded-lg shadow-inner">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-xl font-semibold text-gray-700">Chargement des données de la séquence...</p>
        <p className="text-sm text-gray-500 mt-2">Veuillez patienter pendant la préparation du formulaire d'édition.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-red-700 bg-red-50 rounded-lg shadow-inner p-6">
        <h2 className="text-2xl font-bold mb-3">Erreur de Chargement</h2>
        <p className="text-lg text-center">{loadError}</p>
        <p className="text-sm text-gray-600 mt-2">Impossible de charger les données de la séquence pour édition.</p>
        <Button onClick={onCancel} className="mt-6 bg-red-500 hover:bg-red-600 text-white">
          Fermer
        </Button>
      </div>
    );
  }

  return (
    <SequenceForm
      onSequenceSubmit={handleSave}
      onCancel={onCancel}
      initialSequenceData={currentSequenceData}
      initialSequenceItems={currentSequenceItems}
      initialNiveauId={currentSelectedNiveauId}
      initialOptionId={currentSelectedOptionId}
      initialUniteId={currentSelectedUniteId}
      initialChapitreId={currentSelectedChapitreId}
      onUpdateSequenceData={handleUpdateSequenceData}
      onUpdateSequenceItems={handleUpdateSequenceItems}
      onUpdateHierarchyIds={handleUpdateHierarchyIds}
      isSaving={isSaving}
    />
  );
};

export default EditSequenceForm;
