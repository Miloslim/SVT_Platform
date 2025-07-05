// src/services/classesService.ts
import { supabase } from "@/backend/config/supabase";
import { ClasseDb, CreateClasseDb, UpdateClasseDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "classes";

export const classesService = {
  async getAllClasses(): Promise<{ data: ClasseDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<ClasseDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des classes :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getClasseById(id: number): Promise<{ data: ClasseDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<ClasseDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération de la classe ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createClasse(newClasse: CreateClasseDb): Promise<{ data: ClasseDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<ClasseDb>(TABLE_NAME).insert([newClasse]).select().single();
    if (error) {
      console.error("Erreur lors de la création de la classe :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateClasse(id: number, updatedFields: UpdateClasseDb): Promise<{ data: ClasseDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<ClasseDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour de la classe ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteClasse(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<ClasseDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression de la classe ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  }
};