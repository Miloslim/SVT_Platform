// ============================================================
// 📌 API : scores.ts
// 🎯 Objectif : Centraliser la gestion des scores des étudiants
// ============================================================

import { supabase } from "../config/supabase";
import { NextApiRequest, NextApiResponse } from "next";

// 🔹 Fonction principale qui gère les requêtes API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ✅ Récupération des paramètres de la requête
    const { studentId, classId } = req.query;

    // 🔎 GESTION DES REQUÊTES GET (Récupérer les scores)
    if (req.method === "GET") {
      if (!studentId && !classId) {
        return res.status(400).json({ error: "ID étudiant ou ID classe requis" });
      }

      // 🔍 Requête Supabase : Filtre sur studentId ou classId
      const query = supabase
        .from("student_scores")
        .select("subject, score_value, date, student_id");

      if (studentId) {
        query.eq("student_id", studentId);
      } else if (classId) {
        query.eq("class_id", classId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return res.status(200).json(data);
    }

    // 🆕 GESTION DES REQUÊTES POST (Ajouter un score)
    if (req.method === "POST") {
      const { student_id, subject, score_value, date } = req.body;

      if (!student_id || !subject || score_value === undefined || !date) {
        return res.status(400).json({ error: "Données incomplètes pour l'ajout du score" });
      }

      const { data, error } = await supabase
        .from("student_scores")
        .insert([{ student_id, subject, score_value, date }]);

      if (error) throw error;
      return res.status(201).json({ message: "Score ajouté avec succès", data });
    }

    // ✏️ GESTION DES REQUÊTES PUT (Mettre à jour un score)
    if (req.method === "PUT") {
      const { student_id, subject, new_score_value } = req.body;

      if (!student_id || !subject || new_score_value === undefined) {
        return res.status(400).json({ error: "Données incomplètes pour la mise à jour du score" });
      }

      const { data, error } = await supabase
        .from("student_scores")
        .update({ score_value: new_score_value })
        .eq("student_id", student_id)
        .eq("subject", subject);

      if (error) throw error;
      return res.status(200).json({ message: "Score mis à jour avec succès", data });
    }

    // 🚫 Si la méthode n'est pas supportée
    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (error) {
    console.error("Erreur API :", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}
