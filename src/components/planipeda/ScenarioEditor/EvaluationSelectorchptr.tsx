// Nom du fichier: EvaluationSelector.tsx
// Chemin: src/components/planipeda/ScenarioEditor/EvaluationSelector.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/backend/config/supabase';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { XCircle, ClipboardCheck, LayoutList, ClipboardList, BookText } from 'lucide-react'; // Import des icônes

// Définir l'interface pour les données d'évaluation enrichies à afficher et à sélectionner
interface SelectedEvaluationDetails {
    id: number;
    titre: string;
    type_evaluation?: string | null;
    objectifs: string[];
    connaissances: string[];
    capacitesEvaluees: string[];

    nom_niveau: string | null;
    nom_option: string | null;
    titre_unite: string | null;
    titre_chapitre: string | null;
}

interface EvaluationSelectorProps {
    onEvaluationSelected: (
        evaluationId: number,
        evaluationTitle: string,
        type_evaluation?: string,
        objectifs?: string[],
        connaissances?: string[],
        capacitesEvaluees?: string[]
    ) => void;
    onCancel: () => void;
    chapitreId?: number | null;
    niveauId?: number | null;
    optionId?: number | null;
    uniteId?: number | null;
    searchTerm?: string;
}

const ROWS_PER_PAGE = 8;

const EvaluationSelector: React.FC<EvaluationSelectorProps> = ({
    onEvaluationSelected,
    onCancel,
    chapitreId,
    searchTerm = '' // Default to empty string for prop
}) => {
    const [evaluations, setEvaluations] = useState<SelectedEvaluationDetails[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvaluation, setSelectedEvaluation] = useState<SelectedEvaluationDetails | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    // Use an internal state for the search input to handle debouncing
    const [internalSearchInput, setInternalSearchInput] = useState(searchTerm);

    // Update internal search input when the prop changes (e.g., if parent resets search)
    useEffect(() => {
        setInternalSearchInput(searchTerm);
    }, [searchTerm]);

    const fetchEvaluations = useCallback(async () => {
        // Reset state before new fetch
        setIsLoading(true);
        setError(null);
        setEvaluations([]);
        setCurrentPage(1); // Reset to first page on new search/filter

        if (!chapitreId) {
            // No chapter selected, clear evaluations and stop loading
            setIsLoading(false);
            return;
        }

        try {
            let query = supabase
                .from('evaluations')
                .select(`
                    id,
                    titre_evaluation,
                    type_evaluation,
                    chapitre_id,
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
                    evaluation_objectifs!left(objectifs(description_objectif)),
                    evaluation_connaissances!left(connaissances(titre_connaissance)),
                    evaluation_capacite_habilete!left(capacites_habiletes(titre_capacite_habilete))
                `)
                .eq('chapitre_id', chapitreId)
                .order('titre_evaluation', { ascending: true });

            if (internalSearchInput) {
                query = query.ilike('titre_evaluation', `%${internalSearchInput}%`);
            }

            const { data, error: primaryFetchError } = await query;

            let tempEvaluations: SelectedEvaluationDetails[] = [];

            if (primaryFetchError) {
                console.error("Supabase Primary Fetch Error (EvaluationSelector):", primaryFetchError);
                // Fallback logic for 'capacites_habiletes' if the direct relation fails
                if (primaryFetchError.message.includes("Could not find a relationship between 'evaluation_capacite_habilete' and 'capacites_habiletes'")) {
                    console.warn("Direct relation error for 'capacites_habiletes'. Attempting fallback fetch.");
                    let fallbackQuery = supabase.from('evaluations').select(`
                        id,
                        titre_evaluation,
                        type_evaluation,
                        chapitre_id,
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
                        evaluation_objectifs!left(objectifs(description_objectif)),
                        evaluation_connaissances!left(connaissances(titre_connaissance))
                    `).eq('chapitre_id', chapitreId);

                    if (internalSearchInput) {
                        fallbackQuery = fallbackQuery.ilike('titre_evaluation', `%${internalSearchInput}%`);
                    }
                    fallbackQuery = fallbackQuery.order('titre_evaluation', { ascending: true });

                    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

                    if (fallbackError) {
                        console.error("Supabase Fallback Fetch Error (EvaluationSelector):", fallbackError);
                        throw fallbackError; // Throw the fallback error if it also fails
                    }

                    if (fallbackData) {
                        // Fetch capacities separately for each evaluation
                        const evaluationsWithCapacitiesPromises = fallbackData.map(async (evalItem: any) => {
                            const { data: capaciteLinks, error: linkError } = await supabase
                                .from('evaluation_capacite_habilete')
                                .select('capacites_habiletes(titre_capacite_habilete)')
                                .eq('evaluation_id', evalItem.id);

                            const capaciteHabileteDescriptions = linkError
                                ? (console.warn(`Error fetching capacities for evaluation ${evalItem.id} during fallback:`, linkError), [])
                                : capaciteLinks
                                    ?.map((ech: any) => ech.capacites_habiletes?.titre_capacite_habilete)
                                    ?.filter(Boolean) || [];

                            return {
                                id: evalItem.id,
                                titre: evalItem.titre_evaluation,
                                type_evaluation: evalItem.type_evaluation,
                                objectifs: evalItem.evaluation_objectifs?.map((eo: any) => eo.objectifs?.description_objectif)?.filter(Boolean) || [],
                                connaissances: evalItem.evaluation_connaissances?.map((ec: any) => ec.connaissances?.titre_connaissance)?.filter(Boolean) || [],
                                capacitesEvaluees: capaciteHabileteDescriptions,
                                nom_niveau: evalItem.chapitre?.unite?.option?.niveau?.nom_niveau || null,
                                nom_option: evalItem.chapitre?.unite?.option?.nom_option || null,
                                titre_unite: evalItem.chapitre?.unite?.titre_unite || null,
                                titre_chapitre: evalItem.chapitre?.titre_chapitre || null,
                            };
                        });
                        tempEvaluations = await Promise.all(evaluationsWithCapacitiesPromises);
                    }
                } else {
                    // Re-throw if it's not the specific 'capacites_habiletes' relationship error
                    throw primaryFetchError;
                }
            } else {
                // Process data from successful primary query
                tempEvaluations = data.map((evalItem: any) => ({
                    id: evalItem.id,
                    titre: evalItem.titre_evaluation,
                    type_evaluation: evalItem.type_evaluation,
                    objectifs: evalItem.evaluation_objectifs
                        ?.map((eo: any) => eo.objectifs?.description_objectif)
                        ?.filter(Boolean) || [],
                    connaissances: evalItem.evaluation_connaissances
                        ?.map((ec: any) => ec.connaissances?.titre_connaissance)
                        ?.filter(Boolean) || [],
                    capacitesEvaluees: evalItem.evaluation_capacite_habilete
                        ?.map((ech: any) => ech.capacites_habiletes?.titre_capacite_habilete)
                        ?.filter(Boolean) || [],
                    nom_niveau: evalItem.chapitre?.unite?.option?.niveau?.nom_niveau || null,
                    nom_option: evalItem.chapitre?.unite?.option?.nom_option || null,
                    titre_unite: evalItem.chapitre?.unite?.titre_unite || null,
                    titre_chapitre: evalItem.chapitre?.titre_chapitre || null,
                }));
            }
            setEvaluations(tempEvaluations);
        } catch (err: any) {
            console.error("Failed to load evaluations:", err.message);
            setError(err.message || "Failed to load evaluations.");
        } finally {
            setIsLoading(false);
        }
    }, [chapitreId, internalSearchInput]); // Depend on internalSearchInput

    // Effect to trigger fetch when chapterId or internalSearchInput changes (with debounce)
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchEvaluations();
        }, 300); // Debounce for search input

        return () => clearTimeout(debounceTimer);
    }, [internalSearchInput, chapitreId, fetchEvaluations]); // Include fetchEvaluations in dependencies

    const handleSelectEvaluation = (evaluation: SelectedEvaluationDetails) => {
        setSelectedEvaluation(evaluation);
        setError(null); // Clear error when a selection is made
    };

    const handleInsertSelected = () => {
        if (selectedEvaluation) {
            onEvaluationSelected(
                selectedEvaluation.id,
                selectedEvaluation.titre,
                selectedEvaluation.type_evaluation || undefined,
                selectedEvaluation.objectifs,
                selectedEvaluation.connaissances,
                selectedEvaluation.capacitesEvaluees
            );
        } else {
            setError("Veuillez sélectionner une évaluation à insérer.");
        }
    };

    const totalPages = useMemo(() => Math.ceil(evaluations.length / ROWS_PER_PAGE), [evaluations.length]);

    const paginatedEvaluations = useMemo(() => {
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        const endIndex = startIndex + ROWS_PER_PAGE;
        return evaluations.slice(startIndex, endIndex);
    }, [evaluations, currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="p-4">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Sélectionner une Évaluation Existante</h3>

            {!chapitreId && (
                <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
                    Veuillez sélectionner un chapitre dans le formulaire principal pour afficher les évaluations disponibles.
                </div>
            )}

            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Rechercher par titre..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={internalSearchInput}
                    onChange={(e) => setInternalSearchInput(e.target.value)}
                    disabled={!chapitreId && !internalSearchInput} // Disable only if no chapter and no search term already present
                />
            </div>

            {isLoading ? (
                <p className="text-center text-blue-500 py-4">Chargement des évaluations...</p>
            ) : error ? (
                <p className="text-center text-red-500 py-4">Erreur: {error}</p>
            ) : evaluations.length === 0 && chapitreId ? (
                <p className="text-center text-gray-500 py-4">Aucune évaluation trouvée pour ce chapitre. Essayez de créer une nouvelle évaluation.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre de l'évaluation</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Niveau & Option</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unité</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chapitre</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objectifs</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connaissances</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacités évaluées</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sélection</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedEvaluations.map((evalItem) => (
                                <tr
                                    key={evalItem.id}
                                    className={`cursor-pointer hover:bg-gray-100 ${selectedEvaluation?.id === evalItem.id ? 'bg-blue-50' : ''}`}
                                    onClick={() => handleSelectEvaluation(evalItem)}
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {evalItem.titre}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{`${evalItem.nom_niveau || '-'} - ${evalItem.nom_option || '-'}`}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{evalItem.titre_unite || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{evalItem.titre_chapitre || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {evalItem.objectifs && evalItem.objectifs.length > 0 ? (
                                            <ul className="list-disc list-inside space-y-0.5 text-xs">
                                                {evalItem.objectifs.map((obj, objIndex) => (
                                                    <li key={`eval-obj-sel-${evalItem.id}-${objIndex}`} className="truncate max-w-[150px]">{obj}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-gray-500 text-xs">Aucun</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {evalItem.connaissances && evalItem.connaissances.length > 0 ? (
                                            <ul className="list-disc list-inside space-y-0.5 text-xs">
                                                {evalItem.connaissances.map((conn, connIndex) => (
                                                    <li key={`eval-conn-sel-${evalItem.id}-${connIndex}`} className="truncate max-w-[150px]">{conn}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-gray-500 text-xs">Aucune</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {evalItem.capacitesEvaluees && evalItem.capacitesEvaluees.length > 0 ? (
                                            <ul className="list-disc list-inside space-y-0.5 text-xs">
                                                {evalItem.capacitesEvaluees.map((cap, capIndex) => (
                                                    <li key={`eval-cap-sel-${evalItem.id}-${capIndex}`} className="truncate max-w-[150px]">{cap}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-gray-500 text-xs">Aucune</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                        <input
                                            type="radio"
                                            name="selectedEvaluation"
                                            checked={selectedEvaluation?.id === evalItem.id}
                                            onChange={() => handleSelectEvaluation(evalItem)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                    <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                    >
                        Précédent
                    </Button>
                    {[...Array(totalPages)].map((_, index) => (
                        <Button
                            key={index + 1}
                            onClick={() => handlePageChange(index + 1)}
                            variant={currentPage === index + 1 ? "default" : "outline"}
                            size="sm"
                        >
                            {index + 1}
                        </Button>
                    ))}
                    <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                    >
                        Suivant
                    </Button>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-6">
                <Button
                    type="button"
                    onClick={onCancel}
                    variant="outline"
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                >
                    Annuler
                </Button>
                <Button
                    type="button"
                    onClick={handleInsertSelected}
                    disabled={!selectedEvaluation}
                    className={`px-4 py-2 rounded-md text-white font-semibold shadow-md ${
                        !selectedEvaluation ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                    } transition duration-150 ease-in-out`}
                >
                    Insérer l'évaluation sélectionnée
                </Button>
            </div>
        </div>
    );
};

export default EvaluationSelector;