import React, { useState } from 'react';
import Calendar from 'react-calendar'; // Composant calendrier interactif
import 'react-calendar/dist/Calendar.css'; // Styles par défaut pour react-calendar

// ============================================================
// 📌 Composant : AbsenceCalendar
// 🎯 Objectif :
//   - Permettre aux utilisateurs de sélectionner une ou plusieurs dates
//     d'absence via un calendrier interactif.
//   - Les dates sélectionnées sont formatées en `YYYY-MM-DD` avant d'être transmises.
// ============================================================

const AbsenceCalendar = ({ onSave }: { onSave: (dates: string[]) => void }) => {
  // === État local : Dates sélectionnées par l'utilisateur ===
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // ============================================================
  // Fonction : Ajouter ou retirer une date sélectionnée
  // ============================================================
  const handleDateClick = (value: Date) => {
    // Convertir la date en format ISO
    const isoDate = value.toISOString();
    if (selectedDates.includes(isoDate)) {
      // Retirer la date si elle est déjà sélectionnée
      setSelectedDates(selectedDates.filter((date) => date !== isoDate));
    } else {
      // Ajouter la date si elle n'est pas encore sélectionnée
      setSelectedDates([...selectedDates, isoDate]);
    }
  };

  // ============================================================
  // Fonction : Transmettre les dates sélectionnées au parent
  // ============================================================
  const handleSave = () => {
    if (selectedDates.length === 0) {
      alert('❌ Veuillez sélectionner au moins une date.');
      return;
    }

    // Convertir les dates en format `YYYY-MM-DD`
    const formattedDates = selectedDates.map((date) => {
      const jsDate = new Date(date);
      return jsDate.toISOString().split('T')[0]; // Extraire uniquement YYYY-MM-DD
    });

    console.log('🔹 Dates transmises :', formattedDates); // Debug
    onSave(formattedDates); // Transmettre au parent
  };

  // ============================================================
  // Rendu du composant
  // ============================================================
  return (
    <div className="p-4">
      {/* === Titre du composant === */}
      <h2 className="text-lg font-bold mb-4">Sélectionnez les absences</h2>

      {/* === Composant interactif de calendrier === */}
      <Calendar
        onClickDay={handleDateClick}
        tileClassName={({ date }) =>
          selectedDates.includes(date.toISOString()) ? 'bg-blue-300 text-white' : ''
        } // Style visuel pour les dates sélectionnées
      />

      {/* === Bouton pour enregistrer les dates sélectionnées === */}
      <button
        onClick={handleSave}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Enregistrer les absences
      </button>
    </div>
  );
};

export default AbsenceCalendar;
