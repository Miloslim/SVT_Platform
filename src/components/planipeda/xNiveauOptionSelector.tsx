// 📁 src/components/planipeda/NiveauOptionSelector.tsx

import React from 'react';

interface NiveauOptionSelectorProps {
  onNiveauChange: (niveau: string) => void;
  onOptionChange: (option: string) => void;
}

const NiveauOptionSelector: React.FC<NiveauOptionSelectorProps> = ({ onNiveauChange, onOptionChange }) => {
  return (
    <div className="p-4 bg-white shadow rounded-lg mb-6">
      <h2 className="text-lg font-bold">Sélection du Niveau et de l'Option</h2>
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Sélectionnez un Niveau</label>
        <select onChange={(e) => onNiveauChange(e.target.value)} className="w-full p-2 border rounded mt-2">
          <option value="niveau1">Niveau 1</option>
          <option value="niveau2">Niveau 2</option>
          <option value="niveau3">Niveau 3</option>
        </select>
      </div>
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Sélectionnez une Option</label>
        <select onChange={(e) => onOptionChange(e.target.value)} className="w-full p-2 border rounded mt-2">
          <option value="optionA">Option A</option>
          <option value="optionB">Option B</option>
          <option value="optionC">Option C</option>
        </select>
      </div>
    </div>
  );
};

export default NiveauOptionSelector;
