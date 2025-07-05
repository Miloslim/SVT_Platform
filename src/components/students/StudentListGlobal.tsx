//src/components/sutdents/StudentListGlobal.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../backend/config/supabase";
import SearchFilter from "../common/SearchFilter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "../ui/dialog";
import { Student } from "../../types/index";
import { Bar, Line, Radar } from "react-chartjs-2";
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

// 🔹 Générer les données du graphique
const LineData = {
  labels: ["CC1", "CC2", "CC3", "Activité"],
  datasets: [{
    label: "Scores",
    data: [
      selectedStudent?.scores.cc1,
      selectedStudent?.scores.cc2,
      selectedStudent?.scores.cc3,
      selectedStudent?.scores.c_act
    ],
    backgroundColor: "rgba(75,192,192,0.5)",
    borderColor: "rgba(75,192,192,1)",
    tension: 0.3
  }]
};
//=====
const radarData = {
  labels: ["Raisonner", "S'informer", "Communication", "Analyser"],
  datasets: [{
    label: "Résultats du diagnostique",
    data: [80, 75, 95, 50],
    backgroundColor: "rgba(255, 99, 132, 0.4)", // Plus visible
    borderColor: "rgba(255, 99, 132, 1)",
    borderWidth: 2,
    pointBackgroundColor: "rgba(255, 99, 132, 1)", // Accentue les points
    pointBorderColor: "#fff",
    pointRadius: 6, // Augmente la taille des points pour mieux les voir
  }]
};
const maxValue = Math.max(...radarData.datasets[0].data) ; // Ajoute une marge de 10 pour éviter l'effet bord

//====
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
  console.trace(); // Affiche la pile d'appels pour diagnostiquer
  setSelectedStudent(student);
};

//=========================
//=========================
return (
  <div className="relative p-6 bg-gray-100 rounded shadow-md">
    {/* 🎯 Dialogue - Fiche élève */}
    <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
      <DialogContent className="max-w-4xl bg-white p-6 rounded-2xl shadow-lg border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 mb-2">
            🎓 Profil de {selectedStudent?.first_name} {selectedStudent?.last_name}
          </DialogTitle>
        </DialogHeader>

        {/* Infos générales */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white border rounded-xl p-3 shadow-sm text-sm text-gray-700 flex items-center gap-2">
            📄 <span className="font-medium">{selectedStudent?.student_code}</span>
          </div>
          <div className="bg-white border rounded-xl p-3 shadow-sm text-sm text-gray-700 flex items-center gap-2">
            🏫 <span className="font-medium">{selectedStudent?.class_name}</span>
          </div>
          <div className="bg-white border rounded-xl p-3 shadow-sm text-sm text-gray-700 flex items-center gap-2">
            📅 <span className="font-medium">{selectedStudent?.birth_date}</span>
          </div>
        </div>

        {/* Absences */}
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-900 p-3 rounded-xl text-center font-medium mb-4">
          ⏳ Absences :{" "}
          <span className="text-lg font-bold text-red-700">
            {selectedStudent?.total_absences} h
          </span>
        </div>

        {/* Scores */}
        <h3 className="text-base font-semibold text-gray-800 mb-2">📈 Scores</h3>
        <div className="grid grid-cols-4 gap-4 mb-4">
          {["cc1", "cc2", "cc3", "c_act"].map((key) => (
            <div
              key={key}
              className="bg-gray-50 border rounded-xl p-3 text-center text-sm font-medium text-gray-700 shadow-sm"
            >
              {key.toUpperCase()}
              <div className="text-lg text-blue-600 font-bold">
                {selectedStudent?.scores[key as keyof typeof selectedStudent.scores]}
              </div>
            </div>
          ))}
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl p-4 border shadow-md">
            <Line data={LineData} />
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-md">
            <Radar
              data={radarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    min: 0,
                    max: maxValue,
                    ticks: { stepSize: 20, font: { size: 8 } },
                    grid: { circular: true },
                    pointLabels: { font: { size: 12, weight: "bold" } },
                  },
                },
              }}
            />
          </div>
        </div>

        <DialogClose className="block mx-auto mt-6 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition">
          Fermer
        </DialogClose>
      </DialogContent>
    </Dialog>

    {/* 🔍 Barre de recherche et filtre */}
    <SearchFilter
      searchQuery={searchTerm}
      setSearchQuery={setSearchTerm}
      filterClass={filterClass}
      setFilterClass={setFilterClass}
      classes={classes}
    />

    {/* 📋 Liste des étudiants */}
    {loading ? (
      <p className="text-gray-500 mt-4">Chargement des données...</p>
    ) : filteredStudents.length > 0 ? (
      <div className="overflow-x-auto mt-4">
        <table className="w-full border-collapse bg-white rounded-xl shadow-md">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              {["Code", "Nom", "Naissance", "Classe", "Absences", "CC1", "CC2", "CC3", "Activité", "Actions"].map((head, idx) => (
                <th key={idx} className="border p-2 text-sm font-semibold">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-100 text-sm text-gray-800">
                <td className="border p-2">{student.student_code}</td>
                <td className="border p-2">{student.first_name} {student.last_name}</td>
                <td className="border p-2">{student.birth_date || "-"}</td>
                <td className="border p-2">{student.class_name}</td>
                <td className="border p-2">{student.total_absences}</td>
                <td className="border p-2">{student.scores.cc1?.toFixed(2) || "-"}</td>
                <td className="border p-2">{student.scores.cc2?.toFixed(2) || "-"}</td>
                <td className="border p-2">{student.scores.cc3?.toFixed(2) || "-"}</td>
                <td className="border p-2">{student.scores.c_act?.toFixed(2) || "-"}</td>
                <td className="border p-2">
                  <button
                    onClick={() => handleViewStudentDetails(student)}
                    className="action-btn view"
                  >
                    🔍 Détails
                  </button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-gray-500 mt-4">Aucun élève trouvé.</p>
    )}
  </div>
);

};

export default StudentListGlobal;
