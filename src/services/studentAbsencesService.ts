// src/services/studentAbsencesService.ts
import { supabase } from "@/backend/config/supabase";
import { StudentAbsenceDb, CreateStudentAbsenceDb, UpdateStudentAbsenceDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "student_absences";

export const studentAbsencesService = {
  async getAllStudentAbsences(): Promise<{ data: StudentAbsenceDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentAbsenceDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des absences :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getStudentAbsenceById(id: number): Promise<{ data: StudentAbsenceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentAbsenceDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération de l'absence ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createStudentAbsence(newAbsence: CreateStudentAbsenceDb): Promise<{ data: StudentAbsenceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentAbsenceDb>(TABLE_NAME).insert([newAbsence]).select().single();
    if (error) {
      console.error("Erreur lors de la création de l'absence :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateStudentAbsence(id: number, updatedFields: UpdateStudentAbsenceDb): Promise<{ data: StudentAbsenceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<StudentAbsenceDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour de l'absence ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteStudentAbsence(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<StudentAbsenceDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression de l'absence ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async getAbsencesByStudentId(studentId: number): Promise<{ data: StudentAbsenceDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<StudentAbsenceDb>(TABLE_NAME)
      .select('*')
      .eq('student_id', studentId);
    if (error) {
      console.error(`Erreur lors de la récupération des absences pour l'étudiant ${studentId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};