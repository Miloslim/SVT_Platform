// src/services/activiteObjectifsService.ts
import { supabase } from "@/backend/config/supabase";
import { ActiviteObjectifDb, CreateActiviteObjectifDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "activite_objectifs";

export const activiteObjectifsService = {
  async getObjectifsForActivite(activiteId: number): Promise<{ data: ActiviteObjectifDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ActiviteObjectifDb>(TABLE_NAME)
      .select('*')
      .eq('activite_id', activiteId);
    if (error) {
      console.error(`Erreur lors de la récupération des objectifs pour l'activité ${activiteId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async createActiviteObjectif(link: CreateActiviteObjectifDb): Promise<{ data: ActiviteObjectifDb | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ActiviteObjectifDb>(TABLE_NAME)
      .insert([link])
      .select()
      .single();
    if (error) {
      console.error("Erreur lors de la création du lien activité-objectif :", error);
      return { data: null, error: error as SupabaseError };
    }
    return { data, error: null };
  },

  async deleteActiviteObjectif(activiteId: number, objectifId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<ActiviteObjectifDb>(TABLE_NAME)
      .delete()
      .eq('activite_id', activiteId)
      .eq('objectif_id', objectifId); // Suppression basée sur la clé composite
    if (error) {
      console.error(`Erreur lors de la suppression du lien activité ${activiteId} - objectif ${objectifId} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },
   // Fonction pour supprimer tous les objectifs liés à une activité
  async deleteAllObjectifsForActivite(activiteId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<ActiviteObjectifDb>(TABLE_NAME)
      .delete()
      .eq('activite_id', activiteId);
    if (error) {
      console.error(`Erreur lors de la suppression de tous les objectifs pour l'activité ${activiteId} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    return { success: true, error: null };
  },
};