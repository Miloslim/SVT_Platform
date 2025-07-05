// src/services/chapficheActiviteService.ts

import { supabase } from '@/backend/config/supabase';
import { ChapficheActiviteDb } from '@/types/dbTypes';

/**
 * Service pour les opérations CRUD sur la table 'chapfiche_activite'.
 */
class ChapficheActiviteService {
  private tableName = 'chapfiche_activite';

  /**
   * Insère une ou plusieurs liaisons d'activité planifiée.
   * @param data Un tableau de données de liaison d'activité à insérer.
   * @throws Error en cas d'échec.
   */
  async insertMany(data: Omit<ChapficheActiviteDb, 'date_ajout'>[]): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .insert(data)
      .throwOnError(); // Lève une erreur si l'insertion échoue

    if (error) {
      console.error(`Erreur lors de l'insertion massive dans ${this.tableName}:`, error.message);
      throw new Error(`Échec de l'insertion des activités planifiées: ${error.message}`);
    }
  }

  /**
   * Supprime toutes les liaisons d'activité pour une chapfiche donnée.
   * @param chapficheId L'ID de la chapfiche parente.
   * @throws Error en cas d'échec.
   */
  async deleteByChapficheId(chapficheId: number): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('chapfiche_id', chapficheId);

    if (error) {
      console.error(`Erreur lors de la suppression des activités planifiées pour chapfiche_id ${chapficheId}:`, error.message);
      throw new Error(`Échec de la suppression des activités planifiées: ${error.message}`);
    }
  }

  /**
   * Récupère toutes les liaisons d'activité pour une chapfiche donnée.
   * @param chapficheId L'ID de la chapfiche parente.
   * @returns Un tableau des liaisons d'activité.
   * @throws Error en cas d'échec.
   */
  async getByChapficheId(chapficheId: number): Promise<ChapficheActiviteDb[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('chapfiche_id', chapficheId);

    if (error) {
      console.error(`Erreur lors de la récupération des activités planifiées pour chapfiche_id ${chapficheId}:`, error.message);
      throw new Error(`Échec de la récupération des activités planifiées: ${error.message}`);
    }
    return data;
  }
}

export const chapficheActiviteService = new ChapficheActiviteService();
