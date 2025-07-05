/**
 * 📘 Fichier : UnitesPage.tsx
 * 📍 Chemin : src/components/planipeda/pages/UnitesPage.tsx
 * 🎯 Objectif : Interface de gestion des unités.
 * 🛠️ Fonctionnalités :
 * - Affichage de la liste des unités filtrable par niveau et option.
 * - Boutons d'accès rapide pour ajouter une nouvelle unité ou importer des unités depuis un fichier.
 * - Intégration de la **modale unifiée** pour l'ajout, la modification et l'importation (`AddEditUniteModal`).
 * - Navigation vers la page précédente.
 * - Rafraîchissement des données après chaque opération (ajout, modif, suppression, import).
 */

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"; // Composant bouton de shadcn/ui
import { supabase } from "@/backend/config/supabase"; // Client Supabase
import { useNavigate } from "react-router-dom"; // Hook de navigation de React Router
import UniteList from "../entities/UniteList"; // Composant d'affichage de la liste des unités
import AddEditUniteModal from "../entities/AddEditUniteModal"; // 💡 Modale UNIQUE pour ajout/édition/importation

// --- Interfaces des entités (structure des données) ---
interface Unite {
  id: number;
  titre_unite: string;
  option_id: number;
  niveau_id: number | null; // ID du niveau associé, peut être null
  niveau_nom: string;       // Nom du niveau associé
  option_nom: string;       // Nom de l'option associée
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

// --- Composant principal de la page des unités ---
const UnitesPage: React.FC = () => {
  const navigate = useNavigate(); // Hook pour la navigation

  // --- États pour stocker les données récupérées de Supabase ---
  const [unites, setUnites] = useState<Unite[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);

  // --- États pour les filtres de la page principale ---
  const [selectedNiveau, setSelectedNiveau] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // --- États pour la gestion de la modale AddEditUniteModal ---
  const [currentUnite, setCurrentUnite] = useState<Unite | null>(null); // L'unité à éditer (null pour ajout ou import)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'import' | null>(null); // Mode de la modale
  const [isModalOpen, setIsModalOpen] = useState(false);   // Contrôle l'ouverture/fermeture de la modale

  // --- Effet de chargement initial des données au montage du composant ---
  useEffect(() => {
    fetchData(); // Appel de la fonction de récupération des données
  }, []);

  // --- Fonction asynchrone pour récupérer toutes les données (niveaux, options, unités) ---
  const fetchData = async () => {
    try {
      // Exécute toutes les requêtes Supabase en parallèle pour optimiser
      const [
        { data: niveauxData, error: niveauxError },
        { data: optionsData, error: optionsError },
        { data: unitesData, error: unitesError },
      ] = await Promise.all([
        supabase.from("niveaux").select("*").order("id"), // Récupère tous les niveaux
        supabase.from("options").select("*").order("id"), // Récupère toutes les options
        supabase.from("unites").select(`
          id,
          titre_unite,
          option_id,
          options:option_id (nom_option, niveau_id) // Jointure pour récupérer les noms d'options et les IDs de niveaux
        `).order("id"), // Récupère toutes les unités avec leurs options associées
      ]);

      // Gestion des erreurs de récupération
      if (niveauxError) console.error("Erreur récupération niveaux :", niveauxError);
      if (optionsError) console.error("Erreur récupération options :", optionsError);
      if (unitesError) console.error("Erreur récupération unités :", unitesError);

      // Met à jour les états avec les données récupérées
      setNiveaux(niveauxData || []);
      setOptions(optionsData || []);

      // Création d'une Map pour un accès rapide aux noms de niveaux par leur ID
      const niveauxById = new Map((niveauxData || []).map(n => [n.id, n.nom_niveau]));

      // Formatage des données des unités pour inclure les noms de niveau et d'option
      const formattedUnites = (unitesData || []).map((u: any) => {
        const niveauId = u.options?.niveau_id ?? null;
        const niveauNom = niveauId ? niveauxById.get(niveauId) : "Non défini";

        return {
          id: u.id,
          titre_unite: u.titre_unite,
          option_id: u.option_id,
          option_nom: u.options?.nom_option || "Inconnue",
          niveau_id: niveauId,
          niveau_nom: niveauNom || "Non défini",
        };
      });

      setUnites(formattedUnites); // Met à jour l'état des unités formatées
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error);
      alert("Impossible de récupérer les niveaux, options et unités.");
    }
  };

  // --- Logique de filtrage des options pour les sélecteurs de la page principale ---
  // Affiche uniquement les options qui appartiennent au niveau sélectionné
  const filteredPageOptions = options.filter(o => !selectedNiveau || o.niveau_id === selectedNiveau);

  // --- Logique de filtrage des unités affichées dans la liste ---
  // Filtre les unités en fonction des sélections de niveau et d'option
  const filteredUnites = unites.filter((u) => {
    return (
      (!selectedNiveau || u.niveau_id === selectedNiveau) &&
      (!selectedOption || u.option_id === selectedOption)
    );
  });

  // --- Gestionnaires d'ouverture de la modale unique ---
  // Ouvre la modale en mode "ajout"
  const handleOpenAddModal = () => {
    setCurrentUnite(null); // Pas d'unité sélectionnée pour l'ajout
    setModalMode('add');
    setIsModalOpen(true);
  };

  // Ouvre la modale en mode "modification"
  const handleOpenEditModal = (unite: Unite) => {
    setCurrentUnite(unite); // Passe l'unité à modifier
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Ouvre la modale en mode "importation"
  const handleOpenImportModal = () => {
    setCurrentUnite(null); // Pas d'unité spécifique pour l'importation
    setModalMode('import');
    setIsModalOpen(true);
  };

  // --- Rendu du composant de la page des unités ---
  return (
    <div className="page-container p-6">
      <h1 className="page-title text-3xl font-bold mb-6 text-center">📚 Gestion des Unités</h1>

      {/* Section des boutons d'action (Retour, Importer, Ajouter) */}
      <div className="flex justify-between items-center mb-6">
        {/* Bouton de retour */}
        <button
          className="btn-outline px-4 py-2 border rounded-md hover:bg-gray-100 transition-colors"
          onClick={() => navigate(-1)} // Navigue vers la page précédente
        >
          ← Retour
        </button>

        {/* Conteneur des boutons d'ajout et d'importation */}
        <div className="flex gap-3">
          {/* Bouton pour importer des unités */}
          <Button
            onClick={handleOpenImportModal}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-all duration-200 ease-in-out"
          >
            📚 Importer des unités
          </Button>
          {/* Bouton pour ajouter une unité */}
          <Button
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-all duration-200 ease-in-out"
          >
            ➕ Ajouter une unité
          </Button>
        </div>
      </div>

      {/* --- Section des filtres hiérarchiques (Niveau > Option) --- */}
      <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-50 rounded-lg shadow-sm">
        {/* Filtre par Niveau */}
        <div className="flex flex-col">
          <label htmlFor="niveau-select" className="text-sm font-medium text-gray-700 mb-1">Niveau</label>
          <select
            id="niveau-select"
            className="border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
            value={selectedNiveau ?? ""}
            onChange={(e) => {
              const id = e.target.value === "" ? null : Number(e.target.value);
              setSelectedNiveau(id);
              setSelectedOption(null); // Réinitialise l'option si le niveau change
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

        {/* Filtre par Option */}
        <div>
          <label className="text-sm font-medium block mb-1">Option</label>
          <select
            className="border rounded px-3 py-2"
            value={selectedOption ?? ""}
            onChange={(e) => setSelectedOption(Number(e.target.value))}
            disabled={!selectedNiveau} // Désactivé si aucun niveau n'est sélectionné
          >
            <option value="">Toutes les options</option>
            {/* Affiche uniquement les options filtrées par le niveau sélectionné */}
            {filteredPageOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nom_option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* --- Liste des unités filtrées --- */}
      <UniteList
        unites={filteredUnites} // Passe la liste des unités filtrées au composant d'affichage
        onEdit={handleOpenEditModal} // Passe le gestionnaire d'édition
      />

      {/* --- Modale unifiée d'ajout/modification/importation (rendue conditionnellement) --- */}
      {isModalOpen && modalMode && (
        <AddEditUniteModal
          open={isModalOpen}
          mode={modalMode} // Passe le mode actuel (add, edit, import)
          unite={currentUnite} // Passe l'unité à éditer (sera null en mode ajout/import)
          onClose={() => {
            setIsModalOpen(false);
            setCurrentUnite(null); // Réinitialise l'unité sélectionnée à la fermeture
            setModalMode(null); // Réinitialise le mode
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setCurrentUnite(null);
            setModalMode(null);
            fetchData(); // Rafraîchit toutes les données après une opération réussie
          }}
          // Passe les IDs des filtres courants de la page pour pré-remplir la modale si en mode importation
          initialNiveauId={selectedNiveau}
          initialOptionId={selectedOption}
        />
      )}
    </div>
  );
};

export default UnitesPage;