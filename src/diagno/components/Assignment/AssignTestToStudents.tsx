// ======================================================================
// 📄 Fichier : AssignTestToStudents.tsx
// 📁 Chemin : src/diagno/components/Assignment/AssignTestToStudents.tsx
// 📌 Description : Composant permettant d'affecter un test diagnostique
//     à une ou plusieurs classes du lycée (niveau + option).
// ======================================================================

import React, { useEffect, useState } from 'react';
import { supabase } from '@/backend/config/supabase';
import { Button } from '@/components/ui/button';

interface AssignTestToStudentsProps {
  testId: number;
  onAssigned?: () => void;
}

// Type pour les classes récupérées de la base
interface Classe {
  id: number;
  nom_classe: string;
}

export const AssignTestToStudents: React.FC<AssignTestToStudentsProps> = ({
  testId,
  onAssigned,
}) => {
  // ===============================
  // 📊 État local
  // ===============================
  const [classes, setClasses] = useState<Classe[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ===============================
  // 📥 Chargement des classes existantes
  // ===============================
  useEffect(() => {
    const fetchClasses = async () => {
      const { data, error } = await supabase.from('lycee_classes').select('*');
      if (!error && data) {
        setClasses(data);
      } else {
        console.error('Erreur lors du chargement des classes :', error);
      }
    };

    fetchClasses();
  }, []);

  // ===============================
  // ✅ Gestion des cases cochées
  // ===============================
  const toggleSelection = (classId: number) => {
    const updated = selectedClassIds.includes(classId)
      ? selectedClassIds.filter((id) => id !== classId)
      : [...selectedClassIds, classId];
    setSelectedClassIds(updated);
  };

  // ===============================
  // 💾 Affecter le test aux classes sélectionnées
  // ===============================
  const handleAssignment = async () => {
    if (selectedClassIds.length === 0) return;
    setIsLoading(true);

    const insertData = selectedClassIds.map((classId) => ({
      test_id: testId,
      classe_id: classId,
      date_affectation: new Date().toISOString(),
    }));

    const { error } = await supabase.from('test_diagnostique_classes').insert(insertData);

    setIsLoading(false);

    if (error) {
      console.error('Erreur lors de l’affectation :', error);
    } else {
      onAssigned?.();
    }
  };

  // ===============================
  // 🎨 Rendu visuel
  // ===============================
  return (
    <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">🎯 Affecter le test à une ou plusieurs classes</h2>
      <ul className="space-y-2">
        {classes.map((classe) => (
          <li key={classe.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedClassIds.includes(classe.id)}
              onChange={() => toggleSelection(classe.id)}
              className="form-checkbox"
            />
            <label>{classe.nom_classe}</label>
          </li>
        ))}
      </ul>
      <Button
        className="mt-4"
        disabled={isLoading || selectedClassIds.length === 0}
        onClick={handleAssignment}
      >
        ✅ Valider l’affectation
      </Button>
    </div>
  );
};

export default AssignTestToStudents;
