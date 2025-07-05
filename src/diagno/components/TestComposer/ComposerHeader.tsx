// src/diagno/components/TestComposer/ComposerHeader.tsx
import React from 'react';

// Définition des propriétés que le composant attend de son parent
interface ComposerHeaderProps {
  testTitle: string;
  onTitleChange: (newTitle: string) => void;
  testDuration: number | ''; // Permet une chaîne vide pour le placeholder
  onDurationChange: (newDuration: number | '') => void;
  selectedClass: string;
  onClassChange: (newClass: string) => void;
  onSaveTest: () => void;
}

const ComposerHeader: React.FC<ComposerHeaderProps> = ({
  testTitle,
  onTitleChange,
  testDuration,
  onDurationChange,
  selectedClass,
  onClassChange,
  onSaveTest,
}) => {
  return (
    <header className="bg-white p-4 shadow-md rounded-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Création de Test Diagnostique</h1>
        <button
          onClick={onSaveTest}
          className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        >
          Enregistrer le Test
        </button>
      </div>

      <div className="space-y-4"> {/* Utilisation de space-y pour espacer les champs */}
        {/* Champ Titre du test */}
        <div>
          <label htmlFor="testTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Titre du test :
          </label>
          <input
            type="text"
            id="testTitle"
            value={testTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Ex: Diagnostic SVT Seconde - Chapitre 1"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Champ Durée du test */}
        <div>
          <label htmlFor="testDuration" className="block text-sm font-medium text-gray-700 mb-1">
            Durée estimée (minutes) :
          </label>
          <input
            type="number"
            id="testDuration"
            value={testDuration}
            onChange={(e) => onDurationChange(e.target.value === '' ? '' : parseInt(e.target.value))}
            placeholder="Ex: 60"
            min="1"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Sélection de la Classe concernée */}
        <div>
          <label htmlFor="testClass" className="block text-sm font-medium text-gray-700 mb-1">
            Classe concernée :
          </label>
          <select
            id="testClass"
            value={selectedClass}
            onChange={(e) => onClassChange(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Sélectionnez une classe</option>
            <option value="Seconde">Seconde</option>
            <option value="Premiere">Première</option>
            <option value="Terminale">Terminale</option>
            {/* Vous pourriez mapper ici des options récupérées d'une base de données */}
          </select>
        </div>
      </div>
    </header>
  );
};

export default ComposerHeader;