// ============================================================
// 📁 Fichier : src/components/notes/GestionNotes.tsx
// 🎯 Objectif :
//   - Afficher un tableau des élèves avec leurs notes.
//   - Permettre la modification via une modale.
//   - Intégrer recherche + filtrage par classe.
//   - Connexion dynamique à Supabase.
// ============================================================

import React, { useState, useEffect } from "react";
import NoteModal from "./NoteModal";  // Modale de saisie des notes
import { supabase } from "../../backend/config/supabase";  // Connexion à Supabase

// ============================================================
// 🔵 Composant : GestionNotes
// ============================================================
const GestionNotes: React.FC = () => {
  // === États ===
  const [students, setStudents] = useState<any[]>([]);  // Liste de tous les élèves
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);  // Liste filtrée d'élèves
  const [searchQuery, setSearchQuery] = useState<string>("");  // Critère de recherche pour les élèves
  const [filterClass, setFilterClass] = useState<string>("");  // Filtre pour la classe
  const [classes, setClasses] = useState<any[]>([]);  // Liste des classes
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);  // Élève sélectionné pour modification
  const [showModal, setShowModal] = useState<boolean>(false);  // État de la modale (ouverte/fermée)

  // ============================================================
  // 📥 Récupérer les élèves + classes depuis Supabase
  // ============================================================
  const fetchStudentsAndClasses = async () => {
    try {
      // Récupération des données des élèves et de leurs notes
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(`
          id, student_code, first_name, last_name, student_class,
          student_scores (cc1, cc2, cc3, c_act)
        `);

      if (studentsError) throw new Error(studentsError.message);  // Gestion des erreurs

      // Récupération des classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("id, class_name");

      if (classesError) throw new Error(classesError.message);  // Gestion des erreurs

      // Associer chaque élève à sa classe
      const studentsWithClasses = studentsData.map((student) => {
        const studentClass = classesData.find((cls) => cls.id === student.student_class);
        return { ...student, class_name: studentClass?.class_name || "Classe inconnue" };
      });

      // Mise à jour des états avec les données récupérées
      setStudents(studentsWithClasses);
      setFilteredStudents(studentsWithClasses);  // Initialisation de la liste filtrée
      setClasses(classesData || []);  // Mise à jour des classes
    } catch (err) {
      console.error("❌ Erreur de chargement :", err.message);  // Affichage d'une erreur dans la console
    }
  };

  // ============================================================
  // 🔄 Filtrage en temps réel (search + class)
  // ============================================================
  useEffect(() => {
    const results = students
      .filter((student) =>
        // Recherche par nom, prénom ou code d'élève
        `${student.first_name} ${student.last_name} ${student.student_code}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
      .filter((student) =>
        // Filtrage par classe si un filtre est appliqué
        filterClass ? String(student.student_class) === filterClass : true
      );

    setFilteredStudents(results);  // Mise à jour de la liste filtrée
  }, [searchQuery, filterClass, students]);  // Re-calcul du filtre à chaque changement

  // ============================================================
  // ▶️ Chargement initial des données
  // ============================================================
  useEffect(() => {
    fetchStudentsAndClasses();  // Récupération des données des élèves et des classes au chargement
  }, []);

  // ============================================================
  // 🧾 Gestion de la modale
  // ============================================================
  const handleOpenModal = (student: any) => {
    setSelectedStudent(student);  // Sélection de l'élève pour modification
    setShowModal(true);  // Ouverture de la modale
  };

  const handleCloseModal = () => {
    setShowModal(false);  // Fermeture de la modale
    fetchStudentsAndClasses();  // Rechargement des données après modification
  };

  // ============================================================
  // 📦 Rendu
  // ============================================================
return (
  <div className="tracking-container">
    <h2 className="tracking-title">Gestion des Notes</h2>

    {/* 🔍 Barre de recherche + filtre */}
    <div className="tracking-filters">
      <input
        type="text"
        placeholder="Rechercher par code ou nom"
        className="tracking-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <select
        className="tracking-select"
        value={filterClass}
        onChange={(e) => setFilterClass(e.target.value)}
      >
        <option value="">Toutes les classes</option>
        {classes.map((cls) => (
          <option key={cls.id} value={String(cls.id)}>
            {cls.class_name}
          </option>
        ))}
      </select>
    </div>

    {/* 📋 Tableau des élèves */}
    <table className="tracking-table">
      <thead>
        <tr className="bg-gray-100 text-gray-700">
          <th>Code Élève</th>
          <th>Nom</th>
          <th>Classe</th>
          <th>CC1</th>
          <th>CC2</th>
          <th>CC3</th>
          <th>Activité</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {filteredStudents.map((student) => (
          <tr key={student.id}>
            <td>{student.student_code}</td>
            <td>{student.first_name} {student.last_name}</td>
            <td>{student.class_name}</td>
            <td>{student.student_scores?.cc1?.toFixed(2) || "-"}</td>
            <td>{student.student_scores?.cc2?.toFixed(2) || "-"}</td>
            <td>{student.student_scores?.cc3?.toFixed(2) || "-"}</td>
            <td>{student.student_scores?.c_act?.toFixed(2) || "-"}</td>
            <td>
              <button
                className="absence-btn"
                onClick={() => handleOpenModal(student)}
              >
                Saisir Note
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* 📌 Modale de saisie des notes */}
    {showModal && selectedStudent && (
      <NoteModal student={selectedStudent} onClose={handleCloseModal} />
    )}
  </div>
)


;
};

export default GestionNotes;
