// Fichier vide généré pour la structure
// src/exports/services/fetchFicheData.ts

import { supabase } from "@/backend/config/supabase";

export const fetchFicheById = async (ficheId: number) => {
  const { data, error } = await supabase
    .from("chapfiches")
    .select(`
      id,
      nom_fiche_planification,
      statut,
      date_creation,
      chapitre_id (
        titre_chapitre,
        unite:unite_id (
          titre_unite,
          option:option_id (
            nom_option,
            niveau:niveau_id (
              nom_niveau
            )
          )
        )
      )
    `)
    .eq("id", ficheId)
    .single();

  if (error) throw new Error(error.message);

  return {
    titre_fiche: data.nom_fiche_planification,
    statut: data.statut,
    date_creation: new Date(data.date_creation).toLocaleDateString("fr-FR"),
    chapitre: data.chapitre_id.titre_chapitre,
    unite: data.chapitre_id.unite.titre_unite,
    niveau_option: `${data.chapitre_id.unite.option.niveau.nom_niveau} - ${data.chapitre_id.unite.option.nom_option}`
  };
};

