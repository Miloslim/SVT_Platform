// ============================================================
// 📄 Fichier : HierarchicalSelectorNew_v1.tsx
// 📁 Chemin : D:\SVT_Platform\src\diagno\components\TestComposer\HierarchicalSelectorNew.tsx
// 🎯 Fonction : Sélecteur hiérarchique Niveau > Option > Unité > Chapitre
//    Version corrigée pour éviter les boucles infinies de rendu.
// ============================================================

import React, { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/backend/config/supabase";

interface Niveau { id: number; nom_niveau: string }
interface Option { id: number; nom_option: string; niveau_id: number }
interface Unite { id: number; titre_unite: string; option_id: number }
interface Chapitre { id: number; titre_chapitre: string; unite_id: number }

interface HierarchicalSelectorNewProps {
    showChapitre?: boolean;
    onChange: (selection: {
        niveauId: number | null;
        optionId: number | null;
        uniteId: number | null;
        chapitreId?: number | null;
    }) => void;
    initialNiveauId?: number | null;
    initialOptionId?: number | null;
    initialUniteId?: number | null;
    initialChapitreId?: number | null;
    disableNiveau?: boolean;
    disableOption?: boolean;
    disableUnite?: boolean;
    disableChapitre?: boolean;
}

const HierarchicalSelectorNew: React.FC<HierarchicalSelectorNewProps> = ({
    showChapitre = true,
    onChange,
    initialNiveauId = null,
    initialOptionId = null,
    initialUniteId = null,
    initialChapitreId = null,
    disableNiveau = false,
    disableOption = false,
    disableUnite = false,
    disableChapitre = false,
}) => {
    const [niveaux, setNiveaux] = useState<Niveau[]>([]);
    const [options, setOptions] = useState<Option[]>([]);
    const [unites, setUnites] = useState<Unite[]>([]);
    const [chapitres, setChapitres] = useState<Chapitre[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [niveauId, setNiveauId] = useState<number | null>(null);
    const [optionId, setOptionId] = useState<number | null>(null);
    const [uniteId, setUniteId] = useState<number | null>(null);
    const [chapitreId, setChapitreId] = useState<number | null>(null);

    const isInitialPropsApplied = useRef(false);
    const isInternalUpdate = useRef(false);

    // Chargement des données hiérarchiques
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const [{ data: niveauxData, error: nivErr },
                    { data: optionsData, error: optErr },
                    { data: unitesData, error: uniErr },
                    { data: chapitresData, error: chapErr }] = await Promise.all([
                    supabase.from("niveaux").select("*").order("id"),
                    supabase.from("options").select("*").order("id"),
                    supabase.from("unites").select("*").order("id"),
                    supabase.from("chapitres").select("*").order("id"),
                ]);

                if (nivErr || optErr || uniErr || chapErr) {
                    throw nivErr || optErr || uniErr || chapErr;
                }

                setNiveaux(niveauxData || []);
                setOptions(optionsData || []);
                setUnites(unitesData || []);
                setChapitres(chapitresData || []);
            } catch (err: any) {
                setError("Erreur de chargement : " + (err.message || "inconnue"));
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Initialisation des sélections avec les props initiales
    useEffect(() => {
    if (!isInitialPropsApplied.current || isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
    }

    onChange({
        niveauId,
        optionId,
        uniteId,
        chapitreId: showChapitre ? chapitreId : undefined,
    });
}, [niveauId, optionId, uniteId, chapitreId]);


    // Remontée de la sélection vers le parent
    useEffect(() => {
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }
        if (isInitialPropsApplied.current) {
            onChange({
                niveauId,
                optionId,
                uniteId,
                chapitreId: showChapitre ? chapitreId : undefined,
            });
        }
    }, [niveauId, optionId, uniteId, chapitreId, onChange, showChapitre]);

    // Handlers avec reset des sélections filles
    const handleNiveauChange = (val: number | null) => {
        if (disableNiveau) return;
        setNiveauId(val);
        setOptionId(null);
        setUniteId(null);
        setChapitreId(null);
    };

    const handleOptionChange = (val: number | null) => {
        if (disableOption) return;
        setOptionId(val);
        setUniteId(null);
        setChapitreId(null);
    };

    const handleUniteChange = (val: number | null) => {
        if (disableUnite) return;
        setUniteId(val);
        setChapitreId(null);
    };

    const handleChapitreChange = (val: number | null) => {
        if (disableChapitre) return;
        setChapitreId(val);
    };

    // Filtrages pour options, unites, chapitres
    const filteredOptions = options.filter(o => niveauId === null || o.niveau_id === niveauId);
    const filteredUnites = unites.filter(u => optionId === null || u.option_id === optionId);
    const filteredChapitres = chapitres.filter(c => uniteId === null || c.unite_id === uniteId);

    if (loading) {
        return <p className="text-gray-500 italic">Chargement de la structure...</p>;
    }

    if (error) {
        return <p className="text-red-600">{error}</p>;
    }

    // Composant Selecteur simple
    const Selector = ({
        label,
        value,
        options,
        onChange,
        disabled,
    }: {
        label: string;
        value: number | null;
        options: { id: number; label: string }[];
        onChange: (val: number | null) => void;
        disabled?: boolean;
    }) => (
        <div className="mb-4">
            <label className="block mb-1 font-semibold">{label}</label>
            <select
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
                disabled={disabled}
                className="w-full p-2 border rounded"
            >
                <option value="">{`Sélectionner ${label.toLowerCase()}`}</option>
                {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="p-4 bg-gray-50 border rounded shadow-sm max-w-md">
            <Selector
                label="Niveau"
                value={niveauId}
                options={niveaux.map(n => ({ id: n.id, label: n.nom_niveau }))}
                onChange={handleNiveauChange}
                disabled={disableNiveau}
            />
            <Selector
                label="Option"
                value={optionId}
                options={filteredOptions.map(o => ({ id: o.id, label: o.nom_option }))}
                onChange={handleOptionChange}
                disabled={disableOption || niveauId === null || filteredOptions.length === 0}
            />
            <Selector
                label="Unité"
                value={uniteId}
                options={filteredUnites.map(u => ({ id: u.id, label: u.titre_unite }))}
                onChange={handleUniteChange}
                disabled={disableUnite || optionId === null || filteredUnites.length === 0}
            />
            {showChapitre && (
                <Selector
                    label="Chapitre"
                    value={chapitreId}
                    options={filteredChapitres.map(c => ({ id: c.id, label: c.titre_chapitre }))}
                    onChange={handleChapitreChange}
                    disabled={disableChapitre || uniteId === null || filteredChapitres.length === 0}
                />
            )}
        </div>
    );
};

export default HierarchicalSelectorNew;
