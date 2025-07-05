// src/services/studentsService.ts
import { supabase } from "@/backend/config/supabase";
import { StudentDb, CreateStudentDb, UpdateStudentDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "students";

export const studentsService = {
  async getAllStudents(): Promise<{ data: StudentDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des étudiants :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getStudentById(id: number): Promise<{ data: StudentDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération de l'étudiant ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createStudent(newStudent: CreateStudentDb): Promise<{ data: StudentDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentDb>(TABLE_NAME).insert([newStudent]).select().single();
    if (error) {
      console.error("Erreur lors de la création de l'étudiant :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateStudent(id: number, updatedFields: UpdateStudentDb): Promise<{ data: StudentDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour de l'étudiant ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteStudent(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<StudentDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression de l'étudiant ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async getStudentsByClasseId(classeId: number): Promise<{ data: StudentDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<StudentDb>(TABLE_NAME)
      .select('*')
      .eq('classe_id', classeId);
    if (error) {
      console.error(`Erreur lors de la récupération des étudiants pour la classe ${classeId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};