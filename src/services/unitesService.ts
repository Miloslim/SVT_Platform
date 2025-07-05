// src/services/unitesService.ts
import { supabase } from "@/backend/config/supabase";
import { UniteDb, CreateUniteDb, UpdateUniteDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "unites";

export const unitesService = {
  async getAllUnites(): Promise<{ data: UniteDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<UniteDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des unités :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getUniteById(id: number): Promise<{ data: UniteDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<UniteDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération de l'unité ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createUnite(newUnite: CreateUniteDb): Promise<{ data: UniteDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<UniteDb>(TABLE_NAME).insert([newUnite]).select().single();
    if (error) {
      console.error("Erreur lors de la création de l'unité :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateUnite(id: number, updatedFields: UpdateUniteDb): Promise<{ data: UniteDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<UniteDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour de l'unité ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteUnite(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<UniteDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression de l'unité ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  /**
   * Récupère toutes les unités associées à une option spécifique.
   * @param optionId L'ID de l'option.
   */
  async getUnitesByOptionId(optionId: number): Promise<{ data: UniteDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<UniteDb>(TABLE_NAME)
      .select('*')
      .eq('option_id', optionId);
    if (error) {
      console.error(`Erreur lors de la récupération des unités pour l'option ${optionId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};