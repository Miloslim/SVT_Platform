// src/services/activitesService.ts

import { supabase } from "@/backend/config/supabase"; // Votre client Supabase
import { ActivityDb, CreateActivityDb, UpdateActivityDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "activites"; // Nom de votre table d'activités

export const activitesService = {

  /**
   * Récupère toutes les activités.
   * @returns Promise<{ data: ActivityDb[] | null; error: SupabaseError | null }>
   */
  async getAllActivities(): Promise<{ data: ActivityDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ActivityDb>(TABLE_NAME)
      .select('*'); 
    
    if (error) {
      console.error("Erreur lors de la récupération des activités :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  /**
   * Récupère une activité par son ID.
   * @param id L'ID de l'activité.
   * @returns Promise<{ data: ActivityDb | null; error: SupabaseError | null }>
   */
  async getActivityById(id: number): Promise<{ data: ActivityDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ActivityDb>(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single(); 

    if (error && error.code !== 'PGRST116') { 
      console.error(`Erreur lors de la récupération de l'activité ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  /**
   * Crée une nouvelle activité.
   * @param newActivity Les données de la nouvelle activité.
   * @returns Promise<{ data: ActivityDb | null; error: SupabaseError | null }>
   */
  async createActivity(newActivity: CreateActivityDb): Promise<{ data: ActivityDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ActivityDb>(TABLE_NAME)
      .insert([newActivity])
      .select() 
      .single();

    if (error) {
      console.error("Erreur lors de la création de l'activité :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  /**
   * Met à jour une activité existante.
   * @param id L'ID de l'activité à mettre à jour.
   * @param updatedFields Les champs à mettre à jour.
   * @returns Promise<{ data: ActivityDb | null; error: SupabaseError | null }>
   */
  async updateActivity(id: number, updatedFields: UpdateActivityDb): Promise<{ data: ActivityDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ActivityDb>(TABLE_NAME)
      .update(updatedFields)
      .eq('id', id)
      .select() 
      .single();

    if (error) {
      console.error(`Erreur lors de la mise à jour de l'activité ${id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  /**
   * Supprime une activité.
   * @param id L'ID de l'activité à supprimer.
   * @returns Promise<{ success: boolean; error: SupabaseError | null }>
   */
  async deleteActivity(id: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<ActivityDb>(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erreur lors de la suppression de l'activité ${id} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },

  /**
   * Récupère les activités d'un chapitre spécifique.
   * @param chapitreId L'ID du chapitre.
   * @returns Promise<{ data: ActivityDb[] | null; error: SupabaseError | null }>
   */
  async getActivitiesByChapitreId(chapitreId: number): Promise<{ data: ActivityDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ActivityDb>(TABLE_NAME)
      .select('*')
      .eq('chapitre_id', chapitreId);

    if (error) {
      console.error(`Erreur lors de la récupération des activités pour le chapitre ${chapitreId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  }
};