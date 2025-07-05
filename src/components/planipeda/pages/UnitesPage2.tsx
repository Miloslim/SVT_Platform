import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/backend/config/supabase";
import { useNavigate } from "react-router-dom";
import UniteList from "../entities/UniteList";

/// 🔹 Définition des interfaces
interface Unite {
  id: number;
  titre_unite: string;
  option_id: number;
  niveau_id: number; // 🔹 Ajout du niveau_id pour le filtrage
  option_nom: string;
}

interface Niveau {
  id: number;
  nom_niveau: string;
}

interface Option {
  id: number;
  nom_option: string;
  niveau_id: number;
}

const UnitesPage: React.FC = () => {
  /// 🔹 États pour stocker les données
  const [unites, setUnites] = useState<Unite[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);

  /// 🔹 États pour les filtres et les modales
  const [selectedNiveau, setSelectedNiveau] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [titreUnite, setTitreUnite] = useState<string>("");
  const [openUniteModal, setOpenUniteModal] = useState(false);

  const navigate = useNavigate();

  /// 🔹 Chargement des niveaux, options et unités au montage du composant
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: niveauxData, error: niveauxError }, { data: optionsData, error: optionsError }, { data: unitesData, error: unitesError }] = await Promise.all([
          supabase.from("niveaux").select("*").order("id"),
          supabase.from("options").select("*").order("id"),
          supabase.from("unites").select(`
            id, 
            titre_unite, 
            option_id,
            options:option_id (nom_option, niveau_id)
          `).order("id"),
        ]);

        if (niveauxError) throw niveauxError;
        if (optionsError) throw optionsError;
        if (unitesError) throw unitesError;

        setNiveaux(niveauxData || []);
        setOptions(optionsData || []);

        /// 🔹 Transformation des unités pour inclure `niveau_id`
        const formattedUnites = unitesData.map((u) => ({
          id: u.id,
          titre_unite: u.titre_unite,
          option_id: u.option_id,
          niveau_id: u.options?.niveau_id || null, // 🔹 Ajout du niveau_id
          option_nom: u.options?.nom_option || "Inconnue",
        }));

        setUnites(formattedUnites);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
        alert("Impossible de récupérer les niveaux, options et unités.");
      }
    };

    fetchData();
  }, []);

  /// 🔹 Ajout d'une unité
  const handleAddUnite = async () => {
    if (!selectedOption || !titreUnite.trim()) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const { error } = await supabase.from("unites").insert({
        titre_unite: titreUnite.trim(),
        option_id: selectedOption,
      });

      if (error) throw error;

      setTitreUnite("");
      setOpenUniteModal(false);

      /// 🔹 Rafraîchir la liste des unités après ajout
      const { data: updatedUnites } = await supabase.from("unites").select(`
        id, 
        titre_unite, 
        option_id,
        options:option_id (nom_option, niveau_id)
      `).order("id");

      const formattedUnites = updatedUnites.map((u) => ({
        id: u.id,
        titre_unite: u.titre_unite,
        option_id: u.option_id,
        niveau_id: u.options?.niveau_id || null,
        option_nom: u.options?.nom_option || "Inconnue",
      }));

      setUnites(formattedUnites);
    } catch (error) {
      console.error("Erreur lors de l'ajout :", error);
      alert("Erreur lors de l'ajout.");
    }
  };

  /// 🔹 Filtrage des unités par Niveau et Option
  const filteredUnites = unites.filter((u) => {
    return (
      (!selectedNiveau || u.niveau_id === selectedNiveau) && // 🔹 Vérifie le niveau
      (!selectedOption || u.option_id === selectedOption) // 🔹 Vérifie l'option
    );
  });

  return (
    <div className="page-container">
      <h1 className="page-title">📚 Gestion des Unités</h1>

      <Button onClick={() => navigate(-1)} variant="outline" className="mb-4">
        Retour
      </Button>

      {/* 🔹 Filtres */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="text-sm font-medium">Niveau</label>
          <select
            className="border rounded px-3 py-2"
            value={selectedNiveau ?? ""}
            onChange={(e) => {
              const id = e.target.value === "" ? null : Number(e.target.value);
              setSelectedNiveau(id);
              setSelectedOption(null);
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

        <div>
          <label className="text-sm font-medium">Option</label>
          <select
            className="border rounded px-3 py-2"
            value={selectedOption ?? ""}
            onChange={(e) => setSelectedOption(Number(e.target.value))}
            disabled={!selectedNiveau}
          >
            <option value="">Toutes les options</option>
            {options
              .filter((o) => selectedNiveau === null || o.niveau_id === selectedNiveau)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nom_option}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* 🔹 Modale d’ajout d’une unité */}
      <Dialog open={openUniteModal} onOpenChange={setOpenUniteModal}>
        <DialogTrigger asChild>
          <Button>Ajouter une Unité</Button>
        </DialogTrigger>
        <DialogContent>
          <h2 className="text-lg font-semibold mb-4">➕ Nouvelle Unité</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label>Niveau</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={selectedNiveau ?? ""}
                onChange={(e) => {
                  const id = e.target.value === "" ? null : Number(e.target.value);
                  setSelectedNiveau(id);
                  setSelectedOption(null);
                }}
              >
                <option value="">Sélectionner un niveau</option>
                {niveaux.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nom_niveau}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Option</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={selectedOption ?? ""}
                onChange={(e) => setSelectedOption(Number(e.target.value))}
                disabled={!selectedNiveau}
              >
                <option value="">Sélectionner une option</option>
                {options
                  .filter((o) => selectedNiveau === null || o.niveau_id === selectedNiveau)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nom_option}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label>Titre de l’unité</label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full"
                value={titreUnite}
                onChange={(e) => setTitreUnite(e.target.value)}
                placeholder="Ex: Unité 1 - Introduction"
              />
            </div>

            <Button onClick={handleAddUnite}>Ajouter</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🔹 Liste des unités */}
      <UniteList unites={filteredUnites} />
    </div>
  );
};

export default UnitesPage;
