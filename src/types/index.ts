// ============================================================
// 📌 Fichier : index.ts
// 🎯 Objectif :
//   - Regrouper et standardiser les types utilisés dans le projet.
//   - Fournir des interfaces réutilisables pour élèves, classes, utilisateurs, activités.
// ============================================================

// === Interface : Élève ===
export interface Student {
  id: number;                  // Identifiant unique de l'élève
  student_code: string;        // Code Élève unique
  first_name: string;          // Prénom
  last_name: string;           // Nom
  birth_date: string;          // Date de naissance (ISO)
  student_class: string;       // Référence à la classe (ID ou code)
  class_name?: string;         // Nom lisible de la classe (optionnel)
  student_scores: StudentScores; // Résultats scolaires
  absences?: number;           // Total d'heures d'absences
  address?: Address;           // Adresse de l'élève (optionnel)
  parentContact?: ParentContact; // Contact des parents (optionnel)
  enrollmentDate?: string;     // Date d'inscription (optionnelle)
  notes?: string;              // Notes internes (optionnelles)
}

// === Interface : Résultats de l'élève ===
export interface StudentScores {
  cc1?: number;      // Contrôle continu 1
  cc2?: number;      // Contrôle continu 2
  cc3?: number;      // Contrôle continu 3
  c_act?: number;    // Activité continue ou participation
}

// === Interface : Adresse ===
export interface Address {
  street: string;
  city: string;
  postalCode: string;
}

// === Interface : Contact des parents ===
export interface ParentContact {
  parentName: string;
  phoneNumber: string;
  email?: string;
}

// === Interface : Classe ===
export interface Class {
  id: string;              // ID unique de la classe
  name: string;            // Nom de la classe (ex. : "5e B")
  academicYear: string;    // Année scolaire (ex. : "2023-2024")
  teacherId: string;       // Référence au professeur principal
  students?: Student[];    // Liste des élèves (optionnelle)
  createdAt: string;       // Date de création
}

// === Interface : Utilisateur ===
export interface User {
  id: string;                      // ID unique de l'utilisateur
  email: string;                   // Email
  role: 'teacher' | 'student';     // Rôle
  firstName: string;
  lastName: string;
  createdAt: string;
}

// === Interface : Activité pédagogique ===
export interface Activity {
  id: string;                // ID unique
  name: string;              // Titre de l'activité
  description: string;       // Description détaillée
  type?: 'course' | 'project' | 'exercise' | 'homework' | 'exam'; // Type
  classId?: string;          // ID de la classe concernée
  dueDate?: string;          // Date limite (optionnel, format ISO)
  resources?: string[];      // Liens ou fichiers associés (optionnel)
  created_at: string;        // Création
  updated_at?: string;       // Dernière modification (optionnel)
}
