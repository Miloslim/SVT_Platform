// src/services/objectifsService.ts

import { supabase } from "@/backend/config/supabase"; // Votre client Supabase
import { ObjectifDb, CreateObjectifDb, UpdateObjectifDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "objectifs";

export const objectifsService = {
  /**
   * Récupère tous les objectifs.
   * @returns Promise<{ data: ObjectifDb[] | null; error: SupabaseError | null }>
   */
  async getAllObjectifs(): Promise<{ data: ObjectifDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ObjectifDb>(TABLE_NAME)
      .select('*');

    if (error) {
      console.error("Erreur lors de la récupération des objectifs :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  /**
   * Récupère un objectif par son ID.
   * @param id L'ID de l'objectif.
   * @returns Promise<{ data: ObjectifDb | null; error: SupabaseError | null }>
   */
  async getObjectifById(id: number): Promise<{ data: ObjectifDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ObjectifDb>(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 est "Row not found"
      console.error(`Erreur lors de la récupération de l'objectif ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  /**
   * Crée un nouvel objectif.
   * @param newObjectif Les données du nouvel objectif.
   * @returns Promise<{ data: ObjectifDb | null; error: SupabaseError | null }>
   */
  async createObjectif(newObjectif: CreateObjectifDb): Promise<{ data: ObjectifDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ObjectifDb>(TABLE_NAME)
      .insert([newObjectif])
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la création de l'objectif :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  /**
   * Met à jour un objectif existant.
   * @param id L'ID de l'objectif à mettre à jour.
   * @param updatedFields Les champs à mettre à jour.
   * @returns Promise<{ data: ObjectifDb | null; error: SupabaseError | null }>
   */
  async updateObjectif(id: number, updatedFields: UpdateObjectifDb): Promise<{ data: ObjectifDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ObjectifDb>(TABLE_NAME)
      .update(updatedFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Erreur lors de la mise à jour de l'objectif ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
    },

  /**
   * Supprime un objectif.
   * @param id L'ID de l'objectif à supprimer.
   * @returns Promise<{ success: boolean; error: SupabaseError | null }>
   */
  async deleteObjectif(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<ObjectifDb>(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erreur lors de la suppression de l'objectif ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  /**
   * Récupère les objectifs d'un chapitre spécifique.
   * @param chapitreId L'ID du chapitre.
   * @returns Promise<{ data: ObjectifDb[] | null; error: SupabaseError | null }>
   */
  async getObjectifsByChapitreId(chapitreId: number): Promise<{ data: ObjectifDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ObjectifDb>(TABLE_NAME)
      .select('*')
      .eq('chapitre_id', chapitreId);

    if (error) {
      console.error(`Erreur lors de la récupération des objectifs pour le chapitre ${chapitreId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};