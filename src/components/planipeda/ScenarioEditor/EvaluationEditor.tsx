// ============================================================================
// 📁 Fichier : EvaluationEditor.tsx
// 📌 Emplacement : src/components/planipeda/ScenarioEditor/EvaluationEditor.tsx
// 🎯 Objectif :
//   - Permettre de créer ou modifier une activité d’évaluation
//   - S’intègre à une séquence ou directement à une fiche
// ============================================================================

import React, { useState } from "react";

// 🧩 Type pour une évaluation
export type Evaluation = {
  id: number;
  titre: string;
  type: "diagnostique" | "formative" | "sommative";
  consignes: string;
  criteres: string;
  support: string;
};

// 🎯 Props attendues par le composant
interface EvaluationEditorProps {
  evaluation: Evaluation;
  onUpdate: (updated: Evaluation) => void;
  onDelete?: () => void;
}

// 🧩 Composant principal : éditeur d’évaluation
const EvaluationEditor: React.FC<EvaluationEditorProps> = ({
  evaluation,
  onUpdate,
  onDelete,
}) => {
  const [localEval, setLocalEval] = useState<Evaluation>(evaluation);

  // 🔁 Mise à jour d’un champ
  const handleChange = (field: keyof Evaluation, value: string) => {
    const updated = { ...localEval, [field]: value };
    setLocalEval(updated);
    onUpdate(updated);
  };

  return (
    <div className="evaluation-editor border rounded-lg p-4 shadow space-y-4 bg-white">
      {/* 🎯 Titre de l’évaluation */}
      <input
        type="text"
        value={localEval.titre}
        onChange={(e) => handleChange("titre", e.target.value)}
        className="input w-full font-semibold"
        placeholder="Titre de l’évaluation"
      />

      {/* 📘 Type d’évaluation */}
      <select
        value={localEval.type}
        onChange={(e) => handleChange("type", e.target.value as Evaluation["type"])}
        className="input w-full"
      >
        <option value="diagnostique">Évaluation diagnostique</option>
        <option value="formative">Évaluation formative</option>
        <option value="sommative">Évaluation sommative</option>
      </select>

      {/* 🧾 Consignes pour les élèves */}
      <textarea
        value={localEval.consignes}
        onChange={(e) => handleChange("consignes", e.target.value)}
        className="input w-full"
        placeholder="Consignes à suivre"
        rows={3}
      />

      {/* 🧮 Critères d’évaluation */}
      <textarea
        value={localEval.criteres}
        onChange={(e) => handleChange("criteres", e.target.value)}
        className="input w-full"
        placeholder="Critères d’évaluation (ex : réussite, démarche, etc.)"
        rows={2}
      />

      {/* 📎 Support associé */}
      <input
        type="text"
        value={localEval.support}
        onChange={(e) => handleChange("support", e.target.value)}
        className="input w-full"
        placeholder="Support (ex : document, fichier, outil numérique)"
      />

      {/* ❌ Supprimer */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="text-sm text-red-500 hover:underline block mt-2"
        >
          Supprimer cette évaluation
        </button>
      )}
    </div>
  );
};

export default EvaluationEditor;
