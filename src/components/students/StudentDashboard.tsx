//StudentDashboard.tsx
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, Line } from "react-chartjs-2";
import "chart.js/auto";

// === Interfaces pour les données ===
interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_code: string;
  class_name: string;
  dob: string;
}

interface Score {
  subject: string;
  score_value: number;
  date: string;
}

interface Absence {
  date: string;
  hours_absent: number;
  reason: string;
}

interface StudentDashboardProps {
  studentCode: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ studentCode }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    if (!studentCode) {
      console.error("❌ Erreur : studentCode est undefined !");
      return;
    }

    try {
      console.log("🔎 Requête API pour l'élève :", studentCode);
      const studentResponse = await fetch(`/api/studentByCode/${studentCode}`);
      if (!studentResponse.ok) throw new Error("⚠️ Impossible de récupérer les données de l'élève.");

      const studentData = await studentResponse.json();
      if (!studentData) throw new Error("⚠️ Aucune donnée trouvée pour cet élève.");
      setStudent(studentData);

      // 📌 Vérifier également les scores et absences
      const scoresResponse = await fetch(`/api/scores/${studentData.id}`);
      const scoresData = await scoresResponse.json();
      setScores(scoresData || []);

      const absencesResponse = await fetch(`/api/absences/${studentData.id}`);
      const absencesData = await absencesResponse.json();
      setAbsences(absencesData || []);
    } catch (error) {
      console.error("❌ Erreur API :", error);
    }
  };

  fetchData();
}, [studentCode]);


  if (loading) return <p className="text-center text-gray-500">Chargement des données...</p>;
  if (!student) return <p className="text-center text-red-500">Impossible de charger l'élève.</p>;

  const subjects = Array.from(new Set(scores.map((score) => score.subject)));
  const averageScores = subjects.map((subject) => {
    const subjectScores = scores.filter((score) => score.subject === subject);
    return subjectScores.reduce((total, score) => total + score.score_value, 0) / subjectScores.length;
  });

  return (
    <div className="space-y-6 p-6 bg-gray-100 rounded-md">
      <h2 className="text-2xl font-semibold">
        Profil de {student.first_name} {student.last_name}
      </h2>

      <Tabs defaultValue="scores">
        <TabsList>
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="absences">Absences</TabsTrigger>
        </TabsList>

        {/* 📌 Affichage des scores */}
        <TabsContent value="scores">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent>
                <h3 className="font-medium">Moyenne des scores</h3>
                <Bar
                  data={{
                    labels: subjects,
                    datasets: [
                      {
                        label: "Moyenne",
                        data: averageScores,
                        backgroundColor: "rgba(75,192,192,0.5)",
                      },
                    ],
                  }}
                  options={{ responsive: true }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h3 className="font-medium">Progression</h3>
                <Line
                  data={{
                    labels: scores.map((score) => score.date),
                    datasets: [
                      {
                        label: "Score",
                        data: scores.map((score) => score.score_value),
                        borderColor: "rgba(153,102,255,1)",
                      },
                    ],
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 📌 Affichage des absences */}
        <TabsContent value="absences">
          <Card>
            <CardContent>
              <h3 className="font-medium">Historique des absences</h3>
              <ul className="list-disc ml-6">
                {absences.map((absence, index) => (
                  <li key={index} className="text-sm">
                    {absence.date} - {absence.hours_absent}h ({absence.reason})
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
