// ======================================================================
// 📄 Fichier : AssignmentTable.tsx
// 📁 Chemin : src/diagno/components/Assignment/AssignmentTable.tsx
// 📌 Description : Composant d’affichage des affectations existantes 
//     des tests diagnostiques aux classes. Permet de visualiser 
//     à quelles classes un test a été assigné et quand.
// ======================================================================

import React, { useEffect, useState } from 'react';
import { supabase } from '@/backend/config/supabase';

interface Assignment {
  id: number;
  classe_id: number;
  date_affectation: string;
  lycee_classes: {
    nom_classe: string;
  };
}

interface AssignmentTableProps {
  testId: number;
}

export const AssignmentTable: React.FC<AssignmentTableProps> = ({ testId }) => {
  // ===============================
  // 📊 État local
  // ===============================
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  // ===============================
  // 📥 Chargement des affectations liées au test
  // ===============================
  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('test_diagnostique_classes')
        .select('id, classe_id, date_affectation, lycee_classes(nom_classe)')
        .eq('test_id', testId);

      if (!error && data) {
        setAssignments(data);
      } else {
        console.error('Erreur de chargement des affectations :', error);
      }
      setLoading(false);
    };

    fetchAssignments();
  }, [testId]);

  // ===============================
  // 🎨 Rendu du tableau
  // ===============================
  return (
    <div className="mt-6 p-4 bg-gray-50 border rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">📋 Classes affectées à ce test</h2>

      {loading ? (
        <p>Chargement en cours...</p>
      ) : assignments.length === 0 ? (
        <p>Aucune affectation trouvée pour ce test.</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">#</th>
              <th className="py-2">Classe</th>
              <th className="py-2">Date d’affectation</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assign, index) => (
              <tr key={assign.id} className="border-t">
                <td className="py-2 px-2">{index + 1}</td>
                <td className="py-2 px-2">{assign.lycee_classes.nom_classe}</td>
                <td className="py-2 px-2">
                  {new Date(assign.date_affectation).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AssignmentTable;
