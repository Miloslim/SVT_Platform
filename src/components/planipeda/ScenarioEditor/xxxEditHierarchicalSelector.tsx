// ============================================
// Fichier : src/components/planipeda/ScenarioEditor/EditHierarchicalSelector.tsx
// Composant : HierarchicalSelector
// Description : Sélecteur hiérarchique (niveau > option > unité > chapitre)
// avec support des pré-sélections et mise à jour automatique des sous-niveaux.
// ============================================

import { useEffect, useState } from "react";
import { supabase } from "@/backend/config/supabase";

// ============================
// Définition des types pour chaque niveau hiérarchique
// ============================

type Niveau = { id: number; nom_niveau: string };
type Option = { id: number; nom_option: string; niveau_id: number };
type Unite = { id: number; titre_unite: string; option_id: number };
type Chapitre = { id: number; titre_chapitre: string; unite_id: number };

type Props = {
  selectedNiveauId?: number;
  selectedOptionId?: number;
  selectedUniteId?: number;
  selectedChapitreId?: number;
  onChange: (ids: {
    niveauId?: number;
    optionId?: number;
    uniteId?: number;
    chapitreId?: number;
  }) => void;
};

// ============================
// Composant HierarchicalSelector
// ============================

function EditHierarchicalSelector({
  selectedNiveauId: initialNiveauId,
  selectedOptionId: initialOptionId,
  selectedUniteId: initialUniteId,
  selectedChapitreId: initialChapitreId,
  onChange,
}: Props) {
  // États locaux pour stocker listes et sélections
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [chapitres, setChapitres] = useState<Chapitre[]>([]);

  const [selectedNiveauId, setSelectedNiveauId] = useState<number | undefined>(initialNiveauId);
  const [selectedOptionId, setSelectedOptionId] = useState<number | undefined>(initialOptionId);
  const [selectedUniteId, setSelectedUniteId] = useState<number | undefined>(initialUniteId);
  const [selectedChapitreId, setSelectedChapitreId] = useState<number | undefined>(initialChapitreId);

  // -------- Chargement initial des niveaux --------
  useEffect(() => {
    const fetchNiveaux = async () => {
      const { data, error } = await supabase.from("niveaux").select("id, nom_niveau");
      if (error) {
        console.error("Erreur fetch niveaux:", error);
        setNiveaux([]);
      } else {
        setNiveaux(data || []);
      }
    };
    fetchNiveaux();
  }, []);

  // -------- Chargement options selon niveau sélectionné --------
  useEffect(() => {
    if (!selectedNiveauId) {
      setOptions([]);
      setSelectedOptionId(undefined);
      return;
    }

    const fetchOptions = async () => {
      const { data, error } = await supabase
        .from("options")
        .select("id, nom_option, niveau_id")
        .eq("niveau_id", selectedNiveauId);
      if (error) {
        console.error("Erreur fetch options:", error);
        setOptions([]);
      } else {
        setOptions(data || []);
      }
    };
    fetchOptions();
  }, [selectedNiveauId]);

  // -------- Chargement unités selon option sélectionnée --------
  useEffect(() => {
    if (!selectedOptionId) {
      setUnites([]);
      setSelectedUniteId(undefined);
      return;
    }

    const fetchUnites = async () => {
      const { data, error } = await supabase
        .from("unites")
        .select("id, titre_unite, option_id")
        .eq("option_id", selectedOptionId);
      if (error) {
        console.error("Erreur fetch unités:", error);
        setUnites([]);
      } else {
        setUnites(data || []);
      }
    };
    fetchUnites();
  }, [selectedOptionId]);

  // -------- Chargement chapitres selon unité sélectionnée --------
  useEffect(() => {
    if (!selectedUniteId) {
      setChapitres([]);
      setSelectedChapitreId(undefined);
      return;
    }

    const fetchChapitres = async () => {
      const { data, error } = await supabase
        .from("chapitres")
        .select("id, titre_chapitre, unite_id")
        .eq("unite_id", selectedUniteId);
      if (error) {
        console.error("Erreur fetch chapitres:", error);
        setChapitres([]);
      } else {
        setChapitres(data || []);
      }
    };
    fetchChapitres();
  }, [selectedUniteId]);

  // -------- Gestion des changements de sélection --------
  const handleNiveauChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const niveauId = e.target.value ? parseInt(e.target.value) : undefined;
    setSelectedNiveauId(niveauId);
    setSelectedOptionId(undefined);
    setSelectedUniteId(undefined);
    setSelectedChapitreId(undefined);
    onChange({ niveauId, optionId: undefined, uniteId: undefined, chapitreId: undefined });
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const optionId = e.target.value ? parseInt(e.target.value) : undefined;
    setSelectedOptionId(optionId);
    setSelectedUniteId(undefined);
    setSelectedChapitreId(undefined);
    onChange({ niveauId: selectedNiveauId, optionId, uniteId: undefined, chapitreId: undefined });
  };

  const handleUniteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uniteId = e.target.value ? parseInt(e.target.value) : undefined;
    setSelectedUniteId(uniteId);
    setSelectedChapitreId(undefined);
    onChange({ niveauId: selectedNiveauId, optionId: selectedOptionId, uniteId, chapitreId: undefined });
  };

  const handleChapitreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chapitreId = e.target.value ? parseInt(e.target.value) : undefined;
    setSelectedChapitreId(chapitreId);
    onChange({ niveauId: selectedNiveauId, optionId: selectedOptionId, uniteId: selectedUniteId, chapitreId });
  };

  // -------- Remonter la hiérarchie complète depuis un chapitre sélectionné --------
  useEffect(() => {
    if (!initialChapitreId) return;

    // Fonction asynchrone pour fetch la hiérarchie complète
    const fetchHierarchyFromChapitre = async (chapitreId: number) => {
      // Récupérer le chapitre
      const { data: chapitreData, error: errChapitre } = await supabase
        .from("chapitres")
        .select("id, titre_chapitre, unite_id")
        .eq("id", chapitreId)
        .single();

      if (errChapitre || !chapitreData) {
        console.error("Erreur fetch chapitre:", errChapitre);
        return;
      }

      // Récupérer l'unité associée
      const { data: uniteData, error: errUnite } = await supabase
        .from("unites")
        .select("id, titre_unite, option_id")
        .eq("id", chapitreData.unite_id)
        .single();

      if (errUnite || !uniteData) {
        console.error("Erreur fetch unité:", errUnite);
        return;
      }

      // Récupérer l'option associée
      const { data: optionData, error: errOption } = await supabase
        .from("options")
        .select("id, nom_option, niveau_id")
        .eq("id", uniteData.option_id)
        .single();

      if (errOption || !optionData) {
        console.error("Erreur fetch option:", errOption);
        return;
      }

      // Récupérer le niveau associé
      const { data: niveauData, error: errNiveau } = await supabase
        .from("niveaux")
        .select("id, nom_niveau")
        .eq("id", optionData.niveau_id)
        .single();

      if (errNiveau || !niveauData) {
        console.error("Erreur fetch niveau:", errNiveau);
        return;
      }

      // Mettre à jour les états pour sélectionner toute la hiérarchie
      setSelectedNiveauId(niveauData.id);
      setSelectedOptionId(optionData.id);
      setSelectedUniteId(uniteData.id);
      setSelectedChapitreId(chapitreData.id);

      // Notifier le parent avec la hiérarchie complète
      onChange({
        niveauId: niveauData.id,
        optionId: optionData.id,
        uniteId: uniteData.id,
        chapitreId: chapitreData.id,
      });
    };

    fetchHierarchyFromChapitre(initialChapitreId);
  }, [initialChapitreId, onChange]);

  // -------- Mise à jour des sélections quand les props initiales changent --------
  // On laisse ce mécanisme classique, mais l'usage du fetch hiérarchie complète est prioritaire
  useEffect(() => {
    if (!initialChapitreId) {
      setSelectedNiveauId(initialNiveauId);
    }
  }, [initialNiveauId, initialChapitreId]);

  useEffect(() => {
    if (!initialChapitreId) {
      setSelectedOptionId(initialOptionId);
    }
  }, [initialOptionId, initialChapitreId]);

  useEffect(() => {
    if (!initialChapitreId) {
      setSelectedUniteId(initialUniteId);
    }
  }, [initialUniteId, initialChapitreId]);

  useEffect(() => {
    if (!initialChapitreId) {
      setSelectedChapitreId(undefined);
    }
  }, [initialChapitreId]);

  // ========== Rendu JSX ==========

  return (
    <div className="hierarchical-selector space-y-4">
      {/* Sélecteur Niveau */}
      <div>
        <label htmlFor="niveau-select" className="block font-semibold mb-1">Niveau</label>
        <select
          id="niveau-select"
          value={selectedNiveauId ?? ""}
          onChange={handleNiveauChange}
          className="w-full border rounded px-2 py-1"
        >
          <option value="">-- Sélectionner un niveau --</option>
          {niveaux.map((niveau) => (
            <option key={niveau.id} value={niveau.id}>
              {niveau.nom_niveau}
            </option>
          ))}
        </select>
      </div>

      {/* Sélecteur Option */}
      <div>
        <label htmlFor="option-select" className="block font-semibold mb-1">Option</label>
        <select
          id="option-select"
          value={selectedOptionId ?? ""}
          onChange={handleOptionChange}
          className="w-full border rounded px-2 py-1"
          disabled={!selectedNiveauId}
        >
          <option value="">-- Sélectionner une option --</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.nom_option}
            </option>
          ))}
        </select>
      </div>

      {/* Sélecteur Unité */}
      <div>
        <label htmlFor="unite-select" className="block font-semibold mb-1">Unité</label>
        <select
          id="unite-select"
          value={selectedUniteId ?? ""}
          onChange={handleUniteChange}
          className="w-full border rounded px-2 py-1"
          disabled={!selectedOptionId}
        >
          <option value="">-- Sélectionner une unité --</option>
          {unites.map((unite) => (
            <option key={unite.id} value={unite.id}>
              {unite.titre_unite}
            </option>
          ))}
        </select>
      </div>

      {/* Sélecteur Chapitre */}
      <div>
        <label htmlFor="chapitre-select" className="block font-semibold mb-1">Chapitre</label>
        <select
          id="chapitre-select"
          value={selectedChapitreId ?? ""}
          onChange={handleChapitreChange}
          className="w-full border rounded px-2 py-1"
          disabled={!selectedUniteId}
        >
          <option value="">-- Sélectionner un chapitre --</option>
          {chapitres.map((chapitre) => (
            <option key={chapitre.id} value={chapitre.id}>
              {chapitre.titre_chapitre}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default EditHierarchicalSelector;
