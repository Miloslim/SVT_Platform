// src/services/studentScoresService.ts
import { supabase } from "@/backend/config/supabase";
import { StudentScoreDb, CreateStudentScoreDb, UpdateStudentScoreDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "student_scores";

export const studentScoresService = {
  async getAllStudentScores(): Promise<{ data: StudentScoreDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentScoreDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des scores des étudiants :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getStudentScoreById(id: number): Promise<{ data: StudentScoreDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentScoreDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération du score ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createStudentScore(newScore: CreateStudentScoreDb): Promise<{ data: StudentScoreDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentScoreDb>(TABLE_NAME).insert([newScore]).select().single();
    if (error) {
      console.error("Erreur lors de la création du score :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateStudentScore(id: number, updatedFields: UpdateStudentScoreDb): Promise<{ data: StudentScoreDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentScoreDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour du score ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteStudentScore(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<StudentScoreDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression du score ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async getScoresByStudentId(studentId: number): Promise<{ data: StudentScoreDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<StudentScoreDb>(TABLE_NAME)
      .select('*')
      .eq('student_id', studentId);
    if (error) {
      console.error(`Erreur lors de la récupération des scores pour l'étudiant ${studentId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getScoresByEvaluationId(evaluationId: number): Promise<{ data: StudentScoreDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<StudentScoreDb>(TABLE_NAME)
      .select('*')
      .eq('evaluation_id', evaluationId);
    if (error) {
      console.error(`Erreur lors de la récupération des scores pour l'évaluation ${evaluationId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};