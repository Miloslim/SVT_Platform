// ============================================================
// 📌 Fichier : StudentAnalytics.tsx
// 🎯 Objectif :
//   - Visualiser les statistiques et cartographies des compétences travaillées.
// ============================================================

import React from "react";

const StudentAnalytics: React.FC = () => {
  const stats = [
    { id: 1, label: "Compétences travaillées", value: 78 },
    { id: 2, label: "Séquences utilisées", value: 12 },
  ];

  return (
    <div className="p-6 bg-white rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Statistiques & Cartographie</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat) => (
          <div key={stat.id} className="bg-gray-50 p-4 rounded shadow">
            <h3 className="text-lg font-bold">{stat.label}</h3>
            <p>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentAnalytics;
