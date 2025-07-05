// ============================================================
// 📌 Fichier : Resources.tsx
// 🎯 Objectif :
//   - Gérer les ressources pédagogiques collaboratives.
//   - Permettre l'import/export des fiches et séquences entre enseignants.
// ============================================================

import React, { useState } from "react";

const Resources: React.FC = () => {
  const [resources, setResources] = useState([
    { id: 1, name: "Fiche de Fractions", type: "Fiche Pédagogique", sharedBy: "M. Dupont" },
    { id: 2, name: "Séquence sur les Décimaux", type: "Séquence", sharedBy: "Mme. Martin" },
  ]);

  return (
    <div className="p-6 bg-white rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Ressources Pédagogiques</h2>
      <ul className="space-y-4">
        {resources.map((resource) => (
          <li key={resource.id} className="p-4 bg-gray-50 rounded shadow hover:bg-indigo-100 transition">
            <h3 className="text-lg font-bold">{resource.name}</h3>
            <p>Type : {resource.type}</p>
            <p>Partagé par : {resource.sharedBy}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Resources;
