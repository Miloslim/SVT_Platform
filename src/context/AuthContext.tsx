// ============================================================
// 📌 Fichier : AuthContext.tsx
// 🎯 Objectif :
//   - Fournir une structure de contexte basique, sans authentification.
//   - Permettre une évolutivité future si des fonctionnalités sont ajoutées.
// ============================================================

import React, { createContext, useContext, useState } from "react";

// === Typage du contexte ===
interface AuthContextProps {
  user: null; // Pas d'utilisateur
  signIn: () => void; // Fonction vide pour connexion (placeholder)
  signOut: () => void; // Fonction vide pour déconnexion (placeholder)
}

// === Création du contexte ===
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// === Fournisseur de contexte ===
export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<null>(null); // Pas d'état utilisateur

  // Placeholder pour les fonctions de connexion et déconnexion
  const signIn = () => {
    console.log("Fonction signIn appelée (non implémentée)");
  };

  const signOut = () => {
    console.log("Fonction signOut appelée (non implémentée)");
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// === Hook pour utiliser le contexte ===
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }

  return context;
};
