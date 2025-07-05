// ============================================================
// 📌 Fichier : StudentProfile.tsx
// 🎯 Objectif :
//   - Afficher une fiche personnelle complète basée sur le Code Élève.
//   - Inclure les absences provenant de la table `student_absences`.
// ============================================================

// === Importations nécessaires ===
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Navigation et gestion des paramètres d'URL
import { supabase } from "../../backend/config/supabase"; // Configuration Supabase
import { Student, Class } from "../../types/index"; // Importer les types centralisés

// === Composant principal : StudentProfile ===
const StudentProfile: React.FC = () => {
  const { student_code } = useParams<{ student_code: string }>(); // Récupérer le Code Élève depuis l'URL
  const navigate = useNavigate(); // Pour revenir à la liste des élèves
  const [student, setStudent] = useState<Student | null>(null); // Données de l'élève
  const [classes, setClasses] = useState<Class[]>([]); // Liste des classes
  const [absences, setAbsences] = useState<{ date: string; heure: number; created_at: string }[]>([]); // Liste des absences
  const [loading, setLoading] = useState(true); // Indicateur de chargement

  // ============================================================
  // Fonction : Charger les données de l'élève, des classes et des absences
  // ============================================================
  const fetchStudentData = async () => {
    try {
      setLoading(true); // Activer l'indicateur de chargement

      // Récupérer les données de l'élève depuis `students`
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select(`
          id, student_code, first_name, last_name, birth_date, student_class,
          student_scores (cc1, cc2, cc3, c_act)
        `)
        .eq("student_code", student_code)
        .single();

      if (studentError) throw new Error(studentError.message);

      // Récupérer les absences depuis `student_absences`
      const { data: absencesData, error: absencesError } = await supabase
        .from("student_absences")
        .select("date, heure, created_at")
        .eq("student_code", student_code);

      if (absencesError) throw new Error(absencesError.message);

      // Récupérer les classes depuis `classes`
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("id, class_name");

      if (classesError) throw new Error(classesError.message);

      // Trouver le nom de la classe associée à l'élève
      const studentClassName = classesData.find((cls) => cls.id === studentData.student_class)?.class_name || "Classe inconnue";

      // Mettre à jour les états
      setStudent({ ...studentData, class_name: studentClassName });
      setAbsences(absencesData || []);
      setClasses(classesData || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des données :", err.message);
    } finally {
      setLoading(false); // Désactiver l'indicateur de chargement
    }
  };

  // ============================================================
  // Effet : Charger les données lors du montage du composant
  // ============================================================
  useEffect(() => {
    fetchStudentData(); // Appeler la fonction pour charger les données
  }, [student_code]);

  // ============================================================
  // Rendu principal du composant
  // ============================================================
  return (
    <div className="p-6 bg-gray-100 rounded shadow-md">
      {/* Bouton pour revenir à la liste des élèves */}
      <button
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mb-4"
        onClick={() => navigate(-1)} // Retour à la liste
      >
        Retour à la Liste
      </button>

      {loading ? (
        <p className="text-gray-500">Chargement des informations de l'élève...</p>
      ) : student ? (
        <div className="bg-white p-6 rounded shadow-md">
          {/* Informations personnelles */}
          <h2 className="text-2xl font-bold mb-4">Fiche de {student.first_name} {student.last_name}</h2>
          <p><strong>Code Élève :</strong> {student.student_code}</p>
          <p><strong>ID Élève :</strong> {student.id}</p>
          <p><strong>Date de Naissance :</strong> {student.birth_date || "Non renseignée"}</p>
          <p><strong>Classe :</strong> {student.class_name}</p>

          {/* Performances académiques */}
          <h3 className="text-xl font-bold mb-2 mt-4">Performances :</h3>
          <ul>
            <li><strong>CC1 :</strong> {student.student_scores?.cc1?.toFixed(2) || "-"}</li>
            <li><strong>CC2 :</strong> {student.student_scores?.cc2?.toFixed(2) || "-"}</li>
            <li><strong>CC3 :</strong> {student.student_scores?.cc3?.toFixed(2) || "-"}</li>
            <li><strong>Activité :</strong> {student.student_scores?.c_act?.toFixed(2) || "-"}</li>
          </ul>

          {/* Absences */}
          <h3 className="text-xl font-bold mb-2 mt-4">Absences :</h3>
          {absences.length > 0 ? (
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

          {/* Bouton pour générer un PDF */}
          <button
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            onClick={() => console.log("Générer PDF (fonction à implémenter)")}
          >
            Télécharger la Fiche PDF 📄
          </button>
        </div>
      ) : (
        <p className="text-gray-500">Aucune donnée trouvée pour cet élève.</p>
      )}
    </div>
  );
};

export default StudentProfile;
