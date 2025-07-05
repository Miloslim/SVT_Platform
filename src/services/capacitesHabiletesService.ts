// src/services/capacitesHabiletesService.ts
import { supabase } from "@/backend/config/supabase";
import { CapaciteHabileteDb, CreateCapaciteHabileteDb, UpdateCapaciteHabileteDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "capacites_habiletes";

export const capacitesHabiletesService = {
  async getAllCapacitesHabiletes(): Promise<{ data: CapaciteHabileteDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<CapaciteHabileteDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des capacités/habiletés :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getCapaciteHabileteById(id: number): Promise<{ data: CapaciteHabileteDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<CapaciteHabileteDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération de la capacité/habileté ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createCapaciteHabilete(newCapacite: CreateCapaciteHabileteDb): Promise<{ data: CapaciteHabileteDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<CapaciteHabileteDb>(TABLE_NAME).insert([newCapacite]).select().single();
    if (error) {
      console.error("Erreur lors de la création de la capacité/habileté :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateCapaciteHabilete(id: number, updatedFields: UpdateCapaciteHabileteDb): Promise<{ data: CapaciteHabileteDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<CapaciteHabileteDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour de la capacité/habileté ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteCapaciteHabilete(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<CapaciteHabileteDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression de la capacité/habileté ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  }
};