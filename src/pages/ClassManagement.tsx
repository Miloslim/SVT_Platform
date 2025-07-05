// ============================================================================
// 📄 Fichier : ClassManagement.tsx
// 📁 Chemin : src/pages/ClassManagement.tsx
// 🎯 Objectif : Gérer l'affichage et la navigation entre les sous-modules
//    (élèves, notes, suivi, profil), en centralisant les styles dans un fichier CSS.
// ============================================================================

import React, { useState, useEffect } from 'react';
import GestionEleve from '../components/students/GestionEleve';
import StudentTracking from '../components/students/StudentTracking';
import GestionNotes from '../components/notes/GestionNotes';
import StudentProfile from '../components/students/StudentProfileDashboard';
import { supabase } from '../backend/config/supabase';
import { Student } from '../types/index';

// 💡 Import du fichier de styles CSS centralisé
import '../styles/classManagementStyles.css';

const ClassManagement: React.FC = () => {
  // ================================
  // 🔁 États internes
  // ================================
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<string>('gestionEleve');

  // ================================
  // 📡 Récupération des élèves
  // ================================
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('id, student_code, first_name, last_name, birth_date, student_class');
      if (error) throw new Error(error.message);
      setStudents(data || []);
    } catch (err) {
      console.error('❌ Erreur :', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // ================================
  // 🔁 Affichage dynamique des modules
  // ================================
  const renderModuleContent = () => {
    switch (activeModule) {
      case 'gestionEleve':
        return <GestionEleve students={students} fetchStudents={fetchStudents} />;
      case 'suiviEleve':
        return <StudentTracking />;
      case 'gestionNotes':
        return <GestionNotes />;
      case 'studentProfile':
        return <StudentProfile students={students} fetchStudents={fetchStudents} />;
      default:
        return <p className="text-red-500">Module introuvable</p>;
    }
  };

  // ================================
  // 🧩 Interface utilisateur principale
  // ================================
  return (
    <div className="cm-container">
     {/* <h2 className="cm-title">Gestion des Classes</h2>*/}

      {/* 🔘 Barre de navigation des modules */}
      <div className="cm-navigation">
        {[
          { name: 'Gestion des Élèves', module: 'gestionEleve' },
          { name: 'Suivi des Élèves', module: 'suiviEleve' },
          { name: 'Gestion des Notes', module: 'gestionNotes' },
          { name: 'Profil des Élèves', module: 'studentProfile' },
        ].map(({ name, module }) => (
          <button
            key={module}
            className={`cm-button ${activeModule === module ? 'cm-button-active' : 'cm-button-inactive'}`}
            onClick={() => setActiveModule(module)}
          >
            {name}
          </button>
        ))}
      </div>

      {/* 📦 Contenu du module actif */}
      {loading ? (
        <p className="cm-loading">Chargement des données...</p>
      ) : (
        <div className="cm-module">{renderModuleContent()}</div>
      )}
    </div>
  );
};

export default ClassManagement;
