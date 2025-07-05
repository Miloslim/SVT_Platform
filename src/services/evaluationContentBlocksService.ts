// src/services/evaluationContentBlocksService.ts
import { supabase } from "@/backend/config/supabase";
import { EvaluationContentBlockDb, CreateEvaluationContentBlockDb, UpdateEvaluationContentBlockDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "evaluation_content_blocks";

export const evaluationContentBlocksService = {
  async getBlocksForEvaluation(evaluationId: number): Promise<{ data: EvaluationContentBlockDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationContentBlockDb>(TABLE_NAME)
      .select('*')
      .eq('evaluation_id', evaluationId)
      .order('block_order', { ascending: true }); // Important pour l'ordre des blocs
    if (error) {
      console.error(`Erreur lors de la récupération des blocs de contenu pour l'évaluation ${evaluationId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createEvaluationContentBlock(newBlock: CreateEvaluationContentBlockDb): Promise<{ data: EvaluationContentBlockDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationContentBlockDb>(TABLE_NAME)
      .insert([newBlock])
      .select()
      .single();
    if (error) {
      console.error("Erreur lors de la création du bloc de contenu d'évaluation :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateEvaluationContentBlock(id: number, updatedFields: UpdateEvaluationContentBlockDb): Promise<{ data: EvaluationContentBlockDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationContentBlockDb>(TABLE_NAME)
      .update(updatedFields)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error(`Erreur lors de la mise à jour du bloc de contenu d'évaluation ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteEvaluationContentBlock(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<EvaluationContentBlockDb>(TABLE_NAME)
      .delete()
      .eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression du bloc de contenu d'évaluation ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async deleteAllBlocksForEvaluation(evaluationId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<EvaluationContentBlockDb>(TABLE_NAME)
      .delete()
      .eq('evaluation_id', evaluationId);
    if (error) {
      console.error(`Erreur lors de la suppression de tous les blocs de contenu pour l'évaluation ${evaluationId} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  }
};