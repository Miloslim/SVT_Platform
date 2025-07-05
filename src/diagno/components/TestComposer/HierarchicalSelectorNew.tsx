import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/backend/config/supabase";

interface Niveau { id: number; nom_niveau: string }
interface Option { id: number; nom_option: string; niveau_id: number }
interface Unite { id: number; titre_unite: string; option_id: number }
interface Chapitre { id: number; titre_chapitre: string; unite_id: number }

interface Props {
  showChapitre?: boolean;
  onChange: (selection: {
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
    chapitreId: number | null;
  }) => void;
}

const HierarchicalSelectorNew: React.FC<Props> = ({
  showChapitre = true,
  onChange,
}) => {
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [chapitres, setChapitres] = useState<Chapitre[]>([]);

  const [niveauId, setNiveauId] = useState<number | null>(null);
  const [optionId, setOptionId] = useState<number | null>(null);
  const [uniteId, setUniteId] = useState<number | null>(null);
  const [chapitreId, setChapitreId] = useState<number | null>(null);

  // Ref pour stocker la dernière sélection envoyée et éviter répétition onChange
  const lastSelection = useRef<{niveauId:number|null;optionId:number|null;uniteId:number|null;chapitreId:number|null} | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: n }, { data: o }, { data: u }, { data: c }] = await Promise.all([
          supabase.from("niveaux").select("*"),
          supabase.from("options").select("*"),
          supabase.from("unites").select("*"),
          supabase.from("chapitres").select("*"),
        ]);
        setNiveaux(n || []);
        setOptions(o || []);
        setUnites(u || []);
        setChapitres(c || []);
      } catch (e) {
        console.error("Erreur chargement hiérarchie", e);
      }
    }
    fetchData();
  }, []);

  // Fonction qui compare deux sélections
  function isSelectionEqual(a: typeof lastSelection.current, b: typeof lastSelection.current) {
    if (!a || !b) return false;
    return a.niveauId === b.niveauId &&
           a.optionId === b.optionId &&
           a.uniteId === b.uniteId &&
           a.chapitreId === b.chapitreId;
  }

  // Appeler onChange uniquement si la sélection a changé
  useEffect(() => {
    const currentSelection = { niveauId, optionId, uniteId, chapitreId: showChapitre ? chapitreId : null };
    if (!isSelectionEqual(lastSelection.current, currentSelection)) {
      lastSelection.current = currentSelection;
      onChange(currentSelection);
    }
  }, [niveauId, optionId, uniteId, chapitreId, onChange, showChapitre]);

  // Reset dépendances hiérarchiques
  const handleNiveauChange = (id: number | null) => {
    setNiveauId(id);
    setOptionId(null);
    setUniteId(null);
    setChapitreId(null);
  };
  const handleOptionChange = (id: number | null) => {
    setOptionId(id);
    setUniteId(null);
    setChapitreId(null);
  };
  const handleUniteChange = (id: number | null) => {
    setUniteId(id);
    setChapitreId(null);
  };
  const handleChapitreChange = (id: number | null) => {
    setChapitreId(id);
  };

  const filteredOptions = options.filter((o) => o.niveau_id === niveauId);
  const filteredUnites = unites.filter((u) => u.option_id === optionId);
  const filteredChapitres = chapitres.filter((c) => c.unite_id === uniteId);

  // Composant select simple
  const Select = ({ label, value, options, onChange, disabled }: {
    label: string,
    value: number | null,
    options: {id:number,label:string}[],
    onChange: (val:number|null) => void,
    disabled?: boolean
  }) => (
    <div className="mb-2">
      <label className="block font-medium">{label}</label>
      <select
        disabled={disabled}
        className="w-full border p-2 rounded"
        value={value ?? ""}
        onChange={e => {
          const val = e.target.value === "" ? null : parseInt(e.target.value);
          onChange(val);
        }}
      >
        <option value="">Sélectionner {label.toLowerCase()}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div>
      <Select label="Niveau" value={niveauId} onChange={handleNiveauChange} options={niveaux.map(n => ({id:n.id,label:n.nom_niveau}))} />
      <Select label="Option" value={optionId} onChange={handleOptionChange} options={filteredOptions.map(o => ({id:o.id,label:o.nom_option}))} disabled={!niveauId} />
      <Select label="Unité" value={uniteId} onChange={handleUniteChange} options={filteredUnites.map(u => ({id:u.id,label:u.titre_unite}))} disabled={!optionId} />
      {showChapitre && (
        <Select label="Chapitre" value={chapitreId} onChange={handleChapitreChange} options={filteredChapitres.map(c => ({id:c.id,label:c.titre_chapitre}))} disabled={!uniteId} />
      )}
    </div>
  );
};

export default HierarchicalSelectorNew;
