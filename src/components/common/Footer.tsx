// ============================================================
// 📌 Fichier : Footer.tsx
// 🎯 Objectif :
//   - Afficher un pied de page global pour l'application.
// ============================================================

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 text-center">
      <p className="text-sm">
        © {new Date().getFullYear()} Mon Application. Tous droits réservés.
      </p>
    </footer>
  );
};

export default Footer;
