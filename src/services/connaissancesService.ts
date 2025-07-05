// src/services/connaissancesService.ts
import { supabase } from "@/backend/config/supabase";
import { ConnaissanceDb, CreateConnaissanceDb, UpdateConnaissanceDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "connaissances";

export const connaissancesService = {
  async getAllConnaissances(): Promise<{ data: ConnaissanceDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<ConnaissanceDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des connaissances :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getConnaissanceById(id: number): Promise<{ data: ConnaissanceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<ConnaissanceDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération de la connaissance ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createConnaissance(newConnaissance: CreateConnaissanceDb): Promise<{ data: ConnaissanceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<ConnaissanceDb>(TABLE_NAME).insert([newConnaissance]).select().single();
    if (error) {
      console.error("Erreur lors de la création de la connaissance :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateConnaissance(id: number, updatedFields: UpdateConnaissanceDb): Promise<{ data: ConnaissanceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<ConnaissanceDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour de la connaissance ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteConnaissance(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<ConnaissanceDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression de la connaissance ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async getConnaissancesByChapitreId(chapitreId: number): Promise<{ data: ConnaissanceDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ConnaissanceDb>(TABLE_NAME)
      .select('*')
      .eq('chapitre_id', chapitreId);
    if (error) {
      console.error(`Erreur lors de la récupération des connaissances pour le chapitre ${chapitreId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};