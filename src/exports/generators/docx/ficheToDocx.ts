// src/exports/generators/docx/ficheToDocx.ts

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { fetchFicheById } from "@/exports/services/fetchFicheData";

export const exportFicheDocx = async (ficheId: number) => {
  console.log("%c[exportFicheDocx] ▶ Début export de la fiche ID:", "color: #1E90FF", ficheId);

  const ficheData = await fetchFicheById(ficheId);
  console.log("%c[exportFicheDocx] ✅ Données brutes reçues depuis Supabase :", "color: #228B22", ficheData);

  const res = await fetch("/templates/fiche_planification_minimal.docx");
  if (!res.ok) {
    console.error("[exportFicheDocx] ❌ Erreur chargement modèle DOCX:", res.statusText);
    throw new Error("Impossible de charger le modèle DOCX");
  }
  const content = await res.arrayBuffer();

  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true
  });

  // Préparation des données injectables
  const ficheDataForDocx = {
    titre_fiche: ficheData.titre_fiche || "",
    niveau_option: ficheData.niveau_option || "",
    unite: ficheData.unite || "",
    chapitre: ficheData.chapitre || "",
    date_creation: ficheData.date_creation || "",
    statut: ficheData.statut || "",
    objectifs: Array.isArray(ficheData.objectifs)
      ? ficheData.objectifs.join("\n")
      : (ficheData.objectifs || ""),
    activites: Array.isArray(ficheData.activites)
      ? ficheData.activites.join("\n")
      : (ficheData.activites || ""),
    evaluation: Array.isArray(ficheData.evaluation)
      ? ficheData.evaluation.join("\n")
      : (ficheData.evaluation || ""),
  };

  console.log("%c[exportFicheDocx] 📝 Données injectées dans le modèle :", "color: #FFA500", ficheDataForDocx);

  doc.setData(ficheDataForDocx);

  try {
    doc.render();
    console.log("%c[exportFicheDocx] ✅ Rendu DOCX terminé avec succès", "color: #32CD32");
  } catch (err) {
    console.error("[exportFicheDocx] ❌ Erreur lors du rendu DOCX :", err);
    throw err;
  }

  const blob = doc.getZip().generate({ type: "blob" });
  saveAs(blob, `${ficheData.titre_fiche}.docx`);

  console.log("%c[exportFicheDocx] 📦 Téléchargement du fichier déclenché", "color: #4682B4");
};
