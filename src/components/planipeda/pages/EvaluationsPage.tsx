// ============================================================
// Titre : EvaluationsPage
// Chemin : src/components/planipeda/pages/EvaluationsPage.tsx
// Fonctionnalités :
//   - Page d'accueil affichant la liste des activités d'évaluation.
//   - Permet de filtrer les évaluations par niveau, option, unité et chapitre.
//   - Récupère les données des évaluations en naviguant la hiérarchie (chapitre -> unité -> option -> niveau).
//   - Offre des actions d'édition et de suppression pour chaque évaluation.
//   - MODIFICATION: Chemins de navigation ajustés pour correspondre au routage de App.tsx et ActivitesPage.tsx.
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/backend/config/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; // Import de toast pour les notifications

// --- TYPES DE DONNÉES ---
// Type pour une évaluation affichée dans le tableau récapitulatif
type Evaluation = {
    id: number;
    titre_evaluation: string | null;
    chapitre_id: number | null; // ID du chapitre stocké directement dans la table 'evaluations'
    
    // Noms des entités hiérarchiques (dérivés des jointures imbriquées)
    niveau_id: number | null; // ID du niveau, pour le filtrage
    nom_niveau: string | null;
    option_id: number | null; // ID de l'option, pour le filtrage
    nom_option: string | null;
    unite_id: number | null; // ID de l'unité, pour le filtrage
    titre_unite: string | null;
    titre_chapitre: string | null; // Titre du chapitre

    competences: string[]; // Titres des compétences associées
    objectifs: string[]; // Titres des objectifs associés
};

// Types pour les entités des filtres hiérarchiques (inchangés)
type Niveau = { id: number; nom_niveau: string };
type Option = { id: number; nom_option: string; niveau_id: number };
type Unite = { id: number; titre_unite: string; option_id: number };
type Chapitre = { id: number; titre_chapitre: string; unite_id: number };

// --- COMPOSANT PRINCIPAL ---
const EvaluationsPage: React.FC = () => {
    const navigate = useNavigate();

    // --- ÉTATS ---
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([]);

    // États pour les données des sélecteurs de filtres
    const [niveaux, setNiveaux] = useState<Niveau[]>([]);
    const [options, setOptions] = useState<Option[]>([]);
    const [unites, setUnites] = useState<Unite[]>([]);
    const [chapitres, setChapitres] = useState<Chapitre[]>([]);

    // États pour les sélections de filtres
    const [selectedNiveau, setSelectedNiveau] = useState<number | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [selectedUnite, setSelectedUnite] = useState<number | null>(null);
    const [selectedChapitre, setSelectedChapitre] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [filtersReady, setFiltersReady] = useState(false);

    // États pour la modale de confirmation de suppression
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [evaluationToDeleteId, setEvaluationToDeleteId] = useState<number | null>(null);

    // --- RÉCUPÉRATION DES ÉVALUATIONS ---
    // Cette fonction est responsable de récupérer toutes les évaluations avec leurs données liées.
    const fetchEvaluations = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("evaluations")
                .select(
                    `
                    id,
                    titre_evaluation,
                    chapitre:chapitre_id(    
                        id,
                        titre_chapitre,
                        unite:unite_id(
                            id,
                            titre_unite,
                            option:option_id(
                                id,
                                nom_option,
                                niveau:niveau_id(
                                    id,
                                    nom_niveau
                                )
                            )
                        )
                    ),
                    evaluation_objectifs(objectifs(description_objectif)), 
                    evaluation_competences(competences(titre_competence))
                    `
                );

            if (error) {
                console.error("❌ Erreur Supabase lors de la récupération des évaluations:", error);
                toast.error(`Échec du chargement des évaluations : ${error.message || "Erreur inconnue."}`);
                setLoading(false);
                return;
            }

            // --- Formatage des données récupérées pour l'affichage et le filtrage ---
            const formattedEvaluations = data.map((evalItem: any) => {
                const chapitreData = evalItem.chapitre;
                const uniteData = chapitreData?.unite;
                const optionData = uniteData?.option;
                const niveauData = optionData?.niveau;

                // IDs pour le filtrage
                const niveau_id = niveauData?.id ?? null;
                const option_id = optionData?.id ?? null;
                const unite_id = uniteData?.id ?? null;
                const chapitre_id = chapitreData?.id ?? null;

                // Noms/titres pour l'affichage
                const nom_niveau = niveauData?.nom_niveau ?? "-";
                const nom_option = optionData?.nom_option ?? "-";
                const titre_unite = uniteData?.titre_unite ?? "-";
                const titre_chapitre = chapitreData?.titre_chapitre ?? "-";

                const competences = evalItem.evaluation_competences
                    ?.map((ec: any) => ec.competences?.titre_competence)
                    .filter(Boolean) || [];

                // CHANGÉ: Accès aux titres des objectifs via 'description_objectif'
                const objectifs = evalItem.evaluation_objectifs
                    ?.map((eo: any) => eo.objectifs?.description_objectif)
                    .filter(Boolean) || [];

                return {
                    id: evalItem.id,
                    titre_evaluation: evalItem.titre_evaluation ?? "-",
                    
                    // IDs pour le filtrage
                    niveau_id,
                    option_id,
                    unite_id,
                    chapitre_id,

                    // Noms/titres pour l'affichage
                    nom_niveau,
                    nom_option,
                    titre_unite,
                    titre_chapitre,
                    
                    competences: competences.length > 0 ? competences : ["Aucune compétence associée"],
                    objectifs: objectifs.length > 0 ? objectifs : ["Aucun objectif"],
                };
            });

            setEvaluations(formattedEvaluations);
            setFilteredEvaluations(formattedEvaluations); // Correction de faute de frappe ici
            setLoading(false);
        } catch (err: any) {
            console.error("❌ Erreur inattendue lors de fetchEvaluations:", err);
            toast.error(`Une erreur inattendue est survenue : ${err.message || "Erreur inconnue."}`);
            setLoading(false);
        }
    }, []);


    // --- RÉCUPÉRATION DES ENTITÉS POUR LES FILTRES ---
    const fetchFilters = useCallback(async () => {
        const [{ data: niveauxData }, { data: optionsData }, { data: unitesData }, { data: chapitresData }] = await Promise.all([
            supabase.from("niveaux").select("id, nom_niveau"),
            supabase.from("options").select("id, nom_option, niveau_id"),
            supabase.from("unites").select("id, titre_unite, option_id"),
            supabase.from("chapitres").select("id, titre_chapitre, unite_id"),
        ]);

        if (niveauxData) setNiveaux(niveauxData);
        if (optionsData) setOptions(optionsData);
        if (unitesData) setUnites(unitesData);
        if (chapitresData) setChapitres(chapitresData);

        setFiltersReady(true);
    }, []);


    // --- EFFET INITIAL : Chargement des évaluations et des filtres au montage du composant ---
    useEffect(() => {
        fetchEvaluations();
        fetchFilters();
    }, [fetchEvaluations, fetchFilters]);


    // --- APPLICATION DES FILTRES ---
    const applyFilters = useCallback(() => {
        let currentFilteredList = [...evaluations];

        if (selectedNiveau) {
            currentFilteredList = currentFilteredList.filter((e) => e.niveau_id === selectedNiveau);
        }

        if (selectedOption) {
            currentFilteredList = currentFilteredList.filter((e) => e.option_id === selectedOption);
        }

        if (selectedUnite) {
            currentFilteredList = currentFilteredList.filter((e) => e.unite_id === selectedUnite);
        }

        if (selectedChapitre) {
            currentFilteredList = currentFilteredList.filter((e) => e.chapitre_id === selectedChapitre);
        }

        setFilteredEvaluations(currentFilteredList);
    }, [selectedNiveau, selectedOption, selectedUnite, selectedChapitre, evaluations]);


    // --- Effet pour ré-appliquer les filtres lorsque les données ou sélections changent ---
    useEffect(() => {
        if (!filtersReady) return;
        applyFilters();
    }, [
        selectedNiveau,
        selectedOption,
        selectedUnite,
        selectedChapitre,
        evaluations,
        filtersReady,
        applyFilters
    ]);


    // --- GESTION DE LA SUPPRESSION ---
    // Affiche la modale de confirmation
    const handleDeleteClick = (id: number) => {
        setEvaluationToDeleteId(id);
        setShowConfirmModal(true);
    };

    // Exécute la suppression après confirmation
    const confirmDelete = async () => {
        if (evaluationToDeleteId === null) return; // Sécurité

        setShowConfirmModal(false); // Ferme la modale
        
        toast.promise(
            (async () => {
                const { error } = await supabase.from("evaluations").delete().eq("id", evaluationToDeleteId);
                if (error) {
                    throw new Error(error.message);
                }
                setEvaluations((prev) => prev.filter((e) => e.id !== evaluationToDeleteId));
                setEvaluationToDeleteId(null); // Réinitialise l'ID de suppression
                return "Évaluation supprimée avec succès !";
            })(),
            {
                loading: "Suppression en cours...",
                success: (message) => message,
                error: (err) => `Erreur lors de la suppression : ${err.message}`,
            }
        );
    };

    // Annule la suppression
    const cancelDelete = () => {
        setShowConfirmModal(false);
        setEvaluationToDeleteId(null);
    };

    // --- RENDU DE LA PAGE ---
    return (
        <section className="p-6 space-y-8">
            {/* ✅ EN-TÊTE DE LA PAGE */}
            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => navigate("/planipeda")}> {/* Retour au module planipeda */}
                    ← Retour
                </Button>
                <h1 className="text-2xl font-bold">Gestion des Évaluations</h1>
                {/* MODIFIÉ : Chemin absolu conforme à App.tsx */}
                <Button onClick={() => navigate("/planipeda/evaluations/nouveau")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une évaluation
                </Button>
            </div>

            {/* 🎯 FILTRES HIÉRARCHIQUES */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sélecteur NIVEAU */}
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

                {/* Sélecteur OPTION */}
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

                {/* Sélecteur UNITE */}
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

                {/* Sélecteur CHAPITRE */}
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

            {/* 📊 TABLEAU DES ÉVALUATIONS */}
            {loading ? (
                <div className="text-center p-4 text-gray-600">Chargement des évaluations...</div>
            ) : (
                <div className="overflow-x-auto rounded-lg shadow-md">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-blue-600 text-white text-left text-sm font-semibold uppercase tracking-wider">
                                <th className="p-3 border-r border-blue-700">Titre de l'évaluation</th>
                                <th className="p-3 border-r border-blue-700">Niveau & Option</th>
                                <th className="p-3 border-r border-blue-700">Unité & Chapitre</th>
                                <th className="p-3 border-r border-blue-700">Compétences</th>
                                <th className="p-3 border-r border-blue-700">Objectifs</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEvaluations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-4 text-gray-600">
                                        Aucune évaluation trouvée avec ces filtres.
                                    </td>
                                </tr>
                            ) : (
                                filteredEvaluations.map((evalItem) => (
                                    <tr key={evalItem.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                        <td className="p-3 text-gray-800 font-medium">{evalItem.titre_evaluation}</td>
                                        {/* Affichage des nouvelles colonnes séparées */}
                                        <td className="p-3 text-gray-700">{`${evalItem.nom_niveau} - ${evalItem.nom_option}`}</td>
                                        <td className="p-3 text-gray-700">{`${evalItem.titre_unite} / ${evalItem.titre_chapitre}`}</td>
                                        <td className="p-3 text-gray-700">
                                            <ul className="list-disc list-inside space-y-1">
                                                {evalItem.competences.map((comp, i) => (
                                                    <li key={i} className="text-sm">{comp}</li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="p-3 text-gray-700">
                                            <ul className="list-disc list-inside space-y-1">
                                                {evalItem.objectifs.map((obj, i) => (
                                                    <li key={i} className="text-sm">{obj}</li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="p-3 text-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                // MODIFIÉ : Chemin absolu conforme à App.tsx pour l'édition
                                                onClick={() => navigate(`/planipeda/evaluations/${evalItem.id}/edit`)} 
                                                className="mr-2 text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                                                title="Modifier l'évaluation"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteClick(evalItem.id)}
                                                className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white transition-colors"
                                                title="Supprimer l'évaluation"
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
            )}

            {/* Modale de Confirmation de Suppression (inchangé) */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Confirmer la suppression</h2>
                        <p className="text-gray-700 mb-6">
                            Êtes-vous sûr de vouloir supprimer cette évaluation ? Cette action est irréversible.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="outline"
                                onClick={cancelDelete}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Supprimer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default EvaluationsPage;
