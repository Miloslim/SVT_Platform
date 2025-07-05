// ============================================================
// 📌 Fichier : StudentsContext.tsx
// 🎯 Objectif :
//   - Gérer les élèves dans l'application.
//   - Fournir un contexte React pour centraliser les données et
//     fonctions liées aux élèves.
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../backend/config/supabase'; // Connexion à Supabase

// Typage des données d'élèves
interface Student {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  student_class: string;
}

// Typage du contexte
interface StudentsContextType {
  students: Student[]; // Liste des élèves
  loading: boolean; // Indicateur de chargement
  fetchStudents: () => Promise<void>; // Fonction pour récupérer les élèves
  addStudent: (studentData: Omit<Student, 'id'>) => Promise<void>; // Fonction pour ajouter un élève
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>; // Fonction pour modifier un élève
  deleteStudent: (id: string) => Promise<void>; // Fonction pour supprimer un élève
}

// Création du contexte des élèves
const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

// Hook personnalisé pour accéder au contexte des élèves
export function useStudents(): StudentsContextType {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error('❌ useStudents doit être utilisé dans un StudentsProvider.');
  }
  return context;
}

// Composant Provider : Fournit le contexte à toute l'application
export default function StudentsProvider({ children }: { children: React.ReactNode }) {
  // === États locaux ===
  const [students, setStudents] = useState<Student[]>([]); // Liste des élèves
  const [loading, setLoading] = useState<boolean>(true); // Indicateur de chargement

  // ============================================================
  // Fonction : Récupérer les élèves via Supabase
  // ============================================================
  const fetchStudents = async () => {
    try {
      setLoading(true); // Activer le chargement

      const { data, error } = await supabase
        .from('students')
        .select('id, student_code, first_name, last_name, birth_date, student_class'); // Colonnes nécessaires

      if (error) throw new Error(`Erreur lors de la récupération des élèves : ${error.message}`);

      setStudents(data || []); // Mettre à jour les états locaux
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des élèves :', err.message);
    } finally {
      setLoading(false); // Désactiver le chargement
    }
  };

  // ============================================================
  // Fonction : Ajouter un élève
  // ============================================================
  const addStudent = async (studentData: Omit<Student, 'id'>) => {
    try {
      const { error } = await supabase
        .from('students')
        .insert(studentData); // Insérer les données de l'élève

      if (error) throw new Error(`Erreur lors de l'ajout de l'élève : ${error.message}`);

      alert('✅ Élève ajouté avec succès.');
      fetchStudents(); // Rafraîchir la liste après l'ajout
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout de l\'élève :', err.message);
      alert('Une erreur est survenue lors de l\'ajout.');
    }
  };

  // ============================================================
  // Fonction : Modifier un élève
  // ============================================================
  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      const { error } = await supabase
        .from('students')
        .update(updates) // Mettre à jour les colonnes spécifiques
        .eq('id', id); // Identifier l'élève via son ID

      if (error) throw new Error(`Erreur lors de la modification de l'élève : ${error.message}`);

      alert('✅ Élève mis à jour avec succès.');
      fetchStudents(); // Rafraîchir la liste après la modification
    } catch (err) {
      console.error('❌ Erreur lors de la modification de l\'élève :', err.message);
      alert('Une erreur est survenue lors de la modification.');
    }
  };

  // ============================================================
  // Fonction : Supprimer un élève
  // ============================================================
  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete() // Supprimer l'élève
        .eq('id', id); // Identifier l'élève via son ID

      if (error) throw new Error(`Erreur lors de la suppression de l'élève : ${error.message}`);

      alert('✅ Élève supprimé avec succès.');
      fetchStudents(); // Rafraîchir la liste après la suppression
    } catch (err) {
      console.error('❌ Erreur lors de la suppression de l\'élève :', err.message);
      alert('Une erreur est survenue lors de la suppression.');
    }
  };

  // ============================================================
  // Effet : Charger les données des élèves au montage
  // ============================================================
  useEffect(() => {
    fetchStudents();
  }, []);

  // ============================================================
  // Rendu du Provider
  // ============================================================
  return (
    <StudentsContext.Provider value={{ students, loading, fetchStudents, addStudent, updateStudent, deleteStudent }}>
      {children}
    </StudentsContext.Provider>
  );
}

