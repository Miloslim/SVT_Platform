// 📁 src/types/planificationTypes.ts

/**
 * Ce fichier contient les définitions des interfaces TypeScript utilisées
 * pour la gestion des fiches de planification de chapitre et de leurs éléments de progression.
 * Ces types représentent la structure des données côté client et facilitent
 * la communication avec le service de persistance (Supabase).
 */

// --- Types pour les entités de référence (récupérées via jointures ou sélecteurs) ---

// Représente une entité Niveau
export interface Niveau {
  id: number;
  nom_niveau: string;
}

// Représente une entité Option
export interface Option {
  id: number;
  nom_option: string;
  niveau_id: number;
}

// Représente une entité Unité
export interface Unite {
  id: number;
  titre_unite: string;
  option_id: number;
}

// Représente une entité Chapitre de référence
export interface Chapitre {
  id: number;
  titre_chapitre: string;
  unite_id: number;
}

// Représente un Objectif général lié à un Chapitre
export interface Objectif {
  id: number;
  description_objectif: string;
}

// Représente une Activité maîtresse (stockée dans la table 'activites')
export interface MasterActivity {
  id: number;
  titre_activite: string;
  description?: string | null;
  // Ajoutez d'autres champs pertinents de la table 'activites'
}

// Représente une Séquence maîtresse (stockée dans la table 'sequences')
export interface MasterSequence {
  id: number;
  titre_sequence: string;
  description?: string | null;
  // Ajoutez d'autres champs pertinents de la table 'sequences'
}

// Représente une Évaluation maîtresse (stockée dans la table 'evaluations')
export interface MasterEvaluation {
  id: number;
  titre_evaluation: string;
  type_evaluation: string; // Ex: "Diagnostique", "Formative", "Sommative"
  introduction_activite?: string | null;
  consignes_specifiques?: string | null;
  // Ajoutez d'autres champs pertinents de la table 'evaluations'
}


// --- Types pour les Éléments de Progression Détaillés (Utilisés dans les sélecteurs) ---
// Ces types sont utilisés lorsque des données plus complètes sont nécessaires pour afficher
// ou sélectionner une activité/séquence/évaluation existante.

export interface ActivityDisplayData extends MasterActivity {
  // AJOUTÉ: Description pour cohérence
  description?: string | null;
  // Peut inclure des champs supplémentaires pour l'affichage dans les sélecteurs si nécessaire
  type_activite?: string | null;
  objectifs: string[];
  connaissances: string[];
  competences: string[];
  nom_niveau: string | null;
  nom_option: string | null;
  titre_unite: string | null;
  titre_chapitre: string | null;
}

export interface SequenceDisplayData extends MasterSequence {
  // AJOUTÉ: Description pour cohérence
  description?: string | null;
  // Peut inclure des champs supplémentaires
}

export interface EvaluationDisplayData {
  id: number;
  titre: string; // 'titre_evaluation' from DB, now generic 'titre' here
  type_evaluation?: string | null;
  objectifs: string[]; // Descriptions des objectifs
  connaissances: string[]; // Titres des connaissances
  capacitesEvaluees: string[]; // Titres des capacités évaluées
  nom_niveau: string | null;
  nom_option: string | null;
  titre_unite: string | null;
  titre_chapitre: string | null;
  description?: string | null; // AJOUTÉ: Description pour cohérence
}

// --- NOUVEAU: Interfaces pour la gestion complète des données d'évaluation ---

// Interface for a content block within an evaluation
export interface ContentBlockData {
  id?: number; // Optional ID for existing blocks in the database
  order: number; // The display order of the block
  type: 'text' | 'image' | 'questions' | string; // The type of block (e.g., 'text', 'image', 'questions')
  text_content_html?: string | null; // HTML content for text or question blocks
  questions_html?: string | null; // Specific HTML content for questions
  media_url?: string | null; // URL of the image or other media
  media_alt_text?: string | null; // Alternative text for the image
  media_position?: 'left' | 'right' | 'center' | 'full' | null; // Media position relative to text
}

// Main interface for evaluation data
// Combining fields from your original 'EvaluationData' and 'EvaluationDatacrt'
export interface EvaluationData {
  id?: number; // Optional for creation, present for existing records

  // Direct fields from the 'evaluations' table
  titre_evaluation: string; // Made non-nullable for form validation
  chapitre_id: number | null;
  sequence_id: number | null; // Can be null if the evaluation is not directly linked to a sequence
  activite_id: number | null; // Can be null if the evaluation is not directly linked to an activity

  type_evaluation: string | null; // E.g.: 'Diagnostique', 'Formative', 'Sommative'
  grille_correction: string | null; // Path or content of the correction grid
  introduction_activite: string; // HTML content for the introduction of the activity/evaluation situation
  consignes_specifiques?: string | null; // Additional instructions

  // Fields for resource URLs (JSONB in DB, managed as string in React for MultiFileUpload)
  ressource_urls: string | null; // Teacher resource URLs (JSON stringified array)
  ressources_eleve_urls?: string | null; // Student resource URLs (JSON stringified array)

  // Many-to-Many relationship fields
  modalite_evaluation_ids?: number[]; // Array of evaluation modality IDs
  modalite_evaluation_autre_texte?: string | null; // Text for "other" modality if specified

  objectifs?: number[]; // Array of linked Objective IDs

  // Fields for competencies, knowledge, and abilities/skills
  selected_competence_id?: number | null; // ID of the specific competence
  selected_general_competence_ids?: number[]; // Array of general competence IDs
  selected_connaissance_ids?: number[]; // Array of knowledge IDs
  new_connaissance_text?: string | null; // Text for a new knowledge to insert
  selected_capacite_habilete_ids?: number[]; // Array of ability/skill IDs

  // Dynamic content blocks
  contenu_blocs: ContentBlockData[]; // Array of evaluation content blocks

  // Traceability fields (often managed by the DB)
  date_creation?: string;
  date_mise_a_jour?: string;

  // Hierarchical position fields (for display/filtering in the form)
  niveau_id?: number | null;
  option_id?: number | null;
  unite_id?: number | null;
}


// --- Types pour la Progression au sein d'une Fiche de Planification ---

// Define a base interface for all progression items to ensure common properties
export interface PlanChapterProgressionItemBase {
  id: string; // ID unique généré côté client (UUID or Date.now().toString())
  ordre: number; // Order within the chapter's progression
  chapficheId: number | null; // ID of the parent chapter planning sheet
  titre: string | null; // Common title for display purposes
  description: string | null; // Common description for display purposes
}

// PlanActivity represents an activity in the context of a planning sheet.
// It now extends the base interface and includes a 'sourceId'
export type PlanActivity = PlanChapterProgressionItemBase & {
  type: 'activity'; // Discriminant for the union type
  sourceId: number; // ID of the "master" activity in the 'activites' table
};

// PlanEvaluation represents an evaluation in the context of a planning sheet.
export type PlanEvaluation = PlanChapterProgressionItemBase & {
  type: 'evaluation'; // Discriminant
  sourceId: number; // ID of the "master" evaluation in the 'evaluations' table
  type_evaluation?: string | null; // Specific to evaluation
};

// PlanSequence represents a sequence in the context of a planning sheet.
export type PlanSequence = PlanChapterProgressionItemBase & {
  type: 'sequence'; // Discriminant
  sourceId: number; // ID of the "master" sequence in the 'sequences' table
};

// The union type for a chapter progression item.
export type PlanChapterProgressionItem = PlanSequence | PlanActivity | PlanEvaluation;

// PlanChapitre represents the complete planning sheet for a chapter.
export type PlanChapitre = {
  id: number | null; // MODIFIÉ : ID est maintenant de type number | null pour correspondre à la DB
  chapitreReferenceId: number | null; // ID du chapitre de référence associé (chapitres.id)
  niveauId: number | null;
  optionId: number | null;
  uniteId: number | null;
  titreChapitre: string; // Titre du chapitre de référence (affiché, non modifiable ici)
  objectifsGeneraux: string; // Chaîne formatée des objectifs du chapitre de référence
  objectifsReferencesIds: number[]; // IDs des objectifs du chapitre de référence
  nomFichePlanification: string; // Le nom spécifique de cette fiche de planification
  statutFiche: 'Brouillon' | 'Publié' | 'Archivé'; // Le statut de la fiche
  createdBy: string; // ID de l'utilisateur créateur
  progressionItems: PlanChapterProgressionItem[]; // Tableau des éléments de progression
  date_creation?: string; // Optionnel, géré par la DB
  updated_at?: string; // Optionnel, géré par la DB
};


// --- Types pour la structure des données récupérées directement de Supabase (si nécessaire) ---
// Ces types peuvent être utilisés pour des requêtes spécifiques où la structure DB est importante.

// Chapitre avec ses objectifs directs (utilisé par ChapterPlanningHeader)
export interface ChapitreWithDirectObjectifsDb {
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
  objectifs: Array<{
    id: number;
    description_objectif: string;
  }>;
}

// Représente les données d'une activité avec ses relations jointes pour l'affichage détaillé
export interface ActiviteWithRelationsDb { // Note: Cette interface est définie dans dbTypes.ts
  id: number;
  titre_activite: string;
  description: string | null;
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
  } | null;
  activite_objectifs: {
    objectifs: {
      id: number;
      description_objectif: string;
    } | null;
  }[];
}

// Représente les données d'une évaluation avec ses relations jointes pour l'affichage détaillé
export interface EvaluationWithRelationsDb { // Note: Cette interface est définie dans dbTypes.ts
  id: number;
  titre_evaluation: string;
  type_evaluation: string | null;
  introduction_activite: string;
  consignes_specifiques: string | null;
  chapitre: any | null; // Simplifié pour cet exemple
}

// Représente les données d'une séquence avec ses relations jointes pour l'affichage détaillé
export interface SequenceWithRelationsDb { // Note: Cette interface est définie dans dbTypes.ts
  id: number;
  titre_sequence: string;
  description: string | null;
  chapitre: any | null; // Simplifié pour cet exemple
}

