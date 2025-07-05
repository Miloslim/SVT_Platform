/*
 * 📌 Fichier : ObjectifsPage.tsx
 * 📍 Chemin : src/components/planipeda/pages/ObjectifsPage.tsx
 * 🎯 Objectif : Gestion des objectifs pédagogiques avec filtres hiérarchiques (Niveau → Option → Unité → Chapitre)
 * + Ajout, Édition et Importation d'objectifs via une modale unifiée (AddEditObjectifModal)
 */

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/backend/config/supabase";
import { useNavigate } from "react-router-dom";
import ObjectifList from "../entities/ObjectifList";
// Import de la nouvelle modale unifiée
import AddEditObjectifModal from "../entities/AddEditObjectifModal";

// 📚 Interfaces de typage des entités (conservées pour les filtres et l'affichage)
type Niveau = { id: number; nom_niveau: string };
type Option = { id: number; nom_option: string; niveau_id: number };
type Unite = { id: number; titre_unite: string; option_id: number };
type Chapitre = { id: number; titre_chapitre: string; unite_id: number };
type Objectif = {
  id: number;
  chapitre_id: number;
  objectif_type: string;
  description_objectif: string;
  chapitre_nom: string;
  unite_nom: string;
  option_nom: string;
  niveau_nom: string;
};

// 🎮 Composant principal
const ObjectifsPage: React.FC = () => {
  // 🧠 États pour stocker les données de chaque entité
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [chapitres, setChapitres] = useState<Chapitre[]>([]);
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);

  // 🎯 États de filtres (pour hiérarchie)
  const [selectedNiveau, setSelectedNiveau] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedUnite, setSelectedUnite] = useState<number | null>(null);
  const [selectedChapitre, setSelectedChapitre] = useState<number | null>(null);

  // ➕/✏️/📚 États pour la modale unifiée AddEditObjectifModal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'import'>('add');
  const [selectedObjectifForEdit, setSelectedObjectifForEdit] = useState<Objectif | null>(null);

  const navigate = useNavigate();

  // 📥 Chargement initial des données
  useEffect(() => {
    fetchData();
  }, []);

  // 🔄 Fonction de récupération des données depuis Supabase
  const fetchData = async () => {
    try {
      const [
        { data: niveauxData },
        { data: optionsData },
        { data: unitesData },
        { data: chapitresData },
        { data: objectifsData },
      ] = await Promise.all([
        supabase.from("niveaux").select("*").order("id"),
        supabase.from("options").select("*").order("id"),
        supabase.from("unites").select("*").order("id"),
        supabase.from("chapitres").select("*").order("id"),
        supabase
          .from("objectifs")
          .select(`id, chapitre_id, objectif_type, description_objectif,
            chapitres:chapitre_id(
              id, titre_chapitre, unite_id,
              unites:unite_id(
                id, titre_unite, option_id,
                options:option_id(
                  id, nom_option, niveau_id,
                  niveaux:niveau_id(
                    id, nom_niveau
                  )
                )
              )
            )
          `).order("id"),
      ]);

      setNiveaux(niveauxData || []);
      setOptions(optionsData || []);
      setUnites(unitesData || []);
      setChapitres(chapitresData || []);

      // 🔁 Formatage des objectifs pour affichage lisible
      const formattedObjectifs = (objectifsData || []).map((o: any) => {
        const chapitre = o.chapitres;
        const unite = chapitre?.unites;
        const option = unite?.options;
        const niveau = option?.niveaux;
        return {
          id: o.id,
          chapitre_id: o.chapitre_id,
          objectif_type: o.objectif_type,
          description_objectif: o.description_objectif,
          chapitre_nom: chapitre?.titre_chapitre || "",
          unite_nom: unite?.titre_unite || "",
          option_nom: option?.nom_option || "",
          niveau_nom: niveau?.nom_niveau || "",
        };
      });
      setObjectifs(formattedObjectifs);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      alert("Erreur de chargement des données.");
    }
  };

  // 🔍 Filtres dynamiques basés sur la sélection (inchangé)
  const filteredOptions = options.filter(o => !selectedNiveau || o.niveau_id === selectedNiveau);
  const filteredUnites = unites.filter(u => !selectedOption || u.option_id === selectedOption);
  const filteredChapitres = chapitres.filter(c => !selectedUnite || c.unite_id === selectedUnite);
  const filteredObjectifs = objectifs.filter(o => {
    const niveauMatch = !selectedNiveau || o.niveau_nom === niveaux.find(n => n.id === selectedNiveau)?.nom_niveau;
    const optionMatch = !selectedOption || o.option_nom === options.find(o => o.id === selectedOption)?.nom_option;
    const uniteMatch = !selectedUnite || o.unite_nom === unites.find(u => u.id === selectedUnite)?.titre_unite;
    const chapitreMatch = !selectedChapitre || o.chapitre_id === selectedChapitre;
    return niveauMatch && optionMatch && uniteMatch && chapitreMatch;
  });

  // --- Fonctions pour ouvrir la modale dans différents modes ---
  const handleOpenAddModal = () => {
    setSelectedObjectifForEdit(null); // Pas d'objectif à éditer en mode ajout
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (objectif: Objectif) => {
    setSelectedObjectifForEdit(objectif); // Définit l'objectif à éditer
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenImportModal = () => {
    setSelectedObjectifForEdit(null); // Pas d'objectif à éditer en mode import
    setModalMode('import');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedObjectifForEdit(null);
  };

  const handleModalSuccess = () => {
    fetchData(); // Rafraîchit les données après une opération réussie
    handleModalClose(); // Ferme la modale
  };

  // 🎨 Affichage principal
  return (
    <div className="page-container">
      <h1 className="page-title">🎯 Gestion des Objectifs</h1>

      {/* Barre d’actions avec bouton retour à gauche et boutons d'action à droite */}
      <div className="flex justify-between items-center mb-4">
        <button className="btn-outline" onClick={() => navigate(-1)}>
          ← Retour
        </button>

        <div className="flex gap-2"> {/* Conteneur pour les nouveaux boutons */}
          <Button 
            onClick={handleOpenImportModal} variant="secondary"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-all duration-200 ease-in-out"
            >
            📚 Importer des objectifs
          </Button>
          <Button onClick={handleOpenAddModal}>
            ➕ Ajouter un objectif
          </Button>

        </div>
      </div>

      {/* Filtres hiérarchiques (inchangés) */}
      <div className="flex gap-4 mb-6">
        {/* Niveau */}
        <div>
          <label className="text-sm font-medium">Niveau</label>
          <select
            className="border rounded px-3 py-2"
            value={selectedNiveau ?? ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : Number(e.target.value);
              setSelectedNiveau(val);
              setSelectedOption(null);
              setSelectedUnite(null);
              setSelectedChapitre(null);
            }}
          >
            <option value="">Tous les niveaux</option>
            {niveaux.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nom_niveau}
              </option>
            ))}
          </select>
        </div>

        {/* Option */}
        <div>
          <label className="text-sm font-medium">Option</label>
          <select
            className="border rounded px-3 py-2"
            value={selectedOption ?? ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : Number(e.target.value);
              setSelectedOption(val);
              setSelectedUnite(null);
              setSelectedChapitre(null);
            }}
            disabled={!selectedNiveau}
          >
            <option value="">Toutes les options</option>
            {filteredOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nom_option}
              </option>
            ))}
          </select>
        </div>

        {/* Unité */}
        <div>
          <label className="text-sm font-medium">Unité</label>
          <select
            className="border rounded px-3 py-2"
            value={selectedUnite ?? ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : Number(e.target.value);
              setSelectedUnite(val);
              setSelectedChapitre(null);
            }}
            disabled={!selectedOption}
          >
            <option value="">Toutes les unités</option>
            {filteredUnites.map((u) => (
              <option key={u.id} value={u.id}>
                {u.titre_unite}
              </option>
            ))}
          </select>
        </div>

        {/* Chapitre */}
        <div>
          <label className="text-sm font-medium">Chapitre</label>
          <select
            className="border rounded px-3 py-2"
            value={selectedChapitre ?? ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : Number(e.target.value);
              setSelectedChapitre(val);
            }}
            disabled={!selectedUnite}
          >
            <option value="">Tous les chapitres</option>
            {filteredChapitres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titre_chapitre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des objectifs */}
      <ObjectifList objectifs={filteredObjectifs} onEdit={handleOpenEditModal} />

      {/* Modale unifiée d'ajout/édition/importation d'objectifs */}
      <AddEditObjectifModal
        open={isModalOpen}
        mode={modalMode}
        objectif={selectedObjectifForEdit}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        // Passage des IDs de filtre actuels pour pré-remplir la modale si en mode ajout/import
        initialNiveauId={selectedNiveau}
        initialOptionId={selectedOption}
        initialUniteId={selectedUnite}
        initialChapitreId={selectedChapitre}
      />
    </div>
  );
};

export default ObjectifsPage;