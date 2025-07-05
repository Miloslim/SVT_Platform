// src/services/fichesService.ts
import { supabase } from "@/backend/config/supabase";
import { FicheDb, CreateFicheDb, UpdateFicheDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "fiches";

export const fichesService = {
  async getAllFiches(): Promise<{ data: FicheDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<FicheDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des fiches :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getFicheById(id: number): Promise<{ data: FicheDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<FicheDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération de la fiche ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createFiche(newFiche: CreateFicheDb): Promise<{ data: FicheDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<FicheDb>(TABLE_NAME).insert([newFiche]).select().single();
    if (error) {
      console.error("Erreur lors de la création de la fiche :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateFiche(id: number, updatedFields: UpdateFicheDb): Promise<{ data: FicheDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<FicheDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour de la fiche ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteFiche(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<FicheDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression de la fiche ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async getFichesByChapitreId(chapitreId: number): Promise<{ data: FicheDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<FicheDb>(TABLE_NAME)
      .select('*')
      .eq('chapitre_id', chapitreId);
    if (error) {
      console.error(`Erreur lors de la récupération des fiches pour le chapitre ${chapitreId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};