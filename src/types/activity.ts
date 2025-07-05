// 📁 src/types/activity.ts
//=======================================
// Les formulaires des activités et leurs vues
//=======================================
export interface ActivityData {
  id?: number; // Optionnel, car non présent lors de la création
  created_at?: string; // Optionnel
  updated_at?: string; // Optionnel

  // Champs de la table 'activites'
  chapitre_id: number | null;
  titre_activite: string;
  description: string | null; // Peut être vide, donc null en DB
  role_enseignant: string | null;
  materiel: string | null;
  duree_minutes: number | null;
  modalite_deroulement: string | null;
  modalite_evaluation: string | null;
  commentaires: string | null;
  ressource_urls: string[] | null; // Stocké en tant que JSONB dans Supabase, peut être null

  // Champs pour la relation hiérarchique (non stockés directement dans 'activites', mais utiles pour le formulaire)
  niveau_id: number | null;
  option_id: number | null;
  unite_id: number | null;

  // Relation Many-to-Many via 'activite_objectifs' (stocke les IDs pour le formulaire)
  objectifs: number[];
}
//=======================================
// La page principale des activités
//=======================================
export interface Activite {
    id: number;
    titre_activite: string | null;
    niveauOption: string;
    unite: string | null;
    chapitre: string | null;
    objectifs: string[]; // <-- tableau de string
}