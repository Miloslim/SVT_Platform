// 📁 src/components/planipeda/EntityQuickLinks.tsx

/**
 * Nom du Fichier: EntityQuickLinks.tsx
 * Chemin: src/components/planipeda/EntityQuickLinks.tsx
 *
 * Fonctionnalités:
 * - Affiche une grille de liens rapides vers les différentes entités pédagogiques.
 * - Inclut un nouveau lien vers le tableau de bord des "Fiches de Planification de Chapitre".
 * - Utilise un style de "carte" pour chaque lien, avec des icônes et des couleurs distinctes.
 * - Gère la navigation vers les chemins spécifiés.
 */

import React from "react";
import { Button } from "@/components/ui/button"; // Votre composant bouton personnalisé (si utilisé)
import {
  BookOpen, Cog, Target, Bookmark,
  Layers, ListOrdered, Activity, GraduationCap,
  NotebookText // Nouvelle icône pour les fiches de planification
} from "lucide-react"; // Importe les icônes nécessaires

// --- Définition des Types ---

// Interface pour la structure de chaque lien rapide
interface QuickLink {
  label: string; // Texte affiché sur la carte du lien
  icon: React.ReactNode; // Composant d'icône (ici Lucide React)
  color: string; // Classe de couleur Tailwind pour l'icône et le texte
  path: string; // Chemin de navigation associé au lien
}

// Props pour le composant EntityQuickLinks
interface EntityQuickLinksProps {
  navigate: (path: string) => void; // Fonction de navigation passée par le composant parent
}

// --- Composant Fonctionnel : EntityQuickLinks ---
const EntityQuickLinks: React.FC<EntityQuickLinksProps> = ({ navigate }) => {

  // Définition des liens rapides avec leurs propriétés
  const links: QuickLink[] = [
    // NOUVEAU LIEN : Vers le tableau de bord des Fiches de Planification
    {
      label: "Fiches Planification",
      icon: <NotebookText size={24} />, // Icône de cahier pour les plans
      color: "text-teal-600", // Couleur distincte pour le nouveau lien
      path: "/planipeda/planification-chapitre" // Chemin de la page de liste des fiches
    },
    { label: "Niveaux", icon: <GraduationCap size={24} />, color: "text-indigo-600", path: "/planipeda/niveaux" },
    { label: "Options", icon: <Cog size={24} />, color: "text-gray-600", path: "/planipeda/options" },
    { label: "Unités", icon: <Layers size={24} />, color: "text-blue-600", path: "/planipeda/unites" },
    { label: "Chapitres", icon: <BookOpen size={24} />, color: "text-green-600", path: "/planipeda/chapitres" },
    { label: "Séquences", icon: <ListOrdered size={24} />, color: "text-purple-600", path: "/planipeda/sequences" },
    { label: "Activités", icon: <Activity size={24} />, color: "text-red-600", path: "/planipeda/activites" },
    { label: "Évaluations", icon: <Bookmark size={24} />, color: "text-yellow-600", path: "/planipeda/evaluations" },
    { label: "Objectifs", icon: <Target size={24} />, color: "text-pink-600", path: "/planipeda/objectifs" }
  ];

  // --- Rendu du Composant ---
  return (
    <section className="planning-module bg-white p-6 rounded-lg shadow-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Accès Rapide aux Entités Pédagogiques</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {/* Mappe sur le tableau des liens pour créer chaque carte */}
        {links.map((link, idx) => (
          <button
            key={idx}
            onClick={() => navigate(link.path)}
            className={`
              flex flex-col items-center justify-center p-5 rounded-lg shadow-md
              bg-gray-50 border border-gray-200 cursor-pointer
              hover:shadow-lg hover:border-blue-300 hover:bg-gray-100 transform hover:scale-102
              transition duration-200 ease-in-out text-center
            `}
            aria-label={`Accéder à ${link.label}`}
            title={`Cliquer pour gérer les ${link.label}`}
          >
            {/* Conteneur de l'icône avec la couleur dynamique */}
            <div className={`mb-2 ${link.color}`}>
              {link.icon}
            </div>
            {/* Texte du lien avec la couleur dynamique */}
            <span className={`font-semibold text-sm ${link.color}`}>
              {link.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default EntityQuickLinks;
