// ============================================================================
// 📁 Fichier : ObjectivesSelector.tsx
// 📌 Emplacement : src/components/planipeda/ScenarioEditor/ObjectivesSelector.tsx
// 🎯 Objectif :
//   - Sélectionner des objectifs pédagogiques à associer à une fiche, une séquence ou une activité
//   - Filtrage possible par niveau, option, unité, chapitre
// ============================================================================

import React, { useEffect, useState } from "react";

// 🧩 Types simplifiés pour les données
type Objectif = {
  id: number;
  description_objectif: string;
  chapitre_id: number;
};

interface ObjectivesSelectorProps {
  selectedIds: number[];
  onChange: (newSelected: number[]) => void;
  availableObjectives: Objectif[];
  filterByChapterId?: number; // Optionnel : filtrage par chapitre
}

// 🧠 Composant principal
const ObjectivesSelector: React.FC<ObjectivesSelectorProps> = ({
  selectedIds,
  onChange,
  availableObjectives,
  filterByChapterId,
}) => {
  const [filteredObjectives, setFilteredObjectives] = useState<Objectif[]>([]);

  // 🎯 Filtrage dynamique
  useEffect(() => {
    if (filterByChapterId) {
      setFilteredObjectives(
        availableObjectives.filter((o) => o.chapitre_id === filterByChapterId)
      );
    } else {
      setFilteredObjectives(availableObjectives);
    }
  }, [availableObjectives, filterByChapterId]);

  // 🔁 Gérer la sélection
  const handleToggle = (id: number) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter((sid) => sid !== id)
      : [...selectedIds, id];
    onChange(updated);
  };

  return (
    <div className="objectives-selector space-y-2">
      <h4 className="text-md font-medium">🎯 Objectifs associés</h4>
      <ul className="space-y-1">
        {filteredObjectives.map((obj) => (
          <li key={obj.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.includes(obj.id)}
              onChange={() => handleToggle(obj.id)}
              className="checkbox"
            />
            <label className="text-sm">{obj.description_objectif}</label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ObjectivesSelector;
