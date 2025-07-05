/**
 * 📌 Fichier : AddEditObjectifModal.tsx
 * 📍 Chemin : src/components/planipeda/entities/AddEditObjectifModal.tsx
 * 🎯 Objectif : Modale unifiée pour gérer l'ajout, la modification et l'importation en masse d'objectifs.
 * 🛠️ Fonctionnalités :
 * - Gère trois modes : 'add' (ajout), 'edit' (modification), 'import' (importation depuis fichier texte).
 * - Sélection hiérarchique complète (Niveau > Option > Unité > Chapitre) pour associer les objectifs.
 * - En mode 'add' ou 'edit', permet de saisir/modifier le type et la description de l'objectif.
 * - En mode 'edit', pré-remplit les champs et affiche un bouton de suppression.
 * - En mode 'import', fournit un champ d'upload de fichier texte et gère la lecture/l'insertion en masse.
 * (Le fichier doit contenir une description par ligne).
 * - Interactions avec Supabase pour l'insertion, la mise à jour et la suppression d'objectifs.
 * - Gestion des états de chargement/traitement pour désactiver les boutons.
 */

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button"; // Composant bouton de shadcn/ui
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Composants de modale de shadcn/ui
import { supabase } from "@/backend/config/supabase"; // Client Supabase

// --- Interfaces de typage des entités ---
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
}
interface Objectif {
  id: number;
  chapitre_id: number;
  objectif_type: string;
  description_objectif: string;
}

// --- Props pour le composant AddEditObjectifModal ---
interface AddEditObjectifModalProps {
  open: boolean;
  mode: 'add' | 'edit' | 'import'; // Mode de fonctionnement de la modale
  objectif?: Objectif | null; // L'objectif à éditer (présent uniquement en mode 'edit')
  onClose: () => void; // Fonction appelée pour fermer la modale
  onSuccess: () => void; // Fonction appelée après une opération réussie (ajout, modif, suppression, import)
  // Props pour pré-remplir les sélecteurs en mode 'add' ou 'import' si un contexte est déjà sélectionné dans la page parente
  initialNiveauId?: number | null;
  initialOptionId?: number | null;
  initialUniteId?: number | null;
  initialChapitreId?: number | null;
}

// --- Composant principal AddEditObjectifModal ---
const AddEditObjectifModal: React.FC<AddEditObjectifModalProps> = ({
  open,
  mode,
  objectif,
  onClose,
  onSuccess,
  initialNiveauId,
  initialOptionId,
  initialUniteId,
  initialChapitreId,
}) => {
  // --- États pour les champs du formulaire (pour add/edit) ---
  const [description, setDescription] = useState("");
  const [type, setType] = useState(""); // Ex: "Notionnel", "Habilité"

  // --- États pour les listes déroulantes hiérarchiques ---
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [chapitres, setChapitres] = useState<Chapitre[]>([]);

  // Les IDs sélectionnés pour la hiérarchie
  const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [selectedUniteId, setSelectedUniteId] = useState<number | null>(null);
  const [selectedChapitreId, setSelectedChapitreId] = useState<number | null>(null);

  // --- États spécifiques pour l'importation ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Référence pour réinitialiser le champ d'upload

  // --- État de chargement/traitement pour désactiver les interactions pendant les opérations Supabase ---
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Effet de chargement des données hiérarchiques (niveaux, options, unités, chapitres) ---
  // S'exécute à l'ouverture de la modale pour garantir des listes à jour
  useEffect(() => {
    if (!open) {
      // Réinitialise tous les états à la fermeture de la modale
      setDescription("");
      setType("");
      setSelectedNiveauId(null);
      setSelectedOptionId(null);
      setSelectedUniteId(null);
      setSelectedChapitreId(null);
      setSelectedFile(null);
      setFileContent(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Réinitialise le champ de fichier HTML
      }
      return;
    }

    async function fetchHierarchyData() {
      try {
        const [
          { data: nivData, error: nivError },
          { data: optData, error: optError },
          { data: uniData, error: uniError },
          { data: chapData, error: chapError },
        ] = await Promise.all([
          supabase.from("niveaux").select("id, nom_niveau").order("nom_niveau"),
          supabase.from("options").select("id, nom_option, niveau_id").order("nom_option"),
          supabase.from("unites").select("id, titre_unite, option_id").order("titre_unite"),
          supabase.from("chapitres").select("id, titre_chapitre, unite_id").order("titre_chapitre"),
        ]);

        if (nivError) throw nivError;
        if (optError) throw optError;
        if (uniError) throw uniError;
        if (chapError) throw chapError;

        setNiveaux(nivData || []);
        setOptions(optData || []);
        setUnites(uniData || []);
        setChapitres(chapData || []);

      } catch (error) {
        console.error("Erreur lors du chargement des données hiérarchiques :", error);
        alert("Impossible de charger les données pour les sélecteurs.");
      }
    }
    fetchHierarchyData();
  }, [open]); // Dépend de l'état 'open' de la modale

  // --- Effet pour initialiser les champs du formulaire en mode 'edit' ---
  // S'exécute lorsque 'objectif' change (cad, quand un objectif est passé pour édition)
  useEffect(() => {
    if (mode === 'edit' && objectif) {
      setDescription(objectif.description_objectif);
      setType(objectif.objectif_type);
      setSelectedChapitreId(objectif.chapitre_id); // Initialise le chapitre de l'objectif à modifier
    } else if (mode === 'add' || mode === 'import') {
      // Pour les modes 'add' et 'import', on utilise les initial*Id de la page parente
      setSelectedNiveauId(initialNiveauId ?? null);
      setSelectedOptionId(initialOptionId ?? null);
      setSelectedUniteId(initialUniteId ?? null);
      setSelectedChapitreId(initialChapitreId ?? null);
      setDescription(""); // S'assurer que le champ description est vide
      setType(""); // S'assurer que le champ type est vide
    }
  }, [objectif, mode, initialNiveauId, initialOptionId, initialUniteId, initialChapitreId]);


  // --- Effet pour déduire les IDs hiérarchiques supérieurs (niveau, option, unité) ---
  // S'exécute quand les données hiérarchiques ou le selectedChapitreId changent
  useEffect(() => {
    // Cette logique ne s'applique qu'en mode 'edit' et si un chapitre est sélectionné
    // et que toutes les données hiérarchiques sont chargées.
    if (mode === 'edit' && selectedChapitreId && chapitres.length && unites.length && options.length && niveaux.length) {
      const chapitre = chapitres.find(c => c.id === selectedChapitreId);
      if (chapitre) {
        const unite = unites.find(u => u.id === chapitre.unite_id);
        if (unite) {
          const option = options.find(o => o.id === unite.option_id);
          if (option) {
            const niveau = niveaux.find(n => n.id === option.niveau_id);
            setSelectedNiveauId(niveau?.id ?? null);
            setSelectedOptionId(option.id);
            setSelectedUniteId(unite.id);
          }
        }
      }
    }
  }, [selectedChapitreId, chapitres, unites, options, niveaux, mode]);


  // --- Logique de filtrage des listes déroulantes pour les sélecteurs hiérarchiques ---
  const filteredOptions = options.filter(o => !selectedNiveauId || o.niveau_id === selectedNiveauId);
  const filteredUnites = unites.filter(u => !selectedOptionId || u.option_id === selectedOptionId);
  const filteredChapitres = chapitres.filter(c => !selectedUniteId || c.unite_id === selectedUniteId);

  // --- Gestion du changement de fichier (mode 'import') ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent(event.target?.result as string);
      };
      reader.readAsText(file); // Lit le contenu du fichier comme du texte
    } else {
      setSelectedFile(null);
      setFileContent(null);
    }
  };

  // --- Fonction de soumission principale (ajout, modification, importation) ---
  const handleSubmit = async () => {
    setIsProcessing(true); // Active l'état de traitement

    if (mode === 'add' || mode === 'edit') {
      // --- Logique d'ajout ou de modification d'un seul objectif ---
      if (!selectedChapitreId || !description.trim() || !type.trim()) {
        alert("Veuillez sélectionner un chapitre, un type et saisir une description.");
        setIsProcessing(false);
        return;
      }

      try {
        if (mode === 'edit' && objectif) {
          // Mise à jour de l'objectif existant
          const { error } = await supabase
            .from("objectifs")
            .update({
              description_objectif: description.trim(),
              objectif_type: type,
              chapitre_id: selectedChapitreId,
            })
            .eq("id", objectif.id); // Cible l'objectif par son ID
          if (error) throw error;
          alert("Objectif mis à jour avec succès !");
        } else {
          // Ajout d'un nouvel objectif
          const { error } = await supabase.from("objectifs").insert({
            description_objectif: description.trim(),
            objectif_type: type,
            chapitre_id: selectedChapitreId,
          });
          if (error) throw error;
          alert("Objectif ajouté avec succès !");
        }
        onSuccess(); // Appelle la fonction de succès (qui rafraîchit la page parente et ferme la modale)
      } catch (error: any) {
        console.error(`Erreur lors de l'${mode === 'edit' ? 'mise à jour' : 'ajout'} de l'objectif :`, error.message || error);
        alert(`Échec de l'${mode === 'edit' ? 'mise à jour' : 'ajout'} : ${error.message || "Erreur inconnue"}`);
      } finally {
        setIsProcessing(false);
      }
    } else if (mode === 'import') {
      // --- Logique d'importation d'objectifs en masse ---
      if (!selectedChapitreId) {
        alert("Veuillez sélectionner le chapitre auquel associer les objectifs importés.");
        setIsProcessing(false);
        return;
      }
      if (!type.trim()) { // Le type doit être sélectionné même pour l'import
        alert("Veuillez sélectionner le type d'objectif pour l'importation.");
        setIsProcessing(false);
        return;
      }
      if (!fileContent || !selectedFile) {
        alert("Veuillez sélectionner un fichier texte à importer.");
        setIsProcessing(false);
        return;
      }

      // Sépare le contenu du fichier en lignes, nettoie les espaces et filtre les lignes vides
      const descriptions = fileContent.split("\n").map(line => line.trim()).filter(line => line.length > 0);

      if (descriptions.length === 0) {
        alert("Le fichier ne contient aucun objectif valide.");
        setIsProcessing(false);
        return;
      }

      // Crée un tableau d'objets prêts à être insérés dans Supabase
      const objectivesToInsert = descriptions.map(desc => ({
        description_objectif: desc,
        objectif_type: type, // Utilise le type sélectionné pour tous les objectifs importés
        chapitre_id: selectedChapitreId,
      }));

      try {
        const { data, error } = await supabase
          .from("objectifs")
          .insert(objectivesToInsert)
          .select("id"); // Demande l'ID des lignes insérées pour compter

        if (error) {
          throw error;
        }

        alert(`${data?.length || 0} objectifs importés avec succès !`);
        onSuccess(); // Appelle la fonction de succès
      } catch (error: any) {
        console.error("Erreur lors de l'importation des objectifs :", error.message || error);
        alert(`Échec de l'importation : ${error.message || "Erreur inconnue"}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // --- Fonction de suppression d'un objectif (uniquement en mode 'edit') ---
  const handleDelete = async () => {
    if (!objectif || mode !== 'edit') return; // S'assure que nous sommes en mode édition et qu'un objectif est sélectionné
    const confirmDelete = window.confirm("Voulez-vous vraiment supprimer cet objectif ?");
    if (!confirmDelete) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase.from("objectifs").delete().eq("id", objectif.id);
      if (error) throw error;
      alert("Objectif supprimé avec succès !");
      onSuccess(); // Appelle la fonction de succès
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'objectif :", error.message || error);
      alert(`Échec de la suppression : ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Détermination du titre de la modale en fonction du mode ---
  const dialogTitle =
    mode === 'add' ? "➕ Ajouter un Objectif" :
    mode === 'edit' ? "✏️ Modifier l'Objectif" :
    "📚 Importer des Objectifs";

  // --- Détermination du texte du bouton de soumission en fonction du mode ---
  const submitButtonText =
    isProcessing ? "Traitement..." :
    mode === 'add' ? "Ajouter" :
    mode === 'edit' ? "Mettre à jour" :
    "Importer";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"> {/* Ajout de overflow-y-auto */}
        <DialogHeader>
          <DialogTitle className="text-center">{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">

          {/* Sélecteur de Niveau */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="niveau-select" className="text-right">Niveau</label>
            <select
              id="niveau-select"
              value={selectedNiveauId ?? ""}
              onChange={(e) => {
                const id = e.target.value === "" ? null : Number(e.target.value);
                setSelectedNiveauId(id);
                setSelectedOptionId(null);
                setSelectedUniteId(null);
                setSelectedChapitreId(null);
              }}
              className="col-span-3 border rounded px-3 py-2 w-full"
              disabled={isProcessing}
            >
              <option value="">Sélectionner un niveau</option>
              {niveaux.map((n) => (
                <option key={n.id} value={n.id}>{n.nom_niveau}</option>
              ))}
            </select>
          </div>

          {/* Sélecteur d'Option */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="option-select" className="text-right">Option</label>
            <select
              id="option-select"
              value={selectedOptionId ?? ""}
              onChange={(e) => {
                const id = e.target.value === "" ? null : Number(e.target.value);
                setSelectedOptionId(id);
                setSelectedUniteId(null);
                setSelectedChapitreId(null);
              }}
              className="col-span-3 border rounded px-3 py-2 w-full"
              disabled={!selectedNiveauId || isProcessing}
            >
              <option value="">Sélectionner une option</option>
              {filteredOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.nom_option}</option>
              ))}
            </select>
          </div>

          {/* Sélecteur d'Unité */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="unite-select" className="text-right">Unité</label>
            <select
              id="unite-select"
              value={selectedUniteId ?? ""}
              onChange={(e) => {
                const id = e.target.value === "" ? null : Number(e.target.value);
                setSelectedUniteId(id);
                setSelectedChapitreId(null);
              }}
              className="col-span-3 border rounded px-3 py-2 w-full"
              disabled={!selectedOptionId || isProcessing}
            >
              <option value="">Sélectionner une unité</option>
              {filteredUnites.map((u) => (
                <option key={u.id} value={u.id}>{u.titre_unite}</option>
              ))}
            </select>
          </div>

          {/* Sélecteur de Chapitre */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="chapitre-select" className="text-right">Chapitre cible</label>
            <select
              id="chapitre-select"
              value={selectedChapitreId ?? ""}
              onChange={(e) => setSelectedChapitreId(e.target.value === "" ? null : Number(e.target.value))}
              className="col-span-3 border rounded px-3 py-2 w-full"
              disabled={!selectedUniteId || isProcessing}
            >
              <option value="">Sélectionner un chapitre</option>
              {filteredChapitres.map((c) => (
                <option key={c.id} value={c.id}>{c.titre_chapitre}</option>
              ))}
            </select>
          </div>

          {/* Sélecteur de Type d'Objectif (toujours affiché) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="objectif-type-select" className="text-right">Type d'objectif</label>
            <select
              id="objectif-type-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="col-span-3 border rounded px-3 py-2 w-full"
              disabled={isProcessing}
            >
              <option value="">-- Sélectionnez un type --</option>
              <option value="Notionnel">Notionnel</option>
              <option value="Habilité">Habilité</option>
            </select>
          </div>

          {/* Champ(s) spécifiques au mode 'add' ou 'edit' */}
          {(mode === 'add' || mode === 'edit') && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3 border rounded px-3 py-2 w-full"
                placeholder="Saisissez la description de l'objectif"
                rows={4}
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
                  accept=".txt"
                  onChange={handleFileChange}
                  ref={fileInputRef}
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
                  <p className="font-medium">Aperçu du contenu (premières lignes du fichier) :</p>
                  <pre className="whitespace-pre-wrap text-xs text-gray-700">
                    {fileContent.split('\n').slice(0, 5).join('\n')}
                    {fileContent.split('\n').length > 5 ? '\n...' : ''}
                  </pre>
                  <p className="text-xs text-gray-500 mt-2">Chaque ligne du fichier sera insérée comme un objectif.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Boutons d'action (Supprimer, Annuler, Soumettre) */}
        <DialogFooter className="flex justify-between items-center mt-4">
          {mode === 'edit' && ( // Bouton supprimer uniquement en mode édition
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              Supprimer
            </Button>
          )}
          <div className="flex gap-2 ml-auto"> {/* ml-auto pour aligner à droite si pas de bouton "Supprimer" */}
            <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={
                isProcessing ||
                !selectedChapitreId || // Chapitre toujours obligatoire
                !type.trim() || // Type toujours obligatoire
                ((mode === 'add' || mode === 'edit') && !description.trim()) || // Description obligatoire en mode add/edit
                (mode === 'import' && (!selectedFile || !fileContent)) // Fichier/contenu obligatoire en mode import
              }>
              {submitButtonText}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditObjectifModal;