// ===========================================================================
// 📁 Fichier : NiveauxPage.tsx
// 📌 Emplacement : src/components/planipeda/pages/NiveauxPage.tsx
// 🎯 Objectif :
//   - Gérer l'affichage, l'ajout et la modification des niveaux pédagogiques
//   - Connexion à Supabase via src/backend/config/supabase.ts
// ===========================================================================

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/backend/config/supabase";
import { useNavigate } from "react-router-dom";
import EntityModal from "../entities/EntityNiveauModal";
import NiveauxList from "../entities/NiveauList";


// Interface cohérente avec la table Supabase
interface Niveau {
  id: number;
  nom_niveau: string;
}

const NiveauxPage: React.FC = () => {
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNiveau, setSelectedNiveau] = useState<Niveau | undefined>(undefined);

  const navigate = useNavigate();

  // Charger les niveaux depuis Supabase
  const fetchNiveaux = async () => {
    const { data, error } = await supabase
      .from("niveaux")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("❌ Erreur chargement niveaux :", error.message);
    } else {
      setNiveaux(data || []);
    }
  };

  useEffect(() => {
    fetchNiveaux();
  }, []);

  const handleEdit = (niveau: Niveau) => {
    setSelectedNiveau(niveau);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedNiveau(undefined);
    setModalOpen(true);
  };

  const handleBack = () => {
    navigate(-1);
  };

return (
  <div className="page-container">
    {/* En-tête avec titre à gauche + bouton Ajouter à droite */}
    <div className="niveaux-header flex justify-between items-center mb-4">
      <h1 className="page-title">📚 Gestion des Niveaux</h1>
      <Button className="add-button" onClick={handleAdd}>
        Ajouter un niveau
      </Button>
    </div>

    {/* Bouton retour aligné à gauche avec flèche */}
    <button
      className="btn-outline mb-6 flex items-center gap-1"
      onClick={() => navigate(-1)}
    >
      ← Retour
    </button>

    {/* Liste des niveaux */}
    <div className="niveaux-list-container">
      <NiveauxList niveaux={niveaux} onEdit={handleEdit} />
    </div>

    {/* Modale ajout/modification */}
    <EntityModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      table="niveaux"
      entity={selectedNiveau}
      onSaved={fetchNiveaux}
      placeholder="Nom du niveau"
    />
  </div>
);

};

export default NiveauxPage;
