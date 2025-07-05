import { supabase } from "@/backend/config/supabase";
import {
  CreateSequenceDb,
  SequenceDb,
  UpdateSequenceDb,
  SupabaseError,
} from "@/types/dbTypes";
import { FetchedSequenceData } from "@/types/sequences";
import { sequenceActiviteService } from "./sequenceActiviteService";
import { sequenceEvaluationService } from "./sequenceEvaluationService";

export const sequencesServicechptr = {
  // ➕ Créer une séquence
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

  // 🔍 Obtenir une séquence avec tous les détails (chapitre, activités, évaluations, etc.)
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
        sequence_activite!left(  
            activite_id,
            ordre,
            activites:activites(
                id,
                titre_activite,
                description,
                activite_objectifs(objectifs(description_objectif))
            )
        ),
        sequence_evaluation!left(  
            evaluation_id,
            ordre,
            evaluations:evaluations(
                id,
                titre_evaluation,
                introduction_activite,
                consignes_specifiques,
                type_evaluation,
                evaluation_connaissances(connaissances(titre_connaissance)),
                evaluation_capacite_habilete(capacites_habiletes(titre_capacite_habilete))
            )
        )`
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("❌ Erreur lors de la récupération de la séquence :", error);
      return { data: null, error };
    }

    return { data: data || null, error: null };
  },

  // 🔍 Obtenir toutes les séquences avec détails minimaux
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

    return { data: data || null, error: error || null };
  },

  // 🔍 Obtenir les séquences par chapitre
  async getSequencesByChapitreId(
    chapitreId: number
  ): Promise<{ data: Array<{ id: number; ordre: number }> | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from("sequences")
      .select(`id, ordre`)
      .eq("chapitre_id", chapitreId)
      .order("ordre", { ascending: true });

    return { data, error: error || null };
  },

  // 📝 Mise à jour simple de la séquence (pas les relations)
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

    return { data: data as SequenceDb, error: error || null };
  },

  // ❌ Supprimer une séquence
  async deleteSequence(
    id: number
  ): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from("sequences").delete().eq("id", id);
    return { success: !error, error: error || null };
  },

  // 🔄 Réordonner les séquences dans un chapitre
  async reorderSequencesInChapter(
    chapterId: number,
    newOrder: { id: number; ordre: number }[]
  ): Promise<{ data: SequenceDb[] | null; error: SupabaseError | null }> {
    const updates = newOrder.map(item => ({ id: item.id, ordre: item.ordre }));
    const { data, error } = await supabase
      .from("sequences")
      .upsert(updates, { onConflict: "id" })
      .select();

    return { data: data as SequenceDb[], error: error || null };
  },

  // ✅ Mise à jour complète avec relations (activités et évaluations)
  async updateSequenceWithRelations(
    sequence: { id: number; [key: string]: any },
    activites?: { id: number; ordre: number }[],
    evaluations?: { id: number; ordre: number }[]
  ): Promise<{ error: SupabaseError | null }> {
    const { id, ...dataToUpdate } = sequence;

    if (!id) {
      return {
        error: {
          message: "L'ID de la séquence est requis.",
          code: "400",
          details: "ID manquant",
        },
      };
    }

    // 📝 Mise à jour des données de base de la séquence
    const { error: sequenceError } = await this.updateSequence(id, dataToUpdate);
    if (sequenceError) return { error: sequenceError };

    // 🔄 Activités (si fournies)
    if (activites) {
      await sequenceActiviteService.deleteActivitiesBySequenceId(id);

      const validActivites = activites.filter(act => act.id != null);
      if (validActivites.length > 0) {
        const createActiviteLinks = validActivites.map(act => ({
          sequence_id: id,
          activite_id: act.id,
          ordre: act.ordre,
        }));

        const { error: createActiviteError } =
          await sequenceActiviteService.createMultipleSequenceActivite(createActiviteLinks);
        if (createActiviteError) return { error: createActiviteError };
      }
    }

    // 🔄 Évaluations (si fournies)
    if (evaluations) {
      await sequenceEvaluationService.deleteEvaluationsBySequenceId(id);

      const validEvaluations = evaluations.filter(ev => ev.id != null);
      if (validEvaluations.length > 0) {
        const createEvaluationLinks = validEvaluations.map(ev => ({
          sequence_id: id,
          evaluation_id: ev.id,
          ordre: ev.ordre,
        }));

        const { error: createEvaluationError } =
          await sequenceEvaluationService.createMultipleSequenceEvaluation(createEvaluationLinks);
        if (createEvaluationError) return { error: createEvaluationError };
      }
    }

    return { error: null };
  },
};
