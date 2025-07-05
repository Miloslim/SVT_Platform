import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/backend/config/supabase";

interface EntityOptionModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  placeholder: string;
  niveaux: Array<{ id: number; nom_niveau: string }>;
}

const EntityOptionModal: React.FC<EntityOptionModalProps> = ({
  open,
  onClose,
  onSaved,
  placeholder,
  niveaux,
}) => {
  const [nomOption, setNomOption] = useState("");
  const [niveauId, setNiveauId] = useState("");

const handleSave = async () => {
  if (!nomOption.trim() || !niveauId) {
    alert("Veuillez remplir tous les champs.");
    return;
  }

  // Création des données à insérer
  const dataToInsert = {
    nom_option: nomOption.trim(),
    niveau_id: parseInt(niveauId),
  };

  // Log des données envoyées à Supabase
 // console.log("Données envoyées à Supabase :", dataToInsert);

  // Insertion dans Supabase
  const { data, error } = await supabase.from("options").insert([dataToInsert]);

  // Log de la réponse de Supabase
//  console.log("Réponse de Supabase :", data, error);

  if (error) {
    console.error("Erreur lors de l'ajout de l'option :", error);
    alert("Erreur lors de l'ajout. Veuillez réessayer.");
  } else {
    onSaved();
    onClose();
    setNomOption("");
    setNiveauId("");
  }
};

  if (!open) return null;

  return (
    // ✅ Fond sombre avec modale centrée
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold text-center">Ajouter une nouvelle option</h2>

        {/* Sélecteur de niveau */}
        <div className="space-y-1">
          <label htmlFor="niveauSelect" className="block font-medium">
            Niveau associé
          </label>
          <select
            id="niveauSelect"
            value={niveauId}
            onChange={(e) => setNiveauId(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
          >
            <option value="">-- Sélectionnez un niveau --</option>
            {niveaux.map((niveau) => (
              <option key={niveau.id} value={niveau.id}>
                {niveau.nom_niveau}
              </option>
            ))}
          </select>
        </div>

        {/* Champ texte nom de l’option */}
        <div className="space-y-1">
          <label htmlFor="nomOption" className="block font-medium">
            Nom de l'option
          </label>
          <input
            id="nomOption"
            type="text"
            value={nomOption}
            onChange={(e) => setNomOption(e.target.value)}
            placeholder={placeholder}
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2">
          <Button onClick={handleSave}>Ajouter</Button>
          <Button onClick={onClose} variant="outline">
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EntityOptionModal;
