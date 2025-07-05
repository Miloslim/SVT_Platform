import React, { ChangeEvent } from "react";

// ============================================================
// 📌 Composant : SearchFilter
// 🎯 Objectif :
//   - Fournir une barre de recherche pour filtrer les élèves.
//   - Ajouter un menu déroulant permettant de filtrer par classe.
// ============================================================

// === Typage des props pour le composant ===
interface SearchFilterProps {
  searchQuery: string; // Terme de recherche actuel
  filterClass: string; // Classe sélectionnée pour le filtrage
  setSearchQuery: (query: string) => void; // Fonction pour mettre à jour le terme de recherche
  setFilterClass: (classe: string) => void; // Fonction pour mettre à jour la classe sélectionnée
  classes: { id: number; class_name: string }[]; // Liste des classes disponibles dans la table `classes`
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchQuery,
  filterClass,
  setSearchQuery,
  setFilterClass,
  classes,
}) => {
  // ============================================================
  // Fonction : Mise à jour du terme de recherche (texte)
  // ============================================================
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value); // Mettre à jour la recherche dans l'état du parent
  };

  // ============================================================
  // Fonction : Mise à jour de la classe sélectionnée dans le menu déroulant
  // ============================================================
  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilterClass(e.target.value); // Mettre à jour la classe filtrée dans l'état du parent
  };

  // ============================================================
  // Rendu du composant
  // ============================================================
  return (
    <div className="p-4 bg-gray-100 rounded shadow-md">
      {/* === Barre de recherche === */}
      <input
        type="text"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Rechercher par nom, prénom ou code..."
        className="w-1/2 p-2 border rounded"
      />

      {/* === Menu déroulant pour filtrer par classe === */}
      <select
        value={filterClass}
        onChange={handleFilterChange}
        className="w-1/2 p-2 border rounded"
      >
        {/* Option par défaut : Toutes les classes */}
        <option value="">Toutes les classes</option>

        {/* Générer dynamiquement les options à partir de la liste `classes` */}
        {classes.map((classe) => (
          <option key={classe.id} value={classe.id}>
            {classe.class_name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SearchFilter;
