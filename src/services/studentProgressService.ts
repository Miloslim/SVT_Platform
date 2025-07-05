// src/services/studentProgressService.ts
import { supabase } from "@/backend/config/supabase";
import { StudentProgressDb, CreateStudentProgressDb, UpdateStudentProgressDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "student_progress";

export const studentProgressService = {
  async getAllStudentProgress(): Promise<{ data: StudentProgressDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentProgressDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des suivis de progression :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getStudentProgressById(id: number): Promise<{ data: StudentProgressDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentProgressDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération du suivi de progression ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createStudentProgress(newProgress: CreateStudentProgressDb): Promise<{ data: StudentProgressDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentProgressDb>(TABLE_NAME).insert([newProgress]).select().single();
    if (error) {
      console.error("Erreur lors de la création du suivi de progression :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateStudentProgress(id: number, updatedFields: UpdateStudentProgressDb): Promise<{ data: StudentProgressDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentProgressDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour du suivi de progression ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteStudentProgress(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<StudentProgressDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression du suivi de progression ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async getStudentProgressByStudentId(studentId: number): Promise<{ data: StudentProgressDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<StudentProgressDb>(TABLE_NAME)
      .select('*')
      .eq('student_id', studentId);
    if (error) {
      console.error(`Erreur lors de la récupération du suivi de progression pour l'étudiant ${studentId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getStudentProgressByCompetenceId(competenceId: number): Promise<{ data: StudentProgressDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<StudentProgressDb>(TABLE_NAME)
      .select('*')
      .eq('competence_id', competenceId);
    if (error) {
      console.error(`Erreur lors de la récupération du suivi de progression pour la compétence ${competenceId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};