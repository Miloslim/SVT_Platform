import React, { useState } from "react";

interface ObjectifEditorProps {
  activiteId: number;
  onAddObjectif: (objectif: string) => void;
}

const ObjectifEditor: React.FC<ObjectifEditorProps> = ({ activiteId, onAddObjectif }) => {
  const [objectif, setObjectif] = useState("");

  const handleAddObjectif = () => {
    if (objectif.trim()) {
      onAddObjectif(objectif);
      setObjectif(""); // Réinitialiser l'input après ajout
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Ajouter un objectif pour l'activité {activiteId}</h3>
      <input
        type="text"
        className="border p-2 rounded w-full"
        placeholder="Titre de l'objectif"
        value={objectif}
        onChange={(e) => setObjectif(e.target.value)}
      />
      <button
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        onClick={handleAddObjectif}
      >
        Ajouter
      </button>
    </div>
  );
};

export default ObjectifEditor;
