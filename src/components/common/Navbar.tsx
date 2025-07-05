// ============================================================
// 📌 Fichier : Navbar.tsx
// 🎯 Objectif :
//   - Afficher une barre de navigation globale pour l'application.
// ============================================================

import React from 'react';
import { Link } from 'react-router-dom'; // Navigation avec React Router

const Navbar: React.FC = () => {
  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="text-lg font-bold">
          <Link to="/">Mon Application</Link>
        </div>

        {/* Liens de navigation */}
        <ul className="flex gap-4">
          <li>
            <Link to="/" className="hover:underline">
              Accueil
            </Link>
          </li>
          <li>
            <Link to="/about" className="hover:underline">
              À propos
            </Link>
          </li>
          <li>
            <Link to="/contact" className="hover:underline">
              Contact
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
