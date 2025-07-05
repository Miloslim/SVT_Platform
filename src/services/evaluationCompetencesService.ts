// src/services/evaluationCompetencesService.ts
import { supabase } from "@/backend/config/supabase";
import { EvaluationCompetenceDb, CreateEvaluationCompetenceDb, UpdateEvaluationCompetenceDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "evaluation_competences";

export const evaluationCompetencesService = {
  async getCompetencesForEvaluation(evaluationId: number): Promise<{ data: EvaluationCompetenceDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationCompetenceDb>(TABLE_NAME)
      .select('*')
      .eq('evaluation_id', evaluationId);
    if (error) {
      console.error(`Erreur lors de la récupération des compétences pour l'évaluation ${evaluationId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createEvaluationCompetence(link: CreateEvaluationCompetenceDb): Promise<{ data: EvaluationCompetenceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationCompetenceDb>(TABLE_NAME)
      .insert([link])
      .select()
      .single();
    if (error) {
      console.error("Erreur lors de la création du lien évaluation-compétence :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateEvaluationCompetence(id: number, updatedFields: UpdateEvaluationCompetenceDb): Promise<{ data: EvaluationCompetenceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationCompetenceDb>(TABLE_NAME)
      .update(updatedFields)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error(`Erreur lors de la mise à jour du lien évaluation-compétence ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteEvaluationCompetence(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<EvaluationCompetenceDb>(TABLE_NAME)
      .delete()
      .eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression du lien évaluation-compétence ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async deleteAllCompetencesForEvaluation(evaluationId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<EvaluationCompetenceDb>(TABLE_NAME)
      .delete()
      .eq('evaluation_id', evaluationId);
    if (error) {
      console.error(`Erreur lors de la suppression de toutes les compétences pour l'évaluation ${evaluationId} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  }
};