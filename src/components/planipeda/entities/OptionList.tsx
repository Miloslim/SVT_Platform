// src/components/planipeda/entities/OptionList.tsx
import React from "react";
import { Button } from "@/components/ui/button";

// Interface Option avec 'niveau' optionnel ou nullable
interface Option {
  id: number;
  nom_option: string;
  // 'niveau' peut être un objet avec nom_niveau ou null/undefined
  niveau?: {
    nom_niveau: string;
  } | null;
}

interface OptionListProps {
  options: Option[];
  onEdit: (option: Option) => void;
}

const OptionList: React.FC<OptionListProps> = ({ options, onEdit }) => {
  return (
    <div className="unite-list-container">
      {/* Titre de la liste */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Liste des Options</h2>
      </div>

      {/* Affichage conditionnel selon présence d'options */}
      {options.length === 0 ? (
        <p className="text-center text-gray-500 italic">
          Aucune option enregistrée
        </p>
      ) : (
        <table className="unite-table border-collapse border border-gray-300 w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Nom de l'option</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Niveau</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => (
              <tr key={option.id} className="hover:bg-gray-50">
                {/* Nom de l'option */}
                <td className="border border-gray-300 px-4 py-2">{option.nom_option}</td>

                {/* 
                  Affichage du niveau :
                  - si option.niveau existe et nom_niveau est défini, l'afficher
                  - sinon afficher "Non défini"
                */}
                <td className="border border-gray-300 px-4 py-2">
                  {option.niveau && option.niveau.nom_niveau
                    ? option.niveau.nom_niveau
                    : "Non défini"}
                </td>

                {/* Bouton Modifier */}
                <td className="border border-gray-300 px-4 py-2">
                  <button
                    className="btn-edit bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    onClick={() => onEdit(option)}
                  >
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OptionList;
