// 📄 Fichier : OptionsPage.tsx
// 📁 Chemin : src/components/planipeda/pages/OptionsPage.tsx
// 🎯 Rôle : Afficher, filtrer, ajouter et modifier les options pédagogiques associées à des niveaux

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/backend/config/supabase";
import { useNavigate } from "react-router-dom";
import EntityOptionModal from "../entities/EntityOptionModal";
import OptionList from "../entities/OptionList";
import EditOptionModal from "../entities/EditOptionModal";

// Interface pour représenter une option avec le niveau lié (niveau au singulier)
interface Option {
  id: number;
  nom_option: string;
  niveau_id: number;
  niveau?: {           // <-- niveau au singulier, correspond à la jointure Supabase corrigée
    nom_niveau: string;
  };
}

// Interface pour représenter un niveau
interface Niveau {
  id: number;
  nom_niveau: string;
}

const OptionsPage: React.FC = () => {
  // États locaux
  const [options, setOptions] = useState<Option[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const [selectedNiveau, setSelectedNiveau] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | undefined>(undefined);

  const navigate = useNavigate();

  // Récupération des options avec la bonne jointure 'niveau'
  const fetchOptions = async () => {
    const { data, error } = await supabase
      .from("options")
      .select("*, niveau:niveau_id(*)")  // <-- jointure correcte, alias 'niveau'
      .order("id");

    if (error) {
      console.error("Erreur lors du chargement des options :", error);
    } else {
      setOptions(data);
      setFilteredOptions(data);
    }
  };

  // Récupération des niveaux
  const fetchNiveaux = async () => {
    const { data, error } = await supabase.from("niveaux").select("*").order("id");

    if (error) {
      console.error("Erreur lors du chargement des niveaux :", error);
    } else {
      setNiveaux(data);
    }
  };

  // Chargement initial des données
  useEffect(() => {
    fetchOptions();
    fetchNiveaux();
  }, []);

  // Filtrage des options par niveau sélectionné
  useEffect(() => {
    if (selectedNiveau === null) {
      setFilteredOptions(options);
    } else {
      setFilteredOptions(options.filter((option) => option.niveau_id === selectedNiveau));
    }
  }, [selectedNiveau, options]);

  // Gestion des actions utilisateur
  const handleAdd = () => {
    setSelectedOption(undefined);
    setModalOpen(true);
  };

  const handleEdit = (option: Option) => {
    setSelectedOption(option);
    setModalOpen(true);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleNiveauChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const niveauId = e.target.value === "" ? null : Number(e.target.value);
    setSelectedNiveau(niveauId);
  };

  // Rendu du composant
return (
  <div className="page-container">
    {/* En-tête avec titre à gauche + bouton Ajouter à droite */}
    <div className="niveaux-header flex justify-between items-center mb-4">
      <h1 className="page-title">📝 Gestion des Options</h1>
      <Button onClick={handleAdd} className="add-button">
        Ajouter une option
      </Button>
    </div>

    {/* Bouton retour sous l’en-tête, avec petite flèche */}
    <button
      className="btn-outline mb-4 flex items-center gap-1"
      onClick={() => navigate(-1)}
    >
      ← Retour
    </button>

    {/* Sélecteur de niveau */}
    <div className="niveau-select-container">
      <label htmlFor="niveau-select" className="niveau-select-label">
        Sélectionnez un niveau
      </label>
      <select
        id="niveau-select"
        className="niveau-select"
        onChange={handleNiveauChange}
        value={selectedNiveau ?? ""}
      >
        <option value="">Tous les niveaux</option>
        {niveaux.map((niveau) => (
          <option key={niveau.id} value={niveau.id}>
            {niveau.nom_niveau}
          </option>
        ))}
      </select>
    </div>

    {/* Liste des options */}
    <div className="niveaux-list-container">
      <OptionList options={filteredOptions} onEdit={handleEdit} />
    </div>

    {/* Modal pour ajout ou modification */}
    {selectedOption ? (
      <EditOptionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        option={selectedOption}
        niveaux={niveaux}
        onUpdated={() => {
          setModalOpen(false);
          fetchOptions();
        }}
      />
    ) : (
      <EntityOptionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          fetchOptions();
        }}
        placeholder="Nom de l'option"
        niveaux={niveaux}
      />
    )}
  </div>
);

};

export default OptionsPage;
