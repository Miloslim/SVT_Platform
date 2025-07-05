// Placeholder content
import React from 'react';
import { Link } from 'react-router-dom'; // Utilisation pour les liens de navigation internes

// ============================================================
// 📌 Composant : Header
// 🎯 Objectif :
//   - Fournir un en-tête commun pour l'application.
//   - Inclure un titre et des options de navigation.
// ============================================================

const Header = () => {
  return (
    <header className="bg-blue-500 text-white shadow-md p-4 flex justify-between items-center">
      {/* === Titre de l'application === */}
      <h1 className="text-xl font-bold">
        <Link to="/" className="hover:text-blue-200">Gestion des Classes</Link>
      </h1>

      {/* === Barre de navigation === */}
      <nav>
        <ul className="flex gap-4">
          <li>
            <Link to="/dashboard" className="hover:text-blue-200">Tableau de Bord</Link>
          </li>
          <li>
            <Link to="/students" className="hover:text-blue-200">Élèves</Link>
          </li>
          <li>
            <Link to="/notes" className="hover:text-blue-200">Notes</Link>
          </li>
          <li>
            <Link to="/tracking" className="hover:text-blue-200">Absences</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
