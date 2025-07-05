/**
 * Nom du Fichier: ChapterTargetSelector.tsx
 * Chemin: src/components/planipeda/chapitreplanifier/ChapterTargetSelector.tsx
 *
 * Fonctionnalités:
 * - Fournit des sélecteurs pour définir la position hiérarchique d'un chapitre (Niveau > Option > Unité > Chapitre de Référence).
 * - Charge dynamiquement les données (niveaux, options, unités, chapitres) depuis Supabase.
 * - Gère l'état local des sélections et remonte les IDs choisis au composant parent via `onChange`.
 * - Est une version simplifiée et focalisée du HierarchicalSelector pour éviter les conflits de types et responsabilités.
 * - Inclut des props `initial*` pour pré-remplir les sélections lors de l'édition.
 * - Améliorations : Messages contextuels pour les sélecteurs désactivés ou vides, et styles améliorés.
 */

import React, { useEffect, useState, useCallback } from "react";
// Assurez-vous que le chemin vers votre configuration Supabase est correct
import { supabase } from "@/backend/config/supabase";

// Interfaces pour les données spécifiques de cette hiérarchie
interface NiveauData { id: number; nom_niveau: string }
interface OptionData { id: number; nom_option: string; niveau_id: number }
interface UniteData { id: number; titre_unite: string; option_id: number }
interface ChapitreData { id: number; titre_chapitre: string; unite_id: number }

/**
 * Props pour le composant ChapterTargetSelector.
 */
interface ChapterTargetSelectorProps {
  // Fonction de rappel appelée lorsque les sélections changent.
  onChange: (selection: {
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
    chapitreReferenceId: number | null;
  }) => void;
  // Props optionnelles pour les valeurs initiales des sélections (utiles pour l'édition).
  initialNiveauId?: number | null;
  initialOptionId?: number | null;
  initialUniteId?: number | null;
  initialChapitreReferenceId?: number | null;
}

const ChapterTargetSelector: React.FC<ChapterTargetSelectorProps> = ({
  onChange,
  initialNiveauId = null,
  initialOptionId = null,
  initialUniteId = null,
  initialChapitreReferenceId = null,
}) => {
  // États pour stocker les données brutes chargées depuis Supabase
  const [niveaux, setNiveaux] = useState<NiveauData[]>([]);
  const [options, setOptions] = useState<OptionData[]>([]);
  const [unites, setUnites] = useState<UniteData[]>([]);
  const [chapitres, setChapitres] = useState<ChapitreData[]>([]);

  // États pour la gestion du chargement et des erreurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour stocker les IDs des éléments actuellement sélectionnés par l'utilisateur
  const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(initialNiveauId);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(initialOptionId);
  const [selectedUniteId, setSelectedUniteId] = useState<number | null>(initialUniteId);
  const [selectedChapitreReferenceId, setSelectedChapitreReferenceId] = useState<number | null>(initialChapitreReferenceId);

  // Effet pour charger toutes les données de la hiérarchie (niveaux, options, unités, chapitres)
  // S'exécute une seule fois au montage du composant.
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Exécution parallèle des requêtes Supabase pour un chargement plus rapide
        const [{ data: niveauxData, error: nivError },
               { data: optionsData, error: optError },
               { data: unitesData, error: uniError },
               { data: chapitresData, error: chapError }] =
          await Promise.all([
            supabase.from("niveaux").select("id, nom_niveau").order("id"),
            supabase.from("options").select("id, nom_option, niveau_id").order("id"),
            supabase.from("unites").select("id, titre_unite, option_id").order("id"),
            supabase.from("chapitres").select("id, titre_chapitre, unite_id").order("id"),
          ]);

        // Gestion des erreurs potentielles lors des requêtes
        if (nivError || optError || uniError || chapError) {
          throw nivError || optError || uniError || chapError;
        }

        // Mise à jour des états avec les données chargées
        setNiveaux(niveauxData || []);
        setOptions(optionsData || []);
        setUnites(unitesData || []);
        setChapitres(chapitresData || []);

      } catch (err: any) {
        console.error("Erreur lors du chargement des données hiérarchiques :", err);
        setError("Erreur de chargement de la structure : " + (err.message || "inconnue"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // Le tableau vide [] signifie que cet effet ne s'exécute qu'une fois après le rendu initial.

  // Effet pour synchroniser les sélections internes avec les props initiales.
  // Utile lorsque les props changent (ex: chargement d'un chapitre existant pour édition).
  useEffect(() => {
    setSelectedNiveauId(initialNiveauId);
    setSelectedOptionId(initialOptionId);
    setSelectedUniteId(initialUniteId);
    setSelectedChapitreReferenceId(initialChapitreReferenceId);
  }, [initialNiveauId, initialOptionId, initialUniteId, initialChapitreReferenceId]);


  // Effet pour remonter la sélection actuelle au composant parent via `onChange`.
  // S'exécute à chaque fois que les IDs sélectionnés changent.
  useEffect(() => {
    onChange({
      niveauId: selectedNiveauId,
      optionId: selectedOptionId,
      uniteId: selectedUniteId,
      chapitreReferenceId: selectedChapitreReferenceId,
    });
  }, [selectedNiveauId, selectedOptionId, selectedUniteId, selectedChapitreReferenceId, onChange]);


  // Fonctions de gestion des changements pour chaque sélecteur.
  // Elles mettent à jour l'état local et réinitialisent les sélections des niveaux inférieurs.
  const handleNiveauChange = useCallback((val: number | null) => {
    setSelectedNiveauId(val);
    setSelectedOptionId(null);
    setSelectedUniteId(null);
    setSelectedChapitreReferenceId(null);
  }, []);

  const handleOptionChange = useCallback((val: number | null) => {
    setSelectedOptionId(val);
    setSelectedUniteId(null);
    setSelectedChapitreReferenceId(null);
  }, []);

  const handleUniteChange = useCallback((val: number | null) => {
    setSelectedUniteId(val);
    setSelectedChapitreReferenceId(null);
  }, []);

  const handleChapitreChange = useCallback((val: number | null) => {
    setSelectedChapitreReferenceId(val);
  }, []);

  // Fonctions de filtrage pour afficher les options pertinentes dans chaque sélecteur.
  const filteredOptions = options.filter((opt) => selectedNiveauId === null || opt.niveau_id === selectedNiveauId);
  const filteredUnites = unites.filter((u) => selectedOptionId === null || u.option_id === selectedOptionId);
  const filteredChapitres = chapitres.filter((c) => selectedUniteId === null || c.unite_id === selectedUniteId);

  // Affichage conditionnel pendant le chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center h-24">
        <p className="text-gray-600">Chargement de la structure des cours...</p>
      </div>
    );
  }

  // Affichage conditionnel en cas d'erreur de chargement
  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  // Rendu du composant avec les sélecteurs
  return (
    <div className="bg-blue-50 border border-gray-200 rounded-xl p-6 shadow-sm px-3 py-1">
              <h4 className="text-sm bg-pink-100 font-semibold rounded-xl text-gray-800 text-center mb-4">
          Ciblage du Chapitre dans la Progression
        </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-4">
        {/* Sélecteur Niveau */}
        <Selector
          label="Niveau"
          id="select-niveau"
          value={selectedNiveauId}
          options={niveaux.map((n) => ({ id: n.id, label: n.nom_niveau }))}
          onChange={handleNiveauChange}
          placeholderText="Sélectionner un niveau" // Texte d'aide spécifique
        />

        {/* Sélecteur Option */}
        <Selector
          label="Option"
          id="select-option"
          value={selectedOptionId}
          disabled={selectedNiveauId === null || filteredOptions.length === 0}
          options={filteredOptions.map((o) => ({ id: o.id, label: o.nom_option }))}
          onChange={handleOptionChange}
          placeholderText={ // Texte d'aide contextuel
            selectedNiveauId === null
              ? "Sélectionnez d'abord un niveau" // Si aucun niveau n'est sélectionné
              : filteredOptions.length === 0
              ? "Aucune option disponible" // Si le niveau sélectionné n'a pas d'options
              : "Sélectionner une option" // Par défaut
          }
        />

        {/* Sélecteur Unité */}
        <Selector
          label="Unité"
          id="select-unite"
          value={selectedUniteId}
          disabled={selectedOptionId === null || filteredUnites.length === 0}
          options={filteredUnites.map((u) => ({ id: u.id, label: u.titre_unite }))}
          onChange={handleUniteChange}
          placeholderText={ // Texte d'aide contextuel
            selectedOptionId === null
              ? "Sélectionnez d'abord une option" // Si aucune option n'est sélectionnée
              : filteredUnites.length === 0
              ? "Aucune unité disponible" // Si l'option sélectionnée n'a pas d'unités
              : "Sélectionner une unité" // Par défaut
          }
        />

        {/* Sélecteur Chapitre de Référence (optionnel) */}
        <Selector
          label="Chapitre de Référence"
          id="select-chapitre-ref"
          value={selectedChapitreReferenceId}
          disabled={selectedUniteId === null || filteredChapitres.length === 0}
          options={filteredChapitres.map((c) => ({ id: c.id, label: c.titre_chapitre }))}
          onChange={handleChapitreChange}
          placeholderText={ // Texte d'aide contextuel
            selectedUniteId === null
              ? "Sélectionnez d'abord une unité" // Si aucune unité n'est sélectionnée
              : filteredChapitres.length === 0
              ? "Aucun chapitre disponible" // Si l'unité sélectionnée n'a pas de chapitres
              : "Sélectionner un chapitre de référence" // Par défaut
          }
        />
      </div>
    </div>
  );
};

/**
 * Composant générique pour un sélecteur déroulant.
 * Réutilisé pour Niveau, Option, Unité, et Chapitre.
 * Ajout de la prop `placeholderText` pour des messages plus spécifiques.
 * Amélioration du style pour l'état désactivé.
 */
const Selector = ({
  label,
  id,
  value,
  options,
  disabled = false,
  onChange,
  placeholderText, // Nouvelle prop pour le texte de l'option par défaut
}: {
  label: string;
  id?: string;
  value: number | null;
  options: { id: number; label: string }[];
  disabled?: boolean;
  onChange: (val: number | null) => void;
  placeholderText?: string; // Type de la nouvelle prop
}) => (
  <div>
    <label className="block font-medium mb-1 text-gray-700" htmlFor={id}>
      {label}
    </label>
    <select
      id={id}
      className="w-full border px-3 py-2 rounded-md bg-white text-gray-800 shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    >
      {/* Affiche le placeholderText fourni, sinon un texte générique */}
      <option value="">{placeholderText || `Sélectionner ${label.toLowerCase()}`}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export default ChapterTargetSelector;