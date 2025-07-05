/**
 * 📌 Fichier : ObjectifList.tsx
 * 📍 Chemin : src/components/planipeda/entities/ObjectifList.tsx
 * 🎯 Objectif : Affichage des objectifs pédagogiques liés à un chapitre, avec unité associée, dans un tableau.
 * 🛠️ Fonctionnalités :
 * - Affiche unité, chapitre, type, description et action modifier.
 */

import React from "react";

// 🔹 Interface Objectif enrichie avec unite_nom
interface Objectif {
  id: number;
  chapitre_id: number;
  objectif_type: string;
  description_objectif: string;
  chapitre_nom: string;
  unite_nom: string; // nouveau champ
}

interface Props {
  objectifs: Objectif[];
  onEdit: (objectif: Objectif) => void;
}

const ObjectifList: React.FC<Props> = ({ objectifs, onEdit }) => {
  return (
    <div className="objectif-list-container">
      <table className="objectif-table border-collapse border border-gray-300 w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2">Unité</th>
            <th className="border border-gray-300 px-4 py-2">Chapitre</th>
            <th className="border border-gray-300 px-4 py-2">Type</th>
            <th className="border border-gray-300 px-4 py-2">Description</th>
            <th className="border border-gray-300 px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {objectifs.length > 0 ? (
            objectifs.map((objectif) => (
              <tr key={objectif.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{objectif.unite_nom}</td>
                <td className="border border-gray-300 px-4 py-2">{objectif.chapitre_nom}</td>
                <td className="border border-gray-300 px-4 py-2">{objectif.objectif_type}</td>
                <td className="border border-gray-300 px-4 py-2">{objectif.description_objectif}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <button
                    className="btn-edit bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    onClick={() => onEdit(objectif)}
                    aria-label={`Modifier objectif ${objectif.id}`}
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center border border-gray-300 px-4 py-2">
                Aucun objectif à afficher
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ObjectifList;