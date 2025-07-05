import React from 'react';
import Modal from '../common/Modal'; // Utilisation de la modale générique

// ============================================================
// 📌 Composant : ScoresModal
// 🎯 Objectif :
//   - Afficher une modale compacte pour effectuer une action sur les scores des élèves.
// ============================================================

const ScoresModal = ({ onClose }: { onClose: () => void }) => {
  // ============================================================
  // Rendu principal du composant
  // ============================================================
  return (
    <Modal title="Saisir les Notes" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault(); // Empêcher l'actualisation du formulaire
          alert('✅ Notes enregistrées avec succès !');
          onClose(); // Fermer la modale après soumission
        }}
      >
        {/* === Bouton de sauvegarde === */}
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Enregistrer
        </button>
      </form>
    </Modal>
  );
};

export default ScoresModal;
