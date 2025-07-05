// ============================================================
// 📌 Fichier : Evaluation.tsx
// 🎯 Objectif :
//   - Gérer le suivi et l'évaluation des élèves.
//   - Fournir une visualisation des performances académiques.
// ============================================================

import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto"; // Import nécessaire pour Chart.js

interface StudentEvaluation {
  id: number;
  name: string;
  scores: {
    subject: string;
    grade: number;
  }[];
}

const Evaluation: React.FC = () => {
  // === États pour les évaluations des élèves ===
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([
    {
      id: 1,
      name: "Alice Dupont",
      scores: [
        { subject: "Mathématiques", grade: 85 },
        { subject: "Physique", grade: 78 },
        { subject: "Histoire", grade: 90 },
      ],
    },
    {
      id: 2,
      name: "Bob Martin",
      scores: [
        { subject: "Mathématiques", grade: 65 },
        { subject: "Physique", grade: 72 },
        { subject: "Histoire", grade: 80 },
      ],
    },
  ]);

  const [selectedStudent, setSelectedStudent] = useState<StudentEvaluation | null>(null);

  // === Gestion de la sélection d'un élève ===
  const handleSelectStudent = (student: StudentEvaluation) => {
    setSelectedStudent(student);
  };

  return (
    <div className="p-6 bg-white rounded shadow-md">
      {/* === Titre Principal === */}
      <h2 className="text-xl font-bold mb-4">Suivi et Évaluation</h2>

      {/* === Liste des élèves === */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Liste des élèves</h3>
        <ul className="space-y-2">
          {evaluations.map((evaluation) => (
            <li
              key={evaluation.id}
              onClick={() => handleSelectStudent(evaluation)}
              className="p-4 bg-gray-50 rounded shadow cursor-pointer hover:bg-indigo-100 transition"
            >
              <p className="font-bold">{evaluation.name}</p>
              <p className="text-sm text-gray-600">
                Moyenne :{" "}
                {(
                  evaluation.scores.reduce((acc, curr) => acc + curr.grade, 0) /
                  evaluation.scores.length
                ).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* === Détails et graphique des performances === */}
      <div>
        {selectedStudent ? (
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Performances de {selectedStudent.name}
            </h3>
            <Bar
              data={{
                labels: selectedStudent.scores.map((score) => score.subject),
                datasets: [
                  {
                    label: "Score",
                    data: selectedStudent.scores.map((score) => score.grade),
                    backgroundColor: "rgba(54, 162, 235, 0.6)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        ) : (
          <p className="text-gray-500">Sélectionnez un élève pour voir ses performances.</p>
        )}
      </div>
    </div>
  );
};

export default Evaluation;
