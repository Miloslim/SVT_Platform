// src/components/ui/input.tsx

import React from "react";
import clsx from "clsx"; // Pour fusionner les classes dynamiquement

/* ============================================================================
   🧾 COMPOSANT INPUT (Champ de saisie classique)
============================================================================ */
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className="border p-2 rounded w-full focus:ring focus:ring-blue-300"
  />
);

/* ============================================================================
   📦 COMPOSANT CARD (Conteneur avec style)
============================================================================ */
type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={clsx("rounded-xl border bg-white p-6 shadow-sm", className)}>
      {children}
    </div>
  );
};

/* ============================================================================
   🔘 COMPOSANT BUTTON (Bouton stylisé)
============================================================================ */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className
      )}
    >
      {children}
    </button>
  );
};
