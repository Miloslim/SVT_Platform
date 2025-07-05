// src/services/evaluationConnaissancesService.ts
import { supabase } from "@/backend/config/supabase";
import { EvaluationConnaissanceDb, CreateEvaluationConnaissanceDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "evaluation_connaissances";

export const evaluationConnaissancesService = {
  async getConnaissancesForEvaluation(evaluationId: number): Promise<{ data: EvaluationConnaissanceDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationConnaissanceDb>(TABLE_NAME)
      .select('*')
      .eq('evaluation_id', evaluationId);
    if (error) {
      console.error(`Erreur lors de la récupération des connaissances pour l'évaluation ${evaluationId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createEvaluationConnaissance(link: CreateEvaluationConnaissanceDb): Promise<{ data: EvaluationConnaissanceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationConnaissanceDb>(TABLE_NAME)
      .insert([link])
      .select()
      .single();
    if (error) {
      console.error("Erreur lors de la création du lien évaluation-connaissance :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteEvaluationConnaissance(evaluationId: number, connaissanceId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<EvaluationConnaissanceDb>(TABLE_NAME)
      .delete()
      .eq('evaluation_id', evaluationId)
      .eq('connaissance_id', connaissanceId);
    if (error) {
      console.error(`Erreur lors de la suppression du lien évaluation ${evaluationId} - connaissance ${connaissanceId} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async deleteAllConnaissancesForEvaluation(evaluationId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<EvaluationConnaissanceDb>(TABLE_NAME)
      .delete()
      .eq('evaluation_id', evaluationId);
    if (error) {
      console.error(`Erreur lors de la suppression de toutes les connaissances pour l'évaluation ${evaluationId} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  }
};