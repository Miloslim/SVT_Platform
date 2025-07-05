// src/services/evaluationsService.ts
import { supabase } from "@/backend/config/supabase";
import { EvaluationDb, CreateEvaluationDb, UpdateEvaluationDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "evaluations";

export const evaluationsService = {
  async getAllEvaluations(): Promise<{ data: EvaluationDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<EvaluationDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des évaluations :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getEvaluationById(id: number): Promise<{ data: EvaluationDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<EvaluationDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération de l'évaluation ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createEvaluation(newEvaluation: CreateEvaluationDb): Promise<{ data: EvaluationDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<EvaluationDb>(TABLE_NAME).insert([newEvaluation]).select().single();
    if (error) {
      console.error("Erreur lors de la création de l'évaluation :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateEvaluation(id: number, updatedFields: UpdateEvaluationDb): Promise<{ data: EvaluationDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<EvaluationDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour de l'évaluation ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteEvaluation(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<EvaluationDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression de l'évaluation ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async getEvaluationsByChapitreId(chapitreId: number): Promise<{ data: EvaluationDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationDb>(TABLE_NAME)
      .select('*')
      .eq('chapitre_id', chapitreId);
    if (error) {
      console.error(`Erreur lors de la récupération des évaluations pour le chapitre ${chapitreId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getEvaluationsBySequenceId(sequenceId: number): Promise<{ data: EvaluationDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationDb>(TABLE_NAME)
      .select('*')
      .eq('sequence_id', sequenceId);
    if (error) {
      console.error(`Erreur lors de la récupération des évaluations pour la séquence ${sequenceId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getEvaluationsByActiviteId(activiteId: number): Promise<{ data: EvaluationDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationDb>(TABLE_NAME)
      .select('*')
      .eq('activite_id', activiteId);
    if (error) {
      console.error(`Erreur lors de la récupération des évaluations pour l'activité ${activiteId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};