/**
 * 📌 Fichier : UniteList.tsx
 * 📍 Chemin : src/components/planipeda/entities/UniteList.tsx
 * 🎯 Objectif : Affichage des unités dans un tableau avec leurs niveaux et options associés.
 * 🛠️ Fonctionnalités :
 * - Affichage tabulaire des unités.
 * - Affichage des propriétés `niveau_nom` et `option_nom` pour chaque unité.
 * - Bouton "Modifier" pour chaque ligne, qui déclenche la fonction `onEdit` avec l'unité correspondante.
 * - Message si aucune unité n'est à afficher.
 */

import React from "react";

// --- Définition de l'interface Unite (similaire à celle de UnitesPage.tsx, mais avec les noms pré-calculés) ---
interface Unite {
  id: number;
  titre_unite: string;
  niveau_nom: string; // Nom du niveau, déjà calculé dans la page parente
  option_nom: string; // Nom de l'option, déjà calculé dans la page parente
}

// --- Définition des props du composant UniteList ---
interface Props {
  unites: Unite[]; // Tableau des unités à afficher
  onEdit: (unite: Unite) => void; // Fonction de callback pour l'édition d'une unité
}

// --- Composant fonctionnel UniteList ---
const UniteList: React.FC<Props> = ({ unites, onEdit }) => {
  return (
    <div className="unite-list-container overflow-x-auto"> {/* Ajout de overflow-x-auto pour les petits écrans */}
      {/* --- Tableau des unités --- */}
      <table className="unite-table border-collapse border border-gray-300 w-full min-w-[600px]"> {/* min-w pour éviter l'écrasement */}
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left">Niveau</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Option</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Unité</th>
            <th className="border border-gray-300 px-4 py-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {unites.length > 0 ? (
            // Si des unités sont présentes, on les mappe pour créer les lignes du tableau
            unites.map((unite) => (
              <tr key={unite.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{unite.niveau_nom || "Non défini"}</td>
                <td className="border border-gray-300 px-4 py-2">{unite.option_nom}</td>
                <td className="border border-gray-300 px-4 py-2">{unite.titre_unite}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <button
                    className="btn-edit bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors duration-200"
                    onClick={() => onEdit(unite)} // Appel de la fonction onEdit avec l'unité actuelle
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            ))
          ) : (
            // Si aucune unité, affiche un message
            <tr>
              <td colSpan={4} className="text-center border border-gray-300 px-4 py-2 text-gray-500">
                Aucune unité à afficher.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UniteList;