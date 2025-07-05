// ============================================================
// 📌 Fichier : Differentiation.tsx
// 🎯 Objectif :
//   - Gérer la différenciation pédagogique en fonction des profils d'élèves.
//   - Proposer des activités adaptées aux élèves avancés ou en difficulté.
// ============================================================

import React, { useState } from "react";

interface Activity {
  id: number;
  name: string;
  level: "Avancé" | "Intermédiaire" | "En difficulté";
  description: string;
}

interface StudentProfile {
  id: number;
  name: string;
  profile: "Avancé" | "Intermédiaire" | "En difficulté";
}

const Differentiation: React.FC = () => {
  // === États pour les profils et activités ===
  const [students, setStudents] = useState<StudentProfile[]>([
    { id: 1, name: "Alice", profile: "Avancé" },
    { id: 2, name: "Bob", profile: "En difficulté" },
    { id: 3, name: "Charlie", profile: "Intermédiaire" },
  ]);

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 1,
      name: "Résolution de problèmes complexes",
      level: "Avancé",
      description: "Activités orientées vers la créativité et l'approfondissement.",
    },
    {
      id: 2,
      name: "Révision des bases",
      level: "En difficulté",
      description: "Exercices fondamentaux pour consolider les acquis.",
    },
    {
      id: 3,
      name: "Projet collaboratif",
      level: "Intermédiaire",
      description: "Travail en groupe pour renforcer les compétences sociales et académiques.",
    },
  ]);

  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  // === Fonction pour sélectionner un étudiant et afficher ses activités adaptées ===
  const handleSelectStudent = (student: StudentProfile) => {
    setSelectedStudent(student);
  };

  return (
    <div className="p-6 bg-white rounded shadow-md">
      {/* === Titre Principal === */}
      <h2 className="text-xl font-bold mb-4">Différenciation Pédagogique</h2>

      {/* === Liste des étudiants === */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Liste des Élèves</h3>
        <ul className="space-y-2">
          {students.map((student) => (
            <li
              key={student.id}
              onClick={() => handleSelectStudent(student)}
              className="p-4 bg-gray-50 rounded shadow cursor-pointer hover:bg-indigo-100 transition"
            >
              <p className="font-bold">{student.name}</p>
              <p className="text-sm text-gray-600">Profil : {student.profile}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* === Activités adaptées à l'élève sélectionné === */}
      <div>
        {selectedStudent ? (
          <>
            <h3 className="text-lg font-semibold">Activités pour {selectedStudent.name}</h3>
            <ul className="space-y-2">
              {activities
                .filter((activity) => activity.level === selectedStudent.profile)
                .map((filteredActivity) => (
                  <li key={filteredActivity.id} className="p-4 bg-gray-50 rounded shadow">
                    <h4 className="font-bold">{filteredActivity.name}</h4>
                    <p className="text-sm text-gray-600">{filteredActivity.description}</p>
                  </li>
                ))}
            </ul>
          </>
        ) : (
          <p className="text-gray-500">Sélectionnez un étudiant pour afficher les activités adaptées.</p>
        )}
      </div>
    </div>
  );
};

export default Differentiation;
