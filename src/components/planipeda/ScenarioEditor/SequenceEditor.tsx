// ============================================================================
// 📁 Fichier : SequenceEditor.tsx
// 📌 Emplacement : src/components/planipeda/ScenarioEditor/SequenceEditor.tsx
// 🎯 Objectif :
//   - Permettre l'édition d'une séquence composée de plusieurs activités
//   - Utilise le composant ActivityEditor pour gérer chaque activité
// ============================================================================

import React, { useState } from "react";
import ActivityEditor, { Activity } from "./ActivityEditor";

// 🧩 Type représentant une séquence pédagogique
type Sequence = {
  id: number;
  titre: string;
  objectifs: string;             // Objectifs spécifiques à cette séquence
  activites: Activity[];         // Liste des activités de la séquence
};

// 🎯 Props attendues par SequenceEditor
interface SequenceEditorProps {
  sequence: Sequence;
  onUpdate: (updated: Sequence) => void;
  onDelete?: () => void;
}

// 🧩 Composant principal : éditeur de séquence
const SequenceEditor: React.FC<SequenceEditorProps> = ({ sequence, onUpdate, onDelete }) => {
  const [localSequence, setLocalSequence] = useState<Sequence>(sequence);

  // 🧠 Mise à jour d'une activité spécifique
  const updateActivity = (index: number, updated: Activity) => {
    const updatedActivites = [...localSequence.activites];
    updatedActivites[index] = updated;
    const updatedSequence = { ...localSequence, activites: updatedActivites };
    setLocalSequence(updatedSequence);
    onUpdate(updatedSequence);
  };

  // ➕ Ajouter une activité vide
  const addActivity = () => {
    const newActivity: Activity = {
      id: Date.now(),
      titre: "",
      consigne: "",
      support: "",
      duree: "",
    };
    const updatedSequence = {
      ...localSequence,
      activites: [...localSequence.activites, newActivity],
    };
    setLocalSequence(updatedSequence);
    onUpdate(updatedSequence);
  };

  // ❌ Supprimer une activité
  const deleteActivity = (index: number) => {
    const updated = [...localSequence.activites];
    updated.splice(index, 1);
    const updatedSequence = { ...localSequence, activites: updated };
    setLocalSequence(updatedSequence);
    onUpdate(updatedSequence);
  };

  // 📝 Mise à jour des champs de la séquence
  const handleChange = (field: keyof Sequence, value: string) => {
    const updatedSequence = { ...localSequence, [field]: value };
    setLocalSequence(updatedSequence);
    onUpdate(updatedSequence);
  };

  return (
    <div className="sequence-editor border rounded-lg p-4 shadow space-y-4 bg-white">
      {/* 🎯 Titre de la séquence */}
      <input
        type="text"
        value={localSequence.titre}
        onChange={(e) => handleChange("titre", e.target.value)}
        className="input w-full font-semibold"
        placeholder="Titre de la séquence"
      />

      {/* 🎯 Objectifs pédagogiques de la séquence */}
      <textarea
        value={localSequence.objectifs}
        onChange={(e) => handleChange("objectifs", e.target.value)}
        className="input w-full"
        placeholder="Objectifs pédagogiques de la séquence"
        rows={3}
      />

      {/* 🔁 Liste des activités */}
      <div className="space-y-4">
        {localSequence.activites.map((activity, index) => (
          <ActivityEditor
            key={activity.id}
            activity={activity}
            onUpdate={(updated) => updateActivity(index, updated)}
            onDelete={() => deleteActivity(index)}
          />
        ))}
      </div>

      {/* ➕ Ajouter une activité */}
      <button onClick={addActivity} className="text-sm text-blue-600 hover:underline">
        + Ajouter une activité
      </button>

      {/* ❌ Supprimer la séquence */}
      {onDelete && (
        <button onClick={onDelete} className="text-sm text-red-500 hover:underline block mt-2">
          Supprimer cette séquence
        </button>
      )}
    </div>
  );
};

export default SequenceEditor;
