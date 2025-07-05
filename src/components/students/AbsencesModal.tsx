// ============================================================
// 📌 Fichier : AbsencesModal.tsx
// 🎯 Objectif : Gestion des absences via une modale intuitive
// ============================================================

import React, { useState } from 'react';
import Modal from "../common/Modal"; // Composant modale générique
import Calendar from '../common/Calendar'; // Composant de calendrier interactif

const AbsencesModal = ({ onClose, onSave }: { onClose: () => void; onSave: (data: { date: string; type: string }) => void }) => {
  // === États locaux ===
  const [selectedDate, setSelectedDate] = useState(new Date()); // Date sélectionnée
  const [absenceType, setAbsenceType] = useState(''); // Type d'absence sélectionné

  // ============================================================
  // Fonction : Validation et transmission des données
  // ============================================================
  const handleSave = () => {
    if (!absenceType) {
      alert("Veuillez sélectionner un type d'absence.");
      return;
    }

    const formattedDate = selectedDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
    console.log('Données soumises :', { date: formattedDate, type: absenceType });

    onSave({ date: formattedDate, type: absenceType }); // Transmission au parent
    onClose(); // Fermer la modale
  };

  return (
    <Modal title="Ajouter une Absence" onClose={onClose}>
      <div>
        {/* === Section : Sélection de la date === */}
        <Calendar
          onDateSelect={(date: Date) => setSelectedDate(date)}
          selectedDate={selectedDate}
        />

        {/* === Section : Choix du type d'absence === */}
        <div className="flex gap-4 mt-4">
          <button
            className={`px-4 py-2 rounded ${absenceType === '2h' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setAbsenceType('2h')}
          >
            2h
          </button>
          <button
            className={`px-4 py-2 rounded ${absenceType === '1h' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setAbsenceType('1h')}
          >
            1h
          </button>
        </div>

        {/* === Section : Validation et soumission === */}
        <button
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
          onClick={handleSave}
        >
          Valider
        </button>
      </div>
    </Modal>
  );
};

export default AbsencesModal;
