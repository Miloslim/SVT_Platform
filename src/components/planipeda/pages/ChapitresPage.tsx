/**
 * 📘 Fichier : ChapitresPage.tsx
 * 📍 Chemin : src/components/planipeda/pages/ChapitresPage.tsx
 * 🎯 Objectif : Interface de gestion des chapitres avec filtres par hiérarchie (niveau > option > unité), ajout et modification.
 */

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/backend/config/supabase";
import { useNavigate } from "react-router-dom";
import ChapitreList from "../entities/ChapitreList";
import AddEditChapitreModal from "../entities/AddEditChapitreModal";
import ImportChapitresModal from "../entities/ImportChapitresModal"; // <-- NOUVEL IMPORT

// ---
// 🧩 Interfaces des entités utilisées (base de données)
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
  unite_nom: string;
  option_nom: string;
  niveau_nom: string;
}

// ---
// 🎬 Composant principal : gestion des chapitres
// ---
const ChapitresPage: React.FC = () => {
  const navigate = useNavigate();

  // ---
  // 🔄 États principaux : données récupérées depuis Supabase
  // ---
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [chapitres, setChapitres] = useState<Chapitre[]>([]);

  // ---
  // 🎛️ États de filtres pour la hiérarchie Niveau > Option > Unité
  // ---
  const [selectedNiveau, setSelectedNiveau] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedUnite, setSelectedUnite] = useState<number | null>(null);

  // ---
  // ✏️ États pour la modale d'ajout et de modification unifiée
  // ---
  const [selectedChapitre, setSelectedChapitre] = useState<Chapitre | null>(null); // Le chapitre à éditer (sera null pour l'ajout)
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false); // Contrôle l'ouverture de la modale Add/Edit

  // ---
  // ➕ États pour la modale d'importation
  // ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // <-- NOUVEL ÉTAT

  // ---
  // 📦 Chargement initial des données depuis Supabase
  // ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: niveauxData, error: niveauxError },
             { data: optionsData, error: optionsError },
             { data: unitesData, error: unitesError },
             { data: chapitresData, error: chapitresError }] = await Promise.all([
        supabase.from("niveaux").select("*").order("id"),
        supabase.from("options").select("*").order("id"),
        supabase.from("unites").select("*").order("id"),
        supabase
          .from("chapitres")
          .select(`
            id, titre_chapitre, unite_id,
            unites:unite_id (
              id, titre_unite, option_id,
              options:option_id (
                id, nom_option, niveau_id,
                niveaux:niveau_id (
                  id, nom_niveau
                )
              )
            )
          `)
          .order("id"),
      ]);

      if (niveauxError) console.error("Erreur récupération niveaux :", niveauxError);
      if (optionsError) console.error("Erreur récupération options :", optionsError);
      if (unitesError) console.error("Erreur récupération unités :", unitesError);
      if (chapitresError) console.error("Erreur récupération chapitres :", chapitresError);

      setNiveaux(niveauxData || []);
      setOptions(optionsData || []);
      setUnites(unitesData || []);

      // Formatage des chapitres avec noms hiérarchiques
      const formattedChapitres = (chapitresData || []).map((c: any) => {
        const niveau = c.unites?.options?.niveaux;
        const option = c.unites?.options;
        const unite = c.unites;
        return {
          id: c.id,
          titre_chapitre: c.titre_chapitre,
          unite_id: c.unite_id,
          unite_nom: unite?.titre_unite || "Non défini",
          option_nom: option?.nom_option || "Non défini",
          niveau_nom: niveau?.nom_niveau || "Non défini",
        };
      });
      setChapitres(formattedChapitres);
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
      alert("Erreur lors de la récupération des données.");
    }
  };

  // ---
  // 🔍 Application des filtres hiérarchiques sur les chapitres
  // ---
  const filteredOptions = options.filter(o => !selectedNiveau || o.niveau_id === selectedNiveau);
  const filteredUnites = unites.filter(u => !selectedOption || u.option_id === selectedOption);
  const filteredChapitres = chapitres.filter(c => {
    const niveauMatch = !selectedNiveau || c.niveau_nom === niveaux.find(n => n.id === selectedNiveau)?.nom_niveau;
    const optionMatch = !selectedOption || c.option_nom === options.find(o => o.id === selectedOption)?.nom_option;
    const uniteMatch = !selectedUnite || c.unite_id === selectedUnite;
    return niveauMatch && optionMatch && uniteMatch;
  });

  // ---
  // ✅ Actions pour ouvrir les modales
  // ---
  const handleOpenEditModal = (chapitre: Chapitre) => {
    setSelectedChapitre(chapitre);
    setIsAddEditModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setSelectedChapitre(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenImportModal = () => { // <-- NOUVELLE FONCTION
    setIsImportModalOpen(true);
  };

  // ---
  // 🖼️ Rendu principal de la page
  // ---
  return (
    <div className="page-container p-6">
      <h1 className="page-title text-3xl font-bold mb-6 text-center">📘 Gestion des Chapitres</h1>

      <div className="flex justify-between items-center mb-6">
        <button
          className="btn-outline px-4 py-2 border rounded-md hover:bg-gray-100 transition-colors"
          onClick={() => navigate(-1)}
        >
          ← Retour
        </button>

        {/* NOUVEAUX BOUTONS */}
        <div className="flex gap-3"> {/* Conteneur pour les boutons d'ajout/importation */}
          <Button
            onClick={handleOpenImportModal}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-all duration-200 ease-in-out"
          >
            📚 Importer des chapitres
          </Button>
          <Button
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-all duration-200 ease-in-out"
          >
            ➕ Ajouter un chapitre
          </Button>
        </div>
      </div>

      {/* --- Filtres hiérarchiques (inchangés) --- */}
      <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-50 rounded-lg shadow-sm">
        {/* Niveau */}
        <div className="flex flex-col">
          <label htmlFor="niveau-select" className="text-sm font-medium text-gray-700 mb-1">Niveau</label>
          <select
            id="niveau-select"
            className="border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
            value={selectedNiveau ?? ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : Number(e.target.value);
              setSelectedNiveau(val);
              setSelectedOption(null);
              setSelectedUnite(null);
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
        <div className="flex flex-col">
          <label htmlFor="option-select" className="text-sm font-medium text-gray-700 mb-1">Option</label>
          <select
            id="option-select"
            className="border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
            value={selectedOption ?? ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : Number(e.target.value);
              setSelectedOption(val);
              setSelectedUnite(null);
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
        <div className="flex flex-col">
          <label htmlFor="unite-select" className="text-sm font-medium text-gray-700 mb-1">Unité</label>
          <select
            id="unite-select"
            className="border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
            value={selectedUnite ?? ""}
            onChange={(e) => {
              const val = e.target.value === "" ? null : Number(e.target.value);
              setSelectedUnite(val);
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
      </div>

      {/* --- Liste des chapitres filtrés (inchangée) --- */}
      <ChapitreList chapitres={filteredChapitres} onEdit={handleOpenEditModal} />

      {/* --- Modale d'ajout/modification unifiée --- */}
      {isAddEditModalOpen && (
        <AddEditChapitreModal
          open={isAddEditModalOpen}
          chapitre={selectedChapitre}
          onClose={() => {
            setIsAddEditModalOpen(false);
            setSelectedChapitre(null);
          }}
          onSuccess={() => {
            setIsAddEditModalOpen(false);
            setSelectedChapitre(null);
            fetchData(); // Rafraîchit les données après l'ajout/mod/suppression
          }}
        />
      )}

      {/* --- Modale d'importation de chapitres --- */}
      {isImportModalOpen && (
        <ImportChapitresModal
          open={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            setIsImportModalOpen(false);
            fetchData(); // Rafraîchit les données après l'importation
          }}
          // Passe les IDs des filtres courants à la modale pour pré-remplissage
          initialNiveauId={selectedNiveau}
          initialOptionId={selectedOption}
          initialUniteId={selectedUnite}
        />
      )}
    </div>
  );
};

export default ChapitresPage;