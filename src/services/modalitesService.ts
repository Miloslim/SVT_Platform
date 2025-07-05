// src/services/modalitesService.ts
import { supabase } from "@/backend/config/supabase";
import { ModaliteDb, CreateModaliteDb, UpdateModaliteDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "modalites";

export const modalitesService = {
  async getAllModalites(): Promise<{ data: ModaliteDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<ModaliteDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des modalités :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getModaliteById(id: number): Promise<{ data: ModaliteDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<ModaliteDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération de la modalité ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createModalite(newModalite: CreateModaliteDb): Promise<{ data: ModaliteDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<ModaliteDb>(TABLE_NAME).insert([newModalite]).select().single();
    if (error) {
      console.error("Erreur lors de la création de la modalité :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateModalite(id: number, updatedFields: UpdateModaliteDb): Promise<{ data: ModaliteDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<ModaliteDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour de la modalité ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteModalite(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<ModaliteDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression de la modalité ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
    }
};