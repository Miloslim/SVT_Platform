// 📁 EmplacementPedaSelector.tsx
// Composant de sélection hiérarchique Niveau > Option > Unité > Chapitre > Objectifs
// Chemin : src/components/planipeda/EmplacementPedaSelector.tsx

import React, { useEffect, useState } from "react";
import { supabase } from "@/backend/config/supabase";

interface EmplacementSelection {
  niveau: number | null;
  option: number | null;
  unite: number | null;
  chapitre: number | null;
  objectifs: number[];
}

interface EmplacementPedaSelectorProps {
  selectedNiveau?: number | null;
  selectedOption?: number | null;
  selectedUnite?: number | null;
  selectedChapitre?: number | null;
  selectedObjectifs?: number[];
  onChange: (selection: EmplacementSelection) => void;
}

interface Niveau {
  id: number;
  nom: string;
}
interface Option {
  id: number;
  nom: string;
  niveau_id: number;
}
interface Unite {
  id: number;
  nom: string;
  option_id: number;
}
interface Chapitre {
  id: number;
  nom: string;
  unite_id: number;
}
interface Objectif {
  id: number;
  description_objectif: string;
  chapitre_id: number;
}

const EmplacementPedaSelector: React.FC<EmplacementPedaSelectorProps> = ({
  selectedNiveau = null,
  selectedOption = null,
  selectedUnite = null,
  selectedChapitre = null,
  selectedObjectifs = [],
  onChange,
}) => {
  // États pour listes
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [chapitres, setChapitres] = useState<Chapitre[]>([]);
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);

  // États pour sélection courante
  const [niveau, setNiveau] = useState<number | null>(selectedNiveau);
  const [option, setOption] = useState<number | null>(selectedOption);
  const [unite, setUnite] = useState<number | null>(selectedUnite);
  const [chapitre, setChapitre] = useState<number | null>(selectedChapitre);
  const [objectifsSelected, setObjectifsSelected] = useState<number[]>(selectedObjectifs);

  // Chargement initial des niveaux
  useEffect(() => {
    const fetchNiveaux = async () => {
      const { data, error } = await supabase.from("niveaux").select("*");
      if (error) {
        console.error("Erreur chargement niveaux", error);
        return;
      }
      setNiveaux(data);
    };
    fetchNiveaux();
  }, []);

  // Chargement options selon niveau
  useEffect(() => {
    if (niveau === null) {
      setOptions([]);
      setOption(null);
      return;
    }
    const fetchOptions = async () => {
      const { data, error } = await supabase
        .from("options")
        .select("*")
        .eq("niveau_id", niveau);
      if (error) {
        console.error("Erreur chargement options", error);
        return;
      }
      setOptions(data);
    };
    fetchOptions();
  }, [niveau]);

  // Chargement unités selon option
  useEffect(() => {
    if (option === null) {
      setUnites([]);
      setUnite(null);
      return;
    }
    const fetchUnites = async () => {
      const { data, error } = await supabase
        .from("unites")
        .select("*")
        .eq("option_id", option);
      if (error) {
        console.error("Erreur chargement unités", error);
        return;
      }
      setUnites(data);
    };
    fetchUnites();
  }, [option]);

  // Chargement chapitres selon unité
  useEffect(() => {
    if (unite === null) {
      setChapitres([]);
      setChapitre(null);
      return;
    }
    const fetchChapitres = async () => {
      const { data, error } = await supabase
        .from("chapitres")
        .select("*")
        .eq("unite_id", unite);
      if (error) {
        console.error("Erreur chargement chapitres", error);
        return;
      }
      setChapitres(data);
    };
    fetchChapitres();
  }, [unite]);

  // Chargement objectifs selon chapitre
  useEffect(() => {
    if (chapitre === null) {
      setObjectifs([]);
      setObjectifsSelected([]);
      return;
    }
    const fetchObjectifs = async () => {
      const { data, error } = await supabase
        .from("objectifs")
        .select("*")
        .eq("chapitre_id", chapitre);
      if (error) {
        console.error("Erreur chargement objectifs", error);
        return;
      }
      setObjectifs(data);
    };
    fetchObjectifs();
  }, [chapitre]);

  // À chaque modification, on notifie le parent
  useEffect(() => {
    onChange({
      niveau,
      option,
      unite,
      chapitre,
      objectifs: objectifsSelected,
    });
  }, [niveau, option, unite, chapitre, objectifsSelected, onChange]);

  // Gestion des changements

  const handleNiveauChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : null;
    setNiveau(val);
    setOption(null);
    setUnite(null);
    setChapitre(null);
    setObjectifsSelected([]);
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : null;
    setOption(val);
    setUnite(null);
    setChapitre(null);
    setObjectifsSelected([]);
  };

  const handleUniteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : null;
    setUnite(val);
    setChapitre(null);
    setObjectifsSelected([]);
  };

  const handleChapitreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : null;
    setChapitre(val);
    setObjectifsSelected([]);
  };

  const handleObjectifToggle = (id: number) => {
    if (objectifsSelected.includes(id)) {
      setObjectifsSelected(objectifsSelected.filter((objId) => objId !== id));
    } else {
      setObjectifsSelected([...objectifsSelected, id]);
    }
  };

  return (
    <div className="space-y-4">

      <div>
        <label className="block font-semibold">Niveau</label>
        <select value={niveau ?? ""} onChange={handleNiveauChange} className="w-full border rounded p-2">
          <option value="">-- Choisir un niveau --</option>
          {niveaux.map((n) => (
            <option key={n.id} value={n.id}>{n.nom}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold">Option</label>
        <select value={option ?? ""} onChange={handleOptionChange} className="w-full border rounded p-2" disabled={!niveau}>
          <option value="">-- Choisir une option --</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.nom}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold">Unité</label>
        <select value={unite ?? ""} onChange={handleUniteChange} className="w-full border rounded p-2" disabled={!option}>
          <option value="">-- Choisir une unité --</option>
          {unites.map((u) => (
            <option key={u.id} value={u.id}>{u.nom}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold">Chapitre</label>
        <select value={chapitre ?? ""} onChange={handleChapitreChange} className="w-full border rounded p-2" disabled={!unite}>
          <option value="">-- Choisir un chapitre --</option>
          {chapitres.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold">Objectifs</label>
        {objectifs.length === 0 && <p className="italic text-gray-500">Aucun objectif disponible</p>}
        <div className="space-y-1 max-h-48 overflow-auto border p-2 rounded bg-white">
          {objectifs.map((obj) => (
            <label key={obj.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={objectifsSelected.includes(obj.id)}
                onChange={() => handleObjectifToggle(obj.id)}
              />
              <span>{obj.description_objectif}</span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
};

export default EmplacementPedaSelector;
