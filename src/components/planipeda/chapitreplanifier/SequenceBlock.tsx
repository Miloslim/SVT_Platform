// 🌐 Chemin : src/components/planipeda/chapitreplanifier/SequenceBlock.tsx
// 📄 Nom du fichier : SequenceBlock.tsx
//
// 💡 Fonctionnalités :
//    - Affiche les détails d'une séquence pédagogique liée à une planification de chapitre.
//    - Récupère les informations complètes de la séquence maître (titre, objectifs, durée, description).
//    - Affiche les activités et évaluations liées à cette séquence, y compris leurs objectifs/connaissances.
//    - Permet la suppression de la séquence de la planification.
//    - Offre un bouton pour modifier la séquence maître (ouvrant un formulaire d'édition).

import React, { useState, useEffect, forwardRef } from 'react';
import { PlanSequence } from '@/types/planificationTypes';
import { sequencesServicechptr } from '@/services/sequencesServicechptr';
import { FetchedSequenceData, SequenceItem } from '@/types/sequences';
import { Button } from '@/components/ui/button';
import { FlaskConical, Lightbulb, BookText } from 'lucide-react';

/**
 * Interface pour les détails complets de la séquence maître pour l'affichage.
 */
interface MasterSequenceDetails {
    titre_sequence: string;
    objectifs_specifiques: string | null;
    description: string | null;
    duree_estimee: number | null;
    prerequis: string | null;
    statut: "brouillon" | "validee" | "archivee";
    linkedItems: SequenceItem[];
}

interface SequenceBlockProps {
    sequence: PlanSequence;
    onUpdate: (updatedSequence: PlanSequence) => void;
    onDelete: () => void;
    onEditMasterSequence?: (sequenceId: number, planSequenceId: string) => void;
    sequenceRefreshTrigger: number;
}

const SequenceBlock = forwardRef<HTMLDivElement, SequenceBlockProps>(({
    sequence,
    onUpdate,
    onDelete,
    onEditMasterSequence,
    sequenceRefreshTrigger
}, ref) => {
    const [masterDetails, setMasterDetails] = useState<MasterSequenceDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isMasterLinked = typeof sequence.sourceId === 'number';

    useEffect(() => {
        console.log(`[SequenceBlock - ${sequence.id}] useEffect triggered. Source ID: ${sequence.sourceId}, Refresh Trigger: ${sequenceRefreshTrigger}`);

        if (!isMasterLinked) {
            console.log(`[SequenceBlock - ${sequence.id}] Not master linked or sourceId is missing.`);
            setIsLoading(false);
            setError(null);
            setMasterDetails(null);
            return;
        }

        const fetchMasterSequenceDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                console.log(`[SequenceBlock - ${sequence.id}] Fetching master details for sourceId: ${sequence.sourceId}`);
                const { data, error: fetchError } = await sequencesServicechptr.getSequenceById(sequence.sourceId);


                if (fetchError) {
                    console.error(`[SequenceBlock - ${sequence.id}] Supabase fetch error:`, fetchError);
                    if (fetchError.code === "PGRST116") {
                        setError("Séquence maître introuvable.");
                    } else {
                        setError(`Échec du chargement de la séquence: ${fetchError.message}`);
                    }
                    return;
                }

                if (data) {
                    console.log(`[SequenceBlock - ${sequence.id}] Primary fetch data:`, data);

                    const linkedActivities: SequenceItem[] = (data.sequence_activite || [])
                        .map(link => {
                            const activity = link.activites;
                            if (!activity) {
                                console.warn(`[SequenceBlock] Activité liée avec ID ${link.activite_id} non trouvée.`);
                                return null;
                            }
                            const objectifsDescriptions = (activity.activite_objectifs || [])
                                .map((ao: any) => ao.objectifs?.description_objectif)
                                .filter(Boolean);
                            return {
                                id: activity.id,
                                titre: activity.titre_activite,
                                description: activity.description,
                                objectifs: objectifsDescriptions,
                                type: 'activity',
                                order_in_sequence: link.ordre,
                                linkId: link.id,
                            };
                        }).filter(Boolean) as SequenceItem[];

                    const linkedEvaluations: SequenceItem[] = (data.sequence_evaluation || [])
                        .map(link => {
                            const evaluation = link.evaluations;
                            if (!evaluation) {
                                console.warn(`[SequenceBlock] Évaluation liée avec ID ${link.evaluation_id} non trouvée.`);
                                return null;
                            }
                            const connaissancesDescriptions = (evaluation.evaluation_connaissances || [])
                                .map((ec: any) => ec.connaissances?.titre_connaissance)
                                .filter(Boolean);
                            // CORRECTION FINALE: Utilisation de 'evaluation_capacite_habilete' (au singulier)
                            const capacitesDescriptions = (evaluation.evaluation_capacite_habilete || []) // S'assurer que le service renvoie ce nom
                                .map((ech: any) => ech.capacites_habiletes?.titre_capacite_habilete)
                                .filter(Boolean);
                            return {
                                id: evaluation.id,
                                titre: evaluation.titre_evaluation,
                                type_evaluation: evaluation.type_evaluation,
                                description: evaluation.introduction_activite || evaluation.consignes_specifiques,
                                connaissances: connaissancesDescriptions,
                                capacitesEvaluees: capacitesDescriptions,
                                type: 'evaluation',
                                order_in_sequence: link.ordre,
                                linkId: link.id,
                            };
                        }).filter(Boolean) as SequenceItem[];

                    const allLinkedItems = [...linkedActivities, ...linkedEvaluations]
                        .sort((a, b) => (a.order_in_sequence || 0) - (b.order_in_sequence || 0));

                    setMasterDetails({
                        titre_sequence: data.titre_sequence,
                        objectifs_specifiques: data.objectifs_specifiques,
                        description: data.description,
                        duree_estimee: data.duree_estimee,
                        prerequis: data.prerequis,
                        statut: data.statut,
                        linkedItems: allLinkedItems,
                    });
                } else {
                    setError("Aucune séquence maître trouvée pour cet ID source.");
                }
            } catch (err: any) {
                console.error(`[SequenceBlock - ${sequence.id}] Erreur lors du chargement des détails de la séquence maître:`, err);
                setError("Échec du chargement des détails de la séquence: " + err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMasterSequenceDetails();
    }, [sequence.sourceId, isMasterLinked, sequenceRefreshTrigger]);

    const handleDeleteClick = () => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la séquence "${masterDetails?.titre_sequence || 'cette séquence'}" de la planification ?`)) {
            onDelete();
        }
    };

    const handleEditSequence = () => {
        if (isMasterLinked && sequence.sourceId && onEditMasterSequence) {
            onEditMasterSequence(sequence.sourceId, sequence.id as string);
        } else {
            alert("Impossible de modifier: la séquence n'est pas une séquence maître ou le callback d'édition est manquant.");
        }
    };

    if (isLoading) {
        return <div className="bg-white p-4 rounded-lg shadow-md mb-4 border-l-4 border-blue-500 text-center text-gray-700">Chargement de la séquence...</div>;
    }

    if (error && isMasterLinked) {
        return <div className="bg-red-100 p-4 rounded-lg shadow-md mb-4 border-l-4 border-red-500 text-center text-red-700">Erreur: {error}</div>;
    }

    return (
        <div ref={ref} className="bg-white p-4 rounded-lg shadow-md mb-4 border-l-4 border-blue-500">
            <div className="flex justify-between items-center mb-3">
                <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-800">
                        Séquence: {masterDetails?.titre_sequence || 'Séquence non liée'}
                    </h3>
                    {masterDetails?.statut && (
                        <p className="text-sm font-semibold text-blue-600 mt-1">
                            Statut: {masterDetails.statut}
                        </p>
                    )}
                    {masterDetails?.duree_estimee && (
                        <p className="text-sm text-gray-600">Durée estimée: {masterDetails.duree_estimee} heures</p>
                    )}
                </div>
                <button
                    onClick={handleDeleteClick}
                    className="ml-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-150 ease-in-out flex-shrink-0"
                    title="Supprimer la séquence de la planification"
                >
                    🗑️
                </button>
            </div>

            {isMasterLinked && masterDetails ? (
                <>
                    <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                        <h4 className="text-md font-medium text-blue-800 mb-2">🎯 Objectif Général :</h4>
                        <p className="text-gray-700 text-sm mb-2 italic">
                            {masterDetails.objectifs_specifiques || 'Aucun objectif général défini.'}
                        </p>

                        <h4 className="text-md font-medium text-blue-800 mb-2 mt-4">📝 Description :</h4>
                        <p className="text-gray-700 text-sm mb-2 italic">
                            {masterDetails.description || 'Aucune description fournie.'}
                        </p>

                        <h4 className="text-md font-medium text-blue-800 mb-2 mt-4">🔗 Éléments liés :</h4>
                        {masterDetails.linkedItems.length > 0 ? (
                            <ul className="space-y-3">
                                {masterDetails.linkedItems.map((item, index) => (
                                    <li key={`${item.type}-${item.id}-${index}`} className="p-2 border border-gray-200 rounded-md bg-white shadow-sm">
                                        <div className="flex items-center text-sm font-semibold text-gray-800 mb-1">
                                            {item.type === 'activity' ? (
                                                <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
                                            ) : (
                                                <BookText className="h-4 w-4 mr-2 text-purple-500" />
                                            )}
                                            {item.type === 'activity' ? `Activité: ${item.titre}` : `Évaluation: ${item.titre} (${item.type_evaluation || 'N/A'})`}
                                        </div>
                                        {item.description && <p className="text-xs text-gray-600 italic mb-1 ml-6">{item.description}</p>}
                                        {item.type === 'activity' && item.objectifs && item.objectifs.length > 0 && (
                                            <div className="ml-6 mt-1">
                                                <p className="text-xs font-medium text-gray-700">Objectifs spécifiques :</p>
                                                <ul className="list-disc list-inside text-xs text-gray-600">
                                                    {item.objectifs.map((obj, i) => <li key={i}>{obj}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {item.type === 'evaluation' && item.connaissances && item.connaissances.length > 0 && (
                                            <div className="ml-6 mt-1">
                                                <p className="text-xs font-medium text-gray-700">Connaissances évaluées :</p>
                                                <ul className="list-disc list-inside text-xs text-gray-600">
                                                    {item.connaissances.map((conn, i) => <li key={i}>{conn}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {item.type === 'evaluation' && item.capacitesEvaluees && item.capacitesEvaluees.length > 0 && (
                                            <div className="ml-6 mt-1">
                                                <p className="text-xs font-medium text-gray-700">Capacités / Habilités évaluées :</p>
                                                <ul className="list-disc list-inside text-xs text-gray-600">
                                                    {item.capacitesEvaluees.map((cap, i) => <li key={i}>{cap}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600 text-sm">Aucune activité ou évaluation liée à cette séquence.</p>
                        )}

                        <button
                            onClick={handleEditSequence}
                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
                        >
                            Modifier la séquence maître
                        </button>
                    </div>
                </>
            ) : (
                <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200 text-red-700 text-sm">
                    Cette séquence n'est pas liée à une séquence maître existante ou les détails n'ont pas pu être chargés.
                </div>
            )}
        </div>
    );
});

export default SequenceBlock;
