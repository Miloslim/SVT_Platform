import React, { useState, useEffect } from "react";
import { supabase } from "../../backend/config/supabase";
import SearchFilter from "../common/SearchFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "../ui/dialog";
import { Student } from "../../types/index";

interface StudentWithExtras extends Student {
  total_absences: number;
  class_name?: string;
  scores: {
    cc1?: number;
    cc2?: number;
    cc3?: number;
    c_act?: number;
  };
}

const StudentListGlobal: React.FC = () => {
  const [students, setStudents] = useState<StudentWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [classes, setClasses] = useState<{ id: number; class_name: string }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithExtras | null>(null);

  useEffect(() => {
    const fetchStudentsData = async () => {
      try {
        setLoading(true);
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select(`
            id, student_code, first_name, last_name, birth_date,
            student_class (id, class_name),
            student_scores (cc1, cc2, cc3, c_act)
          `);

        if (studentsError) throw new Error(studentsError.message);

        const { data: absencesData, error: absencesError } = await supabase.rpc("get_total_absences");
        if (absencesError) throw new Error(absencesError.message);

        const studentsWithExtras = studentsData.map((student) => {
          const absences = absencesData.find((absence) => absence.student_code === student.student_code);
          return {
            ...student,
            total_absences: absences?.total_hours || 0,
            scores: {
              cc1: student.student_scores?.cc1,
              cc2: student.student_scores?.cc2,
              cc3: student.student_scores?.cc3,
              c_act: student.student_scores?.c_act,
            },
            class_name: student.student_class?.class_name || "Non assignée",
          };
        });

        setStudents(studentsWithExtras);
      } catch (err) {
        console.error("Erreur lors de la récupération des données :", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsData();
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data: classesData, error } = await supabase.from("classes").select("id, class_name");
        if (error) console.error("Erreur lors de la récupération des classes :", error.message);
        else setClasses(classesData || []);
      } catch (err) {
        console.error("Erreur inattendue :", err.message);
      }
    };

    fetchClasses();
  }, []);

  const filteredStudents = students.filter((student) => {
    const matchesSearchTerm =
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilterClass =
      filterClass === "" || student.student_class?.id === parseInt(filterClass);

    return matchesSearchTerm && matchesFilterClass;
  });

  const handleViewStudentDetails = (student: StudentWithExtras) => {
    console.log("📌 Élève reçu :", student);
    setSelectedStudent(student);
  };
//=========================
//=========================
  return (
    <div className="relative p-6 bg-gray-100 rounded shadow-md">
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-4xl bg-white p-6 rounded-lg shadow-md">
          <DialogHeader>
            <DialogTitle>🎓 Profil de {selectedStudent?.first_name} {selectedStudent?.last_name}</DialogTitle>
          </DialogHeader>

          <p><strong>📄 Code Élève :</strong> {selectedStudent?.student_code}</p>
          <p><strong>🏫 Classe :</strong> {selectedStudent?.class_name}</p>
          <p><strong>📅 Date de Naissance :</strong> {selectedStudent?.birth_date}</p>
          <p><strong>⏳ Absences :</strong> {selectedStudent?.total_absences} heures</p>

          <h3 className="mt-4 text-lg font-semibold">📈 Scores des Contrôles</h3>
          <ul className="list-disc pl-6">
            <li><strong>CC1 :</strong> {selectedStudent?.scores.cc1}</li>
            <li><strong>CC2 :</strong> {selectedStudent?.scores.cc2}</li>
            <li><strong>CC3 :</strong> {selectedStudent?.scores.cc3}</li>
            <li><strong>Activité :</strong> {selectedStudent?.scores.c_act}</li>
          </ul>

          <DialogClose className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Fermer
          </DialogClose>
        </DialogContent>
      </Dialog>

      <SearchFilter
        searchQuery={searchTerm}
        setSearchQuery={setSearchTerm}
        filterClass={filterClass}
        setFilterClass={setFilterClass}
        classes={classes}
      />

       {/* 📋 Affichage des étudiants */}
      {loading ? (
        <p className="text-gray-500">Chargement des données...</p>
      ) : filteredStudents.length > 0 ? (
        <table className="table-auto w-full text-left border-collapse bg-white rounded shadow-md">
          <thead>
            <tr className="bg-gray-200 text-gray-800">
              <th className="border p-2">Code Élève</th>
              <th className="border p-2">Nom Complet</th>
              <th className="border p-2">Date de Naissance</th>
              <th className="border p-2">Classe</th>
              <th className="border p-2">Absences</th>
              <th className="border p-2">CC1</th>
              <th className="border p-2">CC2</th>
              <th className="border p-2">CC3</th>
              <th className="border p-2">Activité</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-100 transition duration-200">
                <td className="border p-2">{student.student_code}</td>
                <td className="border p-2">{student.first_name} {student.last_name}</td>
                <td className="border p-2">{student.birth_date || "-"}</td>
                <td className="border p-2">{student.class_name || "Non assignée"}</td>
                <td className="border p-2">{student.total_absences}</td>
                <td className="border p-2">{student.scores.cc1?.toFixed(2) || "-"}</td>
                <td className="border p-2">{student.scores.cc2?.toFixed(2) || "-"}</td>
                <td className="border p-2">{student.scores.cc3?.toFixed(2) || "-"}</td>
                <td className="border p-2">{student.scores.c_act?.toFixed(2) || "-"}</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleViewStudentDetails(student)}
                    className="px-4 py-2 bg-blue-500 text-white font-semibold rounded shadow hover:bg-blue-600"
                  >
                    Détail Élève
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">Aucun élève trouvé.</p>
      )}
    </div>
  );
};

export default StudentListGlobal;
