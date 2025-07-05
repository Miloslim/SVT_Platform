// src/pages/Planipeda.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom'; // Importation pour la gestion de la navigation
import DashboardOverview from '@/components/planipeda/entities/DashboardOverview';
//import StatsCards from '@/components/planipeda/StatsCards';
import RecentFichesTable from '@/components/planipeda/entities/RecentFichesTable';
import EntityQuickLinks from '@/components/planipeda/entities/EntityQuickLinks';
import '../styles/planipeda-styles.css';

/**
 * Composant principal pour la page de planification pédagogique
 * Affiche le tableau de bord avec les statistiques, le planning et les liens rapides
 */
const Planipeda: React.FC = () => {
  const navigate = useNavigate(); // Hook pour la navigation

  // SUPPRIMER : Cette fonction est redondante ici car la logique de navigation sera dans DashboardOverview
  // const handleCreateNewChapterPlan = () => {
  //   navigate('/planipeda/chapitre/planifier');
  // };

  return (
    <main className="planipeda-dashboard">
      <div className="dashboard-container p-6 space-y-6">
        {/* En-tête du tableau de bord */}
        {/* CORRECTION : Passer la prop navigate à DashboardOverview */}
        <DashboardOverview navigate={navigate} />

        {/* SUPPRIMER : Cette section est redondante et doit être retirée */}
        {/*
        <section className="new-chapter-plan-section text-center py-4">
          <button
            onClick={handleCreateNewChapterPlan}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition duration-200 ease-in-out"
          >
            ➕ Créer un Nouveau Plan de Chapitre
          </button>
        </section>
        */}

        {/* Cartes de statistiques */}
        {/* <section className="stats-section">
          <StatsCards />
        </section>*/}

        {/* Tableau de planification */}
        <section className="planning-section">
          <RecentFichesTable />
        </section>

        {/* Liens rapides vers les entités */}
        <section className="quicklinks-section">
          {/* Passer le navigate comme prop ou l'utiliser dans EntityQuickLinks */}
          <EntityQuickLinks navigate={navigate} />
        </section>
      </div>
    </main>
  );
};

export default Planipeda;