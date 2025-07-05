// 🌐 Chemin : src/components/planipeda/chapitreplanifier/SequenceBlock_complx.tsx
// 📄 Nom du fichier : SequenceBlock.tsx
//
// 💡 Fonctionnalités :
//    - Affiche les détails d'une séquence pédagogique liée à une planification de chapitre.
//    - Récupère les informations complètes de la séquence maître (titre, objectifs, durée, description).
//    - Affiche les activités et évaluations liées à cette séquence, y compris leurs objectifs/connaissances.
//    - Permet la suppression de la séquence de la planification.
//    - Offre un bouton pour modifier la séquence maître (ouvrant un formulaire d'édition).

import React, { useState, useEffect, forwardRef } from 'react';
import { PlanSequence } from '@/types/planificationTypes'; // Type pour l'élément de planification
import { sequencesServicechptr } from '@/services/sequencesServicechptr'; // <-- Assurez-vous que le service importé est le bon !
import { FetchedSequenceData, SequenceItem } from '@/types/sequences'; // Types pour la séquence complète
import { Button } from '@/components/ui/button';
import { Lightbulb, BookText, FlaskConical, CircleDot, FileText } from 'lucide-react'; // Icônes

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
    // Activités et évaluations déjà mappées dans le format SequenceItem pour un affichage facile
    linkedItems: SequenceItem[];
}

interface SequenceBlockProps {
    sequence: PlanSequence;
    onUpdate: (updatedSequence: PlanSequence) => void; // Pour des mises à jour éventuelles de l'ordre local (moins probable ici)
    onDelete: () => void;
    onEditMasterSequence?: (sequenceId: number, planSequenceId: string) => void; // Callback pour l'édition de la maître
    sequenceRefreshTrigger: number; // Prop pour forcer le rafraîchissement des détails de la séquence
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

    // Ajout d'un log pour vérifier l'ID de la séquence de planification
    console.log(`[SequenceBlock - ${sequence.id}] Initializing with sequence:`, sequence);

    const isMasterLinked = typeof sequence.sourceId === 'number' && !isNaN(sequence.sourceId);

    useEffect(() => {
        console.log(`[SequenceBlock - ${sequence.id}] useEffect triggered. Source ID: ${sequence.sourceId}, Is Master Linked: ${isMasterLinked}, Refresh Trigger: ${sequenceRefreshTrigger}`);

        if (!isMasterLinked) {
            console.warn(`[SequenceBlock - ${sequence.id}] Not master linked or sourceId is invalid. Current sourceId:`, sequence.sourceId);
            setIsLoading(false);
            setError("Aucune séquence maître trouvée pour cet ID source."); // Surcharge l'erreur pour la rendre plus claire
            setMasterDetails(null);
            return;
        }

        const fetchMasterSequenceDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                console.log(`[SequenceBlock - ${sequence.id}] Fetching master details for sourceId: ${sequence.sourceId}`);
                // Appel au service renommé
                const { data, error: fetchError } = await sequencesServicechptr.getSequenceById(sequence.sourceId);

                // NOUVEAU LOG : Vérifiez ce que le service retourne
                console.log(`[SequenceBlock - ${sequence.id}] Result from getSequenceById:`, { data, fetchError });


                if (fetchError) {
                    console.error(`[SequenceBlock - ${sequence.id}] Supabase fetch error:`, fetchError);
                    if (fetchError.code === "PGRST116") { // No rows found
                        setError("Séquence maître introuvable dans la base de données.");
                    } else {
                        setError(`Échec du chargement de la séquence: ${fetchError.message}`);
                    }
                    return;
                }

                if (data) {
                    console.log(`[SequenceBlock - ${sequence.id}] Primary fetch data:`, data);

                    // Mapper les activités liées
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
                                linkId: link.id, // ID du lien de jonction
                            };
                        }).filter(Boolean) as SequenceItem[];

                    // Mapper les évaluations liées
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
                            const capacitesDescriptions = (evaluation.evaluation_capacite_habilete || [])
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
                                linkId: link.id, // ID du lien de jonction
                            };
                        }).filter(Boolean) as SequenceItem[];

                    // Combiner et trier tous les éléments liés
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
                    // Cette branche est atteinte si data est null (ex: maybeSingle sans résultat)
                    console.warn(`[SequenceBlock - ${sequence.id}] No data returned for sourceId: ${sequence.sourceId}`);
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
    }, [sequence.sourceId, isMasterLinked, sequenceRefreshTrigger]); // Dépendance ajoutée pour forcer le rafraîchissement

    const handleDeleteClick = () => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la séquence "${masterDetails?.titre_sequence || 'cette séquence'}" de la planification ?`)) {
            onDelete();
        }
    };

    const handleEditSequence = () => {
        if (isMasterLinked && sequence.sourceId && onEditMasterSequence) {
            onEditMasterSequence(sequence.sourceId, sequence.id as string);
        } else {
            // Utiliser toast ou une modale à la place d'alert()
            alert("Impossible de modifier: la séquence n'est pas une séquence maître ou le callback d'édition est manquant.");
        }
    };

    if (isLoading) {
        return <div className="bg-white p-4 rounded-lg shadow-md mb-4 border-l-4 border-blue-500 text-center text-gray-700">Chargement de la séquence...</div>;
    }

    if (error) { // Simplifié pour toujours afficher l'erreur si elle existe
        return <div className="bg-red-100 p-4 rounded-lg shadow-md mb-4 border-l-4 border-red-500 text-center text-red-700">Erreur: {error}</div>;
    }

    // Si masterDetails est null à ce stade, cela signifie qu'il n'y a pas de séquence maîtresse valide à afficher.
    // Cela devrait être couvert par le bloc 'error' ci-dessus, mais un fallback est mis en place.
    if (!masterDetails) {
        return <div className="bg-yellow-100 p-4 rounded-lg shadow-md mb-4 border-l-4 border-yellow-500 text-center text-yellow-700">
            Détails de la séquence non disponibles.
        </div>;
    }

    return (
        <div ref={ref} className="bg-white p-4 rounded-lg shadow-md mb-4 border-l-4 border-blue-500">
            <div className="flex justify-between items-center mb-3">
                <div className="flex-grow">
                    <h3 className="text-xl font-bold text-gray-800">
                        Séquence: {masterDetails.titre_sequence || 'Séquence sans titre'}
                    </h3>
                    {masterDetails.statut && (
                        <p className="text-sm font-semibold text-blue-600 mt-1">
                            Statut: {masterDetails.statut}
                        </p>
                    )}
                    {masterDetails.duree_estimee && (
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
        </div>
    );
});

export default SequenceBlock;
