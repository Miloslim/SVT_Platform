// src/services/evaluationObjectifsService.ts
import { supabase } from "@/backend/config/supabase";
import { EvaluationObjectifDb, CreateEvaluationObjectifDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "evaluation_objectifs";

export const evaluationObjectifsService = {
  async getObjectifsForEvaluation(evaluationId: number): Promise<{ data: EvaluationObjectifDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationObjectifDb>(TABLE_NAME)
      .select('*')
      .eq('evaluation_id', evaluationId);
    if (error) {
      console.error(`Erreur lors de la récupération des objectifs pour l'évaluation ${evaluationId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createEvaluationObjectif(link: CreateEvaluationObjectifDb): Promise<{ data: EvaluationObjectifDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationObjectifDb>(TABLE_NAME)
      .insert([link])
      .select()
      .single();
    if (error) {
      console.error("Erreur lors de la création du lien évaluation-objectif :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteEvaluationObjectif(evaluationId: number, objectifId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<EvaluationObjectifDb>(TABLE_NAME)
      .delete()
      .eq('evaluation_id', evaluationId)
      .eq('objectif_id', objectifId);
    if (error) {
      console.error(`Erreur lors de la suppression du lien évaluation ${evaluationId} - objectif ${objectifId} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async deleteAllObjectifsForEvaluation(evaluationId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<EvaluationObjectifDb>(TABLE_NAME)
      .delete()
      .eq('evaluation_id', evaluationId);
    if (error) {
      console.error(`Erreur lors de la suppression de tous les objectifs pour l'évaluation ${evaluationId} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  }
};