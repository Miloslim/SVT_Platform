// Fichier vide généré pour la structure
// src/components/exportUI/ExportFicheButton.tsx

import React from "react";
import { exportFicheDocx } from "@/exports/generators/docx/ficheToDocx";

export default function ExportButton({ ficheId }: { ficheId: number }) {
  const handleExport = async () => {
    console.log("[ExportButton] Export lancé pour ficheId:", ficheId);
    try {
      await exportFicheDocx(ficheId);
      console.log("[ExportButton] Export terminé avec succès.");
    } catch (error) {
      console.error("[ExportButton] Erreur lors de l'export:", error);
    }
  };

  return (
    <button onClick={handleExport} className="btn-export">
      Exporter la fiche DOCX
    </button>
  );
}
