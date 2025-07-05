// ============================================================
// 📌 Fichier : AIPlanning.tsx
// 🎯 Objectif :
//   - Générer automatiquement une progression annuelle basée sur les objectifs.
// ============================================================

import React, { useState } from "react";

const AIPlanning: React.FC = () => {
  const [inputObjectives, setInputObjectives] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);

  const generatePlan = () => {
    // Exemple d'algorithme simplifié
    setGeneratedPlan(`Progression générée pour : ${inputObjectives}`);
  };

  return (
    <div className="p-6 bg-white rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Générateur IA - Progression Annuelle</h2>
      <textarea
        value={inputObjectives}
        onChange={(e) => setInputObjectives(e.target.value)}
        placeholder="Saisissez vos objectifs pédagogiques ici..."
        className="w-full p-4 border rounded mb-4"
      />
      <button
        onClick={generatePlan}
        className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
      >
        Générer Progression
      </button>
      {generatedPlan && <div className="mt-4 bg-gray-100 p-4 rounded shadow">{generatedPlan}</div>}
    </div>
  );
};

export default AIPlanning;
