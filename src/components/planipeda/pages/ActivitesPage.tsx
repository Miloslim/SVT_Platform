// 📁 GESTION DES ACTIVITÉS PÉDAGOGIQUES AVEC FILTRES HIERARCHIQUES
// Description : Cette page affiche les activités d’apprentissage et permet de les filtrer par niveau, option, unité et chapitre.
// src\components\planipeda\pages\ActivitesPage.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/backend/config/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; // Ajout de toast pour les notifications
import { notifySuccess, notifyError } from "@/backend/utils/notificationHelpers";
import { Activity } from "@/types/activity"; // Import de l'interface partagée
// 🧩 TYPES DE DONNÉES
//voir types/

type Niveau = { id: number; nom_niveau: string };
type Option = { id: number; nom_option: string; niveau_id: number };
type Unite = { id: number; titre_unite: string; option_id: number };
type Chapitre = { id: number; titre_chapitre: string; unite_id: number };

// 📄 COMPOSANT PRINCIPAL
const ActivitesPage: React.FC = () => {
    const navigate = useNavigate();

    // 📌 ÉTATS
    const [activites, setActivites] = useState<Activite[]>([]);
    const [filtered, setFiltered] = useState<Activite[]>([]);

    const [niveaux, setNiveaux] = useState<Niveau[]>([]);
    const [options, setOptions] = useState<Option[]>([]);
    const [unites, setUnites] = useState<Unite[]>([]);
    const [chapitres, setChapitres] = useState<Chapitre[]>([]);

    const [selectedNiveau, setSelectedNiveau] = useState<number | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [selectedUnite, setSelectedUnite] = useState<number | null>(null);
    const [selectedChapitre, setSelectedChapitre] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [filtersReady, setFiltersReady] = useState(false);

    // 🔄 RÉCUPÉRATION DES ACTIVITÉS
    useEffect(() => {
        const fetchActivites = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("activites")
                .select(`
                    id,
                    titre_activite,
                    chapitre:chapitre_id (
                        id,
                        titre_chapitre,
                        unite:unite_id (
                            id,
                            titre_unite,
                            option:option_id (
                                id,
                                nom_option,
                                niveau:niveau_id (
                                    id,
                                    nom_niveau
                                )
                            )
                        )
                    ),
                    activite_objectifs (
                        objectifs:objectifs (
                            description_objectif
                        )
                    )
                `);

            if (error) {
                console.error("Erreur récupération activités:", error);
                toast.error(`Échec du chargement des activités : ${error.message || "Erreur inconnue."}`);
                setLoading(false);
                return;
            }

            const formatted = data.map((act: any) => {
                const chapitre = act.chapitre;
                const unite = chapitre?.unite;
                const option = unite?.option;
                const niveau = option?.niveau;

                const niveauOption = `${niveau?.nom_niveau ?? "-"} - ${option?.nom_option ?? "-"}`;

                // Tableau des descriptions d'objectifs
                const objectifsArr =
                    act.activite_objectifs?.map((ao: any) => ao.objectifs?.description_objectif).filter(Boolean) || [];

                // Si pas d'objectifs, tableau avec texte par défaut
                const objectifs = objectifsArr.length > 0 ? objectifsArr : ["Aucun objectif"];

                return {
                    id: act.id,
                    titre_activite: act.titre_activite ?? "-",
                    niveauOption,
                    unite: unite?.titre_unite ?? "-",
                    chapitre: chapitre?.titre_chapitre ?? "-",
                    objectifs, // tableau de string
                };
            });

            setActivites(formatted);
            setFiltered(formatted);
            setLoading(false);
        };

        fetchActivites();
    }, []);

    // 🔄 RÉCUPÉRATION DES ENTITÉS POUR LES FILTRES
    useEffect(() => {
        const fetchFilters = async () => {
            const [{ data: niveaux }, { data: options }, { data: unites }, { data: chapitres }] = await Promise.all([
                supabase.from("niveaux").select("*"),
                supabase.from("options").select("*"),
                supabase.from("unites").select("*"),
                supabase.from("chapitres").select("*"),
            ]);

            if (niveaux) setNiveaux(niveaux);
            if (options) setOptions(options);
            if (unites) setUnites(unites);
            if (chapitres) setChapitres(chapitres);

            setFiltersReady(true); // ✅ Tous les filtres sont prêts
        };

        fetchFilters();
    }, []);

    // 🔍 APPLICATION DES FILTRES
    const applyFilters = () => {
        let filteredList = [...activites];

        if (selectedNiveau) {
            const niveauNom = niveaux.find((n) => n.id === selectedNiveau)?.nom_niveau ?? "";
            filteredList = filteredList.filter((a) => a.niveauOption.startsWith(niveauNom));
        }

        if (selectedOption) {
            const optionNom = options.find((o) => o.id === selectedOption)?.nom_option ?? "";
            filteredList = filteredList.filter((a) => a.niveauOption.includes(optionNom));
        }

        if (selectedUnite) {
            const uniteNom = unites.find((u) => u.id === selectedUnite)?.titre_unite ?? "";
            filteredList = filteredList.filter((a) => a.unite === uniteNom);
        }

        if (selectedChapitre) {
            const chapitreNom = chapitres.find((c) => c.id === selectedChapitre)?.titre_chapitre ?? "";
            filteredList = filteredList.filter((a) => a.chapitre === chapitreNom);
        }

        setFiltered(filteredList);
    };

    // 🔁 Ré-appliquer les filtres uniquement si les entités sont chargées
    useEffect(() => {
        if (!filtersReady) return;
        applyFilters();
    }, [selectedNiveau, selectedOption, selectedUnite, selectedChapitre, activites, filtersReady]);

    // ❌ SUPPRESSION
    const handleDelete = async (id: number) => {
        if (!window.confirm("Supprimer cette activité ?")) return;
        const { error } = await supabase.from("activites").delete().eq("id", id);
        if (error) {
            toast.error(`Erreur lors de la suppression : ${error.message}`);
            return;
        }
        toast.success("Activité supprimée avec succès !");
        setActivites((prev) => prev.filter((a) => a.id !== id));
    };

    // 🖼️ RENDU DE LA PAGE
    return (
        <section className="p-6 space-y-8">
            {/* ✅ EN-TÊTE */}
            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => navigate("/planipeda")}>
                    ← Retour
                </Button>
                <h1 className="text-2xl font-bold">Gestion des activités d’apprentissage</h1>
                {/* MODIFIÉ : Chemin absolu conforme à App.tsx */}
                <Button onClick={() => navigate("/planipeda/activites/nouveau")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une activité
                </Button>
            </div>

            {/* 🎯 FILTRES HIÉRARCHIQUES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* NIVEAU */}
                <select
                    value={selectedNiveau ?? ""}
                    onChange={(e) => {
                        const value = Number(e.target.value) || null;
                        setSelectedNiveau(value);
                        setSelectedOption(null);
                        setSelectedUnite(null);
                        setSelectedChapitre(null);
                    }}
                    className="p-2 border rounded-md w-full"
                >
                    <option value="">Tous les niveaux</option>
                    {niveaux.map((n) => (
                        <option key={n.id} value={n.id}>
                            {n.nom_niveau}
                        </option>
                    ))}
                </select>

                {/* OPTION */}
                <select
                    value={selectedOption ?? ""}
                    onChange={(e) => {
                        const value = Number(e.target.value) || null;
                        setSelectedOption(value);
                        setSelectedUnite(null);
                        setSelectedChapitre(null);
                    }}
                    disabled={!selectedNiveau}
                    className="p-2 border rounded-md w-full"
                >
                    <option value="">Toutes les options</option>
                    {options
                        .filter((o) => !selectedNiveau || o.niveau_id === selectedNiveau)
                        .map((o) => (
                            <option key={o.id} value={o.id}>
                                {o.nom_option}
                            </option>
                        ))}
                </select>

                {/* UNITE */}
                <select
                    value={selectedUnite ?? ""}
                    onChange={(e) => {
                        const value = Number(e.target.value) || null;
                        setSelectedUnite(value);
                        setSelectedChapitre(null);
                    }}
                    disabled={!selectedOption}
                    className="p-2 border rounded-md w-full"
                >
                    <option value="">Toutes les unités</option>
                    {unites
                        .filter((u) => !selectedOption || u.option_id === selectedOption)
                        .map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.titre_unite}
                            </option>
                        ))}
                </select>

                {/* CHAPITRE */}
                <select
                    value={selectedChapitre ?? ""}
                    onChange={(e) => {
                        const value = Number(e.target.value) || null;
                        setSelectedChapitre(value);
                    }}
                    disabled={!selectedUnite}
                    className="p-2 border rounded-md w-full"
                >
                    <option value="">Tous les chapitres</option>
                    {chapitres
                        .filter((c) => !selectedUnite || c.unite_id === selectedUnite)
                        .map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.titre_chapitre}
                            </option>
                        ))}
                </select>
            </div>

            {/* 📊 TABLEAU DES ACTIVITÉS */}
            <div className="overflow-x-auto rounded-lg shadow-md"> {/* Ajout de styles pour la table */}
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-blue-600 text-white text-left text-sm font-semibold uppercase tracking-wider">
                            <th className="p-3 border-r border-blue-700">Niveau & Option</th>
                            <th className="p-3 border-r border-blue-700">Unité</th>
                            <th className="p-3 border-r border-blue-700">Chapitre</th>
                            <th className="p-3 border-r border-blue-700">Titre de l’activité</th>
                            <th className="p-3 border-r border-blue-700">Objectifs</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center p-4 text-gray-600">
                                    Chargement des activités...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center p-4 text-gray-600">
                                    Aucune activité trouvée.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((act) => (
                                <tr key={act.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                    <td className="p-3 text-gray-800 font-medium">{act.niveauOption}</td>
                                    <td className="p-3 text-gray-700">{act.unite}</td>
                                    <td className="p-3 text-gray-700">{act.chapitre}</td>
                                    <td className="p-3 text-gray-700">{act.titre_activite}</td>
                                    <td className="p-3 text-gray-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            {act.objectifs.map((obj, i) => (
                                                <li key={i} className="text-sm">{obj}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="p-3 text-center">
                                        {/* MODIFIÉ : Chemin absolu conforme à App.tsx */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/planipeda/activites/${act.id}/edit`)}
                                            className="mr-2 text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                                            title="Modifier l'activité"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(act.id)}
                                            className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white transition-colors"
                                            title="Supprimer l'activité"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default ActivitesPage;
