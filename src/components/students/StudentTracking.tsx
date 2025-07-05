// ============================================================
// 📌 Composant : StudentTracking
// 🎯 Objectif :
//   - Suivre les absences des élèves.
//   - Offrir une interface avec filtre, recherche, indicateur visuel et bouton d’action.
// ============================================================

import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import AbsencesModal from './AbsencesModal';
import { supabase } from '../../backend/config/supabase';
import { Student, Class } from '../../types/index';

const StudentTracking: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAbsenceModal, setShowAbsenceModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 🔄 Chargement des élèves et classes depuis Supabase
  const fetchData = async () => {
    try {
      setErrorMessage(null);

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          student_code,
          first_name,
          last_name,
          student_class,
          classes (class_name),
          absences:student_absences(hours)
        `);

      if (studentsError) throw new Error(`Erreur élèves : ${studentsError.message}`);

      const { data: classesData, error: classesError } = await supabase.from('classes').select('*');
      if (classesError) throw new Error(`Erreur classes : ${classesError.message}`);

      const studentsWithAbsences = studentsData.map((student: Student) => ({
        ...student,
        absences_sum: student.absences?.reduce((sum, absence) => sum + absence.hours, 0) || 0,
      }));

      setStudents(studentsWithAbsences);
      setClasses(classesData || []);
      setFilteredStudents(studentsWithAbsences);
    } catch (err) {
      console.error('❌ Erreur chargement :', err.message);
      setErrorMessage(err.message);
    }
  };

  // 💾 Enregistrement d’une nouvelle absence
  const saveAbsenceData = async ({ date, type }: { date: string; type: string }) => {
    try {
      if (!selectedStudent) throw new Error("Aucun élève sélectionné");

      const hours = type === '2h' ? 2 : 1;

      const { error } = await supabase.from('student_absences').insert({
        student_code: selectedStudent.student_code,
        date,
        hours,
      });

      if (error) throw new Error(`Erreur insertion : ${error.message}`);

      alert('✅ Absence enregistrée.');
      fetchData();
    } catch (err) {
      console.error('❌ Erreur sauvegarde :', err.message);
      alert(`Erreur : ${err.message}`);
    }
  };

  // 📥 Chargement initial
  useEffect(() => {
    fetchData();
  }, []);

  // 🔍 Filtres dynamiques
  useEffect(() => {
    const results = students
      .filter((student) =>
        student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_code.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter((student) => (filterClass ? student.student_class === parseInt(filterClass, 10) : true));

    setFilteredStudents(results);
  }, [searchQuery, filterClass, students]);

  // 🖼️ Rendu principal
  return (
    <div className="tracking-container">
      <h1 className="tracking-title">📊 Contrôle des absences</h1>

      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}

      <div className="tracking-filters">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Rechercher élève..."
          className="tracking-input"
        />
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="tracking-select"
        >
          <option value="">Toutes les classes</option>
          {classes.map((classe) => (
            <option key={classe.id} value={classe.id}>
              {classe.class_name}
            </option>
          ))}
        </select>
      </div>

      <table className="tracking-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Nom</th>
            <th>Classe</th>
            <th>Absences</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <tr key={student.student_code}>
                <td>{student.student_code}</td>
                <td>{student.first_name} {student.last_name}</td>
                <td>{student.classes?.class_name || '—'}</td>
                <td>
                  <div className="absence-indicator">
                    <span>{student.absences_sum || 0} h</span>
                    <div
                      className={`absence-bar ${
                        student.absences_sum >= 10
                          ? 'bg-red'
                          : student.absences_sum >= 5
                          ? 'bg-yellow'
                          : 'bg-green'
                      }`}
                    />
                  </div>
                </td>
                <td>
                  <button
                    className="absence-btn"
                    onClick={() => {
                      setSelectedStudent(student);
                      setShowAbsenceModal(true);
                    }}
                  >
                    ABSENCES
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center py-4 text-gray-500">
                Aucun élève trouvé.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showAbsenceModal && selectedStudent && (
        <AbsencesModal
          student={selectedStudent}
          onClose={() => setShowAbsenceModal(false)}
          onSave={saveAbsenceData}
        />
      )}
    </div>
  );
};

export default StudentTracking;
