import React, { ChangeEvent } from 'react';

// ============================================================
// 📌 Composant : SearchBar
// 🎯 Objectif :
//   - Fournir une barre de recherche réutilisable.
//   - Permettre de saisir un mot-clé pour effectuer une recherche dynamique.
// ============================================================

interface SearchBarProps {
  placeholder?: string; // Texte par défaut pour indiquer le rôle de la barre de recherche
  value: string; // Texte actuel dans la barre de recherche
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; // Fonction appelée lors de la modification du texte
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Rechercher...', value, onChange }) => {
  return (
    <div className="flex items-center">
      {/* Input de recherche */}
      <input
        type="text"
        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder} // Texte indicatif
        value={value} // Valeur actuelle
        onChange={onChange} // Appel de la fonction onChange lors des modifications
      />
    </div>
  );
};

export default SearchBar;
