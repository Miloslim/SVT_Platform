// 📁 src/services/chapficheSequenceService.ts
import { supabase } from "@/backend/config/supabase";
import { ChapficheSequenceDb, CreateChapficheSequenceDb, UpdateChapficheSequenceDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME = "chapfiche_sequence";

export const chapficheSequenceService = {
  async getByChapficheId(chapficheId: number): Promise<{ data: ChapficheSequenceDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ChapficheSequenceDb>(TABLE_NAME)
      .select('*')
      .eq('chapfiche_id', chapficheId)
      .order('ordre', { ascending: true });
    return { data, error: error as SupabaseError };
  },

  async insertMany(links: CreateChapficheSequenceDb[]): Promise<{ data: ChapficheSequenceDb[] | null; error: SupabaseError | null }> {
    if (links.length === 0) return { data: [], error: null };
    const { data, error } = await supabase
      .from<ChapficheSequenceDb>(TABLE_NAME)
      .insert(links)
      .select('*'); // Select * pour récupérer les données insérées (et potentiel 'id' si la DB l'ajoutait)
    return { data, error: error as SupabaseError };
  },

  async deleteByChapficheId(chapficheId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<ChapficheSequenceDb>(TABLE_NAME)
      .delete()
      .eq('chapfiche_id', chapficheId);
    return { success: !error, error: error as SupabaseError };
  }
  // Pas de update ou delete single car pas d'ID PK simple dans votre schéma
};


// 📁 src/services/chapficheActiviteService.ts
import { supabase } from "@/backend/config/supabase";
import { ChapficheActiviteDb, CreateChapficheActiviteDb, UpdateChapficheActiviteDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME_ACT = "chapfiche_activite";

export const chapficheActiviteService = {
  async getByChapficheId(chapficheId: number): Promise<{ data: ChapficheActiviteDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ChapficheActiviteDb>(TABLE_NAME_ACT)
      .select('*')
      .eq('chapfiche_id', chapficheId)
      .order('ordre', { ascending: true });
    return { data, error: error as SupabaseError };
  },

  async insertMany(links: CreateChapficheActiviteDb[]): Promise<{ data: ChapficheActiviteDb[] | null; error: SupabaseError | null }> {
    if (links.length === 0) return { data: [], error: null };
    const { data, error } = await supabase
      .from<ChapficheActiviteDb>(TABLE_NAME_ACT)
      .insert(links)
      .select('*');
    return { data, error: error as SupabaseError };
  },

  async deleteByChapficheId(chapficheId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<ChapficheActiviteDb>(TABLE_NAME_ACT)
      .delete()
      .eq('chapfiche_id', chapficheId);
    return { success: !error, error: error as SupabaseError };
  }
};


// 📁 src/services/chapficheEvaluationService.ts
import { supabase } from "@/backend/config/supabase";
import { ChapficheEvaluationDb, CreateChapficheEvaluationDb, UpdateChapficheEvaluationDb, SupabaseError } from "@/types/dbTypes";

const TABLE_NAME_EVAL = "chapfiche_evaluation";

export const chapficheEvaluationService = {
  async getByChapficheId(chapficheId: number): Promise<{ data: ChapficheEvaluationDb[] | null; error: SupabaseError | null }> {
    const { data, error } = await supabase
      .from<ChapficheEvaluationDb>(TABLE_NAME_EVAL)
      .select('*')
      .eq('chapfiche_id', chapficheId)
      .order('ordre', { ascending: true });
    return { data, error: error as SupabaseError };
  },

  async insertMany(links: CreateChapficheEvaluationDb[]): Promise<{ data: ChapficheEvaluationDb[] | null; error: SupabaseError | null }> {
    if (links.length === 0) return { data: [], error: null };
    const { data, error } = await supabase
      .from<ChapficheEvaluationDb>(TABLE_NAME_EVAL)
      .insert(links)
      .select('*');
    return { data, error: error as SupabaseError };
  },

  async deleteByChapficheId(chapficheId: number): Promise<{ success: boolean; error: SupabaseError | null }> {
    const { error } = await supabase
      .from<ChapficheEvaluationDb>(TABLE_NAME_EVAL)
      .delete()
      .eq('chapfiche_id', chapficheId);
    return { success: !error, error: error as SupabaseError };
  }
};

// 📁 src/services/chapfichesService.ts (Si vous avez un service dédié pour la table chapfiches, sinon il faudra intégrer directement dans planificationService)
// Si ce service existe, il doit gérer les opérations de base sur la table chapfiches.
// Exemple très simple, ajustez selon votre implémentation réelle.
// Dans le planificationService ci-dessus, j'ai déjà utilisé le client Supabase directement pour chapfiches.
// Si vous avez un chapfichesService avec des méthodes comme insert/update/getById, il faudrait l'utiliser à la place du supabase.from.
/*
import { supabase } from "@/backend/config/supabase";
import { ChapficheDb, CreateChapficheDb, UpdateChapficheDb, SupabaseError } from "@/types/dbTypes";

const CHAPFICHE_MASTER_TABLE = "chapfiches";

export const chapfichesService = {
  async insert(data: CreateChapficheDb): Promise<number> {
    const { data: chapfiche, error } = await supabase
      .from<ChapficheDb>(CHAPFICHE_MASTER_TABLE)
      .insert([data])
      .select('id')
      .single();
    if (error) throw error;
    return chapfiche!.id;
  },
  async update(id: number, data: UpdateChapficheDb): Promise<void> {
    const { error } = await supabase
      .from<ChapficheDb>(CHAPFICHE_MASTER_TABLE)
      .update(data)
      .eq('id', id);
    if (error) throw error;
  },
  async getById(id: number): Promise<ChapficheDb | null> {
      const { data, error } = await supabase
          .from<ChapficheDb>(CHAPFICHE_MASTER_TABLE)
          .select(`
              *,
              chapitre:chapitre_id(
                  id,
                  titre_chapitre,
                  objectifs(id, description_objectif),
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
                  )
              )
          `)
          .eq('id', id)
          .single();
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means not found
      return data || null;
  },
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from<ChapficheDb>(CHAPFICHE_MASTER_TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
*/
