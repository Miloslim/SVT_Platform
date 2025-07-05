// ============================================================
// 📌 Fichier : NoteModal.tsx
// 🎯 Objectif :
//   - Permettre la saisie ou modification des notes des élèves
//     (CC1, CC2, CC3, et Note Activité - c_act).
//   - Validation stricte des entrées : format numérique ≤ 20.
//   - Sauvegarder les données via Supabase et fermer la modale
//     après succès.
// ============================================================

// === Importations nécessaires ===
import React, { useState } from "react";
import { supabase } from "../../backend/config/supabase"; // Import de la configuration Supabase

// === Typage des props du composant ===
interface NoteModalProps {
  student: {
    student_code: string;
    first_name: string;
    last_name: string;
    student_scores?: {
      cc1?: number;
      cc2?: number;
      cc3?: number;
      c_act?: number;
    };
  };
  onClose: () => void; // Fonction appelée pour fermer la modale
  onSave: () => void; // Fonction appelée pour rafraîchir les données
}

// === Composant principal ===
const NoteModal: React.FC<NoteModalProps> = ({ student, onClose, onSave }) => {
  // === États locaux pour les notes ===
  const [cc1, setCc1] = useState<string>(student.student_scores?.cc1?.toString() || "");
  const [cc2, setCc2] = useState<string>(student.student_scores?.cc2?.toString() || "");
  const [cc3, setCc3] = useState<string>(student.student_scores?.cc3?.toString() || "");
  const [cAct, setCAct] = useState<string>(student.student_scores?.c_act?.toString() || "");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // ============================================================
  // Fonction : Valider les notes avant sauvegarde
  // ============================================================
  const isValidNote = (note: string): boolean => {
    const parsedNote = parseFloat(note);
    return !isNaN(parsedNote) && parsedNote >= 0 && parsedNote <= 20; // Validation stricte
  };

  // ============================================================
  // Fonction : Sauvegarder les données
  // ============================================================
  const handleSave = async () => {
    // Valider les notes
    if (![cc1, cc2, cc3, cAct].every((note) => note === "" || isValidNote(note))) {
      alert("❌ Les notes doivent être comprises entre 0 et 20.");
      return;
    }

    try {
      setIsSaving(true); // Activer l'indicateur de sauvegarde

      const { error } = await supabase
        .from("student_scores")
        .upsert(
          {
            student_code: student.student_code, // Identifiant unique
            cc1: cc1 === "" ? null : parseFloat(cc1).toFixed(2),
            cc2: cc2 === "" ? null : parseFloat(cc2).toFixed(2),
            cc3: cc3 === "" ? null : parseFloat(cc3).toFixed(2),
            c_act: cAct === "" ? null : parseFloat(cAct).toFixed(2),
          },
          { onConflict: ["student_code"] }
        );

      if (error) throw new Error(error.message);

      // Message de confirmation
      alert("✅ Notes sauvegardées avec succès !");

      // Appeler les fonctions onSave et onClose
      if (typeof onSave === "function") {
        onSave(); // Rafraîchir les données
      }
      onClose(); // Fermer la modale
    } catch (err) {
      console.error("❌ Erreur lors de la sauvegarde des notes :", err.message);
      alert(`Une erreur est survenue : ${err.message}`);
    } finally {
      setIsSaving(false); // Désactiver l'indicateur de sauvegarde
    }
  };

  // ============================================================
  // Rendu du composant
  // ============================================================
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <h3 className="text-lg font-bold mb-4">
          Saisir les Notes - {student.first_name} {student.last_name}
        </h3>

        {/* === Champs de saisie des notes === */}
        {["CC1", "CC2", "CC3", "Note Activité"].map((label, index) => (
          <div key={label} className="mb-4">
            <label className="block text-gray-700">{label}</label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.01"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={[cc1, cc2, cc3, cAct][index]}
              onChange={(e) => {
                const newValues = [setCc1, setCc2, setCc3, setCAct];
                newValues[index](e.target.value);
              }}
            />
          </div>
        ))}

        {/* === Boutons de contrôle === */}
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={onClose}
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Enregistrement..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;
