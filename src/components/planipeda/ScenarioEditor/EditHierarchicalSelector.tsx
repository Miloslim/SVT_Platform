// src/components/planipeda/ScenarioEditor/HierarchicalSelector.tsx_orignial
import React, { useEffect, useState } from "react";
import { supabase } from "@/backend/config/supabase";

interface Niveau { id: number; nom_niveau: string }
interface Option { id: number; nom_option: string; niveau_id: number }
interface Unite { id: number; titre_unite: string; option_id: number }
interface Chapitre { id: number; titre_chapitre: string; unite_id: number }
interface Objectif { id: number; chapitre_id: number; description_objectif: string }

interface HierarchicalSelectorProps {
  showChapitre?: boolean;
  showObjectifs?: boolean;
  onChange: (selection: {
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
    chapitreId?: number | null;
    objectifIds?: number[];
  }) => void;
}

const HierarchicalSelector: React.FC<HierarchicalSelectorProps> = ({
  showChapitre = true,
  showObjectifs = true,
  onChange,
}) => {
  // États des données hiérarchiques
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [chapitres, setChapitres] = useState<Chapitre[]>([]);

  // États des objectifs, avec cache, chargement et erreur
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [objectifsCache, setObjectifsCache] = useState<{ [chapId: number]: Objectif[] }>({});
  const [loadingObjectifs, setLoadingObjectifs] = useState(false);
  const [errorObjectifs, setErrorObjectifs] = useState<string | null>(null);

  // États de sélection
  const [niveauId, setNiveauId] = useState<number | null>(null);
  const [optionId, setOptionId] = useState<number | null>(null);
  const [uniteId, setUniteId] = useState<number | null>(null);
  const [chapitreId, setChapitreId] = useState<number | null>(null);
  const [objectifIds, setObjectifIds] = useState<number[]>([]);

  // Chargement initial des données hiérarchiques (niveaux, options, unités, chapitres)
  useEffect(() => {
    fetchAllData();
  }, []);

  // Chargement des objectifs quand le chapitre change
  useEffect(() => {
    if (chapitreId !== null && showObjectifs) {
      fetchObjectifsByChapitre(chapitreId);
    } else {
      setObjectifs([]);
      setObjectifIds([]);
      setErrorObjectifs(null);
      setLoadingObjectifs(false);
    }
  }, [chapitreId, showObjectifs]);

  // Remonter la sélection à chaque changement
  useEffect(() => {
    onChange({
      niveauId,
      optionId,
      uniteId,
      chapitreId: showChapitre ? chapitreId : undefined,
      objectifIds: showObjectifs ? objectifIds : undefined,
    });
  }, [niveauId, optionId, uniteId, chapitreId, objectifIds, onChange, showChapitre, showObjectifs]);

  // Fonction pour charger toutes les données hiérarchiques
  const fetchAllData = async () => {
    try {
      const [{ data: niveauxData }, { data: optionsData }, { data: unitesData }, { data: chapitresData }] =
        await Promise.all([
          supabase.from("niveaux").select("*").order("id"),
          supabase.from("options").select("*").order("id"),
          supabase.from("unites").select("*").order("id"),
          supabase.from("chapitres").select("*").order("id"),
        ]);
      setNiveaux(niveauxData || []);
      setOptions(optionsData || []);
      setUnites(unitesData || []);
      setChapitres(chapitresData || []);
    } catch (err) {
      console.error("Erreur lors du chargement des données hiérarchiques :", err);
    }
  };

  // Fonction de chargement des objectifs par chapitre avec cache, gestion loading et erreur
  const fetchObjectifsByChapitre = async (chapId: number) => {
    // Vérifier cache
    if (objectifsCache[chapId]) {
      setObjectifs(objectifsCache[chapId]);
      setObjectifIds([]);
      setErrorObjectifs(null);
      setLoadingObjectifs(false);
      return;
    }

    setLoadingObjectifs(true);
    setErrorObjectifs(null);

    const { data, error } = await supabase
      .from("objectifs")
      .select("id, chapitre_id, description_objectif")
      .eq("chapitre_id", chapId)
      .order("id");

    if (error) {
      console.error("Erreur lors de la récupération des objectifs :", error.message);
      setObjectifs([]);
      setErrorObjectifs("Impossible de charger les objectifs pour ce chapitre.");
    } else {
      setObjectifs(data || []);
      setObjectifsCache((prev) => ({ ...prev, [chapId]: data || [] }));
      setErrorObjectifs(null);
    }
    setObjectifIds([]);
    setLoadingObjectifs(false);
  };

  // Filtrage des options en fonction du niveau sélectionné
  const filteredOptions = options.filter((opt) => niveauId === null || opt.niveau_id === niveauId);
  // Filtrage des unités en fonction de l'option sélectionnée
  const filteredUnites = unites.filter((u) => optionId === null || u.option_id === optionId);
  // Filtrage des chapitres en fonction de l'unité sélectionnée
  const filteredChapitres = chapitres.filter((c) => uniteId === null || c.unite_id === uniteId);

  // Gestion de la sélection/désélection des objectifs (checkbox)
  const toggleObjectif = (id: number) => {
    if (objectifIds.includes(id)) {
      setObjectifIds(objectifIds.filter((oid) => oid !== id));
    } else {
      setObjectifIds([...objectifIds, id]);
    }
  };

  return (
    <div className="bg-blue-50 border border-gray-200 rounded-xl p-6 shadow-sm">

  {/* <h2 className="text-lg font-semibold mb-4">Sélection de l'emplacement pédagogique</h2> */}

  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4"> 
    {/* Sélecteur Niveau */}
    <Selector
      label="Niveau"
      id="select-niveau"
      value={niveauId}
      options={niveaux.map((n) => ({ id: n.id, label: n.nom_niveau }))}
      onChange={(val) => {
        setNiveauId(val);
        setOptionId(null);
        setUniteId(null);
        setChapitreId(null);
        setObjectifIds([]);
      }}
    />

    {/* Sélecteur Option */}
    <Selector
      label="Option"
      id="select-option"
      value={optionId}
      disabled={niveauId === null}
      options={filteredOptions.map((o) => ({ id: o.id, label: o.nom_option }))}
      onChange={(val) => {
        setOptionId(val);
        setUniteId(null);
        setChapitreId(null);
        setObjectifIds([]);
      }}
    />

    {/* Sélecteur Unité */}
    <Selector
      label="Unité"
      id="select-unite"
      value={uniteId}
      disabled={optionId === null}
      options={filteredUnites.map((u) => ({ id: u.id, label: u.titre_unite }))}
      onChange={(val) => {
        setUniteId(val);
        setChapitreId(null);
        setObjectifIds([]);
      }}
    />

    {/* Sélecteur Chapitre */}
    {showChapitre && (
      <Selector
        label="Chapitre"
        id="select-chapitre"
        value={chapitreId}
        disabled={uniteId === null}
        options={filteredChapitres.map((c) => ({ id: c.id, label: c.titre_chapitre }))}
        onChange={(val) => {
          setChapitreId(val);
          setObjectifIds([]);
        }}
      />
    )}

    {/* Liste des objectifs : occupe les deux colonnes */}
    {showObjectifs && (
      <div className="md:col-span-2">
        <label className="block font-medium mb-1" id="label-objectifs">
          Objectifs
        </label>

        {loadingObjectifs ? (
          <p className="italic text-gray-500">Chargement des objectifs...</p>
        ) : errorObjectifs ? (
          <p className="italic text-red-600">{errorObjectifs}</p>
        ) : chapitreId === null || objectifs.length === 0 ? (
          <p className="italic text-gray-500">Aucun objectif disponible</p>
        ) : (
          <div
            className="flex flex-col gap-2 max-h-48 overflow-auto border border-gray-200 rounded p-2 bg-white"
            role="group"
            aria-labelledby="label-objectifs"
          >
            {objectifs.map((o) => (
              <label key={o.id} className="inline-flex items-start gap-2" aria-checked={objectifIds.includes(o.id)}>
                <input
                  type="checkbox"
                  checked={objectifIds.includes(o.id)}
                  onChange={() => toggleObjectif(o.id)}
                />
                <span>{o.description_objectif}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
</div>

  );
};

// Composant Selector générique pour les sélecteurs hiérarchiques
const Selector = ({
  label,
  id,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  id?: string;
  value: number | null;
  options: { id: number; label: string }[];
  disabled?: boolean;
  onChange: (val: number | null) => void;
}) => (
  <div>
    <label className="block font-medium mb-1" htmlFor={id}>
      {label}
    </label>
    <select
      id={id}
      className="w-full border px-3 py-2 rounded"
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    >
      <option value="">Sélectionner {label.toLowerCase()}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export default HierarchicalSelector;
