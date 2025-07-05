// ============================================================
// 📌 Fichier : StudentAbsences.tsx
// 🎯 Objectif :
//   - Afficher les absences d'un élève spécifique.
// ============================================================

// === Importations nécessaires ===
import React, { useEffect, useState } from "react";
import { supabase } from "../../backend/config/supabase"; // Configuration Supabase

interface Absence {
  date: string;
  heure: number;
  created_at: string;
}

interface Props {
  studentCode: string;
}

// === Composant Principal : StudentAbsences ===
const StudentAbsences: React.FC<Props> = ({ studentCode }) => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer les absences
  const fetchAbsences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("student_absences")
        .select("date, heurs, created_at")
        .eq("student_code", studentCode);

      if (error) throw new Error(error.message);
      setAbsences(data || []);
    } catch (err) {
      console.log("Données des absences :", absences);
      console.error("Erreur lors de la récupération des absences :", err.message);


    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentCode) fetchAbsences();
  }, [studentCode]);

  return (
    <div>
      {loading ? (
        <p>Chargement des absences...</p>
      ) : absences.length > 0 ? (
        <ul className="list-disc pl-6">
          {absences.map((absence, index) => (
            <li key={index}>
              <strong>Date :</strong> {absence.date} — <strong>Heures :</strong> {absence.heure}
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucune absence enregistrée.</p>
      )}
    </div>
  );
};

export default StudentAbsences;
