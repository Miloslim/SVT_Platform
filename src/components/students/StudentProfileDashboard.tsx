// === 📁 Fichier : StudentProfileDashboard.tsx ===
// 🎯 Objectif :
// - Centraliser l'affichage de la liste d’élèves et les détails d’un élève dans une modale.

import React, { useState } from "react";
import { useParams } from "react-router-dom";
import StudentListGlobal from "./StudentListGlobal";
import StudentDashboard from "./StudentDashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const StudentProfileDashboard: React.FC = () => {
  const { student_code } = useParams<{ student_code: string }>();
  const [selectedStudentCode, setSelectedStudentCode] = useState<string | null>(student_code || null);

  // ⏹️ Fermer la modale
  const handleCloseDialog = () => {
    console.log("Fermeture de la modale");
    setSelectedStudentCode(null);
  };

  return (
    <div className="p-6 bg-gray-100 rounded shadow-md">
      <h1 className="text-2xl font-bold mb-6">Tableau de Bord - Profil Élève</h1>

      {/* 📋 Section 1 : Liste des élèves */}
      <section className="mb-8">
        <StudentListGlobal onSelectStudent={(code) => setSelectedStudentCode(code)} />
      </section>

      {/* 🪟 Section 2 : Modale avec le tableau de bord individuel */}
      <Dialog open={!!selectedStudentCode} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Profil de l’élève</DialogTitle>
          </DialogHeader>
          {selectedStudentCode && <StudentDashboard studentCode={selectedStudentCode} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentProfileDashboard;
