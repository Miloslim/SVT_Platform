// 🌐 Chemin : src/components/planipeda/chapitreplanifier/SequenceSelector.tsx
// 📄 Nom du fichier : SequenceSelector.tsx
//
// 💡 Fonctionnalités :
//    - Affiche une liste des séquences existantes, filtrables uniquement par un champ de recherche textuelle.
//    - La sélection du chapitre parent est désormais gérée implicitement par la prop `chapitreReferenceId` reçue du parent.
//    - Permet à l'utilisateur de sélectionner une séquence à ajouter à une fiche de planification de chapitre.
//    - Utilise le service `sequencesServicechptr` pour récupérer les données.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// import { supabase } from '@/backend/config/supabase'; // Plus nécessaire pour charger la hiérarchie ici
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Les composants Select ne sont plus nécessaires
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FetchedSequenceData } from '@/types/sequences';
import { sequencesServicechptr } from '@/services/sequencesServicechptr';

// Interfaces pour les données de hiérarchie (toujours nécessaires pour les types de FetchedSequenceData)
interface Niveau { id: number; nom_niveau: string; }
interface Option { id: number; nom_option: string; niveau_id: number; }
interface Unite { id: number; titre_unite: string; option_id: number; }
interface Chapitre { id: number; titre_chapitre: string; unite_id: number; }

/**
 * Interface pour les données de séquence à afficher dans le sélecteur.
 * Simplifiée pour l'affichage dans le tableau.
 */
export interface SequenceDisplayData {
    id: number;
    titre_sequence: string;
    description?: string | null;
    objectifs_specifiques: string | null;
    duree_estimee: number | null;
    statut: "brouillon" | "validee" | "archivee";
    nom_niveau: string | null;
    nom_option: string | null;
    titre_unite: string | null;
    titre_chapitre: string | null;
}

interface SequenceSelectorProps {
    onSequenceSelected: (sequenceId: number, sequenceDetails: Omit<SequenceDisplayData, 'id'>) => void;
    onCancel: () => void;
    // Prop unique pour le filtrage initial basé sur le chapitre de référence du parent
    chapitreReferenceId?: number | null;
    // Les props niveauId, optionId, uniteId ne sont plus directement utilisées pour le filtrage local dans ce composant
    niveauId?: number | null;
    optionId?: number | null;
    uniteId?: number | null;
}

const SequenceSelector: React.FC<SequenceSelectorProps> = ({
    onSequenceSelected,
    onCancel,
    chapitreReferenceId, // Seule prop de contexte de chapitre utilisée
    // niveauId, optionId, uniteId ne sont pas utilisées dans la logique de filtrage ici
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allSequences, setAllSequences] = useState<FetchedSequenceData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Chargement initial des données ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Charger toutes les séquences avec leurs détails hiérarchiques
                const { data: sequencesData, error: sequencesError } = await sequencesServicechptr.getAllSequencesWithDetails();
                if (sequencesError) throw sequencesError;
                setAllSequences(sequencesData || []);
            } catch (err: any) {
                console.error("Erreur lors du chargement des données:", err);
                setError("Échec du chargement des séquences: " + err.message);
                toast.error("Échec du chargement des séquences.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []); // Aucun dépendance à chapitreReferenceId ici car getAllSequencesWithDetails ne filtre pas par chapitre

    // --- Filtrage et tri des séquences à afficher ---
    const filteredAndSortedSequences = useMemo(() => {
        let filtered = allSequences;

        // Filtrer par le chapitre de référence passé en prop
        if (chapitreReferenceId) {
            filtered = filtered.filter(seq => seq.chapitre?.id === chapitreReferenceId);
        }

        // Filtrer par terme de recherche
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(seq =>
                seq.titre_sequence.toLowerCase().includes(lowerCaseSearchTerm) ||
                (seq.objectifs_specifiques && seq.objectifs_specifiques.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (seq.description && seq.description.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }

        // Convertir en SequenceDisplayData pour l'affichage et trier
        return filtered.map(seq => ({
            id: seq.id,
            titre_sequence: seq.titre_sequence,
            description: seq.description,
            objectifs_specifiques: seq.objectifs_specifiques,
            duree_estimee: seq.duree_estimee,
            statut: seq.statut,
            nom_niveau: seq.chapitre?.unite?.option?.niveau?.nom_niveau || null,
            nom_option: seq.chapitre?.unite?.option?.nom_option || null,
            titre_unite: seq.chapitre?.unite?.titre_unite || null,
            titre_chapitre: seq.chapitre?.titre_chapitre || null,
        })).sort((a, b) => a.titre_sequence.localeCompare(b.titre_sequence)); // Tri alphabétique par titre
    }, [allSequences, searchTerm, chapitreReferenceId]); // Dépend de chapitreReferenceId

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <p className="text-lg text-gray-600">Chargement des séquences...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 p-4 text-center">
                <p>Erreur: {error}</p>
                <Button onClick={onCancel} className="mt-4">Fermer</Button>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Sélectionner une Séquence</h2>

            {/* Section de recherche (le seul filtre UI conservé) */}
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <Label htmlFor="search">Recherche par mot-clé</Label>
                <Input
                    id="search"
                    type="text"
                    placeholder="Rechercher par titre, objectifs ou description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
            </div>

            {/* Message si aucun chapitre de référence n'est sélectionné */}
            {!chapitreReferenceId && (
                <div className="p-4 mb-4 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md">
                    Veuillez d'abord sélectionner un chapitre de référence dans l'éditeur parent pour filtrer les séquences disponibles.
                </div>
            )}


            {filteredAndSortedSequences.length === 0 ? (
                <p className="text-center text-gray-600 mt-8">
                    {chapitreReferenceId
                        ? "Aucune séquence trouvée avec les critères de filtre pour ce chapitre."
                        : "Aucune séquence à afficher. Sélectionnez un chapitre de référence."}
                </p>
            ) : (
                <div className="max-h-[60vh] overflow-y-auto border rounded-lg shadow-inner">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objectifs</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hiérarchie</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAndSortedSequences.map((seq) => (
                                <tr key={seq.id} className="hover:bg-blue-50">
                                    <td className="px-4 py-2 whitespace-normal text-sm font-medium text-gray-900">{seq.titre_sequence}</td>
                                    <td className="px-4 py-2 whitespace-normal text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis">{seq.objectifs_specifiques || 'N/A'}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{seq.statut}</td>
                                    <td className="px-4 py-2 whitespace-normal text-sm text-gray-600">
                                        {seq.nom_niveau && <span className="block">{seq.nom_niveau}</span>}
                                        {seq.nom_option && <span className="block">{seq.nom_option}</span>}
                                        {seq.titre_unite && <span className="block">{seq.titre_unite}</span>}
                                        {seq.titre_chapitre && <span className="block font-semibold">{seq.titre_chapitre}</span>}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                        <Button
                                            onClick={() => onSequenceSelected(seq.id, seq)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-xs"
                                        >
                                            Sélectionner
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex justify-end mt-6 space-x-3">
                <Button variant="outline" onClick={onCancel}>
                    Annuler
                </Button>
            </div>
        </div>
    );
};

export default SequenceSelector;