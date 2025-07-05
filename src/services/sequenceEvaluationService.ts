// src/services/sequenceEvaluationService.ts
import { supabase } from "@/backend/config/supabase";
import { SequenceEvaluationDb, CreateSequenceEvaluationDb, UpdateSequenceEvaluationDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "sequence_evaluation";

export const sequenceEvaluationService = {
  /**
   * Récupère toutes les évaluations liées à une séquence spécifique, ordonnées par leur 'ordre'.
   * Très utile pour EditSequenceEditor au chargement des données.
   */
  async getEvaluationsForSequence(sequenceId: number): Promise<{ data: SequenceEvaluationDb[] | null; error: SupabaseError | null }> {
    console.log(`[${TABLE_NAME} Service] Tentative de récupération des évaluations pour la séquence: ${sequenceId}`);
    const { data, error } = await supabase
      .from<SequenceEvaluationDb>(TABLE_NAME)
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('ordre', { ascending: true });

    if (error) {
      console.error(`[${TABLE_NAME} Service] Erreur lors de la récupération des évaluations pour la séquence ${sequenceId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    console.log(`[${TABLE_NAME} Service] Évaluations récupérées pour la séquence ${sequenceId}.`);
    return { data, error: null };
  },

  /**
   * Crée un nouveau lien entre une séquence et une évaluation avec un ordre donné.
   */
  async createSequenceEvaluation(link: CreateSequenceEvaluationDb): Promise<{ data: SequenceEvaluationDb | null; error: SupabaseError | null }> {
    console.log(`[${TABLE_NAME} Service] Tentative de création d'un lien séquence-évaluation:`, link);
    const { data, error } = await supabase
      .from<SequenceEvaluationDb>(TABLE_NAME)
      .insert([link])
      .select()
      .single();

    if (error) {
      console.error(`[${TABLE_NAME} Service] Erreur lors de la création du lien séquence-évaluation pour seq_id ${link.sequence_id}, eval_id ${link.evaluation_id} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    console.log(`[${TABLE_NAME} Service] Lien séquence-évaluation créé avec succès:`, data);
    return { data, error: null };
  },

  /**
   * Met à jour les champs d'un lien existant entre une séquence et une évaluation (par exemple, l'ordre).
   */
  async updateSequenceEvaluation(sequenceId: number, evaluationId: number, updatedFields: UpdateSequenceEvaluationDb): Promise<{ data: SequenceEvaluationDb | null; error: SupabaseError | null }> {
    console.log(`[${TABLE_NAME} Service] Tentative de mise à jour du lien séquence ${sequenceId} - évaluation ${evaluationId} avec:`, updatedFields);
    const { data, error } = await supabase
      .from<SequenceEvaluationDb>(TABLE_NAME)
      .update(updatedFields)
      .eq('sequence_id', sequenceId)
      .eq('evaluation_id', evaluationId)
      .select()
      .single();

    if (error) {
      console.error(`[${TABLE_NAME} Service] Erreur lors de la mise à jour du lien séquence ${sequenceId} - évaluation ${evaluationId} :`, error);
      return { data: null, error: error as SupabaseError };
    }
    console.log(`[${TABLE_NAME} Service] Lien séquence ${sequenceId} - évaluation ${evaluationId} mis à jour avec succès:`, data);
    return { data, error: null };
  },

  /**
   * Supprime un lien spécifique entre une séquence et une évaluation.
   */
  async deleteSequenceEvaluation(sequenceId: number, evaluationId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    console.log(`[${TABLE_NAME} Service] Tentative de suppression du lien séquence ${sequenceId} - évaluation ${evaluationId}`);
    const { error } = await supabase
      .from<SequenceEvaluationDb>(TABLE_NAME)
      .delete()
      .eq('sequence_id', sequenceId)
      .eq('evaluation_id', evaluationId);

    if (error) {
      console.error(`[${TABLE_NAME} Service] Erreur lors de la suppression du lien séquence ${sequenceId} - évaluation ${evaluationId} :`, error);
      return { success: false, error: error as SupabaseError };
    }
    console.log(`[${TABLE_NAME} Service] Lien séquence ${sequenceId} - évaluation ${evaluationId} supprimé avec succès.`);
    return { success: true, error: null };
  },

  /**
   * Crée plusieurs liens séquence-évaluation en une seule fois (batch insert).
   * @param links Un tableau d'objets CreateSequenceEvaluationDb à insérer.
   * @returns Un objet contenant les données insérées ou une erreur.
   */
  async createMultipleSequenceEvaluation(links: CreateSequenceEvaluationDb[]): Promise<{ data: SequenceEvaluationDb[] | null; error: SupabaseError | null }> {
    if (links.length === 0) {
      console.log(`[${TABLE_NAME} Service] Aucune évaluation à insérer. Retourne un tableau vide.`);
      return { data: [], error: null };
    }
    console.log(`[${TABLE_NAME} Service] Tentative de création de ${links.length} liens séquence-évaluation (multiples):`, links);
    const { data, error } = await supabase
      .from<SequenceEvaluationDb>(TABLE_NAME)
      .insert(links)
      .select();

    if (error) {
      console.error(`[${TABLE_NAME} Service] Erreur lors de la création de multiples liens séquence-évaluation :`, error);
      return { data: null, error: error as SupabaseError };
    }
    console.log(`[${TABLE_NAME} Service] ${data?.length || 0} liens séquence-évaluation créés avec succès.`);
    return { data, error: null };
  },

  /**
   * Supprime toutes les liaisons évaluation-séquence pour une séquence donnée.
   */
  async deleteEvaluationsBySequenceId(sequenceId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    console.log(`[${TABLE_NAME} Service] Tentative de suppression de toutes les évaluations liées pour sequence_id: ${sequenceId}`);
    const { error } = await supabase
      .from<SequenceEvaluationDb>(TABLE_NAME)
      .delete()
      .eq('sequence_id', sequenceId);

    if (error) {
      console.error(`[${TABLE_NAME} Service] Échec de la suppression de toutes les évaluations pour la séquence ${sequenceId} :`, error); // Changed error.message to error object for more detail
      return { success: false, error: error as SupabaseError };
    }
    console.log(`[${TABLE_NAME} Service] Toutes les évaluations liées à la séquence ${sequenceId} supprimées avec succès.`);
    return { success: true, error: null };
  }
};