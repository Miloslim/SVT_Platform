// src/services/optionsService.ts
import { supabase } from "@/backend/config/supabase";
import { OptionDb, CreateOptionDb, UpdateOptionDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "options"; // Assurez-vous que c'est le nom exact de votre table 'options'

export const optionsService = {
  async getAllOptions(): Promise<{ data: OptionDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<OptionDb>(TABLE_NAME).select('*');
    if (error) {
      console.error("Erreur lors de la récupération des options :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async getOptionById(id: number): Promise<{ data: OptionDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<OptionDb>(TABLE_NAME).select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      console.error(`Erreur lors de la récupération de l'option ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createOption(newOption: CreateOptionDb): Promise<{ data: OptionDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<OptionDb>(TABLE_NAME).insert([newOption]).select().single();
    if (error) {
      console.error("Erreur lors de la création de l'option :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data: null, error: error as SupabaseError };
  },

  async updateOption(id: number, updatedFields: UpdateOptionDb): Promise<{ data: OptionDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase.from<OptionDb>(TABLE_NAME).update(updatedFields).eq('id', id).select().single();
    if (error) {
      console.error(`Erreur lors de la mise à jour de l'option ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteOption(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase.from<OptionDb>(TABLE_NAME).delete().eq('id', id);
    if (error) {
      console.error(`Erreur lors de la suppression de l'option ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  // Vous pouvez ajouter d'autres fonctions spécifiques aux options si nécessaire
  async getOptionsByNiveauId(niveauId: number): Promise<{ data: OptionDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<OptionDb>(TABLE_NAME)
      .select('*')
      .eq('niveau_id', niveauId); // Assurez-vous que 'niveau_id' est le nom de la colonne de clé étrangère
    if (error) {
      console.error(`Erreur lors de la récupération des options pour le niveau ${niveauId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};