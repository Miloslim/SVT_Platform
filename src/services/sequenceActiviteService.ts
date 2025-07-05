// 📁 src/services/sequenceActiviteService.ts

import { supabase } from "@/backend/config/supabase";
import {
  SequenceActiviteDb,
  CreateSequenceActiviteDb,
  UpdateSequenceActiviteDb,
  SupabaseError,
} from "@/types/dbTypes";

const TABLE_NAME = "sequence_activite"; // Assurez-vous que c'est le nom exact de votre table

export const sequenceActiviteService = {
  /**
   * Récupère toutes les activités liées à une séquence spécifique, ordonnées par leur 'ordre'.
   */
  async getActivitesForSequence(sequenceId: number): Promise<{
    data: SequenceActiviteDb[] | null;
    error: SupabaseError | null;
  }> {
    console.log(`[${TABLE_NAME} Service] Tentative de récupération des activités pour la séquence: ${sequenceId}`);
    const { data, error } = await supabase
      .from<SequenceActiviteDb>(TABLE_NAME)
      .select("*")
      .eq("sequence_id", sequenceId)
      .order("ordre", { ascending: true });

    if (error) {
      console.error(`[${TABLE_NAME} Service] Erreur lors de la récupération :`, error);
      return { data: null, error: error as SupabaseError };
    }

    console.log(`[${TABLE_NAME} Service] Activités récupérées pour la séquence ${sequenceId}.`);
    return { data, error: null };
  },

  /**
   * Crée un lien séquence-activité unique.
   */
  async createSequenceActivite(link: CreateSequenceActiviteDb): Promise<{
    data: SequenceActiviteDb | null;
    error: SupabaseError | null;
  }> {
    console.log(`[${TABLE_NAME} Service] Création d'un lien unique :`, link);

    const { data, error } = await supabase
      .from<SequenceActiviteDb>(TABLE_NAME)
      .insert([link])
      .select()
      .single();

    if (error) {
      console.error(`[${TABLE_NAME} Service] Erreur de création :`, error);
      return { data: null, error: error as SupabaseError };
    }

    console.log(`[${TABLE_NAME} Service] Lien créé avec succès :`, data);
    return { data, error: null };
  },

  /**
   * Crée plusieurs liens en une seule requête.
   */
  async createMultipleSequenceActivite(links: CreateSequenceActiviteDb[]): Promise<{
    data: SequenceActiviteDb[] | null;
    error: SupabaseError | null;
  }> {
    if (links.length === 0) {
      console.log(`[${TABLE_NAME} Service] Aucune activité à insérer.`);
      return { data: [], error: null };
    }

    console.log(`[${TABLE_NAME} Service] Insertion de ${links.length} liens :`, links);

    const { data, error } = await supabase
      .from<SequenceActiviteDb>(TABLE_NAME)
      .insert(links)
      .select();

    if (error) {
      console.error(`[${TABLE_NAME} Service] Erreur d'insertion multiple :`, error);
      return { data: null, error: error as SupabaseError };
    }

    console.log(`[${TABLE_NAME} Service] Liens créés avec succès (${data?.length || 0}).`);
    return { data, error: null };
  },

  /**
   * Met à jour un lien existant.
   */
  async updateSequenceActivite(
    sequenceId: number,
    activiteId: number,
    updatedFields: UpdateSequenceActiviteDb
  ): Promise<{ data: SequenceActiviteDb | null; error: SupabaseError | null }> {
    console.log(`[${TABLE_NAME} Service] Mise à jour du lien séquence ${sequenceId} - activité ${activiteId} :`, updatedFields);

    const { data, error } = await supabase
      .from<SequenceActiviteDb>(TABLE_NAME)
      .update(updatedFields)
      .eq("sequence_id", sequenceId)
      .eq("activite_id", activiteId)
      .select()
      .single();

    if (error) {
      console.error(`[${TABLE_NAME} Service] Erreur de mise à jour :`, error);
      return { data: null, error: error as SupabaseError };
    }

    console.log(`[${TABLE_NAME} Service] Lien mis à jour :`, data);
    return { data, error: null };
  },

  /**
   * Supprime un lien spécifique.
   */
  async deleteSequenceActivite(
    sequenceId: number,
    activiteId: number
  ): Promise<{ success: boolean; error: SupabaseError | null }> {
    console.log(`[${TABLE_NAME} Service] Suppression du lien séquence ${sequenceId} - activité ${activiteId}`);

    const { error } = await supabase
      .from<SequenceActiviteDb>(TABLE_NAME)
      .delete()
      .eq("sequence_id", sequenceId)
      .eq("activite_id", activiteId);

    if (error) {
      console.error(`[${TABLE_NAME} Service] Erreur de suppression :`, error);
      return { success: false, error: error as SupabaseError };
    }

    console.log(`[${TABLE_NAME} Service] Lien supprimé.`);
    return { success: true, error: null };
  },

  /**
   * Supprime toutes les activités d'une séquence.
   */
  async deleteAllActivitesForSequence(
    sequenceId: number
  ): Promise<{ success: boolean; error: SupabaseError | null }> {
    console.log(`[${TABLE_NAME} Service] Suppression de toutes les activités pour la séquence ${sequenceId}`);

    const { error } = await supabase
      .from<SequenceActiviteDb>(TABLE_NAME)
      .delete()
      .eq("sequence_id", sequenceId);

    if (error) {
      console.error(`[${TABLE_NAME} Service] Erreur lors de la suppression totale :`, error);
      return { success: false, error: error as SupabaseError };
    }

    console.log(`[${TABLE_NAME} Service] Toutes les activités supprimées.`);
    return { success: true, error: null };
  },

  /**
   * Alias pour deleteAllActivitesForSequence.
   */
  async deleteActivitiesBySequenceId(
    sequenceId: number
  ): Promise<{ success: boolean; error: SupabaseError | null }> {
    console.warn(`Utilisation de l'alias deleteActivitiesBySequenceId`);
    return this.deleteAllActivitesForSequence(sequenceId);
  }
};
