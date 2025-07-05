// =========================================================
//C:\Users\USER\Downloads\project2_modulaire\src\backend\config\supabase.ts
//📌 Fichier : supabase.ts
// 🎯 Objectif :
//   - Fournir une connexion centralisée à Supabase.
//   - Compatible avec les environnements Frontend (Vite) et Backend (Node.js).
// =========================================================

import { createClient } from '@supabase/supabase-js'; // 🔹 Importation du client Supabase

// =========================================================
// 🔹 Variables d'environnement : URLs et clés API
//   - Compatibilité Frontend (Vite) : import.meta.env
//   - Compatibilité Backend (Node.js) : process.env
// =========================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// 🔹 Vérification des variables environnementales
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Erreur : Les variables Supabase (URL ou clé) ne sont pas définies.");
}

// =========================================================
// 🔹 Création du client Supabase
// =========================================================
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =========================================================
// ℹ️ Notes :
//   1. Utilisez `supabase` dans n'importe quelle partie de votre application
//      pour interagir avec votre base de données.
//   2. Configurez les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
//      dans vos fichiers `.env`.
// =========================================================
