// 📁 src/utils/utils.ts
import { clsx } from "clsx"; // Importation de la bibliothèque clsx pour gérer l'ajout conditionnel de classes CSS
import { twMerge } from "tailwind-merge"; // Importation de la bibliothèque tailwind-merge pour résoudre les conflits de classes Tailwind

// Fonction utilitaire pour combiner les classes Tailwind de manière intelligente
export function cn(...inputs: any[]) {
  // La fonction 'clsx' permet de combiner les classes de manière conditionnelle
  // Exemple : clsx('p-4', isActive && 'text-blue-500') donnera 'p-4 text-blue-500' si 'isActive' est vrai
  // Ensuite, 'twMerge' est utilisé pour résoudre les conflits entre les classes Tailwind (si deux classes se contredisent)
  // Exemple : twMerge('bg-red-500 bg-green-500') retournera 'bg-green-500' car c'est la dernière classe définie
  return twMerge(clsx(inputs)); 
}
