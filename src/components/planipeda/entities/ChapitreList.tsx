/**
 * 📌 Fichier : ChapitreList.tsx
 * 📍 Chemin : src/components/planipeda/entities/ChapitreList.tsx
 * 🎯 Objectif : Affichage des chapitres avec leurs unités, options et niveaux, et ajout du bouton Modifier.
 * 🛠️ Fonctionnalités :
 *    - Affichage des chapitres sous forme de tableau.
 *    - Affichage du niveau, de l'option et de l'unité associés à chaque chapitre.
 *    - Ajout d'un bouton Modifier pour chaque chapitre.
 */

import React from "react";

// 🔹 Définition de l'interface Chapitre
interface Chapitre {
  id: number;
  titre_chapitre: string;
  unite_id: number;
  unite_nom: string;
  option_nom: string;
  niveau_nom: string;
}

// 🔹 Définition des props du composant
interface Props {
  chapitres: Chapitre[];
  onEdit: (chapitre: Chapitre) => void;
}

// 🔹 Composant `ChapitreList`
// Affiche un tableau contenant les chapitres avec leurs infos associées
const ChapitreList: React.FC<Props> = ({ chapitres, onEdit }) => {
return (
  <div className="unite-list-container">
    <table className="unite-table border-collapse border border-gray-300 w-full">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 px-4 py-2">Niveau</th>
          <th className="border border-gray-300 px-4 py-2">Option</th>
          <th className="border border-gray-300 px-4 py-2">Unité</th>
          <th className="border border-gray-300 px-4 py-2">Chapitre</th>
          <th className="border border-gray-300 px-4 py-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {chapitres.length > 0 ? (
          chapitres.map((chapitre) => (
            <tr key={chapitre.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">{chapitre.niveau_nom || "Non défini"}</td>
              <td className="border border-gray-300 px-4 py-2">{chapitre.option_nom || "Non défini"}</td>
              <td className="border border-gray-300 px-4 py-2">{chapitre.unite_nom || "Non défini"}</td>
              <td className="border border-gray-300 px-4 py-2">{chapitre.titre_chapitre}</td>
              <td className="border border-gray-300 px-4 py-2">
                <button
                  className="btn-edit bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  onClick={() => onEdit(chapitre)}
                >
                  Modifier
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5} className="text-center border border-gray-300 px-4 py-2">
              Aucun chapitre à afficher
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);


};

export default ChapitreList;
