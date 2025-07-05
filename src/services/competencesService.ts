// src/services/competencesService.ts
import { supabase } from "@/backend/config/supabase";
import { CompetenceDb, CreateCompetenceDb, UpdateCompetenceDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "competences";

export const competencesService = {
  async getAllCompetences(): Promise<{ data: CompetenceDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<CompetenceDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des compétences :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getCompetenceById(id: number): Promise<{ data: CompetenceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<CompetenceDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération de la compétence ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createCompetence(newCompetence: CreateCompetenceDb): Promise<{ data: CompetenceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<CompetenceDb>(TABLE_NAME).insert([newCompetence]).select().single();
    if (error) {
      console.error("Erreur lors de la création de la compétence :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async updateCompetence(id: number, updatedFields: UpdateCompetenceDb): Promise<{ data: CompetenceDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<CompetenceDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour de la compétence ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteCompetence(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<CompetenceDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression de la compétence ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  async getCompetencesByUniteId(uniteId: number): Promise<{ data: CompetenceDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<CompetenceDb>(TABLE_NAME)
      .select('*')
      .eq('unite_id', uniteId);
    if (error) {
      console.error(`Erreur lors de la récupération des compétences pour l'unité ${uniteId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};