import React, { useState } from 'react';
import Calendar from 'react-calendar'; // Composant de calendrier basé sur la bibliothèque `react-calendar`
import 'react-calendar/dist/Calendar.css'; // Styles par défaut pour le calendrier

// ============================================================
// Composant : AbsenceCalendar
// Description :
// Ce composant permet de sélectionner une ou plusieurs dates d'absence via un
// calendrier interactif. Les dates sélectionnées sont formatées en `YYYY-MM-DD` 
// avant d'être transmises au parent pour un traitement ou un enregistrement.
// ============================================================

const AbsenceCalendar = ({ onSave }) => {
  // === État local : Stocke les dates sélectionnées par l'utilisateur ===
  const [selectedDates, setSelectedDates] = useState([]);

  // === Fonction : Ajouter ou retirer une date sélectionnée ===
  const handleDateClick = (value) => {
    // Convertir la date en format ISO pour la cohérence
    const isoDate = value.toISOString();
    if (selectedDates.includes(isoDate)) {
      // Retirer la date si elle est déjà sélectionnée
      setSelectedDates(selectedDates.filter((date) => date !== isoDate));
    } else {
      // Ajouter la date si elle n'est pas encore sélectionnée
      setSelectedDates([...selectedDates, isoDate]);
    }
  };

  // === Fonction : Transmettre les dates sélectionnées au parent ===
const handleSave = () => {
  if (selectedDates.length === 0) {
    alert("Veuillez sélectionner au moins une date.");
    return;
  }

  // Transformation des dates au format YYYY-MM-DD
  const formattedDates = selectedDates.map((date) => {
    const jsDate = new Date(date); // Convertir en objet Date
    return jsDate.toISOString().split('T')[0]; // Extraire uniquement YYYY-MM-DD
  });

  console.log('Dates formatées avant transmission :', formattedDates); // Debug
  if (onSave) {
    onSave(formattedDates); // Transmettre au parent
  }
};

  return (
    <div className="p-4">
      {/* === Titre du composant === */}
      <h2 className="text-lg font-bold mb-4">Sélectionnez les absences</h2>

      {/* === Composant de calendrier interactif === */}
      <Calendar
        onClickDay={handleDateClick} // Fonction appelée lors du clic sur une date
        tileClassName={({ date }) =>
          selectedDates.includes(date.toISOString()) ? 'bg-blue-300 text-white' : ''
        } // Style pour les dates sélectionnées
      />

      {/* === Bouton pour enregistrer les absences sélectionnées === */}
      <button
        onClick={handleSave}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
      >
        Enregistrer les absences
      </button>
    </div>
  );
};

export default AbsenceCalendar;
