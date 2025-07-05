// src/components/exportUI/ExportFicheButton1.tsx

import React from "react";
import { exportFicheDocx } from "@/exports/generators/docx/ficheToDocx";

const ExportFicheButton = () => {
  const ficheId = 401; // Met un ID valide pour tester

  const handleExport = async () => {
    try {
      await exportFicheDocx(ficheId);
      alert("Export DOCX réussi !");
    } catch (error) {
      alert("Erreur export DOCX : " + error.message);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Exporter la fiche DOCX
    </button>
  );
};

export default ExportFicheButton;
