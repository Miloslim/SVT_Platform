// ============================================================
// 📌 Fichier : useStudentsData.ts
// 🎯 Objectif : Gestion centralisée des données des élèves
// ============================================================

import { useState, useEffect } from 'react';
import { supabase } from "../../../backend/config/supabase";

// Typage des données des élèves
interface Student {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  student_class: string;
  birth_date: string;
  gender?: string;
}

// ============================================================
// Hook personnalisé : useStudentsData
// Description :
// - Récupérer et gérer les données des élèves.
// - Appliquer des filtres dynamiques par recherche ou classe.
// ============================================================
export const useStudentsData = () => {
  // === États locaux ===
  const [students, setStudents] = useState<Student[]>([]); // Liste des élèves récupérés
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]); // Liste filtrée
  const [loading, setLoading] = useState<boolean>(false); // Indicateur de chargement
  const [searchQuery, setSearchQuery] = useState<string>(''); // Recherche par mot-clé
  const [filterClass, setFilterClass] = useState<string>(''); // Filtrage par classe

  // ============================================================
  // Fonction : Récupérer les données des élèves depuis Supabase
  // ============================================================
  const fetchStudents = async () => {
    try {
      setLoading(true); // Activer l'indicateur de chargement

      const { data, error } = await supabase
        .from('students')
        .select('id, student_code, first_name, last_name, student_class, birth_date, gender');

      if (error) throw new Error(`Erreur lors de la récupération des élèves : ${error.message}`);

      setStudents(data || []);
      setFilteredStudents(data || []); // Initialiser la liste filtrée
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des élèves :', err.message);
    } finally {
      setLoading(false); // Désactiver l'indicateur de chargement
    }
  };

  // ============================================================
  // Effet : Charger les données au montage du composant
  // ============================================================
  useEffect(() => {
    fetchStudents(); // Charger la liste des élèves au démarrage
  }, []);

  // ============================================================
  // Effet : Appliquer les filtres dynamiquement
  // ============================================================
  useEffect(() => {
    const results = students
      .filter((student) =>
        student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_code.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter((student) => (filterClass ? student.student_class === filterClass : true));

    setFilteredStudents(results); // Mettre à jour la liste filtrée
  }, [searchQuery, filterClass, students]);

  // ============================================================
  // Retour : États et fonctions pour les composants consommateurs
  // ============================================================
  return {
    students: filteredStudents, // Liste des élèves filtrés
    loading, // Indicateur de chargement
    searchQuery, // Terme de recherche
    setSearchQuery, // Fonction pour modifier la recherche
    filterClass, // Classe filtrée
    setFilterClass, // Fonction pour modifier le filtre par classe
    fetchStudents, // Fonction pour récupérer les élèves
  };
};
