// src/types/evaluation.ts
//===================================================================
//Typage formulaire ../ScenarioEditor/EditEvaluationEditor.tsx
//===================================================================
export interface EvaluationData {
  id?: number; // Optionnel pour la création, présent pour les enregistrements existants
  
  // Champs directs de la table 'evaluations'
  titre_evaluation: string | null;
  chapitre_id: number | null;
  sequence_id: number | null; // Ajouter si vous avez une relation directe avec les séquences
  activite_id: number | null; // Ajouter si une évaluation peut être liée à une activité
  ressource_urls: string | null; // Stocke les URLs sous forme de chaîne unique (par exemple, séparées par des retours à la ligne)
  type_evaluation: string | null;
  modalite_evaluation: string | null;
  grille_correction: string | null;
  date_creation?: string; // Automatiquement défini par la BDD, optionnel pour les données initiales du formulaire
  date_mise_a_jour?: string; // Automatiquement mis à jour par la BDD, optionnel pour les données initiales du formulaire

  // Champs pour le HierarchicalSelector (pour peupler/filtrer le formulaire, non directement dans la table 'evaluations')
  niveau_id?: number | null;
  option_id?: number | null;
  unite_id?: number | null;

  // Champs pour les Objectifs (gérés par HierarchicalSelector, relation plusieurs-à-plusieurs)
  objectifs?: number[]; // Stocke un tableau d'IDs d'Objectifs, car HierarchicalSelector envoie une liste

  // Champs pour les Compétences, Capacités/Habilités et Connaissances
  // Ce sont des sélections uniques provenant des listes déroulantes dans CompetenceSelector.
  // Le composant parent (CreateEvaluationEditorPage) gérera ensuite
  // l'insertion de ces IDs uniques dans les tables de jointure plusieurs-à-plusieurs.
  selected_competence_id?: number | null; // Stocke un ID unique de Compétence sélectionné
  selected_capacite_habilete_id?: number | null; // Stocke un ID unique de Capacité/Habilité sélectionné
  selected_connaissance_id?: number | null; // Stocke un ID unique de Connaissance sélectionné
}
//===================================================================
//Typage formulaire ../ScenarioEditor/CreateEvaluationEditor.tsx
//===================================================================
export interface EvaluationDatacrt {
  id?: number;
  titre_evaluation: string;
  date_creation?: string;
  
  chapitre_id: number | null;
  sequence_id: number | null;
  activite_id: number | null;

  type_evaluation: string | null;
  modalite_evaluation_ids?: number[];
  modalite_evaluation_autre_texte?: string | null;

  grille_correction: string | null;
  introduction_activite: string;
  contenu_blocs: ContentBlockData[];
  consignes_specifiques?: string;

  ressource_urls: string | null;
  ressources_eleve_urls?: string | null;

  objectifs?: number[];

  // MODIFIÉ: selected_capacite_habilete_id devient un tableau pour la sélection multiple
  selected_competence_id?: number | null;
  selected_general_competence_ids?: number[];
  selected_connaissance_ids?: number[];
  new_connaissance_text?: string | null;
  selected_capacite_habilete_ids?: number[]; // Maintenant un tableau d'IDs

  date_mise_a_jour?: string;

  niveau_id?: number | null;
  option_id?: number | null;
  unite_id?: number | null;
}
