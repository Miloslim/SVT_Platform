// ============================================================
// 📌 Fichier : StudentList.tsx
// 🎯 Objectif :
//   - Afficher la liste des élèves avec recherche et filtrage.
//   - Permettre la modification ou suppression des élèves.
// ============================================================

import React, { useEffect, useState } from 'react';
import { supabase } from '../../backend/config/supabase';
import { Student, Class } from '../../types/index';
//import '../../styles/classManagementStyles.css'; // 🎨 Import du fichier CSS centralisé

function StudentList() {
  // 📌 États locaux
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // 📦 Récupérer les élèves depuis Supabase
  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('id, student_code, first_name, last_name, birth_date, student_class');
    if (error) console.error(error);
    else setStudents(data || []);
    setLoading(false);
  };

  // 📦 Récupérer les classes depuis Supabase
  const fetchClasses = async () => {
    const { data, error } = await supabase.from('classes').select('id, class_name');
    if (error) console.error(error);
    else setClasses(data || []);
  };

  // 💾 Sauvegarder les modifications
  const handleSave = async () => {
    if (!editingStudent) return;
    const { id, ...update } = editingStudent;
    const { error } = await supabase.from('students').update(update).eq('id', id);
    if (error) console.error(error);
    else {
      setEditingStudent(null);
      fetchStudents();
    }
  };

  // ❌ Supprimer un élève
  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet élève ?')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) console.error(error);
    else fetchStudents();
  };

  // 🔍 Filtrage dynamique
  const filteredStudents = students.filter((student) => {
    const matchSearch =
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchClass = !filterClass || student.student_class?.toString() === filterClass;
    return matchSearch && matchClass;
  });

  // 📦 Initialisation au chargement
  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  // 🖥️ Rendu du composant
  return (
    <div className="student-list-container">
      {/* Titre principal */}
     {/* <h2 className="student-list-title">Liste des élèves</h2> */}

      {/* Barre de recherche et filtre */}
      <div className="toolbar">
        <div className="toolbar-item">
          <label>Rechercher :</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom, prénom ou code..."
          />
        </div>
        <div className="toolbar-item">
          <label>Classe :</label>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
            <option value="">Toutes les classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau des élèves */}
      {loading ? (
        <p>Chargement...</p>
      ) : filteredStudents.length === 0 ? (
        <p>Aucun élève trouvé.</p>
      ) : (
        <table className="student-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom complet</th>
              <th>Date de naissance</th>
              <th>Classe</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) =>
              editingStudent?.id === student.id ? (
                <tr key={student.id}>
                  <td>
                    <input
                      type="text"
                      value={editingStudent.student_code}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, student_code: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editingStudent.first_name}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, first_name: e.target.value })
                      }
                    />
                    <input
                      type="text"
                      value={editingStudent.last_name}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, last_name: e.target.value })
                      }
                      className="ml-2"
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      value={editingStudent.birth_date}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, birth_date: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={editingStudent.student_class || ''}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, student_class: e.target.value })
                      }
                    >
                      <option value="">Choisir</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.class_name}
                        </option>
                      ))}
                    </select>
                  </td>
                    <td>
                      <div className="action-group">
                        <button onClick={handleSave} className="action-btn save">✔️ Enregistrer</button>
                        <button onClick={() => setEditingStudent(null)} className="action-btn cancel">❌ Annuler</button>
                      </div>
                    </td>

                </tr>
              ) : (
                <tr key={student.id}>
                  <td>{student.student_code}</td>
                  <td>{student.first_name} {student.last_name}</td>
                  <td>{student.birth_date}</td>
                  <td>{classes.find((c) => c.id === student.student_class)?.class_name || 'Inconnue'}</td>
                    <td>
                      <div className="action-group">
                        <button onClick={() => setEditingStudent(student)} className="action-btn edit">✏️ Modifier</button>
                        <button onClick={() => handleDelete(student.id)} className="action-btn delete">🗑️ Supprimer</button>
                      </div>
                    </td>

                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StudentList;
