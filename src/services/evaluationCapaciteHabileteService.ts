// src/services/evaluationCapaciteHabileteService.ts
import { supabase } from "@/backend/config/supabase";
import { EvaluationCapaciteHabileteDb, CreateEvaluationCapaciteHabileteDb, UpdateEvaluationCapaciteHabileteDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "evaluation_capacite_habilete";

export const evaluationCapaciteHabileteService = {
  async getCapacitesHabiletesForEvaluation(evaluationId: number): Promise<{ data: EvaluationCapaciteHabileteDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationCapaciteHabileteDb>(TABLE_NAME)
      .select('*')
      .eq('evaluation_id', evaluationId);
    if (error) {
      console.error(`Erreur lors de la récupération des capacités/habiletés pour l'évaluation ${evaluationId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createEvaluationCapaciteHabilete(link: CreateEvaluationCapaciteHabileteDb): Promise<{ data: EvaluationCapaciteHabileteDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationCapaciteHabileteDb>(TABLE_NAME)
      .insert([link])
      .select()
      .single();
    if (error) {
      console.error("Erreur lors de la création du lien évaluation-capacité/habileté :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateEvaluationCapaciteHabilete(id: number, updatedFields: UpdateEvaluationCapaciteHabileteDb): Promise<{ data: EvaluationCapaciteHabileteDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<EvaluationCapaciteHabileteDb>(TABLE_NAME)
      .update(updatedFields)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error(`Erreur lors de la mise à jour du lien évaluation-capacité/habileté ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteEvaluationCapaciteHabilete(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<EvaluationCapaciteHabileteDb>(TABLE_NAME)
      .delete()
      .eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression du lien évaluation-capacité/habileté ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async deleteAllCapacitesHabiletesForEvaluation(evaluationId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<EvaluationCapaciteHabileteDb>(TABLE_NAME)
      .delete()
      .eq('evaluation_id', evaluationId);
    if (error) {
      console.error(`Erreur lors de la suppression de toutes les capacités/habiletés pour l'évaluation ${evaluationId} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  }
};