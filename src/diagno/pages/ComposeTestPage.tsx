// =============================================================
// 📄 Fichier : CompositeurTestPage.tsx
// 📁 Chemin : src/components/diagno/CompositeurTestPage.tsx
// 📌 Description : Interface principale du compositeur de test
// =============================================================

import React, { useState, useEffect } from 'react';
import HierarchicalSelectorNew from '@/diagno/components/TestComposer/HierarchicalSelectorNew';
import PrerequisSelector from '@/diagno/components/TestComposer/PrerequisSelector';

const CompositeurTestPage: React.FC = () => {
  // 🧭 Contexte sélectionné (niveau > option > unité > chapitre)
  const [contextSelection, setContextSelection] = useState<{
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

  // ✅ Prérequis sélectionnés
  const [selectedPrerequis, setSelectedPrerequis] = useState<number[]>([]);

  // 🛠 Pour logguer la sélection en debug
  useEffect(() => {
    console.log("[CompositeurTestPage] 🎯 Contexte mis à jour :", contextSelection);
  }, [contextSelection]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">🧪 Compositeur de Test Diagnostique</h1>

      {/* 🎓 Bloc 1 : Sélection du contexte pédagogique */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h2 className="font-semibold text-lg mb-2">🎓 Contexte de la classe</h2>
        <HierarchicalSelectorNew
          showChapitre={true}
          showObjectifs={false}
          onChange={(selection) => {
            setContextSelection(selection);
          }}
        />
      </div>

      {/* 📌 Bloc 2 : Sélection des prérequis liés au chapitre */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h2 className="font-semibold text-lg mb-2">📌 Prérequis à diagnostiquer</h2>
        <PrerequisSelector
          chapitreId={contextSelection.chapitreId}
          selectedPrerequis={selectedPrerequis}
          onChange={setSelectedPrerequis}
        />
      </div>

      {/* 🔧 Bloc 3 : Capacités/habiletés (à venir) */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h2 className="font-semibold text-lg mb-2">🛠 Capacités et habiletés (bientôt)</h2>
        <p className="text-gray-500 italic">
          Module à venir pour sélectionner les compétences cognitives ou procédurales à mobiliser.
        </p>
      </div>
    </div>
  );
};

export default CompositeurTestPage;
