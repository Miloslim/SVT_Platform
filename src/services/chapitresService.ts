// src/services/chapitresService.ts

import { supabase } from "@/backend/config/supabase"; // Votre client Supabase
import { ChapitreDb, CreateChapitreDb, UpdateChapitreDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "chapitres";

export const chapitresService = {
  /**
   * Récupère tous les chapitres.
   * @returns Promise<{ data: ChapitreDb[] | null; error: SupabaseError | null }>
   */
  async getAllChapitres(): Promise<{ data: ChapitreDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ChapitreDb>(TABLE_NAME)
      .select('*');

    if (error) {
      console.error("Erreur lors de la récupération des chapitres :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  /**
   * Récupère un chapitre par son ID.
   * @param id L'ID du chapitre.
   * @returns Promise<{ data: ChapitreDb | null; error: SupabaseError | null }>
   */
  async getChapitreById(id: number): Promise<{ data: ChapitreDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ChapitreDb>(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 est "Row not found"
      console.error(`Erreur lors de la récupération du chapitre ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  /**
   * Crée un nouveau chapitre.
   * @param newChapitre Les données du nouveau chapitre.
   * @returns Promise<{ data: ChapitreDb | null; error: SupabaseError | null }>
   */
  async createChapitre(newChapitre: CreateChapitreDb): Promise<{ data: ChapitreDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ChapitreDb>(TABLE_NAME)
      .insert([newChapitre])
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la création du chapitre :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  /**
   * Met à jour un chapitre existant.
   * @param id L'ID du chapitre à mettre à jour.
   * @param updatedFields Les champs à mettre à jour.
   * @returns Promise<{ data: ChapitreDb | null; error: SupabaseError | null }>
   */
  async updateChapitre(id: number, updatedFields: UpdateChapitreDb): Promise<{ data: ChapitreDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ChapitreDb>(TABLE_NAME)
      .update(updatedFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erreur lors de la mise à jour du chapitre ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  /**
   * Supprime un chapitre.
   * @param id L'ID du chapitre à supprimer.
   * @returns Promise<{ success: boolean; error: SupabaseError | null }>
   */
  async deleteChapitre(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<ChapitreDb>(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erreur lors de la suppression du chapitre ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  /**
   * Récupère les chapitres d'une unité spécifique.
   * @param uniteId L'ID de l'unité.
   * @returns Promise<{ data: ChapitreDb[] | null; error: SupabaseError | null }>
   */
  async getChapitresByUniteId(uniteId: number): Promise<{ data: ChapitreDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ChapitreDb>(TABLE_NAME)
      .select('*')
      .eq('unite_id', uniteId);

    if (error) {
      console.error(`Erreur lors de la récupération des chapitres pour l'unité ${uniteId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};