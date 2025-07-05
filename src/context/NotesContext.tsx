// ============================================================
// 📌 Fichier : NotesContext.tsx
// 🎯 Objectif :
//   - Gérer les notes des élèves via Supabase.
//   - Fournir un contexte React pour accéder aux données des notes
//     dans toute l'application.
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../backend/config/supabase'; // Connexion à Supabase

// Typage des données des notes
interface StudentNote {
  student_code: string;
  cc1: number | null;
  cc2: number | null;
  cc3: number | null;
  c_act: number | null;
}

// Typage du contexte
interface NotesContextType {
  notes: StudentNote[]; // Liste des notes des élèves
  loading: boolean; // Indicateur de chargement
  fetchNotes: () => Promise<void>; // Fonction pour récupérer les notes
  updateNote: (
    student_code: string,
    updates: Partial<StudentNote>
  ) => Promise<void>; // Fonction pour modifier une note
}

// Création du contexte des notes
const NotesContext = createContext<NotesContextType | undefined>(undefined);

// Hook personnalisé pour accéder au contexte des notes
export function useNotes(): NotesContextType {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('❌ useNotes doit être utilisé dans un NotesProvider.');
  }
  return context;
}

// Composant Provider : Fournit le contexte à toute l'application
export default function NotesProvider({ children }: { children: React.ReactNode }) {
  // === États locaux ===
  const [notes, setNotes] = useState<StudentNote[]>([]); // Liste des notes des élèves
  const [loading, setLoading] = useState<boolean>(true); // Indicateur de chargement

  // ============================================================
  // Fonction : Récupérer les données des notes via Supabase
  // ============================================================
  const fetchNotes = async () => {
    try {
      setLoading(true); // Activer l'indicateur de chargement

      const { data, error } = await supabase
        .from('student_scores')
        .select('student_code, cc1, cc2, cc3, c_act'); // Colonnes nécessaires

      if (error) throw new Error(`Erreur lors de la récupération des notes : ${error.message}`);

      setNotes(data || []); // Mettre à jour les états locaux
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des notes :', err.message);
    } finally {
      setLoading(false); // Désactiver l'indicateur de chargement
    }
  };

  // ============================================================
  // Fonction : Modifier une note
  // ============================================================
  const updateNote = async (student_code: string, updates: Partial<StudentNote>) => {
    try {
      const { error } = await supabase
        .from('student_scores')
        .update(updates) // Mettre à jour les colonnes spécifiques
        .eq('student_code', student_code); // Identifier l'élève via son code unique

      if (error) throw new Error(`Erreur lors de la modification des notes : ${error.message}`);

      // Rafraîchir les données après la mise à jour
      await fetchNotes();
      alert('✅ Notes mises à jour avec succès.');
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour des notes :', err.message);
      alert('Une erreur est survenue lors de la modification des notes.');
    }
  };

  // ============================================================
  // Effet : Charger les données des notes au montage
  // ============================================================
  useEffect(() => {
    fetchNotes();
  }, []);

  // ============================================================
  // Rendu du Provider
  // ============================================================
  return (
    <NotesContext.Provider value={{ notes, loading, fetchNotes, updateNote }}>
      {children}
    </NotesContext.Provider>
  );
}
