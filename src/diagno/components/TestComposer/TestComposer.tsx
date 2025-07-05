// 📄 src/diagno/components/TestComposer/TestComposer.tsx

import React, { useState } from "react";
import PrerequisSelector from "./PrerequisSelector";
import HierarchicalSelectorNew from '@/diagno/components/TestComposer/HierarchicalSelectorNew';
const TestComposer: React.FC = () => {
  const [selectedPrerequis, setSelectedPrerequis] = useState<number[]>([]);
  const [selection, setSelection] = useState<{
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
    chapitreId: number | null;
  }>({
    niveauId: null,
    optionId: null,
    uniteId: null,
    chapitreId: null,
  });

  const handleChangeSelection = (newSelection: any) => {
    setSelection((prev) => ({ ...prev, ...newSelection }));
  };

  const handlePrerequisChange = (ids: number[]) => {
    setSelectedPrerequis(ids);
  };

  return (
    <div className="p-6 bg-gray-100 rounded shadow-md space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        🧪 Compositeur de Test Diagnostique
      </h1>

      {/* Sélection de la structure hiérarchique */}
      <section>
        <h2 className="text-xl font-semibold text-blue-800 mb-2">0. Choix du Chapitre</h2>
        <HierarchicalSelector
          showChapitre
          showObjectifs={false}
          onChange={handleChangeSelection}
        />
      </section>

      {/* Bloc 1 - Prérequis */}
      <section>
        <h2 className="text-xl font-semibold text-blue-800 mb-2">1. Choix des Prérequis</h2>
        <PrerequisSelector
  chapitreId={contextSelection.chapitreId}
  selectedPrerequis={selectedPrerequis}
  onChange={setSelectedPrerequis}
/>

{console.log("[TestComposer] Chapitre sélectionné:", selection.chapitreId)}

      </section>

      {/* Bloc 2 - Capacités */}
      {/* <section>
        <h2 className="text-xl font-semibold text-blue-800 mb-2">2. Compétences et Capacités</h2>
        <CapacitesSelector onChange={setSelectedCapacites} />
      </section> */}

      {/* Récapitulatif temporaire */}
      <section className="bg-white border p-4 rounded">
        <h3 className="font-medium text-gray-700 mb-2">🧾 Récapitulatif</h3>
        <p>Chapitre sélectionné : {selection.chapitreId || "Aucun"}</p>
        <p>Prérequis sélectionnés : {selectedPrerequis.join(", ") || "Aucun"}</p>
      </section>
    </div>
  );
};

export default TestComposer;
