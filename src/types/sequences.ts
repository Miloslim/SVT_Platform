// Nom du fichier: src/types/sequence.ts
// Fonctionnalités :
// - Définit les interfaces de données pour les séquences,
// leurs éléments liés (activités, évaluations) et leurs relations.
// - Utilisé pour la cohérence des types entre les composants de séquence
// (SequenceForm, services, etc.)
// - Ce fichier centralise les définitions de types liées aux séquences.

import {
    ActiviteDb,
    EvaluationDb,
    ObjectifDb,
    ConnaissanceDb,
    CapaciteHabileteDb,
    SequenceDb
} from "./dbTypes"; // Importez les types DB-centric

/**
 * Interface pour les données du formulaire de séquence.
 * Reflète les champs de la table 'sequences' mais adaptés pour l'état React du formulaire.
 * L'ID est optionnel car il n'est présent qu'en mode édition.
 */
export interface SequenceFormData {
    id?: number; // Optionnel pour la création, requis pour l'édition
    titre_sequence: string;
    objectifs_specifiques: string | null;
    description: string | null;
    duree_estimee: number | null;
    prerequis: string | null;
    statut: "brouillon" | "validee" | "archivee";
    chapitre_id: number; // chapitre_id est essentiel et ne doit pas être optionnel pour un formulaire de création/édition de séquence
    ordre: number | null; // Ordre de la séquence dans le chapitre
    // Pas de created_at/updated_at ici car ce sont des champs gérés par la DB
}


// --- Interfaces pour la création/mise à jour d'Activités/Évaluations via les modales ---

/**
 * Interface pour les données d'une activité retournées par ActivityChooserModal.
 */
export interface AddedActivityDetails {
    id: number;
    titre_activite: string;
    description_activite: string | null; // Assurez-vous que c'est description_activite
    objectifs: Array<{ id: number; description_objectif: string }>; // Objets avec ID et description
}

/**
 * Interface pour les données d'une évaluation retournées par EvaluationChooserModal.
 */
export interface AddedEvaluationDetails {
    id: number;
    titre_evaluation: string;
    introduction_activite: string | null;
    consignes_specifiques: string | null;
    type_evaluation: string;
    connaissances: Array<{ id: number; titre_connaissance: string }>;
    capacites_habiletes: Array<{ id: number; titre_capacite_habilete: string }>;
}


// --- Interfaces pour les données récupérées directement de la base de données via Supabase SELECT imbriqué ---

/**
 * Représente une activité telle que récupérée par la requête Supabase imbriquée dans FetchedSequenceData.
 * Elle inclut la relation pour les objectifs, telle que renvoyée par le select Supabase.
 */
export interface JoinedActivity extends ActiviteDb { // Étend ActiviteDb de dbTypes
    activite_objectifs: Array<{
        objectifs: {
            description_objectif: string;
        };
    }>;
}

/**
 * Représente une évaluation telle que récupérée par la requête Supabase imbriquée dans FetchedSequenceData.
 * Elle inclut les relations pour les connaissances et les capacités, telles que renvoyées par le select Supabase.
 */
export interface JoinedEvaluation extends EvaluationDb { // Étend EvaluationDb de dbTypes
    evaluation_connaissances: Array<{
        connaissances: {
            titre_connaissance: string;
        };
    }>;
    evaluation_capacites_habiletes: Array<{
        capacites_habiletes: {
            titre_capacite_habilete: string;
        };
    }>;
}

/**
 * Type pour les liens d'activités récupérés, incluant l'activité jointe et l'ID du lien lui-même.
 * Le nom de l'alias 'activites' doit correspondre à votre requête Supabase.
 */
export interface FetchedSequenceActiviteLink {
    id: number; // L'ID du lien dans la table de jonction (sequence_activite.id)
    activite_id: number;
    ordre: number;
    activites: JoinedActivity; // L'alias 'activites' dans votre .select()
}

/**
 * Type pour les liens d'évaluations récupérés, incluant l'évaluation jointe et l'ID du lien lui-même.
 * Le nom de l'alias 'evaluations' doit correspondre à votre requête Supabase.
 */
export interface FetchedSequenceEvaluationLink {
    id: number; // L'ID du lien dans la table de jonction (sequence_evaluation.id)
    evaluation_id: number;
    ordre: number;
    evaluations: JoinedEvaluation; // L'alias 'evaluations' dans votre .select()
}

/**
 * Interface pour les données complètes d'une séquence récupérées de la base de données avec toutes les relations.
 * Reflète la structure de la réponse de `sequencesService.getSequenceById`.
 */
export interface FetchedSequenceData extends SequenceDb { // Étend SequenceDb
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
    };
    sequence_activite: FetchedSequenceActiviteLink[]; // Nom des relations Supabase
    sequence_evaluation: FetchedSequenceEvaluationLink[]; // Nom des relations Supabase
}


// --- Interfaces pour les éléments (activités/évaluations) dans l'état du formulaire (pour DND Kit) ---

/**
 * Interface unifiée pour un élément affiché dans la liste des SequenceItems du formulaire.
 * C'est le type clé pour le composant `SequenceForm` et `SortableItem`.
 * Il combine les propriétés d'activité et d'évaluation, rendant certaines optionnelles.
 */
export interface SequenceItem {
    // Note: l'ID ici est l'ID de l'activité ou de l'évaluation réelle, PAS l'ID du lien de jonction.
    // L'ID du lien de jonction est 'linkId'.
    id: number;
    titre: string; // Utilise 'titre' générique (titre_activite ou titre_evaluation)
    type: 'activity' | 'evaluation';
    order_in_sequence: number; // Ordre pour le tri DND

    // Propriétés spécifiques aux activités
    description?: string | null; // Description de l'activité (attention: description_activite dans DB)
    objectifs?: string[]; // Descriptions des objectifs d'activité (format string[])

    // Propriétés spécifiques aux évaluations
    type_evaluation?: string | null;
    introduction_activite?: string | null;
    consignes_specifiques?: string | null;
    connaissances?: string[]; // Titres des connaissances évaluées (format string[])
    capacitesEvaluees?: string[]; // Titres des capacités/habiletés évaluées (format string[])

    linkId?: number; // ID de la liaison dans la table sequence_activite ou sequence_evaluation (pour l'édition/suppression des liaisons existantes)
}

// --- Payloads pour la communication avec les services ---

// Représentation des données d'une activité pour l'insertion/mise à jour dans 'sequence_activite'
export interface ActivityLinkPayload {
    id?: number; // Optionnel: ID du lien existant dans 'sequence_activite'
    activite_id: number;
    ordre: number;
}

// Représentation des données d'une évaluation pour l'insertion/mise à jour dans 'sequence_evaluation'
export interface EvaluationLinkPayload {
    id?: number; // Optionnel: ID du lien existant dans 'sequence_evaluation'
    evaluation_id: number;
    ordre: number;
}

// Le payload complet pour la création ou la mise à jour d'une séquence
// C'est ce que votre service `sequencesService.createSequence` et `sequencesService.updateSequence` va recevoir
export interface SequencePayload {
    sequenceData: SequenceFormData; // Contient les données de la séquence principale, incluant son ID (si existant)
    chapitre_id: number; // Redondant avec sequenceData.chapitre_id mais explicite dans le payload
    activities: ActivityLinkPayload[];
    evaluations: EvaluationLinkPayload[];
}