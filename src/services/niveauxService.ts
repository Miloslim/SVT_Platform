// src/services/niveauxService.ts
import { supabase } from "@/backend/config/supabase";
import { NiveauDb, CreateNiveauDb, UpdateNiveauDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "niveaux";

export const niveauxService = {
  async getAllNiveaux(): Promise<{ data: NiveauDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<NiveauDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des niveaux :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getNiveauById(id: number): Promise<{ data: NiveauDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<NiveauDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération du niveau ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createNiveau(newNiveau: CreateNiveauDb): Promise<{ data: NiveauDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<NiveauDb>(TABLE_NAME).insert([newNiveau]).select().single();
    if (error) {
      console.error("Erreur lors de la création du niveau :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateNiveau(id: number, updatedFields: UpdateNiveauDb): Promise<{ data: NiveauDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<NiveauDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour du niveau ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteNiveau(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<NiveauDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression du niveau ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  }
};