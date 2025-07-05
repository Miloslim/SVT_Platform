// ============================================================================
// 📄 Fichier : GestionEleve.tsx
// 📁 Chemin : src/components/students/GestionEleve.tsx
// 🎯 Objectif : Gérer l'ajout, l'importation et l'affichage des élèves
// ============================================================================

import React, { useState } from 'react';
import StudentForm from './StudentForm';
import ImportStudents from './ImportStudents';
import StudentList from './StudentList';

interface GestionEleveProps {
  students: Array<{ id: number; first_name: string; last_name: string; class: string }>;
  fetchStudents: () => void;
}

const GestionEleve: React.FC<GestionEleveProps> = ({ students, fetchStudents }) => {
  // ================================
  // 🔁 États locaux
  // ================================
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // ================================
  // 🧩 Structure principale
  // ================================
  return (
    <div className="ge-container">
    <h2 className="cm-title">Gestion des élèves</h2>
      {/* === 🔘 Boutons d'action === */}
      <div className="ge-actions">
        <button
          onClick={() => setShowForm(!showForm)}
          className={`ge-button ${showForm ? 'ge-button-close' : 'ge-button-add'}`}
        >
          {showForm ? 'Fermer l\'ajout des élèves' : 'Ajouter un élève'}
        </button>

        <button
          onClick={() => setShowImport(!showImport)}
          className={`ge-button ${showImport ? 'ge-button-close' : 'ge-button-import'}`}
        >
          {showImport ? 'Fermer l\'importation' : 'Importer des élèves'}
        </button>
      </div>

      {/* === 📝 Formulaire d'ajout === */}
      {showForm && (
        <div className="ge-form">
          <StudentForm
            onStudentAdded={() => {
              setShowForm(false);
              fetchStudents();
            }}
          />
        </div>
      )}

      {/* === 📥 Importation de fichier === */}
      {showImport && (
        <div className="ge-form">
          <ImportStudents
            onImportCompleted={() => {
              setShowImport(false);
              fetchStudents();
            }}
          />
        </div>
      )}

      {/* === 📃 Liste des élèves === */}
      <div className="ge-student-list">
        <StudentList students={students} />
      </div>
    </div>
  );
};

export default GestionEleve;
