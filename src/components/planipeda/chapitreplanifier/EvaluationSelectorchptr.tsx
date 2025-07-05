// src/components/planipeda/ScenarioEditor/EvaluationSelectorchptr.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/backend/config/supabase';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// Lucide icons ne sont pas directement utilisées dans le rendu mais conservées pour un usage futur
// import { XCircle, ClipboardCheck, LayoutList, ClipboardList, BookText } from 'lucide-react';

// Import du type mis à jour depuis planificationTypes.ts
import { EvaluationDisplayData } from '@/types/planificationTypes';

interface EvaluationSelectorProps {
    onEvaluationSelected: (
        evaluationId: number,
        evaluationDetails: Omit<EvaluationDisplayData, 'id'> // Maintenant passe l'objet de détails
    ) => void;
    onCancel: () => void;
    chapitreReferenceId?: number | null; // Renommé pour correspondre au prop du parent
    niveauId?: number | null; // Prop non utilisée directement dans le fetch actuel mais passée pour cohérence
    optionId?: number | null; // Prop non utilisée directement dans le fetch actuel mais passée pour cohérence
    uniteId?: number | null; // Prop non utilisée directement dans le fetch actuel mais passée pour cohérence
}

const ROWS_PER_PAGE = 8;

const EvaluationSelector: React.FC<EvaluationSelectorProps> = ({
    onEvaluationSelected,
    onCancel,
    chapitreReferenceId, // Utilisation du nouveau nom de prop
    // niveauId, optionId, uniteId sont passés mais non utilisés dans ce composant pour le fetch actuel
}) => {
    const [evaluations, setEvaluations] = useState<EvaluationDisplayData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationDisplayData | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [internalSearchInput, setInternalSearchInput] = useState(''); // Initialise à vide, sera mis à jour par l'utilisateur

    const fetchEvaluations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setEvaluations([]);
        setCurrentPage(1);

        // Assurez-vous qu'un chapitre de référence est sélectionné pour filtrer
        if (!chapitreReferenceId) {
            setIsLoading(false);
            // Optionally set an error or a message
            setError("Veuillez sélectionner un chapitre de référence pour afficher les évaluations.");
            return;
        }

        try {
            // Requête principale avec les jointures
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
                .eq('chapitre_id', chapitreReferenceId) // Filtre par le chapitre de référence
                .order('titre_evaluation', { ascending: true });

            if (internalSearchInput) {
                query = query.ilike('titre_evaluation', `%${internalSearchInput}%`);
            }

            const { data, error: primaryFetchError } = await query;

            if (primaryFetchError) {
                console.error("Supabase Primary Fetch Error (EvaluationSelectorchptr):", primaryFetchError);
                // Gérer le cas spécifique d'erreur de relation pour capacites_habiletes
                if (primaryFetchError.message.includes("Could not find a relationship between 'evaluation_capacite_habilete' and 'capacites_habiletes'")) {
                    console.warn("Erreur de relation directe pour 'capacites_habiletes'. Tentative de récupération alternative.");
                    // Fallback: Récupérer sans la relation problématique et tenter de la joindre manuellement
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
                    `).eq('chapitre_id', chapitreReferenceId);

                    if (internalSearchInput) {
                        fallbackQuery = fallbackQuery.ilike('titre_evaluation', `%${internalSearchInput}%`);
                    }
                    fallbackQuery = fallbackQuery.order('titre_evaluation', { ascending: true });

                    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

                    if (fallbackError) {
                        console.error("Supabase Fallback Fetch Error (EvaluationSelectorchptr):", fallbackError);
                        throw fallbackError; // Propager l'erreur si la récupération de secours échoue aussi
                    }

                    if (fallbackData) {
                        // Récupérer les capacités séparément pour chaque évaluation si la relation directe est cassée
                        const evaluationsWithCapacitiesPromises = fallbackData.map(async (evalItem: any) => {
                            const { data: capaciteLinks, error: linkError } = await supabase
                                .from('evaluation_capacite_habilete')
                                .select('capacites_habiletes(titre_capacite_habilete)')
                                .eq('evaluation_id', evalItem.id);

                            const capaciteHabileteDescriptions = linkError
                                ? (console.warn(`Erreur lors de la récupération des capacités pour l'évaluation ${evalItem.id} (fallback):`, linkError), [])
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
                            } as EvaluationDisplayData; // Conversion explicite
                        });
                        setEvaluations(await Promise.all(evaluationsWithCapacitiesPromises));
                    }
                } else {
                    // Si ce n'est pas une erreur de relation spécifique, la propager
                    throw primaryFetchError;
                }
            } else {
                // Traiter les données de la requête principale réussie
                const processedData = data.map((evalItem: any) => ({
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
                })) as EvaluationDisplayData[]; // Conversion explicite
                setEvaluations(processedData);
            }
        } catch (err: any) {
            console.error("Échec du chargement des évaluations:", err.message);
            setError(err.message || "Échec du chargement des évaluations.");
        } finally {
            setIsLoading(false);
        }
    }, [chapitreReferenceId, internalSearchInput]);

    // Effet pour déclencher la récupération lorsque chapitreReferenceId ou internalSearchInput change (avec debounce)
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchEvaluations();
        }, 300); // Debounce de 300ms pour l'entrée de recherche

        return () => clearTimeout(debounceTimer);
    }, [internalSearchInput, chapitreReferenceId, fetchEvaluations]); // Inclure fetchEvaluations dans les dépendances

    const handleSelectEvaluation = (evaluation: EvaluationDisplayData) => {
        setSelectedEvaluation(evaluation);
        setError(null); // Effacer l'erreur lorsqu'une sélection est faite
    };

    const handleInsertSelected = () => {
        if (selectedEvaluation) {
            // Appelle la prop onEvaluationSelected avec l'ID et l'objet de détails complet
            const { id, ...details } = selectedEvaluation;
            onEvaluationSelected(id, details);
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

            {!chapitreReferenceId && (
                <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
                    Veuillez sélectionner un chapitre de référence dans le formulaire principal pour afficher les évaluations disponibles.
                </div>
            )}

            <div className="mb-4">
                <Input
                    type="text"
                    placeholder="Rechercher par titre..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={internalSearchInput}
                    onChange={(e) => setInternalSearchInput(e.target.value)}
                    // Désactiver si aucun chapitre n'est sélectionné et pas de terme de recherche pour éviter des requêtes inutiles
                    disabled={!chapitreReferenceId && internalSearchInput === ''}
                />
            </div>

            {isLoading ? (
                <p className="text-center text-blue-500 py-4">Chargement des évaluations...</p>
            ) : error ? (
                <p className="text-center text-red-500 py-4">Erreur: {error}</p>
            ) : evaluations.length === 0 && chapitreReferenceId ? (
                <p className="text-center text-gray-500 py-4">Aucune évaluation trouvée pour ce chapitre. Essayez de créer une nouvelle évaluation ou ajustez votre recherche.</p>
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
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sélection</th>
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
