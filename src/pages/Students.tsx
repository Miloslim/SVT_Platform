// === 📁 Fichier : StudentDashboard.tsx ===
// 🎯 Objectif :
// - Afficher les informations détaillées d’un élève (identité, classe, scores, absences, etc.)
// - Utilisé dans la modale depuis StudentProfileDashboard

import React, { useEffect, useState } from "react";
import { supabase } from "../../backend/config/supabase";
import { Student } from "../../types";

interface Props {
  studentCode: string;
}

interface StudentData extends Student {
  class_name?: string;
  scores?: {
    cc1?: number;
    cc2?: number;
    cc3?: number;
    c_act?: number;
  };
  total_absences?: number;
}

const StudentDashboard: React.FC<Props> = ({ studentCode }) => {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      setLoading(true);
      try {
        // 🔎 Requête pour récupérer les infos de l’élève
        const { data, error } = await supabase
          .from("students")
          .select(`
            id, student_code, first_name, last_name, birth_date,
            student_class (class_name),
            student_scores (cc1, cc2, cc3, c_act)
          `)
          .eq("student_code", studentCode)
          .single();

        if (error) throw new Error(error.message);

        // 🔎 Requête pour absences
        const { data: absencesData, error: absencesError } = await supabase
          .rpc("get_total_absences", { code: studentCode });

        const total_absences = absencesData?.[0]?.total_hours || 0;

        setStudent({
          ...data,
          class_name: data.student_class?.class_name || "Non assignée",
          scores: data.student_scores || {},
          total_absences,
        });
      } catch (err) {
        console.error("Erreur lors du chargement :", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (studentCode) fetchStudentDetails();
  }, [studentCode]);

  if (loading) return <p>Chargement du profil...</p>;
  if (!student) return <p>Élève introuvable.</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Détails de l'élève</h2>
      <div className="grid grid-cols-2 gap-4">
        <div><strong>Code :</strong> {student.student_code}</div>
        <div><strong>Nom :</strong> {student.first_name} {student.last_name}</div>
        <div><strong>Date de naissance :</strong> {student.birth_date}</div>
        <div><strong>Classe :</strong> {student.class_name}</div>
        <div><strong>Total absences :</strong> {student.total_absences} h</div>
        <div><strong>CC1 :</strong> {student.scores?.cc1 ?? "-"}</div>
        <div><strong>CC2 :</strong> {student.scores?.cc2 ?? "-"}</div>
        <div><strong>CC3 :</strong> {student.scores?.cc3 ?? "-"}</div>
        <div><strong>Activité :</strong> {student.scores?.c_act ?? "-"}</div>
      </div>
    </div>
  );
};

export default StudentDashboard;
