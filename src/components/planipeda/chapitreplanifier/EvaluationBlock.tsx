// src/components/planipeda/chapitreplanifier/EvaluationBlock.tsx

import React, { useState, useEffect, forwardRef } from 'react';
import { PlanEvaluation } from '@/types/planificationTypes';
import { supabase } from '@/backend/config/supabase';
import { EvaluationData } from '@/types/planificationTypes';
import { BookText } from 'lucide-react';


/**
 * Interface pour les données de l'évaluation maître, récupérées pour l'affichage.
 */
interface MasterEvaluationDetails {
    titre: string;
    type_evaluation: string | null;
    objectifs: string[]; // Descriptions des objectifs
    connaissances: string[]; // Titres des connaissances
    capacitesEvaluees: string[]; // Titres des capacités évaluées
    contenu_apercu: string; // Aperçu du contenu de l'activité
}

interface EvaluationBlockProps {
    evaluation: PlanEvaluation;
    onUpdate: (updatedEvaluation: PlanEvaluation) => void;
    onDelete: () => void;
    onEditMasterEvaluation?: (evaluationId: number, planEvaluationId: string) => void;
    evaluationRefreshTrigger: number;
}

const EvaluationBlock = forwardRef<HTMLDivElement, EvaluationBlockProps>(({ evaluation, onUpdate, onDelete, onEditMasterEvaluation, evaluationRefreshTrigger }, ref) => {
    const [masterDetails, setMasterDetails] = useState<MasterEvaluationDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isMasterLinked = typeof evaluation.sourceId === 'number';

    useEffect(() => {
        if (!isMasterLinked) {
            setIsLoading(false);
            setError(null);
            setMasterDetails(null);
            return;
        }

        const fetchMasterEvaluationDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Requête pour récupérer les détails de l'évaluation maître avec toutes les jointures nécessaires
                // CORRECTION FINALE: Utilisation de 'evaluation_capacite_habilete' (au singulier)
                const { data, error: fetchError } = await supabase
                    .from('evaluations')
                    .select(`
                        id,
                        titre_evaluation,
                        type_evaluation,
                        evaluation_objectifs!left(objectifs(description_objectif)),
                        evaluation_connaissances!left(connaissances(titre_connaissance)),
                        evaluation_capacite_habilete!left(capacites_habiletes(titre_capacite_habilete)),
                        evaluation_content_blocks(block_type, text_content_html, block_order)
                    `)
                    .eq('id', evaluation.sourceId)
                    .single();

                if (fetchError) {
                    throw fetchError;
                } else if (data) {
                    const contentBlocks = data.evaluation_content_blocks || [];
                    const textBlocks = contentBlocks.filter((b: any) => b.block_type === 'text' && b.text_content_html);
                    const firstTextBlockHtml = textBlocks.sort((a: any, b: any) => a.block_order - b.block_order)[0]?.text_content_html || '';
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(firstTextBlockHtml, 'text/html');
                    const textContent = doc.body.textContent || '';
                    const contentPreview = textContent.length > 150 ? textContent.substring(0, 150) + '...' : textContent;

                    setMasterDetails({
                        titre: data.titre_evaluation ?? "",
                        type_evaluation: data.type_evaluation ?? null,
                        objectifs: data.evaluation_objectifs?.map((eo: any) => eo.objectifs?.description_objectif)?.filter(Boolean) || [],
                        connaissances: data.evaluation_connaissances?.map((ec: any) => ec.connaissances?.titre_connaissance)?.filter(Boolean) || [],
                        capacitesEvaluees: data.evaluation_capacite_habilete?.map((ech: any) => ech.capacites_habiletes?.titre_capacite_habilete)?.filter(Boolean) || [], // Utilisation du nom de relation corrigé
                        contenu_apercu: contentPreview,
                    });
                } else {
                    setError("Aucune évaluation maître trouvée pour cet ID source.");
                }
            } catch (err: any) {
                console.error("Erreur lors du chargement des détails de l'évaluation maître:", err);
                setError("Échec du chargement des détails de l'évaluation: " + err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMasterEvaluationDetails();
    }, [evaluation.sourceId, isMasterLinked, evaluationRefreshTrigger]);

    const handleDeleteClick = () => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'évaluation "${masterDetails?.titre || 'cette évaluation'}" de la planification ?`)) {
            onDelete();
        }
    };

    const handleEditEvaluation = () => {
        if (isMasterLinked && evaluation.sourceId && onEditMasterEvaluation) {
            onEditMasterEvaluation(evaluation.sourceId, evaluation.id as string);
        } else {
            alert("Impossible de modifier: l'évaluation n'est pas une évaluation maître ou le callback d'édition est manquant.");
        }
    };

    if (isLoading) {
        return <div className="bg-white p-4 rounded-lg shadow-md mb-4 border-l-4 border-purple-500 text-center text-gray-700">Chargement de l'évaluation...</div>;
    }

    if (error && isMasterLinked) {
        return <div className="bg-red-100 p-4 rounded-lg shadow-md mb-4 border-l-4 border-red-500 text-center text-red-700">Erreur: {error}</div>;
    }

    return (
        <div ref={ref} className="bg-white p-4 rounded-lg shadow-md mb-4 border-l-4 border-purple-500">
            <div className="flex justify-between items-center mb-3">
                <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-800">
                        {masterDetails?.titre || 'Évaluation non liée'}
                    </h3>
                    {masterDetails?.type_evaluation && (
                        <p className="text-sm font-semibold text-purple-600 mt-1">
                            Type: {masterDetails.type_evaluation}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleDeleteClick}
                    className="ml-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-150 ease-in-out flex-shrink-0"
                    title="Supprimer l'évaluation de la planification"
                >
                    🗑️
                </button>
            </div>

            {isMasterLinked && masterDetails ? (
                <>
                    <div className="mt-4 p-3 bg-purple-50 rounded-md border border-purple-200">
                        <h4 className="text-md font-medium text-purple-800 mb-2">📄 Aperçu du Contenu :</h4>
                        {masterDetails.contenu_apercu ? (
                            <p className="text-gray-700 text-sm mb-2 italic">
                                {masterDetails.contenu_apercu}
                            </p>
                        ) : (
                            <p className="text-gray-600 text-sm">Aucun aperçu de contenu disponible.</p>
                        )}

                        <h4 className="text-md font-medium text-purple-800 mb-2 mt-4">🎯 Objectifs :</h4>
                        {masterDetails.objectifs && masterDetails.objectifs.length > 0 ? (
                            <ul className="list-disc list-inside text-gray-700 text-sm mb-2 space-y-1">
                                {masterDetails.objectifs.map((obj, index) => (
                                    <li key={index}>{obj}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600 text-sm">Aucun objectif associé.</p>
                        )}

                        <h4 className="text-md font-medium text-purple-800 mb-2 mt-4">🧠 Connaissances :</h4>
                        {masterDetails.connaissances && masterDetails.connaissances.length > 0 ? (
                            <ul className="list-disc list-inside text-gray-700 text-sm mb-2 space-y-1">
                                {masterDetails.connaissances.map((conn, index) => (
                                    <li key={index}>{conn}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600 text-sm">Aucune connaissance associée.</p>
                        )}

                        <h4 className="text-md font-medium text-purple-800 mb-2 mt-4">💪 Capacités Évaluées :</h4>
                        {masterDetails.capacitesEvaluees && masterDetails.capacitesEvaluees.length > 0 ? (
                            <ul className="list-disc list-inside text-gray-700 text-sm mb-2 space-y-1">
                                {masterDetails.capacitesEvaluees.map((cap, index) => (
                                    <li key={index}>{cap}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600 text-sm">Aucune capacité évaluée associée.</p>
                        )}

                        <button
                            onClick={handleEditEvaluation}
                            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                        >
                            Modifier l'évaluation maître
                        </button>
                    </div>
                </>
            ) : (
                <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200 text-red-700 text-sm">
                    Cette évaluation n'est pas liée à une évaluation maître existante ou les détails n'ont pas pu être chargés.
                </div>
            )}
        </div>
    );
});

export default EvaluationBlock;
