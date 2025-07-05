// src/services/chapficheEvaluationService.ts

import { supabase } from '@/backend/config/supabase';
import { ChapficheEvaluationDb } from '@/types/dbTypes';

/**
 * Service pour les opérations CRUD sur la table 'chapfiche_evaluation'.
 */
class ChapficheEvaluationService {
  private tableName = 'chapfiche_evaluation';

  /**
   * Insère une ou plusieurs liaisons d'évaluation planifiée.
   * @param data Un tableau de données de liaison d'évaluation à insérer.
   * @throws Error en cas d'échec.
   */
  async insertMany(data: Omit<ChapficheEvaluationDb, 'date_ajout'>[]): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .insert(data)
      .throwOnError(); // Lève une erreur si l'insertion échoue

    if (error) {
      console.error(`Erreur lors de l'insertion massive dans ${this.tableName}:`, error.message);
      throw new Error(`Échec de l'insertion des évaluations planifiées: ${error.message}`);
    }
  }

  /**
   * Supprime toutes les liaisons d'évaluation pour une chapfiche donnée.
   * @param chapficheId L'ID de la chapfiche parente.
   * @throws Error en cas d'échec.
   */
  async deleteByChapficheId(chapficheId: number): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('chapfiche_id', chapficheId);

    if (error) {
      console.error(`Erreur lors de la suppression des évaluations planifiées pour chapfiche_id ${chapficheId}:`, error.message);
      throw new Error(`Échec de la suppression des évaluations planifiées: ${error.message}`);
    }
  }

  /**
   * Récupère toutes les liaisons d'évaluation pour une chapfiche donnée.
   * @param chapficheId L'ID de la chapfiche parente.
   * @returns Un tableau des liaisons d'évaluation.
   * @throws Error en cas d'échec.
   */
  async getByChapficheId(chapficheId: number): Promise<ChapficheEvaluationDb[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('chapfiche_id', chapficheId);

    if (error) {
      console.error(`Erreur lors de la récupération des évaluations planifiées pour chapfiche_id ${chapficheId}:`, error.message);
      throw new Error(`Échec de la récupération des évaluations planifiées: ${error.message}`);
    }
    return data;
  }
}

export const chapficheEvaluationService = new ChapficheEvaluationService();
