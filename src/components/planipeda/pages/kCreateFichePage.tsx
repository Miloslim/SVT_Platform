// 📁 GESTION DE LA FICHE PÉDAGOGIQUE D'UN CHAPITRE
// Description : Cette page permet de visualiser et d'organiser la structure d'un chapitre
// en séquences, activités et évaluations, avec des fonctionnalités d'ajout, modification et suppression.

import React, { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

// IMPORTANT : Remplacez par vos vraies clés Supabase
// Ces valeurs se trouvent dans votre tableau de bord Supabase, sous "Project Settings" -> "API".
const supabaseUrl = 'VOTRE_URL_SUPABASE'; // Ex: 'https://abcdef12345.supabase.co'
const supabaseAnonKey = 'VOTRE_CLE_ANON_SUPABASE'; // Ex: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlMTIzNDUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3ODkzMDQwMCwiZXhwIj0xOTk0NDY2NDAwfQ.YOUR_ACTUAL_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 🧩 TYPES DE DONNÉES pour la structure hiérarchique
// Note: Les types de base (Niveau, Option, Unite, Chapitre) sont définis pour les filtres
// mais ici, nous nous concentrons sur la structure imbriquée d'un SEUL chapitre.

interface ActiviteDetail {
    id: number;
    titre_activite: string;
    description?: string;
    type_activite?: string; // Ajouté pour correspondre à la maquette
    objectif_activite?: string; // Ajouté pour correspondre à la maquette
    duree_minutes?: number;
}

interface EvaluationDetail {
    id: number;
    titre_evaluation: string;
    type_evaluation?: string;
    critere_evaluation?: string; // Utilise 'grille_correction' de la DB pour 'critères'
}

interface SequenceData {
    id: number;
    titre_sequence: string;
    objectif_global?: string;
    description?: string;
    duree_estimee?: number;
    statut?: string;
    ordre_dans_chapitre?: number;
    activites: ActiviteDetail[];
    evaluations: EvaluationDetail[];
    isExpanded: boolean; // Pour gérer l'état déplié/replié de la séquence
}

interface ChapterData {
    id: number;
    titre_chapitre: string;
    objectifs_generaux?: string; // Ajouté au chapitre pour la maquette
    sequences: SequenceData[];
}

// 📄 COMPOSANT PRINCIPAL
const ChapterPlanningPage: React.FC = () => {
    const navigate = useNavigate();
    const { chapitreId } = useParams<{ chapitreId: string }>(); // Récupère l'ID du chapitre depuis l'URL
    const currentChapitreId = chapitreId ? parseInt(chapitreId, 10) : 1; // Utilise 1 par défaut si non défini

    const [chapter, setChapter] = useState<ChapterData | null>(null);
    const [loading, setLoading] = useState(true);

    // 🔄 RÉCUPÉRATION DE LA FICHE PÉDAGOGIQUE COMPLÈTE
    useEffect(() => {
        const fetchChapterPlanning = async () => {
            setLoading(true);
            try {
                // 1. Récupérer les détails du chapitre
                const { data: chapterData, error: chapterError } = await supabase
                    .from('chapitres')
                    .select('id, titre_chapitre, objectifs_generaux') // Assurez-vous que 'objectifs_generaux' existe
                    .eq('id', currentChapitreId)
                    .single();

                if (chapterError || !chapterData) {
                    console.error("Erreur récupération chapitre:", chapterError);
                    toast.error(`Échec du chargement du chapitre : ${chapterError?.message || "Non trouvé."}`);
                    setLoading(false);
                    return;
                }

                // 2. Récupérer les séquences liées à ce chapitre
                const { data: sequencesData, error: sequencesError } = await supabase
                    .from('sequences')
                    .select(`
                        id,
                        titre_sequence,
                        objectif_global,
                        description,
                        duree_estimee,
                        statut,
                        ordre_dans_chapitre
                    `)
                    .eq('chapitre_id', currentChapitreId)
                    .order('ordre_dans_chapitre', { ascending: true }); // Trier les séquences

                if (sequencesError) {
                    console.error("Erreur récupération séquences:", sequencesError);
                    toast.error(`Échec du chargement des séquences : ${sequencesError.message}`);
                    setLoading(false);
                    return;
                }

                const sequencesWithDetails: SequenceData[] = await Promise.all(
                    (sequencesData || []).map(async (seq: any) => {
                        // 3. Récupérer les activités pour chaque séquence
                        const { data: sequenceActivites, error: activitesError } = await supabase
                            .from('sequence_activité')
                            .select(`
                                ordre,
                                activite:activite_id (
                                    id,
                                    titre_activite,
                                    description,
                                    duree_minutes,
                                    type_activite, -- Assurez-vous que cette colonne existe
                                    objectif_activite -- Assurez-vous que cette colonne existe
                                )
                            `)
                            .eq('sequence_id', seq.id)
                            .order('ordre', { ascending: true });

                        if (activitesError) {
                            console.error("Erreur récupération activités de séquence:", activitesError);
                        }

                        // 4. Récupérer les évaluations pour chaque séquence
                        const { data: sequenceEvaluations, error: evaluationsError } = await supabase
                            .from('sequence_evaluation')
                            .select(`
                                ordre,
                                evaluation:evaluation_id (
                                    id,
                                    titre_evaluation,
                                    type_evaluation,
                                    grille_correction -- Utilisé comme critère_evaluation
                                )
                            `)
                            .eq('sequence_id', seq.id)
                            .order('ordre', { ascending: true });

                        if (evaluationsError) {
                            console.error("Erreur récupération évaluations de séquence:", evaluationsError);
                        }

                        const activities = (sequenceActivites || [])
                            .filter(sa => sa.activite !== null) // Filtrer les activités nulles si la jointure échoue
                            .map(sa => ({
                                id: sa.activite.id,
                                titre_activite: sa.activite.titre_activite,
                                description: sa.activite.description,
                                duree_minutes: sa.activite.duree_minutes,
                                type_activite: sa.activite.type_activite,
                                objectif_activite: sa.activite.objectif_activite,
                            }));

                        const evaluations = (sequenceEvaluations || [])
                            .filter(se => se.evaluation !== null) // Filtrer les évaluations nulles
                            .map(se => ({
                                id: se.evaluation.id,
                                titre_evaluation: se.evaluation.titre_evaluation,
                                type_evaluation: se.evaluation.type_evaluation,
                                critere_evaluation: se.evaluation.grille_correction,
                            }));

                        return {
                            ...seq,
                            activites,
                            evaluations,
                            isExpanded: true, // Toutes les séquences sont ouvertes par défaut
                        };
                    })
                );

                setChapter({
                    id: chapterData.id,
                    titre_chapitre: chapterData.titre_chapitre,
                    objectifs_generaux: chapterData.objectifs_generaux,
                    sequences: sequencesWithDetails,
                });

            } catch (fetchError: any) {
                console.error("Erreur globale lors du chargement de la planification:", fetchError);
                toast.error(`Erreur inattendue : ${fetchError.message || "Impossible de charger la fiche."}`);
            } finally {
                setLoading(false);
            }
        };

        fetchChapterPlanning();
    }, [currentChapitreId]); // Recharger si l'ID du chapitre change

    // ➡️ Fonctions de gestion de la Fiche Pédagogique (Chapitre)
    const handleUpdateChapter = async (field: 'titre_chapitre' | 'objectifs_generaux', value: string) => {
        if (!chapter) return;
        const { error } = await supabase
            .from('chapitres')
            .update({ [field]: value })
            .eq('id', chapter.id);

        if (error) {
            toast.error(`Échec de la mise à jour du chapitre : ${error.message}`);
        } else {
            setChapter(prev => prev ? { ...prev, [field]: value } : null);
            toast.success("Chapitre mis à jour !");
        }
    };

    // ➡️ Fonctions de gestion des Séquences
    const handleAddSequence = async () => {
        if (!chapter) return;
        const titre = prompt("Titre de la nouvelle séquence :");
        if (!titre) return;

        const newSequence = {
            chapitre_id: chapter.id,
            titre_sequence: titre,
            ordre_dans_chapitre: (chapter.sequences.length > 0 ? Math.max(...chapter.sequences.map(s => s.ordre_dans_chapitre || 0)) : -1) + 1,
            objectif_global: "Objectif global par défaut",
            statut: "brouillon"
        };

        const { data, error } = await supabase
            .from('sequences')
            .insert(newSequence)
            .select()
            .single();

        if (error) {
            toast.error(`Échec ajout séquence : ${error.message}`);
        } else {
            setChapter(prev => prev ? {
                ...prev,
                sequences: [...prev.sequences, { ...data, activites: [], evaluations: [], isExpanded: true }]
            } : null);
            toast.success("Séquence ajoutée !");
        }
    };

    const handleUpdateSequence = async (sequenceId: number) => {
        const sequenceToUpdate = chapter?.sequences.find(s => s.id === sequenceId);
        if (!sequenceToUpdate) return;

        const nouveauTitre = prompt("Nouveau titre de la séquence :", sequenceToUpdate.titre_sequence);
        const nouvelObjectif = prompt("Nouvel objectif global :", sequenceToUpdate.objectif_global);
        const nouvelleDuree = prompt("Nouvelle durée estimée (min) :", sequenceToUpdate.duree_estimee?.toString());
        const nouveauStatut = prompt("Nouveau statut (brouillon, publié, etc.) :", sequenceToUpdate.statut);

        if (nouveauTitre === null && nouvelObjectif === null && nouvelleDuree === null && nouveauStatut === null) return; // Annulé

        const updates: { [key: string]: any } = {};
        if (nouveauTitre !== null) updates.titre_sequence = nouveauTitre;
        if (nouvelObjectif !== null) updates.objectif_global = nouvelObjectif;
        if (nouvelleDuree !== null) updates.duree_estimee = parseInt(nouvelleDuree, 10) || 0;
        if (nouveauStatut !== null) updates.statut = nouveauStatut;


        const { error } = await supabase
            .from('sequences')
            .update(updates)
            .eq('id', sequenceId);

        if (error) {
            toast.error(`Échec modification séquence : ${error.message}`);
        } else {
            setChapter(prev => prev ? {
                ...prev,
                sequences: prev.sequences.map(s => s.id === sequenceId ? { ...s, ...updates } : s)
            } : null);
            toast.success("Séquence modifiée !");
        }
    };

    const handleDeleteSequence = async (sequenceId: number) => {
        if (!confirm("Voulez-vous vraiment supprimer cette séquence et tout son contenu lié ?")) return;

        const { error } = await supabase
            .from('sequences')
            .delete()
            .eq('id', sequenceId);

        if (error) {
            toast.error(`Échec suppression séquence : ${error.message}`);
        } else {
            setChapter(prev => prev ? {
                ...prev,
                sequences: prev.sequences.filter(s => s.id !== sequenceId)
            } : null);
            toast.success("Séquence supprimée !");
        }
    };

    const toggleSequenceExpand = (sequenceId: number) => {
        setChapter(prev => prev ? {
            ...prev,
            sequences: prev.sequences.map(s =>
                s.id === sequenceId ? { ...s, isExpanded: !s.isExpanded } : s
            )
        } : null);
    };

    // ➡️ Fonctions de gestion des Activités
    const handleAddActivity = async (sequenceId: number) => {
        const titre = prompt("Titre de la nouvelle activité :");
        if (!titre) return;
        const type = prompt("Type de l'activité (ex: déclenchement, apprentissage) :");
        const objectif = prompt("Objectif de l'activité :");
        const duree = prompt("Durée estimée de l'activité (min) :");

        const newActivity = {
            titre_activite: titre,
            description: "Description par défaut",
            type_activite: type || "apprentissage",
            objectif_activite: objectif || "Objectif par défaut",
            duree_minutes: parseInt(duree || '0', 10)
        };

        // 1. Insérer la nouvelle activité dans la table 'activites'
        const { data: insertedActivity, error: activityError } = await supabase
            .from('activites')
            .insert(newActivity)
            .select()
            .single();

        if (activityError || !insertedActivity) {
            toast.error(`Échec ajout activité : ${activityError?.message}`);
            return;
        }

        // 2. Lier l'activité à la séquence via la table 'sequence_activité'
        const { error: linkError } = await supabase
            .from('sequence_activité')
            .insert({ sequence_id: sequenceId, activite_id: insertedActivity.id, ordre: 0 }); // ordre simple pour l'instant

        if (linkError) {
            toast.error(`Échec liaison activité/séquence : ${linkError.message}`);
            // Optionnel: supprimer l'activité si la liaison échoue
            await supabase.from('activites').delete().eq('id', insertedActivity.id);
            return;
        }

        setChapter(prev => prev ? {
            ...prev,
            sequences: prev.sequences.map(seq =>
                seq.id === sequenceId
                    ? { ...seq, activites: [...seq.activites, insertedActivity] }
                    : seq
            )
        } : null);
        toast.success("Activité ajoutée !");
    };

    const handleDeleteActivity = async (sequenceId: number, activityId: number) => {
        if (!confirm("Voulez-vous vraiment supprimer cette activité ?")) return;

        // Supprimer d'abord la liaison dans sequence_activité
        const { error: linkError } = await supabase
            .from('sequence_activité')
            .delete()
            .eq('sequence_id', sequenceId)
            .eq('activite_id', activityId);

        if (linkError) {
            toast.error(`Échec suppression liaison activité : ${linkError.message}`);
            return;
        }

        // Ensuite, supprimer l'activité elle-même
        const { error: activityError } = await supabase
            .from('activites')
            .delete()
            .eq('id', activityId);

        if (activityError) {
            toast.error(`Échec suppression activité : ${activityError.message}`);
            return;
        }

        setChapter(prev => prev ? {
            ...prev,
            sequences: prev.sequences.map(seq =>
                seq.id === sequenceId
                    ? { ...seq, activites: seq.activites.filter(act => act.id !== activityId) }
                    : seq
            )
        } : null);
        toast.success("Activité supprimée !");
    };

    // ➡️ Fonctions de gestion des Évaluations
    const handleAddEvaluation = async (sequenceId: number) => {
        const titre = prompt("Titre de la nouvelle évaluation :");
        if (!titre) return;
        const type = prompt("Type de l'évaluation (ex: diagnostique, sommative) :");
        const criteres = prompt("Critères d'évaluation :");

        const newEvaluation = {
            titre_evaluation: titre,
            type_evaluation: type || "diagnostique",
            grille_correction: criteres || "Critères par défaut"
        };

        // 1. Insérer la nouvelle évaluation dans la table 'evaluation'
        const { data: insertedEvaluation, error: evaluationError } = await supabase
            .from('evaluation') // Nom de la table est 'evaluation', pas 'evaluations'
            .insert(newEvaluation)
            .select()
            .single();

        if (evaluationError || !insertedEvaluation) {
            toast.error(`Échec ajout évaluation : ${evaluationError?.message}`);
            return;
        }

        // 2. Lier l'évaluation à la séquence via la table 'sequence_evaluation'
        const { error: linkError } = await supabase
            .from('sequence_evaluation')
            .insert({ sequence_id: sequenceId, evaluation_id: insertedEvaluation.id, ordre: 0 }); // ordre simple pour l'instant

        if (linkError) {
            toast.error(`Échec liaison évaluation/séquence : ${linkError.message}`);
            await supabase.from('evaluation').delete().eq('id', insertedEvaluation.id);
            return;
        }

        setChapter(prev => prev ? {
            ...prev,
            sequences: prev.sequences.map(seq =>
                seq.id === sequenceId
                    ? { ...seq, evaluations: [...seq.evaluations, { ...insertedEvaluation, critere_evaluation: insertedEvaluation.grille_correction }] }
                    : seq
            )
        } : null);
        toast.success("Évaluation ajoutée !");
    };

    const handleDeleteEvaluation = async (sequenceId: number, evaluationId: number) => {
        if (!confirm("Voulez-vous vraiment supprimer cette évaluation ?")) return;

        // Supprimer d'abord la liaison dans sequence_evaluation
        const { error: linkError } = await supabase
            .from('sequence_evaluation')
            .delete()
            .eq('sequence_id', sequenceId)
            .eq('evaluation_id', evaluationId);

        if (linkError) {
            toast.error(`Échec suppression liaison évaluation : ${linkError.message}`);
            return;
        }

        // Ensuite, supprimer l'évaluation elle-même
        const { error: evaluationError } = await supabase
            .from('evaluation')
            .delete()
            .eq('id', evaluationId);

        if (evaluationError) {
            toast.error(`Échec suppression évaluation : ${evaluationError.message}`);
            return;
        }

        setChapter(prev => prev ? {
            ...prev,
            sequences: prev.sequences.map(seq =>
                seq.id === sequenceId
                    ? { ...seq, evaluations: seq.evaluations.filter(evalItem => evalItem.id !== evaluationId) }
                    : seq
            )
        } : null);
        toast.success("Évaluation supprimée !");
    };


    if (loading) {
        return (
            <section className="p-6 text-center text-gray-600">
                Chargement de la fiche pédagogique...
            </section>
        );
    }

    if (!chapter) {
        return (
            <section className="p-6 text-center text-red-600">
                Impossible de charger la fiche pédagogique. Vérifiez l'ID du chapitre et la configuration Supabase.
                <Button onClick={() => navigate("/planipeda")} className="mt-4">
                    ← Retour à la planification
                </Button>
            </section>
        );
    }

    // 🖼️ RENDU DE LA PAGE
    return (
        <section className="p-6 space-y-8 bg-gray-100 min-h-screen font-inter">
            {/* ✅ EN-TÊTE ET TITRE DU CHAPITRE */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
                <Button variant="outline" onClick={() => navigate("/planipeda")}>
                    ← Retour
                </Button>
                <h1 className="text-3xl font-extrabold text-blue-800">Fiche pédagogique du chapitre</h1>
                <div className="w-24"></div> {/* Pour aligner le titre au centre */}
            </div>

            {/* 📋 DÉTAILS DU CHAPITRE */}
            <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Titre du chapitre :</label>
                    <input
                        type="text"
                        value={chapter.titre_chapitre}
                        onChange={(e) => setChapter(prev => prev ? { ...prev, titre_chapitre: e.target.value } : null)}
                        onBlur={(e) => handleUpdateChapter('titre_chapitre', e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Objectifs généraux :</label>
                    <textarea
                        value={chapter.objectifs_generaux || ''}
                        onChange={(e) => setChapter(prev => prev ? { ...prev, objectifs_generaux: e.target.value } : null)}
                        onBlur={(e) => handleUpdateChapter('objectifs_generaux', e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                    />
                </div>
            </div>

            {/* ➕ BOUTON AJOUTER SÉQUENCE */}
            <div className="flex justify-center mt-6">
                <Button onClick={handleAddSequence} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200">
                    <Plus className="mr-2 h-5 w-5" /> Ajouter Séquence
                </Button>
            </div>

            {/* 📚 LISTE DES SÉQUENCES */}
            <div className="space-y-6">
                {chapter.sequences.length === 0 ? (
                    <p className="text-center text-gray-500 italic mt-8">Aucune séquence pour ce chapitre.</p>
                ) : (
                    chapter.sequences.map((seq) => (
                        <div key={seq.id} className="bg-white p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2
                                    className="text-xl font-semibold text-blue-700 cursor-pointer flex items-center"
                                    onClick={() => toggleSequenceExpand(seq.id)}
                                >
                                    {seq.isExpanded ? <ChevronDown className="mr-2 h-5 w-5" /> : <ChevronRight className="mr-2 h-5 w-5" />}
                                    Séquence {seq.ordre_dans_chapitre !== undefined ? seq.ordre_dans_chapitre + 1 : ''} : {seq.titre_sequence}
                                </h2>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUpdateSequence(seq.id)}
                                        className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                                        title="Modifier la séquence"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteSequence(seq.id)}
                                        className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white transition-colors"
                                        title="Supprimer la séquence"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {seq.isExpanded && (
                                <div className="ml-8 space-y-4 border-l-2 border-gray-200 pl-4">
                                    <p className="text-gray-700">**Objectif Global :** {seq.objectif_global}</p>
                                    <p className="text-gray-700">**Durée Estimée :** {seq.duree_estimee} min</p>
                                    <p className="text-gray-700">**Statut :** {seq.statut}</p>

                                    <div className="flex space-x-4 mt-4">
                                        <Button
                                            onClick={() => handleAddActivity(seq.id)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition duration-200"
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> Ajouter Activité
                                        </Button>
                                        <Button
                                            onClick={() => handleAddEvaluation(seq.id)}
                                            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md text-sm transition duration-200"
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> Ajouter Évaluation
                                        </Button>
                                    </div>

                                    {/* Liste des Activités */}
                                    <div className="mt-6 space-y-3">
                                        <h3 className="text-lg font-bold text-gray-800">Activités :</h3>
                                        {seq.activites.length === 0 ? (
                                            <p className="text-gray-500 italic text-sm">Aucune activité dans cette séquence.</p>
                                        ) : (
                                            seq.activites.map((act) => (
                                                <div key={act.id} className="bg-gray-50 p-4 rounded-md border border-gray-200 flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">◦ Activité : {act.titre_activite} (type : {act.type_activite})</p>
                                                        <p className="text-sm text-gray-700 ml-4">Objectif : {act.objectif_activite}</p>
                                                        <p className="text-sm text-gray-700 ml-4">Durée : {act.duree_minutes} min</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteActivity(seq.id, act.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="Supprimer l'activité"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Liste des Évaluations */}
                                    <div className="mt-6 space-y-3">
                                        <h3 className="text-lg font-bold text-gray-800">Évaluations :</h3>
                                        {seq.evaluations.length === 0 ? (
                                            <p className="text-gray-500 italic text-sm">Aucune évaluation dans cette séquence.</p>
                                        ) : (
                                            seq.evaluations.map((evalItem) => (
                                                <div key={evalItem.id} className="bg-gray-50 p-4 rounded-md border border-gray-200 flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">◦ Évaluation : {evalItem.titre_evaluation}</p>
                                                        <p className="text-sm text-gray-700 ml-4">Type : {evalItem.type_evaluation}</p>
                                                        <p className="text-sm text-gray-700 ml-4">Critères : {evalItem.critere_evaluation}</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteEvaluation(seq.id, evalItem.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="Supprimer l'évaluation"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default CreateFichePage;
