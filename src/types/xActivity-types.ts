// ============================================================
// 📌 Fichier : Activity-types.ts
// 🎯 Objectif :
//   - Définir les types pour les activités pédagogiques.
//   - Garantir une structure uniforme dans le module "Activités".
// ============================================================

export interface Activity {
  id: string; // Identifiant unique de l'activité
  name: string; // Nom de l'activité (exemple : "Cours de mathématiques")
  description: string; // Description détaillée de l'activité (objectifs, contenu)
  created_at: string; // Date de création au format ISO (exemple : "2023-04-01")
  updated_at?: string; // Date de dernière modification au format ISO (optionnel)
  type?: string; // Type d'activité (exemple : "cours", "projet", "exercice")
  resources?: string[]; // Liste de liens ou fichiers associés à l'activité (optionnel)
}
