// src/services/lyceeClassesService.ts
import { supabase } from "@/backend/config/supabase";
import { LyceeClasseDb, CreateLyceeClasseDb, UpdateLyceeClasseDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "lycee_classes";

export const lyceeClassesService = {
  async getAllLyceeClasses(): Promise<{ data: LyceeClasseDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<LyceeClasseDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des classes de lycée :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getLyceeClasseById(id: number): Promise<{ data: LyceeClasseDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<LyceeClasseDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération de la classe de lycée ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createLyceeClasse(newClasse: CreateLyceeClasseDb): Promise<{ data: LyceeClasseDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<LyceeClasseDb>(TABLE_NAME).insert([newClasse]).select().single();
    if (error) {
      console.error("Erreur lors de la création de la classe de lycée :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateLyceeClasse(id: number, updatedFields: UpdateLyceeClasseDb): Promise<{ data: LyceeClasseDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<LyceeClasseDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour de la classe de lycée ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteLyceeClasse(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<LyceeClasseDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression de la classe de lycée ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async getLyceeClassesByNiveauId(niveauId: number): Promise<{ data: LyceeClasseDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<LyceeClasseDb>(TABLE_NAME)
      .select('*')
      .eq('niveau_id', niveauId);
    if (error) {
      console.error(`Erreur lors de la récupération des classes pour le niveau ${niveauId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getLyceeClassesByOptionId(optionId: number): Promise<{ data: LyceeClasseDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<LyceeClasseDb>(TABLE_NAME)
      .select('*')
      .eq('option_id', optionId);
    if (error) {
      console.error(`Erreur lors de la récupération des classes pour l'option ${optionId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};