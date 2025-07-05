// src/components/common/CustomModal.ts

import React from 'react';

/**
 * Props pour le composant Modal.
 * - children: Le contenu à afficher à l'intérieur de la modale.
 * - isOpen: Booléen pour contrôler la visibilité de la modale.
 * - onClose: Fonction de rappel appelée lorsque la modale doit être fermée (clic sur le fond, échap).
 * - title: Titre de la modale (optionnel).
 */
interface CustomModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const CustomModal: React.FC<CustomModalProps> = ({ children, isOpen, onClose, title }) => {
  if (!isOpen) {
    return null; // Ne rend rien si la modale n'est pas ouverte
  }

  return (
    // Overlay semi-transparent qui prend tout l'écran
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Ferme la modale si on clique en dehors du contenu
    >
      {/* Contenu de la modale */}
      <div
        className="bg-white rounded-lg shadow-xl w-[90%] max-w-7xl max-h-[90vh] overflow-y-auto transform scale-100 opacity-100 transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()} // Empêche la fermeture quand on clique sur le contenu
      >
        {/* En-tête de la modale */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">{title || 'Modal'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
