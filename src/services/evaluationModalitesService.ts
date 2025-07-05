// src/services/evaluationModalitesService.ts
import { supabase } from "@/backend/config/supabase";
import { EvaluationModaliteDb, CreateEvaluationModaliteDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "evaluation_modalites";

export const evaluationModalitesService = {
  async getModalitesForEvaluation(evaluationId: number): Promise<{ data: EvaluationModaliteDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationModaliteDb>(TABLE_NAME)
      .select('*')
      .eq('evaluation_id', evaluationId);
    if (error) {
      console.error(`Erreur lors de la récupération des modalités pour l'évaluation ${evaluationId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createEvaluationModalite(link: CreateEvaluationModaliteDb): Promise<{ data: EvaluationModaliteDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationModaliteDb>(TABLE_NAME)
      .insert([link])
      .select()
      .single();
    if (error) {
      console.error("Erreur lors de la création du lien évaluation-modalité :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteEvaluationModalite(evaluationId: number, modaliteId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<EvaluationModaliteDb>(TABLE_NAME)
      .delete()
      .eq('evaluation_id', evaluationId)
      .eq('modalite_id', modaliteId);
    if (error) {
      console.error(`Erreur lors de la suppression du lien évaluation ${evaluationId} - modalité ${modaliteId} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async deleteAllModalitesForEvaluation(evaluationId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<EvaluationModaliteDb>(TABLE_NAME)
      .delete()
      .eq('evaluation_id', evaluationId);
    if (error) {
      console.error(`Erreur lors de la suppression de toutes les modalités pour l'évaluation ${evaluationId} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  }
};