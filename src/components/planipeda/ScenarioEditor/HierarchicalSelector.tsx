// ============================================================
// Titre : HierarchicalSelector
// Chemin : src/components/planipeda/ScenarioEditor/HierarchicalSelector.tsx
// Fonctionnalités :
//    - Sélection hiérarchique : Niveau > Option > Unité > Chapitre > Objectifs.
//    - Chargement des données à partir de Supabase (structure complète).
//    - Gestion des sélections locales et remontée des changements via `onChange`.
//    - Pré-cochage des objectifs basé sur `initialObjectifIds`.
//    - Affichage conditionnel des niveaux inférieurs (option, unité, etc.)
//    - NOUVEAU : Possibilité de désactiver les sélecteurs via des props externes (`disableNiveau`, etc.).
// ============================================================

import React, { useEffect, useState, useRef, useCallback } from "react";
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
    // Props pour les valeurs initiales
    initialNiveauId?: number | null;
    initialOptionId?: number | null;
    initialUniteId?: number | null;
    initialChapitreId?: number | null;
    initialObjectifIds?: number[];
    // NOUVELLES PROPS pour désactiver les sélecteurs de manière externe
    disableNiveau?: boolean;
    disableOption?: boolean;
    disableUnite?: boolean;
    disableChapitre?: boolean;
}

const HierarchicalSelector: React.FC<HierarchicalSelectorProps> = ({
    showChapitre = true,
    showObjectifs = true,
    onChange,
    initialNiveauId = null,
    initialOptionId = null,
    initialUniteId = null,
    initialChapitreId = null,
    initialObjectifIds = [],
    disableNiveau = false, // Valeur par défaut : non désactivé
    disableOption = false,
    disableUnite = false,
    disableChapitre = false,
}) => {
    const [niveaux, setNiveaux] = useState<Niveau[]>([]);
    const [options, setOptions] = useState<Option[]>([]);
    const [unites, setUnites] = useState<Unite[]>([]);
    const [chapitres, setChapitres] = useState<Chapitre[]>([]);
    const [loadingHierarchy, setLoadingHierarchy] = useState(true);
    const [hierarchyError, setHierarchyError] = useState<string | null>(null);

    const [objectifs, setObjectifs] = useState<Objectif[]>([]);
    const [objectifsCache, setObjectifsCache] = useState<{ [chapId: number]: Objectif[] }>({});
    const [loadingObjectifs, setLoadingObjectifs] = useState(false);
    const [errorObjectifs, setErrorObjectifs] = useState<string | null>(null);

    const [niveauId, setNiveauId] = useState<number | null>(null);
    const [optionId, setOptionId] = useState<number | null>(null);
    const [uniteId, setUniteId] = useState<number | null>(null);
    const [chapitreId, setChapitreId] = useState<number | null>(null);
    const [objectifIds, setObjectifIds] = useState<number[]>([]);

    const isInitialPropsApplied = useRef(false);
    const isInternalStateUpdate = useRef(false);

    useEffect(() => {
        const fetchAllHierarchyData = async () => {
            setLoadingHierarchy(true);
            setHierarchyError(null);
            try {
                const [{ data: niveauxData, error: nivError },
                       { data: optionsData, error: optError },
                       { data: unitesData, error: uniError },
                       { data: chapitresData, error: chapError }] =
                    await Promise.all([
                        supabase.from("niveaux").select("*").order("id"),
                        supabase.from("options").select("*").order("id"),
                        supabase.from("unites").select("*").order("id"),
                        supabase.from("chapitres").select("*").order("id"),
                    ]);

                if (nivError || optError || uniError || chapError) {
                    throw nivError || optError || uniError || chapError;
                }

                setNiveaux(niveauxData || []);
                setOptions(optionsData || []);
                setUnites(unitesData || []);
                setChapitres(chapitresData || []);
            } catch (err: any) {
                console.error("Erreur lors du chargement des données hiérarchiques :", err);
                setHierarchyError("Erreur de chargement de la structure : " + (err.message || "inconnue"));
            } finally {
                setLoadingHierarchy(false);
            }
        };
        fetchAllHierarchyData();
    }, []);

    // 🚀 Effet pour INITIALISER les sélections locales avec les props `initial*`
    useEffect(() => {
        if (!isInitialPropsApplied.current && !loadingHierarchy && niveaux.length > 0) {
            console.log("HierarchicalSelector: Applique les props initiales:", { initialNiveauId, initialOptionId, initialUniteId, initialChapitreId, initialObjectifIds });

            isInternalStateUpdate.current = true; // Empêche l'appel `onChange` lors de cette initialisation

            setNiveauId(initialNiveauId);
            setOptionId(initialOptionId);
            setUniteId(initialUniteId);
            setChapitreId(initialChapitreId);
            setObjectifIds(initialObjectifIds || []);

            if (initialChapitreId !== null && showObjectifs) {
                fetchObjectifsByChapitre(initialChapitreId);
            }

            isInitialPropsApplied.current = true;
            console.log("HierarchicalSelector: Initialisation des états internes terminée.");
        }
    }, [
        initialNiveauId,
        initialOptionId,
        initialUniteId,
        initialChapitreId,
        initialObjectifIds,
        loadingHierarchy,
        niveaux,
        showObjectifs,
    ]);


    // 🎯 Effet pour charger les objectifs quand le chapitre change (après l'initialisation)
    useEffect(() => {
        if (chapitreId !== null && showObjectifs) {
            fetchObjectifsByChapitre(chapitreId);
        } else if (chapitreId === null && showObjectifs && objectifs.length > 0) {
            setObjectifs([]);
            setErrorObjectifs(null);
            setLoadingObjectifs(false);
        }
    }, [chapitreId, showObjectifs]);

    // ➡️ Effet pour REMONTER la sélection au parent (appeler `onChange`)
    useEffect(() => {
        if (isInternalStateUpdate.current) {
            isInternalStateUpdate.current = false;
            return;
        }

        if (isInitialPropsApplied.current) {
            console.log("HierarchicalSelector: Remontée de la sélection au parent:", { niveauId, optionId, uniteId, chapitreId, objectifIds });
            onChange({
                niveauId,
                optionId,
                uniteId,
                chapitreId: showChapitre ? chapitreId : undefined,
                objectifIds: showObjectifs ? objectifIds : undefined,
            });
        }
    }, [niveauId, optionId, uniteId, chapitreId, objectifIds, onChange, showChapitre, showObjectifs]);


    const fetchObjectifsByChapitre = useCallback(async (chapId: number) => {
        if (objectifsCache[chapId]) {
            setObjectifs(objectifsCache[chapId]);
            setErrorObjectifs(null);
            setLoadingObjectifs(false);
            return;
        }

        setLoadingObjectifs(true);
        setErrorObjectifs(null);

        try {
            const { data, error } = await supabase
                .from("objectifs")
                .select("id, chapitre_id, description_objectif")
                .eq("chapitre_id", chapId)
                .order("id");

            if (error) throw error;

            setObjectifs(data || []);
            setObjectifsCache((prev) => ({ ...prev, [chapId]: data || [] }));
            setErrorObjectifs(null);
        } catch (err: any) {
            console.error("Erreur lors de la récupération des objectifs :", err.message);
            setObjectifs([]);
            setErrorObjectifs("Impossible de charger les objectifs pour ce chapitre.");
        } finally {
            setLoadingObjectifs(false);
        }
    }, [objectifsCache]);


    const handleNiveauChange = useCallback((val: number | null) => {
        if (disableNiveau) return; // Empêche le changement si désactivé par prop externe
        isInternalStateUpdate.current = false;
        setNiveauId(val);
        setOptionId(null);
        setUniteId(null);
        setChapitreId(null);
        setObjectifIds([]);
    }, [disableNiveau]); // Dépend de disableNiveau

    const handleOptionChange = useCallback((val: number | null) => {
        if (disableOption) return; // Empêche le changement si désactivé par prop externe
        isInternalStateUpdate.current = false;
        setOptionId(val);
        setUniteId(null);
        setChapitreId(null);
        setObjectifIds([]);
    }, [disableOption]); // Dépend de disableOption

    const handleUniteChange = useCallback((val: number | null) => {
        if (disableUnite) return; // Empêche le changement si désactivé par prop externe
        isInternalStateUpdate.current = false;
        setUniteId(val);
        setChapitreId(null);
        setObjectifIds([]);
    }, [disableUnite]); // Dépend de disableUnite

    const handleChapitreChange = useCallback((val: number | null) => {
        if (disableChapitre) return; // Empêche le changement si désactivé par prop externe
        isInternalStateUpdate.current = false;
        setChapitreId(val);
        setObjectifIds([]);
    }, [disableChapitre]); // Dépend de disableChapitre

    const toggleObjectif = useCallback((id: number) => {
        isInternalStateUpdate.current = false;
        setObjectifIds(prevObjectifIds => {
            if (prevObjectifIds.includes(id)) {
                return prevObjectifIds.filter((oid) => oid !== id);
            } else {
                return [...prevObjectifIds, id];
            }
        });
    }, []);

    const filteredOptions = options.filter((opt) => niveauId === null || opt.niveau_id === niveauId);
    const filteredUnites = unites.filter((u) => optionId === null || u.option_id === optionId);
    const filteredChapitres = chapitres.filter((c) => uniteId === null || c.unite_id === uniteId);


    if (loadingHierarchy) {
        return (
            <div className="flex justify-center items-center h-24">
                <p className="text-gray-600">Chargement de la structure des cours...</p>
            </div>
        );
    }

    if (hierarchyError) {
        return (
            <div className="p-4 bg-red-100 text-red-700 rounded-md">
                <p>{hierarchyError}</p>
            </div>
        );
    }


    return (
        <div className="bg-blue-50 border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                {/* Sélecteur Niveau */}
                <Selector
                    label="Niveau"
                    id="select-niveau"
                    value={niveauId}
                    options={niveaux.map((n) => ({ id: n.id, label: n.nom_niveau }))}
                    onChange={handleNiveauChange}
                    disabled={disableNiveau || loadingHierarchy}
                />

                {/* Sélecteur Option */}
                <Selector
                    label="Option"
                    id="select-option"
                    value={optionId}
                    disabled={disableOption || niveauId === null || filteredOptions.length === 0 || loadingHierarchy}
                    options={filteredOptions.map((o) => ({ id: o.id, label: o.nom_option }))}
                    onChange={handleOptionChange}
                />

                {/* Sélecteur Unité */}
                <Selector
                    label="Unité"
                    id="select-unite"
                    value={uniteId}
                    disabled={disableUnite || optionId === null || filteredUnites.length === 0 || loadingHierarchy}
                    options={filteredUnites.map((u) => ({ id: u.id, label: u.titre_unite }))}
                    onChange={handleUniteChange}
                />

                {/* Sélecteur Chapitre */}
                {showChapitre && (
                    <Selector
                        label="Chapitre"
                        id="select-chapitre"
                        value={chapitreId}
                        disabled={disableChapitre || uniteId === null || filteredChapitres.length === 0 || loadingHierarchy}
                        options={filteredChapitres.map((c) => ({ id: c.id, label: c.titre_chapitre }))}
                        onChange={handleChapitreChange}
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
                            <p className="italic text-gray-500">Aucun objectif disponible pour ce chapitre</p>
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

// Composant Selector générique (inchangé)
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