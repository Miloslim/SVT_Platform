// =============================================================
// 📄 Fichier : testsService.ts
// 📁 Chemin : src/diagno/services/testsService.ts
// 📌 Service pour gérer les tests diagnostiques et récupération
//     des objectifs liés aux classes, unités, options, chapitres.
// =============================================================

import { supabase } from '@/backend/config/supabase';

export const testsService = {
  // Récupère les objectifs filtrés par niveau et option
  async getObjectifsByClass(niveauId: number, optionId: number) {
    const { data, error } = await supabase
      .from('objectifs')
      .select(`
        id,
        chapitre_id,
        objectif_type,
        description_objectif,
        chapitres (
          id,
          titre_chapitre,
          unite_id,
          unites (
            id,
            titre_unite,
            option_id,
            options (
              id,
              nom_option,
              niveau_id,
              niveaux (
                id,
                nom_niveau
              )
            )
          )
        )
      `)
      .match({ 'chapitres.unites.options.niveau_id': niveauId, 'chapitres.unites.option_id': optionId });

    if (error) throw error;

    return data || [];
  },

  // Autres fonctions du service ici (saveTest, getEvaluations, etc.)
};
