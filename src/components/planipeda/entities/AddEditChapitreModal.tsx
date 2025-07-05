/**
 * 📌 Fichier : AddEditChapitreModal.tsx
 * 📍 Chemin : src/components/planipeda/entities/AddEditChapitreModal.tsx
 * 🎯 Objectif : Gérer l'ajout et la modification d'un chapitre dans une modale unifiée,
 * avec sélection hiérarchique (niveau > option > unité).
 * 🛠️ Fonctionnalités :
 * - Mode création : Ajout d'un nouveau chapitre avec sélection en cascade.
 * - Mode édition : Modification d'un chapitre existant (avec pré-sélection des filtres).
 * - Sélection hiérarchique (niveau, option, unité).
 * - Interactions avec Supabase pour l'insertion, la mise à jour et la suppression.
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/backend/config/supabase";

// ---
// 🧩 Interfaces des entités (celles déjà définies ou similaires)
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
interface Chapitre {
  id: number;
  titre_chapitre: string;
  unite_id: number;
  // Les noms hiérarchiques ne sont pas nécessaires pour l'édition dans la modale,
  // car nous gérons les IDs directement.
}

// ---
// Props pour le composant unifié
// ---
interface AddEditChapitreModalProps {
  open: boolean;
  chapitre?: Chapitre | null; // Sera null pour l'ajout, et l'objet Chapitre pour la modification
  onClose: () => void;
  onSuccess: () => void; // Appelée après ajout, modification ou suppression réussie
  // initialUniteId n'est plus strictement nécessaire car la modale gère sa propre hiérarchie
  // mais peut être conservé si vous avez un cas d'usage où vous voulez forcer une unité au départ.
  // Pour cette implémentation, on se base sur le 'chapitre' existant ou une sélection neuve.
}

// ---
// 🎬 Composant AddEditChapitreModal
// ---
const AddEditChapitreModal: React.FC<AddEditChapitreModalProps> = ({
  open,
  chapitre,
  onClose,
  onSuccess,
}) => {
  const [titreChapitre, setTitreChapitre] = useState("");
  const [uniteId, setUniteId] = useState<number | null>(null);

  // États pour les listes hiérarchiques
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);

  // États pour les sélections hiérarchiques (dans la modale)
  const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);

  // ---
  // Synchronise l'état local avec les props (pour le mode édition et réinitialisation)
  // ---
  useEffect(() => {
    if (!open) {
      // Réinitialise tous les champs et sélections quand la modale se ferme
      setTitreChapitre("");
      setUniteId(null);
      setSelectedNiveauId(null);
      setSelectedOptionId(null);
      setIsEditMode(false);
      return;
    }

    // Si la modale s'ouvre et qu'un chapitre est fourni (mode édition)
    if (chapitre) {
      setIsEditMode(true);
      setTitreChapitre(chapitre.titre_chapitre);
      setUniteId(chapitre.unite_id); // Définit l'unité ID du chapitre existant

      // Pré-sélectionne le niveau et l'option de l'unité du chapitre
      const currentUnite = unites.find(u => u.id === chapitre.unite_id);
      if (currentUnite) {
        setSelectedOptionId(currentUnite.option_id);
        const currentOption = options.find(o => o.id === currentUnite.option_id);
        if (currentOption) {
          setSelectedNiveauId(currentOption.niveau_id);
        }
      }
    } else {
      // Mode ajout
      setIsEditMode(false);
      setTitreChapitre("");
      setUniteId(null);
      setSelectedNiveauId(null); // S'assure que les filtres sont vides par défaut en ajout
      setSelectedOptionId(null);
    }
  }, [open, chapitre, unites, options]); // Dépend de 'unites' et 'options' pour la pré-sélection en mode édition

  // ---
  // Charge toutes les données hiérarchiques (niveaux, options, unités) à l'ouverture de la modale
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
  // Gestionnaires de changement pour les listes déroulantes de filtres
  // ---
  const handleNiveauChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const niveauId = e.target.value === "" ? null : Number(e.target.value);
    setSelectedNiveauId(niveauId);
    setSelectedOptionId(null); // Réinitialise l'option et l'unité lors du changement de niveau
    setUniteId(null);
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const optionId = e.target.value === "" ? null : Number(e.target.value);
    setSelectedOptionId(optionId);
    setUniteId(null); // Réinitialise l'unité lors du changement d'option
  };

  const handleUniteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unitId = e.target.value === "" ? null : Number(e.target.value);
    setUniteId(unitId);
  };

  // ---
  // Logique de filtrage des options et unités basées sur les sélections
  // ---
  const filteredOptions = options.filter(o => !selectedNiveauId || o.niveau_id === selectedNiveauId);
  const filteredUnites = unites.filter(u => !selectedOptionId || u.option_id === selectedOptionId);

  // ---
  // Fonctions de sauvegarde et suppression
  // ---
  const handleSave = async () => {
    if (!titreChapitre.trim() || !uniteId) {
      alert("Veuillez renseigner le titre du chapitre et sélectionner une unité.");
      return;
    }

    if (isEditMode && chapitre) {
      // Logique de modification
      const { error } = await supabase
        .from("chapitres")
        .update({ titre_chapitre: titreChapitre.trim(), unite_id: uniteId })
        .eq("id", chapitre.id);

      if (error) {
        console.error("Erreur lors de la mise à jour du chapitre :", error);
        alert("Échec de la mise à jour du chapitre.");
      } else {
        onSuccess();
        onClose();
      }
    } else {
      // Logique d'ajout
      const { error } = await supabase.from("chapitres").insert({
        titre_chapitre: titreChapitre.trim(),
        unite_id: uniteId,
      });

      if (error) {
        console.error("Erreur lors de l'ajout du chapitre :", error);
        alert("Échec de l'ajout du chapitre.");
      } else {
        onSuccess();
        onClose();
      }
    }
  };

  const handleDelete = async () => {
    if (!chapitre || !isEditMode) return; // Ne peut supprimer qu'en mode édition
    const confirmDelete = window.confirm("Voulez-vous vraiment supprimer ce chapitre ?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("chapitres").delete().eq("id", chapitre.id);
    if (error) {
      console.error("Erreur lors de la suppression du chapitre :", error);
      alert("Échec de la suppression du chapitre.");
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modifier le Chapitre" : "Ajouter un Nouveau Chapitre"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Sélection du Niveau */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="niveau-select" className="text-right">
              Niveau
            </label>
            <select
              id="niveau-select"
              value={selectedNiveauId ?? ""}
              onChange={handleNiveauChange}
              className="col-span-3 border rounded px-3 py-2 w-full"
            >
              <option value="">Sélectionner un niveau</option>
              {niveaux.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nom_niveau}
                </option>
              ))}
            </select>
          </div>

          {/* Sélection de l'Option */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="option-select" className="text-right">
              Option
            </label>
            <select
              id="option-select"
              value={selectedOptionId ?? ""}
              onChange={handleOptionChange}
              disabled={!selectedNiveauId} // Désactivé si aucun niveau sélectionné
              className="col-span-3 border rounded px-3 py-2 w-full"
            >
              <option value="">Sélectionner une option</option>
              {filteredOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nom_option}
                </option>
              ))}
            </select>
          </div>

          {/* Sélection de l'Unité */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="unite-select" className="text-right">
              Unité
            </label>
            <select
              id="unite-select"
              value={uniteId ?? ""}
              onChange={handleUniteChange}
              disabled={!selectedOptionId} // Désactivé si aucune option sélectionnée
              className="col-span-3 border rounded px-3 py-2 w-full"
            >
              <option value="">Sélectionner une unité</option>
              {filteredUnites.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.titre_unite}
                </option>
              ))}
            </select>
          </div>

          {/* Titre du Chapitre */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="titreChapitre" className="text-right">
              Titre du Chapitre
            </label>
            <input
              id="titreChapitre"
              type="text"
              value={titreChapitre}
              onChange={(e) => setTitreChapitre(e.target.value)}
              className="col-span-3 border rounded px-3 py-2 w-full"
              placeholder="Ex : Chapitre 1 - Introduction aux fonctions"
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between items-center">
          {isEditMode && (
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" onClick={handleSave}>
              {isEditMode ? "Mettre à jour" : "Ajouter"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditChapitreModal;