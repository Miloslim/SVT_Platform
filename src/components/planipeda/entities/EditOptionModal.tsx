import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/backend/config/supabase";

interface Option {
  id: number;
  nom_option: string;
}

interface EditOptionModalProps {
  open: boolean;
  option: Option | null;
  onClose: () => void;
  onUpdated: () => void;
}

const EditOptionModal: React.FC<EditOptionModalProps> = ({ open, option, onClose, onUpdated }) => {
  const [nomOption, setNomOption] = useState(option?.nom_option || "");

  // Met à jour l'état si l'option change
  React.useEffect(() => {
    setNomOption(option?.nom_option || "");
  }, [option]);

  const handleUpdate = async () => {
    if (!option || !nomOption.trim()) return;

    const { error } = await supabase
      .from("options")
      .update({ nom_option: nomOption.trim() })
      .eq("id", option.id);

    if (error) {
      console.error("Erreur lors de la mise à jour :", error);
      alert("Échec de la mise à jour");
    } else {
      onUpdated();
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!option) return;

    const confirmDelete = window.confirm("Voulez-vous vraiment supprimer cette option ?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("options").delete().eq("id", option.id);

    if (error) {
      console.error("Erreur lors de la suppression :", error);
      alert("Échec de la suppression");
    } else {
      onUpdated();
      onClose();
    }
  };

  if (!open || !option) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-semibold text-center">Modifier l'option</h2>

        {/* Champ pour modifier le nom de l'option */}
        <div className="space-y-1">
          <label htmlFor="editNomOption" className="block font-medium">
            Nom de l'option
          </label>
          <input
            id="editNomOption"
            type="text"
            value={nomOption}
            onChange={(e) => setNomOption(e.target.value)}
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-between pt-4">
          <Button variant="destructive" onClick={handleDelete}>
            Supprimer
          </Button>
          <div className="space-x-2">
            <Button onClick={handleUpdate}>Mettre à jour</Button>
            <Button onClick={onClose} variant="outline">
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOptionModal;
