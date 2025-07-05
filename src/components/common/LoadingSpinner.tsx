// Placeholder content
import React from 'react';

// ============================================================
// 📌 Composant : LoadingSpinner
// 🎯 Objectif :
//   - Fournir un indicateur de chargement visuel moderne.
//   - Réutilisable dans toute l'application pour indiquer un état de chargement.
// ============================================================

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500 border-solid border-opacity-70"></div>
    </div>
  );
};

export default LoadingSpinner;
