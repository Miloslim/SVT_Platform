// src/lib/sequenceManagement.ts

import { supabase } from "@/backend/config/supabase"; // Assurez-vous que ce chemin est correct
import { sequencesService } from '@/services/sequencesService';
import { sequenceActiviteService } from '@/services/sequenceActiviteService';
import { sequenceEvaluationService } from '@/services/sequenceEvaluationService';
import { CreateSequenceDb, CreateSequenceActiviteDb, CreateSequenceEvaluationDb } from '@/types/dbTypes';
import toast from 'react-hot-toast'; // Assurez-vous d'avoir react-hot-toast installé et configuré

interface SequenceDataToSave {
  titre_sequence: string;
  chapitre_id: number;
  description?: string;
  ordre?: number;
  duree_estimee?: number;
  statut?: string;
  objectifs_specifiques?: string; // JSONB stocké comme stringifié pour l'insertion directe
  prerequis?: string; // JSONB stocké comme stringifié pour l'insertion directe
  activite_ids?: { id: number; ordre?: number }[]; // IDs des activités à lier avec leur ordre
  evaluation_ids?: { id: number; ordre?: number }[]; // IDs des évaluations à lier avec leur ordre
}

/**
 * Enregistre une nouvelle séquence, ses activités liées et ses évaluations liées.
 *
 * @param data Les données de la séquence à créer, incluant les IDs des activités et évaluations à lier.
 * @returns L'ID de la séquence créée en cas de succès, ou null si une erreur survient.
 */
export async function saveNewSequenceWithRelations(data: SequenceDataToSave): Promise<number | null> {
  let toastId: string | undefined;
  try {
    toastId = toast.loading("Enregistrement de la séquence...");

    // 1. Préparer les données pour l'insertion de la séquence principale
    const sequenceToCreate: CreateSequenceDb = {
      titre_sequence: data.titre_sequence,
      chapitre_id: data.chapitre_id,
      description: data.description || null,
      ordre: data.ordre || null,
      duree_estimee: data.duree_estimee || null,
      statut: data.statut || 'brouillon',
      objectifs_specifiques: data.objectifs_specifiques || null,
      prerequis: data.prerequis || null,
    };

    // 2. Créer la séquence principale
    const { data: newSequence, error: sequenceError } = await sequencesService.createSequence(sequenceToCreate);

    if (sequenceError) {
      throw new Error(`Erreur lors de la création de la séquence principale: ${sequenceError.message}`);
    }
    if (!newSequence || !newSequence.id) {
      throw new Error("La création de la séquence a échoué: ID non retourné.");
    }

    const sequenceId = newSequence.id;

    // 3. Lier les activités à la séquence (table sequence_activite)
    if (data.activite_ids && data.activite_ids.length > 0) {
      const activitiesToLink: CreateSequenceActiviteDb[] = data.activite_ids.map((act) => ({
        sequence_id: sequenceId,
        activite_id: act.id,
        ordre: act.ordre || null,
      }));

      const { error: activitesLinkError } = await supabase
        .from('sequence_activite')
        .insert(activitiesToLink);

      if (activitesLinkError) {
        console.error("Erreur lors de la liaison des activités à la séquence:", activitesLinkError.message);
        toast.error(`Certaines activités n'ont pas pu être liées: ${activitesLinkError.message}`, { id: toastId });
      }
    }

    // 4. Lier les évaluations à la séquence (table sequence_evaluation)
    if (data.evaluation_ids && data.evaluation_ids.length > 0) {
      const evaluationsToLink: CreateSequenceEvaluationDb[] = data.evaluation_ids.map((evalItem) => ({
        sequence_id: sequenceId,
        evaluation_id: evalItem.id,
        ordre: evalItem.ordre || null,
      }));

      const { error: evaluationsLinkError } = await supabase
        .from('sequence_evaluation')
        .insert(evaluationsToLink);

      if (evaluationsLinkError) {
        console.error("Erreur lors de la liaison des évaluations à la séquence:", evaluationsLinkError.message);
        toast.error(`Certaines évaluations n'ont pas pu être liées: ${evaluationsLinkError.message}`, { id: toastId });
      }
    }

    toast.success("Séquence et ses éléments liés enregistrés avec succès!", { id: toastId });
    return sequenceId; // Retourne l'ID de la séquence créée
  } catch (error: any) {
    console.error("Erreur globale lors de l'enregistrement de la séquence:", error);
    toast.error(error.message || "Erreur lors de l'enregistrement de la séquence.", { id: toastId });
    return null; // Indique un échec
  } finally {
    if (toastId) {
      toast.dismiss(toastId);
    }
  }
}