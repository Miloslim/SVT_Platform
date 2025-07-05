// 📁 src/types/dbTypes.ts

/**
 * Ce fichier contient les interfaces TypeScript qui représentent
 * la structure exacte des données de vos tables Supabase.
 * Ces types sont "DB-centric" et reflètent la forme des enregistrements
 * tels qu'ils sont stockés et récupérés directement de la base de données.
 */

import { PostgrestError } from "@supabase/supabase-js";

// Type générique pour les erreurs de Supabase
export type SupabaseError = PostgrestError;


// --- Interfaces pour la structure hiérarchique des cours (tables de base) ---

export interface NiveauDb {
  id: number;
  nom_niveau: string;
}

export interface OptionDb {
  id: number;
  nom_option: string;
  niveau_id: number; // Clé étrangère vers la table 'niveaux'
}

export interface UniteDb {
  id: number;
  titre_unite: string;
  option_id: number; // Clé étrangère vers la table 'options'
}

export interface ChapitreDb {
  id: number;
  titre_chapitre: string;
  unite_id: number; // Clé étrangère vers la table 'unites'
}

export interface ObjectifDb {
  id: number;
  chapitre_id: number; // Clé étrangère vers la table 'chapitres' (relation directe)
  objectif_type: string;
  description_objectif: string;
}

export interface ConnaissanceDb {
  id: number;
  titre_connaissance: string;
  chapitre_id?: number | null; // Assumer que la connaissance est liée à un chapitre
  description_connaissance?: string | null; // Description optionnelle
}

export interface CapaciteHabileteDb {
  id: number;
  titre_capacite_habilete: string;
}


// --- Interfaces pour les Entités Pédagogiques Maîtres ---

export interface ActiviteDb {
  id: number;
  chapitre_id: number | null;
  titre_activite: string;
  description: string | null;
  role_enseignant: string | null;
  materiel: string | null;
  duree_minutes: number | null;
  modalite_deroulement: string | null;
  modalite_evaluation: string | null;
  commentaires: string | null;
  ressource_urls: string[] | null; // JSONB de tableau de strings
  created_at?: string;
  updated_at?: string;
}

export type CreateActiviteDb = Omit<ActiviteDb, 'id' | 'created_at' | 'updated_at'>;
export type UpdateActiviteDb = Partial<Omit<ActiviteDb, 'id' | 'created_at' | 'updated_at'>>;


export interface EvaluationDb {
  id: number;
  titre_evaluation: string;
  chapitre_id: number | null; // FK vers la table chapitres
  sequence_id: number | null; // FK vers la table sequences (optionnel)
  activite_id: number | null; // FK vers la table activites (optionnel)

  type_evaluation: string | null;
  grille_correction: string | null;
  introduction_activite: string; // Contenu HTML principal
  consignes_specifiques: string | null;

  ressource_urls_json: string[] | null; // JSONB pour les URLs de ressources enseignant
  ressources_eleve_urls: string[] | null; // JSONB pour les URLs de ressources élève

  modalite_evaluation_autre_texte?: string | null;
  
  created_at?: string;
  date_mise_a_jour?: string; // Nom de colonne probable pour updated_at
}

export type CreateEvaluationDb = Omit<EvaluationDb, 'id' | 'created_at' | 'date_mise_a_jour'>;
export type UpdateEvaluationDb = Partial<Omit<EvaluationDb, 'id' | 'created_at' | 'date_mise_a_jour'>>; // Mettre à jour pour inclure date_mise_a_jour dans l'Omit


export interface SequenceDb {
  id: number;
  titre_sequence: string;
  objectifs_specifiques: string | null; // Contenu textuel/HTML
  description: string | null;
  duree_estimee: number | null;
  prerequis: string | null;
  statut: "brouillon" | "validee" | "archivee";
  chapitre_id: number; // Clé étrangère vers la table 'chapitres'
  ordre: number | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateSequenceDb = Omit<SequenceDb, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSequenceDb = Partial<Omit<SequenceDb, 'id' | 'created_at' | 'updated_at'>>;


// --- Interfaces pour la table de planification de chapitre ('chapfiches') ---
export interface ChapficheDb {
  id: number;
  chapitre_id: number;
  nom_fiche_planification: string | null; // AJOUTÉ : Le nom spécifique de la fiche de planification
  statut: 'Brouillon' | 'Publié' | 'Archivé'; // MODIFIÉ : Typage plus précis du statut
  date_creation: string | null;
  created_by: string | null;
  updated_at: string | null;
}

// Omit les champs auto-générés ou gérés par la DB à l'insertion
export type CreateChapficheDb = Omit<ChapficheDb, 'id' | 'date_creation' | 'updated_at'>;
// Tous les champs sont optionnels pour la mise à jour, sauf id. created_by ne doit pas être mis à jour.
export type UpdateChapficheDb = Partial<Omit<ChapficheDb, 'id' | 'date_creation' | 'created_by' | 'updated_at'>>;


// --- Interfaces pour les Tables de Jonction (Relations Plusieurs-à-Plusieurs) ---

export interface ActiviteObjectifDb {
    id: number;
    activite_id: number;
    objectif_id: number;
}

export interface EvaluationObjectifDb {
    id: number;
    evaluation_id: number;
    objectif_id: number;
}

export interface EvaluationCompetenceDb {
    id: number;
    evaluation_id: number;
    competence_id: number;
}

export interface EvaluationConnaissanceDb {
    id: number;
    evaluation_id: number;
    connaissance_id: number;
}

export interface EvaluationModaliteDb {
    id: number;
    evaluation_id: number;
    modalite_id: number;
}

export interface EvaluationCapaciteHabileteDb {
    id: number;
    evaluation_id: number;
    capacite_habilete_id: number;
}


// --- Tables de liaison de progression (avec détails des entités maîtresses pour hydratation) ---

export interface ChapficheSequenceDb {
  chapfiche_id: number;
  sequence_id: number;
  ordre: number;
  date_ajout: string | null;
  // AJOUTÉ : Propriété pour les détails de la séquence maîtresse lors d'une jointure
  sequence_details?: SequenceDb | null;
}
export type CreateChapficheSequenceDb = Omit<ChapficheSequenceDb, 'date_ajout' | 'sequence_details'>;


export interface ChapficheActiviteDb {
  chapfiche_id: number;
  activite_id: number;
  ordre: number;
  date_ajout: string | null;
  // AJOUTÉ : Propriété pour les détails de l'activité maîtresse lors d'une jointure
  activity_details?: ActiviteDb | null;
}
export type CreateChapficheActiviteDb = Omit<ChapficheActiviteDb, 'date_ajout' | 'activity_details'>;


export interface ChapficheEvaluationDb {
  chapfiche_id: number;
  evaluation_id: number;
  ordre: number;
  date_ajout: string | null;
  // AJOUTÉ : Propriété pour les détails de l'évaluation maîtresse lors d'une jointure
  evaluation_details?: EvaluationDb | null;
}
export type CreateChapficheEvaluationDb = Omit<ChapficheEvaluationDb, 'date_ajout' | 'evaluation_details'>;


// --- Interfaces pour les Requêtes avec Jointures (Données "hydratées") ---

// Représente les données d'un chapitre avec ses relations directes pour le chargement
export interface ChapitreWithDirectObjectifsDb {
  id: number;
  titre_chapitre: string; // Ce champ vient de la table 'chapitres'
  objectifs: { id: number; description_objectif: string }[]; // Ces objectifs viennent de la table 'objectifs' via la jointure avec 'chapitres'
  unite_id: number; // L'ID de l'unité est une propriété directe du chapitre

  // Jointure complète de la hiérarchie pour obtenir Niveau, Option, Unité
  unite: {
    id: number;
    titre_unite: string;
    option: {
      id: number;
      nom_option: string;
      niveau: {
        id: number;
        nom_niveau: string;
      };
    };
  };
}

// Étend ActiviteDb avec les relations jointes nécessaires pour l'affichage détaillé
export interface ActiviteWithRelationsDb extends ActiviteDb {
  chapitre: { // Jointure depuis chapitre_id
    id: number;
    titre_chapitre: string;
    unite: {
      id: number;
      titre_unite: string;
      option: {
        id: number;
        nom_option: string;
        niveau: {
          id: number;
          nom_niveau: string;
        };
      };
    };
  } | null; // Peut être null si chapitre_id est null

  activite_objectifs: { // Relation plusieurs-à-plusieurs via 'activite_objectifs'
    objectifs: {
      id: number; // <-- AJOUTÉ: ID de l'objectif est nécessaire si vous le filtrez plus tard
      description_objectif: string;
    } | null;
  }[];
}

// Pour les évaluations, si vous voulez hydrater les données avec des jointures comme pour ActiviteWithRelationsDb
export interface EvaluationWithRelationsDb extends EvaluationDb {
  chapitre: {
    id: number;
    titre_chapitre: string;
    unite: {
      id: number;
      titre_unite: string;
      option: {
        id: number;
        nom_option: string;
        niveau: {
          id: number;
          nom_niveau: string;
        };
      };
    };
  } | null; // Peut être null

  // Relations Many-to-Many via tables de jonction
  evaluation_objectifs: {
    objectifs: {
      id: number;
      description_objectif: string;
    } | null;
  }[];

  evaluation_competences: {
    competences: {
      id: number;
      titre_competence: string; // Supposons un titre pour la compétence
    } | null;
  }[];

  evaluation_connaissances: {
    connaissances: {
      id: number;
      titre_connaissance: string; // Supposons un titre pour la connaissance
    } | null;
  }[];

  evaluation_modalites: {
    modalites_evaluation: { // Supposons une table 'modalites_evaluation'
      id: number;
      nom_modalite: string;
    } | null;
  }[];

  evaluation_capacites_habiletes: {
    capacites_habiletes: { // Supposons une table 'capacites_habiletes'
      id: number;
      titre_capacite_habilete: string;
    } | null;
  }[];

  // Blocs de contenu directement liés à l'évaluation
  contenu_blocs: EvaluationContentBlockDb[];
}

// Pour les séquences, si vous voulez hydrater les données avec des jointures
export interface SequenceWithRelationsDb extends SequenceDb {
  chapitre: {
    id: number;
    titre_chapitre: string;
    unite: {
      id: number;
      titre_unite: string;
      option: {
        id: number;
        nom_option: string;
        niveau: {
          id: number;
          nom_niveau: string;
        };
      };
    };
  } | null; // Peut être null
  // Vous pourriez aussi ajouter les activités et évaluations liées à cette séquence si nécessaire
  // activites_liees: { activites: ActiviteDb }[];
  // evaluations_liees: { evaluations: EvaluationDb }[];
}

// --- AJOUTÉ: Interface pour les Compétences (si non déjà définie et utilisée) ---
export interface CompetenceDb {
  id: number;
  titre_competence: string;
  // ... autres champs
}

// --- AJOUTÉ: Interface pour les Modalités d'Évaluation (si non déjà définie et utilisée) ---
export interface ModaliteEvaluationDb {
  id: number;
  nom_modalite: string;
  // ... autres champs
}
