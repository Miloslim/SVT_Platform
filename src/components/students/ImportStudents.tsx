
// ============================================================
// Fichier : ImportStudents.tsx
// Objectif :
// Permettre l'importation d'élèves et de leurs scores depuis un fichier Excel
// vers Supabase, en écrasant les doublons grâce à la logique UPSERT.
// ============================================================

// Importations nécessaires
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx'; // Bibliothèque pour lire les fichiers Excel
import { supabase } from '../../backend/config/supabase'; // Import supabase

// ============================================================
// Composant principal : ImportStudents
// ============================================================
const ImportStudents = ({ onImportCompleted }) => {
  // ============================================================
  // ÉTATS LOCAUX : Gestion des données et interactions utilisateur
  // ============================================================
  const [file, setFile] = useState(null); // Fichier Excel sélectionné
  const [studentsData, setStudentsData] = useState([]); // Données élèves extraites
  const [scoresData, setScoresData] = useState([]); // Données scores extraites
  const [selectedClass, setSelectedClass] = useState(''); // Classe sélectionnée
  const [classes, setClasses] = useState([]); // Liste des classes disponibles

  // ============================================================
  // FONCTION : Récupérer les classes depuis Supabase
  // ============================================================
  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase.from('classes').select('id, class_name'); // Colonnes nécessaires
      if (error) throw error;
      setClasses(data || []); // Met à jour l'état avec les classes récupérées
    } catch (err) {
      console.error('Erreur lors de la récupération des classes :', err.message);
    }
  };

  useEffect(() => {
    fetchClasses(); // Charger les classes au montage du composant
  }, []);

  // ============================================================
  // FONCTION : Gestion de la sélection du fichier Excel
  // ============================================================
  const handleFileChange = (e) => {
    const file = e.target.files[0]; // Récupère le fichier sélectionné
    setFile(file); // Met à jour l'état avec le fichier
  };

  // ============================================================
  // FONCTION : Extraction des données depuis Excel
  // ============================================================
  const handleImport = () => {
    if (!file) {
      alert('Veuillez sélectionner un fichier Excel.');
      return; // Arrête si aucun fichier n'est sélectionné
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryStr = event.target.result; // Contenu du fichier en binaire
      const workbook = XLSX.read(binaryStr, { type: 'binary' }); // Charge le fichier Excel
      const sheetName = workbook.SheetNames[0]; // Sélectionne la première feuille
      const worksheet = workbook.Sheets[sheetName];

      // Ajuste la plage des données (commence à la ligne 18)
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      range.s.r = 18 - 1; // Base 0 pour SheetJS
      worksheet['!ref'] = XLSX.utils.encode_range(range);

      // Convertit les données en tableau JSON brut
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Extraction des données des élèves
      const extractedStudents = data
        .filter((row) => row[2]) // Filtre les lignes où le code élève est présent
        .map((row) => ({
          student_code: row[2] || null, // Colonne C : Code unique
          student_name: `${row[3] || ''} ${row[4] || ''}`.trim(), // Nom et Prénom
          birth_date: row[5] || null, // Date de naissance
          student_class: selectedClass, // Classe associée
        }));

      // Extraction des données des scores
      const extractedScores = data
        .filter((row) => row[2]) // Filtre les lignes où le code élève est présent
        .map((row) => ({
          student_code: row[2] || null, // Code élève
          cc1: parseFloat(row[6]) || null, // Score CC1 avec décimales
          cc2: parseFloat(row[7]) || null, // Score CC2 avec décimales
          cc3: parseFloat(row[8]) || null, // Score CC3 avec décimales
          c_act: parseFloat(row[9]) || null, // Score C_Act avec décimales
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

      console.log('Données extraites pour élèves :', extractedStudents);
      console.log('Données extraites pour scores :', extractedScores);

      if (!extractedStudents.length || !extractedScores.length) {
        alert('Le fichier Excel semble être vide ou mal formaté.');
        return;
      }

      setStudentsData(extractedStudents); // Stocke les données élèves
      setScoresData(extractedScores); // Stocke les données scores
    };

    reader.readAsBinaryString(file); // Lit le fichier en mode binaire
  };

  // ============================================================
  // FONCTION : Insérer les données dans Supabase (avec UPSERT)
  // ============================================================
  const importDataToDatabase = async () => {
    if (!studentsData.length || !scoresData.length) {
      alert('Aucune donnée à importer.');
      return;
    }

    try {
      // ============================================================
      // Transformation des données pour la table students
      // ============================================================
      const enrichedStudents = studentsData.map((student) => {
        const [firstName, ...lastNameParts] = student.student_name.split(' ');
        const lastName = lastNameParts.join(' ');

        const convertDateFormat = (date) => {
          if (!date) return null; // Si la date est vide
          const [day, month, year] = date.split('-'); // Convertit "DD-MM-YYYY" en "YYYY-MM-DD"
          return `${year}-${month}-${day}`;
        };

        return {
          student_code: student.student_code,
          first_name: firstName || 'Inconnu', // Valeur par défaut si le prénom est vide
          last_name: lastName || 'Inconnu', // Valeur par défaut si le nom est vide
          birth_date: convertDateFormat(student.birth_date),
          student_class: student.student_class,
          created_at: new Date().toISOString(),
        };
      });

      console.log('Données préparées pour UPSERT dans students :', enrichedStudents);

      // UPSERT dans la table students
      const { error: studentsError } = await supabase
        .from('students')
        .upsert(enrichedStudents, { onConflict: ['student_code'] });
      if (studentsError) throw studentsError;

      // ============================================================
      // Transformation des données pour la table student_scores
      // ============================================================
      const enrichedScores = scoresData.map((score) => ({
        student_code: score.student_code || null,
        cc1: score.cc1 !== null ? parseFloat(String(score.cc1).replace(',', '.')) : null,
        cc2: score.cc2 !== null ? parseFloat(String(score.cc2).replace(',', '.')) : null,
        cc3: score.cc3 !== null ? parseFloat(String(score.cc3).replace(',', '.')) : null,
        c_act: score.c_act !== null ? parseFloat(String(score.c_act).replace(',', '.')) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      console.log('Données préparées pour UPSERT dans student_scores :', enrichedScores);

      // UPSERT dans la table student_scores
      const { error: scoresError } = await supabase
        .from('student_scores')
        .upsert(enrichedScores, { onConflict: ['student_code'] });
      if (scoresError) throw scoresError;

      // Notifications de succès
      alert('Données importées avec succès dans students et student_scores.');
      onImportCompleted?.(); // Appelle la fonction pour indiquer la fin de l'importation
    } catch (error) {
      console.error('Erreur lors de l’importation :', error.message);
      alert(`Une erreur est survenue lors de l’importation : ${error.message}`);
    }
  };
  // ============================================================
  // RENDU DU COMPOSANT
  // ============================================================
  return (
    <div className="bg-white p-6 rounded shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Importer des élèves</h2>

      {/* Sélection de la classe */}
      <div className="mb-4">
        <label htmlFor="class-select" className="block text-gray-700 font-medium mb-2">
          Choisissez une classe :
        </label>
        <select
          id="class-select"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sélectionnez une classe</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.class_name}
            </option>
          ))}
        </select>
      </div>

      {/* Sélection du fichier Excel */}
      <div className="mb-4">
        <label htmlFor="file-upload" className="block text-gray-700 font-medium mb-2">
          Choisissez un fichier Excel :
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Boutons pour importer et insérer */}
      <button
        onClick={handleImport}
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200 mb-4"
      >
        Préparer les données
      </button>

      <button
        onClick={importDataToDatabase}
        className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-200"
        disabled={!studentsData.length || !scoresData.length}
      >
        Importer dans la base
      </button>
    </div>
  );
};

export default ImportStudents;
