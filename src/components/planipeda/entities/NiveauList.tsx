// ===========================================================================
// 📄 Fichier : NiveauxList.tsx
// 📁 Chemin : src/components/planipeda/entities/NiveauxList.tsx
// 🎯 Objectif : Afficher une liste de niveaux pédagogiques dans un tableau avec actions
// ===========================================================================

import React from "react";
import { Button } from "@/components/ui/button";

// Type de données pour un niveau
interface Niveau {
  id: number;
  nom_niveau: string;
}

// Props attendues
interface NiveauxListProps {
  niveaux: Niveau[];
  onEdit: (niveau: Niveau) => void;
}

const NiveauxList: React.FC<NiveauxListProps> = ({ niveaux, onEdit }) => {
return (
  <div className="niveau-list-container">
    {/* 🔹 Tableau des niveaux */}
    <table className="unite-table border-collapse border border-gray-300 w-full">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 px-4 py-2">Niveau</th>
          <th className="border border-gray-300 px-4 py-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {niveaux.length > 0 ? (
          niveaux.map((niveau) => (
            <tr key={niveau.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">{niveau.nom_niveau || "Non défini"}</td>
              <td className="border border-gray-300 px-4 py-2">
                <button
                  className="btn-edit bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  onClick={() => onEdit(niveau)}
                >
                  Modifier
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={2} className="text-center border border-gray-300 px-4 py-2 text-gray-500 italic">
              Aucun niveau enregistré.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);


};

export default NiveauxList;
