/**
 * 📌 Fichier : SequenceList.tsx
 * 📍 Chemin : src/components/planipeda/entities/SequenceList.tsx
 * 🎯 Objectif : Affichage des séquences pédagogiques dans un tableau, incluant les informations du chapitre associé.
 * 🛠️ Fonctionnalités :
 * - Affiche titre, description, durée estimée, statut, et chapitre associé pour chaque séquence.
 * - Fournit un bouton "Modifier" pour chaque séquence, permettant l'édition.
 * - Affiche un message clair si aucune séquence n'est à afficher.
 */

import React from "react";
import { Link } from "react-router-dom"; // Pour la navigation vers la page de modification
import { Database } from "../../../types/supabase"; // Chemin correct pour les types Supabase

// Définir le type de la séquence avec les infos du chapitre jointes pour un affichage complet
type Sequence = Database['public']['Tables']['sequences']['Row'] & {
    chapitres?: Database['public']['Tables']['chapitres']['Row'] | null; // Le champ 'chapitres' est ajouté par la jointure via select
};

// Interface des props attendues par le composant SequenceList
interface SequenceListProps {
    sequences: Sequence[]; // Le tableau de séquences à afficher
    // onEdit: (sequenceId: number) => void; // Un gestionnaire d'édition pourrait être ajouté ici
}

const SequenceList: React.FC<SequenceListProps> = ({ sequences }) => {
    return (
        <div className="sequence-list-container overflow-x-auto shadow-md rounded-lg">
            <table className="sequence-table min-w-full border-collapse border border-gray-300">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Titre de la Séquence</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Chapitre Associé</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Description</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Durée Estimée (min)</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Statut</th>
                        <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Correction ici: Le bloc "else" du ternaire doit retourner un élément JSX valide. */}
                    {sequences.length > 0 ? (
                        sequences.map((seq) => (
                            <tr key={seq.id} className="hover:bg-gray-50 transition-colors duration-200">
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">{seq.id}</td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 font-medium">{seq.titre_sequence}</td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                    {seq.chapitres?.titre_chapitre || "Non spécifié"}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700 max-w-xs truncate">
                                    {seq.description || "Aucune description"}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                    {seq.duree_estimee !== null ? `${seq.duree_estimee} min` : "N/A"}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                    {seq.statut}
                                </td>
                                <td className="border border-gray-300 px-4 py-2 text-sm">
                                    <Link
                                        to={`/planipeda/sequence/${seq.id}/edit`}
                                        className="btn-edit bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                        aria-label={`Modifier séquence ${seq.id}`}
                                    >
                                        Modifier
                                    </Link>
                                </td>
                            </tr>
                        ))
                    ) : (
                        // Message affiché si aucune séquence n'est trouvée - doit être un TR complet
                        <tr>
                            <td colSpan={7} className="text-center border border-gray-300 px-4 py-4 text-gray-600 italic">
                                Aucune séquence à afficher.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SequenceList;