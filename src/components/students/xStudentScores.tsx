// ============================================================
// 📌 Fichier : StudentScores.tsx
// 🎯 Objectif :
//   - Afficher les performances académiques d'un élève spécifique.
// ============================================================

// === Importations nécessaires ===
import React, { useEffect, useState } from "react";
import { supabase } from "../../backend/config/supabase"; // Configuration Supabase

interface Scores {
  cc1?: number;
  cc2?: number;
  cc3?: number;
  c_act?: number;
}

interface Props {
  studentCode: string;
}

// === Composant Principal : StudentScores ===
const StudentScores: React.FC<Props> = ({ studentCode }) => {
  const [scores, setScores] = useState<Scores | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer les scores
  const fetchScores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("students")
        .select("student_scores (cc1, cc2, cc3, c_act)")
        .eq("student_code", studentCode)
        .single();

      if (error) throw new Error(error.message);
      setScores(data?.student_scores || null);
    } catch (err) {
      console.error("Erreur lors de la récupération des scores :", err.message);
      console.log("Données des scores académiques :", scores);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentCode) fetchScores();
  }, [studentCode]);

  return (
    <div>
      {loading ? (
        <p>Chargement des scores...</p>
      ) : scores ? (
        <ul className="list-disc pl-6">
          <li><strong>CC1 :</strong> {scores.cc1?.toFixed(2) || "-"}</li>
          <li><strong>CC2 :</strong> {scores.cc2?.toFixed(2) || "-"}</li>
          <li><strong>CC3 :</strong> {scores.cc3?.toFixed(2) || "-"}</li>
          <li><strong>Activité :</strong> {scores.c_act?.toFixed(2) || "-"}</li>
        </ul>
      ) : (
        <p>Aucune performance académique trouvée.</p>
      )}
    </div>
  );
};

export default StudentScores;
