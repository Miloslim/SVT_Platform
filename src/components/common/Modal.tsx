import React, { useEffect } from 'react';

// ============================================================
// 📌 Composant : Modal
// 🎯 Objectif :
//   - Fournir une fenêtre contextuelle (modale) réutilisable.
//   - Permettre l'affichage de contenu dynamique avec un bouton de fermeture.
// ============================================================

interface ModalProps {
  title: string; // Titre de la modale
  children: React.ReactNode; // Contenu de la modale
  onClose: () => void; // Fonction appelée pour fermer la modale
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose }) => {
  // ============================================================
  // Effet : Gestion de la fermeture avec la touche "Escape"
  // ============================================================
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose(); // Fermer la modale
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown); // Nettoyage de l'événement
    };
  }, [onClose]);

  // ============================================================
  // Rendu du composant
  // ============================================================
  return (
    <div
      className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50"
      aria-labelledby="modal-title" // Associé au titre pour l'accessibilité
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white p-6 rounded-lg shadow-md w-1/3 relative">
        {/* === Titre de la modale === */}
        <h2 id="modal-title" className="text-xl font-bold mb-4">
          {title}
        </h2>

        {/* === Contenu dynamique de la modale === */}
        <div>{children}</div>

        {/* === Bouton de fermeture === */}
        <button
          className="absolute top-3 right-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          onClick={onClose}
          aria-label="Fermer la modale"
        >
          X
        </button>

        {/* === Bouton pour fermer depuis le bas === */}
        <button
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded w-full hover:bg-red-600"
          onClick={onClose}
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default Modal;
