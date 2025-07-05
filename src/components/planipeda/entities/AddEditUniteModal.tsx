/**
 * 📌 Fichier : AddEditUniteModal.tsx
 * 📍 Chemin : src/components/planipeda/entities/AddEditUniteModal.tsx
 * 🎯 Objectif : Modale unifiée pour gérer l'ajout, la modification et l'importation en masse d'unités.
 * 🛠️ Fonctionnalités :
 * - Gère trois modes : 'add' (ajout), 'edit' (modification), 'import' (importation depuis fichier texte).
 * - Sélection hiérarchique (niveau > option) pour associer les unités.
 * - En mode 'add' ou 'edit', permet de saisir/modifier le titre de l'unité.
 * - En mode 'edit', pré-remplit les champs et affiche un bouton de suppression.
 * - En mode 'import', fournit un champ d'upload de fichier texte et gère la lecture/l'insertion en masse.
 * - Interactions avec Supabase pour l'insertion, la mise à jour et la suppression d'unités.
 */

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button"; // Composant bouton
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Composants de modale
import { supabase } from "@/backend/config/supabase"; // Client Supabase

// --- Interfaces des entités (structure des données) ---
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

// --- Props pour le composant AddEditUniteModal ---
interface AddEditUniteModalProps {
  open: boolean;
  mode: 'add' | 'edit' | 'import'; // Nouveau prop pour définir le mode de la modale
  unite?: Unite | null; // Unité à éditer (présent seulement en mode 'edit')
  onClose: () => void;
  onSuccess: () => void; // Appelée après ajout, modification ou suppression/importation réussie
  initialNiveauId?: number | null; // Pour pré-remplir le niveau en mode 'import' ou 'add'
  initialOptionId?: number | null; // Pour pré-remplir l'option en mode 'import' ou 'add'
}

// --- Composant AddEditUniteModal ---
const AddEditUniteModal: React.FC<AddEditUniteModalProps> = ({
  open,
  mode,
  unite,
  onClose,
  onSuccess,
  initialNiveauId,
  initialOptionId,
}) => {
  // --- États pour les champs du formulaire (pour add/edit) ---
  const [titreUnite, setTitreUnite] = useState("");
  const [optionId, setOptionId] = useState<number | null>(null);

  // --- États pour les listes déroulantes hiérarchiques ---
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(null);

  // --- États spécifiques pour l'importation ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Référence pour réinitialiser le champ de fichier

  // --- État de chargement/traitement ---
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Effet pour initialiser les champs/sélections en fonction du mode et de l'unité ---
  useEffect(() => {
    if (!open) {
      // Réinitialise tous les champs et sélections quand la modale se ferme
      setTitreUnite("");
      setOptionId(null);
      setSelectedNiveauId(null);
      setSelectedFile(null);
      setFileContent(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Réinitialise le champ de fichier HTML
      }
      return;
    }

    // Charge les données hiérarchiques (niveaux, options) à chaque ouverture
    async function fetchHierarchyData() {
      const [{ data: niveauxData, error: niveauxError },
             { data: optionsData, error: optionsError }] = await Promise.all([
        supabase.from("niveaux").select("id, nom_niveau").order("nom_niveau"),
        supabase.from("options").select("id, nom_option, niveau_id").order("nom_option"),
      ]);

      if (niveauxError) console.error("Erreur récupération niveaux :", niveauxError);
      if (optionsError) console.error("Erreur récupération options :", optionsError);

      setNiveaux(niveauxData || []);
      setOptions(optionsData || []);
    }
    fetchHierarchyData();

    // Logique d'initialisation spécifique à chaque mode
    if (mode === 'edit' && unite) {
      setTitreUnite(unite.titre_unite);
      setOptionId(unite.option_id);
      // Trouve le niveau_id de l'option de l'unité éditée pour pré-sélectionner le niveau
      const currentOption = options.find(o => o.id === unite.option_id);
      if (currentOption) {
        setSelectedNiveauId(currentOption.niveau_id);
      }
    } else if (mode === 'add' || mode === 'import') {
      // Pré-remplit les sélecteurs de niveau et d'option avec les valeurs de la page parente
      // (utile pour le contexte d'ajout ou d'importation)
      setSelectedNiveauId(initialNiveauId ?? null);
      // Ne définit initialOptionId que si un niveau est déjà sélectionné pour éviter des options non pertinentes
      setOptionId(initialOptionId && initialNiveauId ? initialOptionId : null);
      setTitreUnite(""); // Assure que le titre est vide pour l'ajout/importation
    }
  }, [open, mode, unite, initialNiveauId, initialOptionId]); // Dépend de 'options' pour la pré-sélection en mode édition, mais géré par le fetch à l'ouverture.

  // --- Gestionnaires de changement pour les listes déroulantes de filtres ---
  const handleNiveauChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const niveauId = e.target.value === "" ? null : Number(e.target.value);
    setSelectedNiveauId(niveauId);
    setOptionId(null); // Réinitialise l'option lors du changement de niveau
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const optId = e.target.value === "" ? null : Number(e.target.value);
    setOptionId(optId);
  };

  // --- Logique de filtrage des options basées sur la sélection du niveau ---
  const filteredOptions = options.filter(o => !selectedNiveauId || o.niveau_id === selectedNiveauId);

  // --- Gère la sélection de fichier et lit son contenu (mode 'import') ---
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

  // --- Fonction principale de soumission (ajout, modification, importation) ---
  const handleSubmit = async () => {
    setIsProcessing(true);

    if (mode === 'add' || mode === 'edit') {
      // --- Logique d'ajout ou de modification ---
      if (!titreUnite.trim() || !optionId) {
        alert("Veuillez renseigner le titre de l'unité et sélectionner une option.");
        setIsProcessing(false);
        return;
      }

      try {
        if (mode === 'edit' && unite) {
          // Mise à jour
          const { error } = await supabase
            .from("unites")
            .update({ titre_unite: titreUnite.trim(), option_id: optionId })
            .eq("id", unite.id);
          if (error) throw error;
          alert("Unité mise à jour avec succès !");
        } else {
          // Ajout
          const { error } = await supabase.from("unites").insert({
            titre_unite: titreUnite.trim(),
            option_id: optionId,
          });
          if (error) throw error;
          alert("Unité ajoutée avec succès !");
        }
        onSuccess(); // Appelle le callback de succès
      } catch (error: any) {
        console.error(`Erreur lors de l'${mode === 'edit' ? 'mise à jour' : 'ajout'} de l'unité :`, error.message || error);
        alert(`Échec de l'${mode === 'edit' ? 'mise à jour' : 'ajout'} : ${error.message || "Erreur inconnue"}`);
      } finally {
        setIsProcessing(false);
      }
    } else if (mode === 'import') {
      // --- Logique d'importation ---
      if (!optionId) {
        alert("Veuillez sélectionner l'option à laquelle associer les unités.");
        setIsProcessing(false);
        return;
      }
      if (!fileContent || !selectedFile) {
        alert("Veuillez sélectionner un fichier texte à importer.");
        setIsProcessing(false);
        return;
      }

      const titres = fileContent.split("\n").map(line => line.trim()).filter(line => line.length > 0);

      if (titres.length === 0) {
        alert("Le fichier ne contient aucun titre d'unité valide.");
        setIsProcessing(false);
        return;
      }

      const unitsToInsert = titres.map(titre => ({
        titre_unite: titre,
        option_id: optionId,
      }));

      try {
        const { data, error } = await supabase
          .from("unites")
          .insert(unitsToInsert)
          .select("id"); // Sélectionne les IDs insérés pour obtenir le nombre

        if (error) {
          throw error;
        }

        alert(`${data?.length || 0} unités importées avec succès !`);
        onSuccess(); // Appelle le callback de succès
      } catch (error: any) {
        console.error("Erreur lors de l'importation des unités :", error.message || error);
        alert(`Échec de l'importation : ${error.message || "Erreur inconnue"}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // --- Fonction de suppression (seulement en mode 'edit') ---
  const handleDelete = async () => {
    if (!unite || mode !== 'edit') return; // Ne peut supprimer qu'en mode édition
    const confirmDelete = window.confirm("Voulez-vous vraiment supprimer cette unité ? Tous les chapitres associés seront également supprimés.");
    if (!confirmDelete) return;

    setIsProcessing(true);
    try {
      // Si votre BDD gère le CASCADE DELETE, cette seule requête est suffisante.
      // Sinon, il faudrait supprimer les chapitres associés d'abord.
      const { error } = await supabase.from("unites").delete().eq("id", unite.id);
      if (error) {
        throw error;
      }
      alert("Unité supprimée avec succès !");
      onSuccess(); // Appelle le callback de succès
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'unité :", error.message || error);
      alert(`Échec de la suppression : ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Rendu de la modale ---
  const dialogTitle =
    mode === 'add' ? "➕ Nouvelle Unité" :
    mode === 'edit' ? "✏️ Modifier l'Unité" :
    "📚 Importer des Unités";

  const submitButtonText =
    isProcessing ? "Traitement..." :
    mode === 'add' ? "Ajouter" :
    mode === 'edit' ? "Mettre à jour" :
    "Importer";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Sélection du Niveau (toujours affichée) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="niveau-select" className="text-right">Niveau</label>
            <select
              id="niveau-select"
              value={selectedNiveauId ?? ""}
              onChange={handleNiveauChange}
              className="col-span-3 border rounded px-3 py-2 w-full"
              disabled={isProcessing}
            >
              <option value="">Sélectionner un niveau</option>
              {niveaux.map((n) => (
                <option key={n.id} value={n.id}>{n.nom_niveau}</option>
              ))}
            </select>
          </div>

          {/* Sélection de l'Option (toujours affichée) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="option-select" className="text-right">Option cible</label>
            <select
              id="option-select"
              value={optionId ?? ""}
              onChange={handleOptionChange}
              disabled={!selectedNiveauId || isProcessing} // Désactivé si aucun niveau sélectionné ou en traitement
              className="col-span-3 border rounded px-3 py-2 w-full"
            >
              <option value="">Sélectionner une option</option>
              {filteredOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.nom_option}</option>
              ))}
            </select>
          </div>

          {/* Champs spécifiques au mode 'add' ou 'edit' */}
          {(mode === 'add' || mode === 'edit') && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="titreUnite" className="text-right">Titre de l'Unité</label>
              <input
                id="titreUnite"
                type="text"
                value={titreUnite}
                onChange={(e) => setTitreUnite(e.target.value)}
                className="col-span-3 border rounded px-3 py-2 w-full"
                placeholder="Ex : Unité 1 - Introduction"
                disabled={isProcessing}
              />
            </div>
          )}

          {/* Champ spécifique au mode 'import' */}
          {mode === 'import' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="file-upload" className="text-right">Fichier texte (.txt)</label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".txt" // N'accepte que les fichiers .txt
                  onChange={handleFileChange}
                  ref={fileInputRef} // Attache la référence
                  className="col-span-3 border rounded px-3 py-2 w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={isProcessing}
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
            </>
          )}
        </div>
        <DialogFooter className="flex justify-between items-center">
          {mode === 'edit' && ( // Bouton supprimer uniquement en mode édition
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              Supprimer
            </Button>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isProcessing || !optionId || ((mode === 'add' || mode === 'edit') && !titreUnite.trim()) || (mode === 'import' && (!selectedFile || !fileContent))}>
              {submitButtonText}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditUniteModal;