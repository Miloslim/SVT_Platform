// src/components/planipeda/entities/DashboardOverview.tsx

import React from 'react';

interface DashboardOverviewProps {
  navigate: (path: string) => void; // On attend une fonction de navigation en prop
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ navigate }) => {
  return (
    <section className="dashboard-overview bg-white p-6 rounded-lg shadow-lg">
  {/* En-tête principal du tableau de bord + Bouton principal déplacé */}
  <div className="text-gray-800 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div>
      <h1 className="text-3xl font-extrabold mb-2">Bienvenue sur Planipeda !</h1>
      <p className="text-lg text-gray-600">Votre plateforme intuitive pour la gestion pédagogique.</p>
    </div>
<button
  onClick={() => navigate('/planipeda/planification-chapitre/nouveau')}
  className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
>
  ➕ Créer un Plan de Chapitre
</button>

 
  </div>

  {/* Section des actions rapides / boutons principaux */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Carte 1: Vos Séquences */}
    <div className="bg-purple-50 p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center border-l-4 border-purple-600">
      <h2 className="text-xl font-semibold text-purple-800 mb-3">Vos Séquences</h2>
      <p className="text-gray-600 text-sm mb-4">Consultez, créez ou modifiez les séquences pédagogiques</p>
      <button
        onClick={() => navigate('/planipeda/sequences')}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
      >
        Voir les Séquences
      </button>
    </div>

    {/* Carte 2: Vos Activités */}
    <div className="bg-green-50 p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center border-l-4 border-green-600">
      <h2 className="text-xl font-semibold text-green-800 mb-3">Vos Activités</h2>
      <p className="text-gray-600 text-sm mb-4">Consultez, modifiez et gérez toutes vos activités pédagogiques existantes.</p>
      <button
        onClick={() => navigate('/planipeda/activites')}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
      >
        Voir les Activités
      </button>
    </div>

    {/* Carte 3: Vos Évaluations */}
    <div className="bg-red-50 p-6 rounded-lg shadow-md flex flex-col items-center justify-center text-center border-l-4 border-red-600">
      <h2 className="text-xl font-semibold text-red-800 mb-3">Vos Évaluations</h2>
      <p className="text-gray-600 text-sm mb-4">Accédez à vos évaluations existantes pour les modifier ou les réutiliser.</p>
      <button
        onClick={() => navigate('/planipeda/evaluations')}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
      >
        Voir les Évaluations
      </button>
    </div>
  </div>
</section>

  );
};

export default DashboardOverview;