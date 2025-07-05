// Nom du fichier: sequencesService.ts
// Chemin: src/services/sequencesService.ts

import { supabase } from "@/backend/config/supabase";
import {
  CreateSequenceDb,
  SequenceDb,
  UpdateSequenceDb,
  SupabaseError,
} from "@/types/dbTypes";
import { FetchedSequenceData, SequenceFormData } from "@/types/sequences";
import { sequenceActiviteService } from "./sequenceActiviteService";
import { sequenceEvaluationService } from "./sequenceEvaluationService";

export const sequencesService = {
  /**
   * Crée une nouvelle séquence dans la base de données.
   * @param sequenceData Les données de la séquence à créer.
   * @returns Un objet contenant les données de la séquence créée ou une erreur.
   */
  async createSequence(
    sequenceData: CreateSequenceDb
  ): Promise<{ data: SequenceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from("sequences")
      .insert([sequenceData])
      .select()
      .single();

    return { data: data as SequenceDb, error: error as SupabaseError };
  },

  /**
   * Récupère une séquence par son ID, y compris ses chapitres, unités, options, niveaux,
   * et surtout ses activités et évaluations liées avec leurs détails complets.
   * @param id L'ID de la séquence à récupérer.
   * @returns Un objet contenant les données complètes de la séquence ou une erreur.
   */
  async getSequenceById(
    id: number
  ): Promise<{ data: FetchedSequenceData | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from("sequences")
      .select<string, FetchedSequenceData>(
        `id,
        titre_sequence,
        objectifs_specifiques,
        description,
        duree_estimee,
        prerequis,
        statut,
        chapitre_id,
        ordre,
        chapitre:sequences_chapitre_id_fkey(
            id,
            titre_chapitre,
            unite:unites(
                id,
                titre_unite,
                option:options(
                    id,
                    nom_option,
                    niveau:niveaux(
                        id,
                        nom_niveau
                    )
                )
            )
        ),
        sequence_activite!fk_sequence_activite(
            activite_id,
            ordre,
            activites:activites(
                id,
                titre_activite,
                description,
                activite_objectifs(objectifs:objectifs(description_objectif))
            )
        ),
        sequence_evaluation!fk_sequence_evaluation(
            evaluation_id,
            ordre,
            evaluations:evaluations(
                id,
                titre_evaluation,
                introduction_activite,
                consignes_specifiques,
                type_evaluation,
                evaluation_connaissances(connaissances:connaissances(titre_connaissance)),
                evaluation_capacite_habilete(capacites_habiletes(titre_capacite_habilete)) 
            )
        )`
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Erreur lors de la récupération de la séquence par ID:", error);
      return { data: null, error: error as SupabaseError };
    }

    return { data: data || null, error: null };
  },

  /**
   * Récupère toutes les séquences avec des détails agrégés.
   * @returns Un tableau de séquences avec leurs détails ou une erreur.
   */
  async getAllSequencesWithDetails(): Promise<{
    data: FetchedSequenceData[] | null;
    error: SupabaseError | null;
  }> {
    const { data, error } = await supabase
      .from("sequences")
      .select<string, FetchedSequenceData>(
        `id,
        titre_sequence,
        objectifs_specifiques,
        duree_estimee,
        statut,
        ordre,
        chapitre:sequences_chapitre_id_fkey(
            id,
            titre_chapitre,
            unite:unites(
                id,
                titre_unite,
                option:options(
                    id,
                    nom_option,
                    niveau:niveaux(
                        id,
                        nom_niveau
                    )
                )
            )
        )`
      )
      .order("ordre", { ascending: true });

    return { data: data || null, error: error as SupabaseError || null };
  },

  /**
   * Récupère les IDs et ordres des séquences pour un chapitre donné.
   * @param chapitreId L'ID du chapitre.
   * @returns Un tableau d'objets { id, ordre } pour les séquences du chapitre.
   */
  async getSequencesByChapitreId(
    chapitreId: number
  ): Promise<{ data: Array<{ id: number; ordre: number }> | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from("sequences")
      .select(`id, ordre`)
      .eq("chapitre_id", chapitreId)
      .order("ordre", { ascending: true });

    return { data, error: error as SupabaseError || null };
  },

  /**
   * Met à jour les informations d'une séquence.
   * @param id L'ID de la séquence à mettre à jour.
   * @param updateData Les données de mise à jour.
   * @returns La séquence mise à jour ou une erreur.
   */
  async updateSequence(
    id: number,
    updateData: UpdateSequenceDb
  ): Promise<{ data: SequenceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from("sequences")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    return { data: data as SequenceDb, error: error as SupabaseError || null };
  },

  /**
   * Supprime une séquence par son ID.
   * @param id L'ID de la séquence à supprimer.
   * @returns Un objet indiquant le succès ou une erreur.
   */
  async deleteSequence(
    id: number
  ): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from("sequences").delete().eq("id", id);

    return { success: !error, error: error as SupabaseError || null };
  },

  /**
   * Réordonne les séquences au sein d'un chapitre.
   * @param chapterId L'ID du chapitre.
   * @param newOrder Un tableau d'objets { id, ordre } pour le nouvel ordre.
   * @returns Les séquences mises à jour ou une erreur.
   */
  async reorderSequencesInChapter(
    chapterId: number,
    newOrder: { id: number; ordre: number }[]
  ): Promise<{ data: SequenceDb[] | null; error: SupabaseError | null }> {
    const updates = newOrder.map((item) => ({
      id: item.id,
      ordre: item.ordre,
    }));

    // Utilisation de upsert pour mettre à jour l'ordre des séquences existantes
    const { data, error } = await supabase
      .from("sequences")
      .upsert(updates, { onConflict: "id" })
      .select();

    return { data: data as SequenceDb[], error: error as SupabaseError || null };
  },

  /**
   * Met à jour une séquence et ses relations activités/évaluations.
   * Cette fonction gère la suppression des anciennes relations et l'insertion des nouvelles.
   * @param sequence L'objet séquence à mettre à jour.
   * @param activites Un tableau des activités liées à insérer.
   * @param evaluations Un tableau des évaluations liées à insérer.
   * @returns Un objet indiquant le succès ou une erreur.
   */
  async updateSequenceWithRelations(
    sequence: SequenceFormData,
    activites: { id: number; ordre: number }[],
    evaluations: { id: number; ordre: number }[]
  ): Promise<{ error: SupabaseError | null }> {
    const { id, ...dataToUpdate } = sequence;

    if (!id) {
        return { error: { message: "Sequence ID est requis pour la mise à jour des relations.", code: "400", details: "Missing ID" } };
    }

    // Mise à jour de la séquence principale
    const { error: sequenceError } = await this.updateSequence(id, dataToUpdate);
    if (sequenceError) return { error: sequenceError };

    // Suppression de toutes les anciennes liaisons (activités et évaluations)
    console.log(`[sequencesService] Suppression des anciennes activités pour séquence ID: ${id}`);
    await sequenceActiviteService.deleteActivitiesBySequenceId(id);
    console.log(`[sequencesService] Suppression des anciennes évaluations pour séquence ID: ${id}`);
    await sequenceEvaluationService.deleteEvaluationsBySequenceId(id);

    // Insertion des nouvelles liaisons d'activités (celles qui sont actuellement dans le formulaire)
    if (activites.length > 0) {
        const createActiviteLinks = activites.map(act => ({
            sequence_id: id,
            activite_id: act.id,
            ordre: act.ordre,
        }));
        const { error: createActiviteError } = await sequenceActiviteService.createMultipleSequenceActivite(createActiviteLinks);
        if (createActiviteError) {
            console.error("Erreur lors de la recréation des activités liées:", createActiviteError);
            return { error: createActiviteError };
        }
    }

    // Insertion des nouvelles liaisons d'évaluations (celles qui sont actuellement dans le formulaire)
    if (evaluations.length > 0) {
        const createEvaluationLinks = evaluations.map(evalu => ({
            sequence_id: id,
            evaluation_id: evalu.id,
            ordre: evalu.ordre,
        }));
        const { error: createEvaluationError } = await sequenceEvaluationService.createMultipleSequenceEvaluation(createEvaluationLinks);
        if (createEvaluationError) {
            console.error("Erreur lors de la recréation des évaluations liées:", createEvaluationError);
            return { error: createEvaluationError };
        }
    }

    return { error: null };
  },
};
