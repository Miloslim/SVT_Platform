// ============================================================
// 📌 Fichier : student.ts
// 🎯 Objectif : Endpoint API pour récupérer les informations d'un élève
// ============================================================

import { supabase } from "../config/supabase"; // Importation de la configuration Supabase
import { NextApiRequest, NextApiResponse } from "next"; // Typage des requêtes et réponses Next.js

// 🔹 Fonction principale qui gère la requête API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ Extraction du code élève depuis la requête (GET)
  const { studentCode } = req.query;

  // ⚠️ Vérification : Si le code élève n'est pas fourni, retour d'une erreur 400 (requête invalide)
  if (!studentCode) {
    return res.status(400).json({ error: "Code élève manquant" });
  }

  // 🔎 Requête Supabase : Sélectionner l'élève dont le `student_code` correspond
  const { data, error } = await supabase
    .from("students")  // 🔍 Sélectionne la table `students`
    .select("*")       // 🌍 Récupère toutes les colonnes
    .eq("student_code", studentCode) // 🔍 Filtre sur le `student_code` fourni
    .single();         // ✅ On récupère un seul résultat (évite un tableau de données)

  // ⚠️ Vérification : Si une erreur survient, retour d'un code 500 (erreur serveur)
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // ✅ Succès : Envoi des données de l'élève avec un code 200 (OK)
  res.status(200).json(data);
}
