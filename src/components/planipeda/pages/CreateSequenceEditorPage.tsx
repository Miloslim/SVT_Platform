// src/components/planipeda/pages/CreateSequenceEditorPage.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CreateSequenceEditor from "@/components/planipeda/ScenarioEditor/CreateSequenceEditor";
import { supabase } from "@/backend/config/supabase"; // Import de Supabase

import { toast } from "sonner"; // Import pour les notifications

// Interfaces pour les données de sélection de la hiérarchie pédagogique
interface Niveau { id: number; nom_niveau: string; }
interface Option { id: number; nom_option: string; niveau_id: number; }
interface Unite { id: number; titre_unite: string; option_id: number; }
interface Chapitre { id: number; titre_chapitre: string; unite_id: number; }


const CreateSequenceEditorPage: React.FC = () => {
    const navigate = useNavigate();

    // États pour les données de sélection des niveaux, options, unités et chapitres
    const [niveaux, setNiveaux] = useState<Niveau[]>([]);
    const [options, setOptions] = useState<Option[]>([]);
    const [unites, setUnites] = useState<Unite[]>([]);
    const [chapitres, setChapitres] = useState<Chapitre[]>([]);

    // États pour les IDs des éléments sélectionnés dans la hiérarchie
    const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(null);
    const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
    const [selectedUniteId, setSelectedUniteId] = useState<number | null>(null);
    const [selectedChapitreId, setSelectedChapitreId] = useState<number | null>(null);

    // États pour gérer le chargement des données des filtres
    const [isLoadingFilters, setIsLoadingFilters] = useState(true);
    const [loadErrorFilters, setLoadErrorFilters] = useState<string | null>(null);


    // Les callbacks pour la création et l'annulation de la séquence
    const handleSequenceCompleted = useCallback(() => {
        navigate("/planipeda/sequences"); // Redirige vers la page de liste des séquences
    }, [navigate]);

    /**
     * Effet au montage du composant pour charger toutes les données nécessaires aux sélecteurs
     * (niveaux, options, unités, chapitres) depuis Supabase.
     * Gère les états de chargement et les erreurs potentielles.
     */
    useEffect(() => {
        const fetchFilterData = async () => {
            setIsLoadingFilters(true);
            setLoadErrorFilters(null);
            try {
                // Exécution parallèle des requêtes pour optimiser le chargement
                const [{ data: niveauxData, error: niveauxError }, { data: optionsData, error: optionsError }, { data: unitesData, error: unitesError }, { data: chapitresData, error: chapitresError }] =
                    await Promise.all([
                        supabase.from("niveaux").select("*"),
                        supabase.from("options").select("*"),
                        supabase.from("unites").select("*"),
                        supabase.from("chapitres").select("*"),
                    ]);

                // Gestion des erreurs pour chaque requête
                if (niveauxError) throw new Error(`Erreur Niveaux: ${niveauxError.message}`);
                if (optionsError) throw new Error(`Erreur Options: ${optionsError.message}`);
                if (unitesError) throw new Error(`Erreur Unités: ${unitesError.message}`);
                if (chapitresError) throw new Error(`Erreur Chapitres: ${chapitresError.message}`);

                // Mise à jour des états avec les données récupérées
                setNiveaux(niveauxData || []);
                setOptions(optionsData || []);
                setUnites(unitesData || []);
                setChapitres(chapitresData || []);

            } catch (error: any) {
                // Affichage d'un message d'erreur si le chargement échoue
                setLoadErrorFilters(error.message || "Impossible de charger les données des filtres.");
                toast.error(`Erreur de chargement des filtres: ${error.message || "Vérifiez votre connexion ou la configuration de Supabase."}`);
            } finally {
                // Fin du chargement, quel que soit le résultat
                setIsLoadingFilters(false);
            }
        };
        fetchFilterData();
    }, []); // Le tableau de dépendances vide assure que cet effet ne s'exécute qu'une seule fois au montage

    /**
     * Gère le changement de sélection pour les niveaux.
     * Réinitialise les sélections des options, unités et chapitres.
     * @param value L'ID du niveau sélectionné (en chaîne de caractères).
     */
    const handleNiveauChange = useCallback((value: string) => {
        const id = Number(value);
        setSelectedNiveauId(id);
        setSelectedOptionId(null);
        setSelectedUniteId(null);
        setSelectedChapitreId(null);
    }, []);

    /**
     * Gère le changement de sélection pour les options.
     * Réinitialise les sélections des unités et chapitres.
     * @param value L'ID de l'option sélectionnée (en chaîne de caractères).
     */
    const handleOptionChange = useCallback((value: string) => {
        const id = Number(value);
        setSelectedOptionId(id);
        setSelectedUniteId(null);
        setSelectedChapitreId(null);
    }, []);

    /**
     * Gère le changement de sélection pour les unités.
     * Réinitialise la sélection du chapitre.
     * @param value L'ID de l'unité sélectionnée (en chaîne de caractères).
     */
    const handleUniteChange = useCallback((value: string) => {
        const id = Number(value);
        setSelectedUniteId(id);
        setSelectedChapitreId(null);
    }, []);

    /**
     * Gère le changement de sélection pour les chapitres.
     * Met à jour l'ID du chapitre sélectionné.
     * @param value L'ID du chapitre sélectionné (en chaîne de caractères).
     */
    const handleChapitreChange = useCallback((value: string) => {
        const id = Number(value);
        setSelectedChapitreId(id);
    }, []);


    // Affiche un message de chargement pendant la récupération des données initiales
    if (isLoadingFilters) {
        return (
            <section className="p-6 space-y-8 flex justify-center items-center h-screen">
                <p className="text-lg text-gray-600">Chargement des données du formulaire...</p>
            </section>
        );
    }

    // Affiche un message d'erreur si le chargement initial a échoué
    if (loadErrorFilters) {
        return (
            <section className="p-6 space-y-8 flex flex-col justify-center items-center h-screen text-red-600">
                <p className="text-lg">Erreur lors du chargement du formulaire :</p>
                <p className="text-sm">{loadErrorFilters}</p>
                <Button onClick={() => window.location.reload()} className="mt-4">Réessayer</Button>
            </section>
        );
    }

    return (
        <section className="p-6 space-y-8">
            <div className="flex justify-between items-center mb-6">
                <Button onClick={handleSequenceCompleted}>
                    ← Retour à la liste
                </Button>
                <h1 className="text-2xl font-bold text-center flex-grow">Créer une nouvelle séquence pédagogique</h1>
                <div style={{ width: '88px' }}></div> {/* Div vide pour centrer le titre */}
            </div>

            {/* Le composant CreateSequenceEditor est rendu ici avec les props de hiérarchie */}
            <CreateSequenceEditor
                onSequenceCreated={handleSequenceCompleted}
                onCancel={handleSequenceCompleted}
                niveaux={niveaux}
                options={options}
                unites={unites}
                chapitres={chapitres}
                selectedNiveauId={selectedNiveauId}
                selectedOptionId={selectedOptionId}
                selectedUniteId={selectedUniteId}
                selectedChapitreId={selectedChapitreId}
                onNiveauChange={handleNiveauChange}
                onOptionChange={handleOptionChange}
                onUniteChange={handleUniteChange}
                onChapitreChange={handleChapitreChange}
                isLoadingFilters={isLoadingFilters}
            />
        </section>
    );
};

export default CreateSequenceEditorPage;
