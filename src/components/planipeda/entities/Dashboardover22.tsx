// src/pages/Dashboardover22.tsx (ou là où se trouve votre composant Dashboard)

import React from 'react';
import { useNavigate } from 'react-router-dom'; // Importez useNavigate

// Supposons que vous ayez d'autres imports ici, comme par exemple:
// import SomeDashboardCard from '../components/DashboardCard';
// import { useAuth } from '../context/AuthContext'; // Si vous utilisez le contexte d'auth

const Dashboard: React.FC = () => {
  const navigate = useNavigate(); // Initialisez le hook de navigation

  // Fonction pour gérer le clic sur le bouton "Créer une fiche"
  const handleCreateNewChapterPlan = () => {
    // Navigue vers la route de notre éditeur de planification de chapitre
    // Assurez-vous que ce chemin correspond à celui défini dans App.tsx
    navigate('/planipeda/chapitre/planifier');
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Tableau de Bord</h1>

      {/* Section pour les actions rapides ou les boutons principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/*
          C'est ici que vous auriez le bouton "Créer une Fiche"
          Remplacez ou adaptez votre bouton existant.
        */}
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Planification</h2>
          <p className="text-gray-600 text-center mb-4">Commencez à composer un nouveau chapitre pédagogique.</p>
          <button
            onClick={handleCreateNewChapterPlan} // Appelle notre fonction de navigation
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            Créer un Plan de Chapitre
          </button>
        </div>

        {/* Autres cartes ou sections de votre tableau de bord existantes */}
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Gestion des Classes</h2>
          <p className="text-gray-600 text-center mb-4">Accéder et gérer vos classes et élèves.</p>
          <button
            onClick={() => navigate('/class-management')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            Aller aux Classes
          </button>
        </div>

        {/* Ajoutez d'autres sections ou liens si nécessaire */}
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Vos Activités</h2>
          <p className="text-gray-600 text-center mb-4">Consultez et modifiez vos activités pédagogiques.</p>
          <button
            onClick={() => navigate('/planipeda/activites')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            Voir les Activités
          </button>
        </div>
      </div>

      {/* Le reste de votre tableau de bord... */}
    </div>
  );
};

export default Dashboard;