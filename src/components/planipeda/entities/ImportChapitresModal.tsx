/**
 * 📌 Fichier : ImportChapitresModal.tsx
 * 📍 Chemin : src/components/planipeda/entities/ImportChapitresModal.tsx
 * 🎯 Objectif : Permettre l'importation en masse de chapitres depuis un fichier texte (un chapitre par ligne).
 * 🛠️ Fonctionnalités :
 * - Sélection hiérarchique (niveau > option > unité) pour associer les chapitres.
 * - Champ d'upload de fichier texte.
 * - Lecture du contenu du fichier et insertion de chaque ligne comme un chapitre.
 */

import React, { useState, useEffect, useRef } from "react"; // Importation de useRef
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/backend/config/supabase";

// ---
// 🧩 Interfaces des entités (restent les mêmes)
// ---
interface Niveau {
  id: number;
  nom_niveau: string;
}
interface Option {
  id: number;
  nom_option: string;
  niveau_id: number;
}
interface Unite {
  id: number;
  titre_unite: string;
  option_id: number;
}

// ---
// Props pour le composant (restent les mêmes)
// ---
interface ImportChapitresModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialNiveauId?: number | null;
  initialOptionId?: number | null;
  initialUniteId?: number | null;
}

// ---
// 🎬 Composant ImportChapitresModal
// ---
const ImportChapitresModal: React.FC<ImportChapitresModalProps> = ({
  open,
  onClose,
  onSuccess,
  initialNiveauId,
  initialOptionId,
  initialUniteId,
}) => {
  // États pour les listes hiérarchiques
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);

  // États pour les sélections de filtres dans la modale
  const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [selectedUniteId, setSelectedUniteId] = useState<number | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Nouveau état pour le fichier
  const [fileContent, setFileContent] = useState<string | null>(null); // Nouveau état pour le contenu du fichier
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null); // Référence pour réinitialiser le champ de fichier

  // ---
  // Synchronise les états de sélection avec les props initiales et réinitialise à la fermeture.
  // ---
  useEffect(() => {
    if (open) {
      setSelectedNiveauId(initialNiveauId ?? null);
      setSelectedOptionId(initialOptionId ?? null);
      setSelectedUniteId(initialUniteId ?? null);
      setSelectedFile(null); // Réinitialise le fichier sélectionné
      setFileContent(null); // Réinitialise le contenu du fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Réinitialise le champ de fichier HTML
      }
    } else {
      setSelectedFile(null);
      setFileContent(null);
      setSelectedNiveauId(null);
      setSelectedOptionId(null);
      setSelectedUniteId(null);
    }
  }, [open, initialNiveauId, initialOptionId, initialUniteId]);

  // ---
  // Charge toutes les données hiérarchiques à l'ouverture de la modale
  // ---
  useEffect(() => {
    async function fetchHierarchyData() {
      const [{ data: niveauxData, error: niveauxError },
             { data: optionsData, error: optionsError },
             { data: unitesData, error: unitesError }] = await Promise.all([
        supabase.from("niveaux").select("id, nom_niveau").order("nom_niveau"),
        supabase.from("options").select("id, nom_option, niveau_id").order("nom_option"),
        supabase.from("unites").select("id, titre_unite, option_id").order("titre_unite"),
      ]);

      if (niveauxError) console.error("Erreur récupération niveaux :", niveauxError);
      if (optionsError) console.error("Erreur récupération options :", optionsError);
      if (unitesError) console.error("Erreur récupération unités :", unitesError);

      setNiveaux(niveauxData || []);
      setOptions(optionsData || []);
      setUnites(unitesData || []);
    }

    if (open) {
      fetchHierarchyData();
    }
  }, [open]);

  // ---
  // Gestionnaires de changement pour les listes déroulantes de filtres (inchangés)
  // ---
  const handleNiveauChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const niveauId = e.target.value === "" ? null : Number(e.target.value);
    setSelectedNiveauId(niveauId);
    setSelectedOptionId(null);
    setSelectedUniteId(null);
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const optionId = e.target.value === "" ? null : Number(e.target.value);
    setSelectedOptionId(optionId);
    setSelectedUniteId(null);
  };

  const handleUniteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uniteId = e.target.value === "" ? null : Number(e.target.value);
    setSelectedUniteId(uniteId);
  };

  // ---
  // Logique de filtrage des options et unités basées sur les sélections (inchangée)
  // ---
  const filteredOptions = options.filter(o => !selectedNiveauId || o.niveau_id === selectedNiveauId);
  const filteredUnites = unites.filter(u => !selectedOptionId || u.option_id === selectedOptionId);

  // ---
  // Gère la sélection de fichier et lit son contenu
  // ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent(event.target?.result as string);
      };
      reader.readAsText(file); // Lit le fichier comme du texte
    } else {
      setSelectedFile(null);
      setFileContent(null);
    }
  };

  // ---
  // Logique d'importation
  // ---
  const handleImport = async () => {
    if (!selectedUniteId) {
      alert("Veuillez sélectionner l'unité à laquelle associer les chapitres.");
      return;
    }
    if (!fileContent || !selectedFile) {
      alert("Veuillez sélectionner un fichier texte à importer.");
      return;
    }

    setIsImporting(true);
    // On split par ligne, trim pour enlever les espaces inutiles, et filtre les lignes vides
    const titres = fileContent.split("\n").map(line => line.trim()).filter(line => line.length > 0);

    if (titres.length === 0) {
      alert("Le fichier ne contient aucun titre de chapitre valide.");
      setIsImporting(false);
      return;
    }

    const chaptersToInsert = titres.map(titre => ({
      titre_chapitre: titre,
      unite_id: selectedUniteId,
    }));

    try {
      const { data, error } = await supabase
        .from("chapitres")
        .insert(chaptersToInsert)
        .select("id");

      if (error) {
        throw error;
      }

      alert(`${data?.length || 0} chapitres importés avec succès !`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Erreur lors de l'importation des chapitres :", error.message || error);
      alert(`Échec de l'importation : ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>📚 Importer des Chapitres depuis un Fichier</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Sélection du Niveau */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="niveau-import-select" className="text-right">Niveau</label>
            <select
              id="niveau-import-select"
              value={selectedNiveauId ?? ""}
              onChange={handleNiveauChange}
              className="col-span-3 border rounded px-3 py-2 w-full"
            >
              <option value="">Sélectionner un niveau</option>
              {niveaux.map((n) => (
                <option key={n.id} value={n.id}>{n.nom_niveau}</option>
              ))}
            </select>
          </div>

          {/* Sélection de l'Option */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="option-import-select" className="text-right">Option</label>
            <select
              id="option-import-select"
              value={selectedOptionId ?? ""}
              onChange={handleOptionChange}
              disabled={!selectedNiveauId}
              className="col-span-3 border rounded px-3 py-2 w-full"
            >
              <option value="">Sélectionner une option</option>
              {filteredOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.nom_option}</option>
              ))}
            </select>
          </div>

          {/* Sélection de l'Unité */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="unite-import-select" className="text-right">Unité cible</label>
            <select
              id="unite-import-select"
              value={selectedUniteId ?? ""}
              onChange={handleUniteChange}
              disabled={!selectedOptionId}
              className="col-span-3 border rounded px-3 py-2 w-full"
            >
              <option value="">Sélectionner une unité</option>
              {filteredUnites.map((u) => (
                <option key={u.id} value={u.id}>{u.titre_unite}</option>
              ))}
            </select>
          </div>

          {/* Champ d'upload de fichier */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="file-upload" className="text-right">Fichier texte (.txt)</label>
            <input
              id="file-upload"
              type="file"
              accept=".txt" // N'accepte que les fichiers .txt
              onChange={handleFileChange}
              ref={fileInputRef} // Attache la référence
              className="col-span-3 border rounded px-3 py-2 w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          {selectedFile && (
            <div className="col-span-4 text-center text-sm text-gray-600">
              Fichier sélectionné : <span className="font-medium">{selectedFile.name}</span>
            </div>
          )}
          {fileContent && (
            <div className="col-span-4 p-2 bg-gray-100 rounded-md text-sm max-h-40 overflow-auto">
              <p className="font-medium">Aperçu du contenu (premières lignes) :</p>
              <pre className="whitespace-pre-wrap text-xs text-gray-700">
                {fileContent.split('\n').slice(0, 5).join('\n')}
                {fileContent.split('\n').length > 5 ? '\n...' : ''}
              </pre>
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isImporting}>
            Annuler
          </Button>
          <Button onClick={handleImport} disabled={isImporting || !selectedUniteId || !selectedFile || !fileContent}>
            {isImporting ? "Importation..." : "Importer les chapitres"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportChapitresModal;