// src/services/chapfichesService.ts

import { supabase } from '@/backend/config/supabase';
import { ChapficheDb } from '@/types/dbTypes'; 

/**
 * Service pour les opérations CRUD sur la table 'chapfiches'.
 */
class ChapfichesService {
  private tableName = 'chapfiches';

  /**
   * Insère une nouvelle fiche de planification.
   * @param data Les données de la fiche à insérer.
   * @returns L'ID de la fiche insérée.
   * @throws Error en cas d'échec.
   */
  async insert(data: Omit<ChapficheDb, 'id' | 'date_creation' | 'updated_at'>): Promise<number> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(data)
      .select('id')
      .single();

    if (error) {
      console.error(`Erreur lors de l'insertion dans ${this.tableName}:`, error.message);
      throw new Error(`Échec de l'insertion de la chapfiche: ${error.message}`);
    }
    return result.id;
  }

  /**
   * Met à jour une fiche de planification existante.
   * @param id L'ID de la fiche à mettre à jour.
   * @param data Les données à mettre à jour.
   * @throws Error en cas d'échec.
   */
  async update(id: number, data: Partial<Omit<ChapficheDb, 'id' | 'date_creation' | 'updated_at'>>): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id);

    if (error) {
      console.error(`Erreur lors de la mise à jour dans ${this.tableName} (ID: ${id}):`, error.message);
      throw new Error(`Échec de la mise à jour de la chapfiche: ${error.message}`);
    }
  }

  /**
   * Récupère une fiche de planification par son ID, avec les données du chapitre de référence.
   * @param id L'ID de la fiche à récupérer.
   * @returns Les données de la fiche, ou null si non trouvée.
   * @throws Error en cas d'échec (sauf si non trouvé).
   */
  async getById(id: number): Promise<any | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        chapitre:chapitre_id(
          id,
          titre_chapitre,
          unite:unite_id(
            id,
            titre_unite,
            option:option_id(
              id,
              nom_option,
              niveau:niveau_id(
                id,
                nom_niveau
              )
            )
          ),
          objectifs(
            id,
            description_objectif
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return null;
      }
      console.error(`Erreur lors de la récupération de la chapfiche (ID: ${id}):`, error.message);
      throw new Error(`Échec de la récupération de la chapfiche: ${error.message}`);
    }
    return data;
  }

  /**
   * Supprime une fiche de planification par son ID.
   * @param id L'ID de la fiche à supprimer.
   * @throws Error en cas d'échec.
   */
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Erreur lors de la suppression dans ${this.tableName} (ID: ${id}):`, error.message);
      throw new Error(`Échec de la suppression de la chapfiche: ${error.message}`);
    }
  }
}

export const chapfichesService = new ChapfichesService();
