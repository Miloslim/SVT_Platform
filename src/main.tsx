// ============================================================
// 📌 Fichier : main.tsx
// 🎯 Objectif :
//   - Point d'entrée principal de l'application React.
//   - Monte l'application dans le DOM avec ReactDOM.
//   - Applique les styles globaux.
// ============================================================

// === Importations principales ===
import React from 'react'; // Import du moteur React
import ReactDOM from 'react-dom/client'; // API pour monter l'application React
import App from './App'; // Composant principal contenant les routes et contextes
import './index.css'; // Styles globaux de l'application

// ============================================================
// 📌 Rendu du composant principal
// 🎯 Utilise React.StrictMode pour activer les vérifications strictes.
// ============================================================
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
