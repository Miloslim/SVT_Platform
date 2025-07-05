// Nom du fichier: ActivityChooserModal.tsx
// Chemin: src/components/planipeda/ScenarioEditor/ActivityChooserModal.tsx

// Fonctionnalités:
// Ce composant sert de "hub" ou de "gestionnaire" pour l'ajout d'activités à une séquence.
// Il permet à l'utilisateur de choisir entre deux modes:
// 1. Créer une nouvelle activité: Affiche le formulaire CreateInsertActivityEditor.
// 2. Sélectionner une activité existante: Affiche le composant ActivitySelector (pour la recherche et la sélection).
// Il gère la logique de sauvegarde des nouvelles activités vers Supabase et transmet
// les activités choisies (nouvelles ou existantes) à son composant parent (CreateSequenceEditor),
// incluant désormais plus de détails (description, objectifs).

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import CreateInsertActivityEditor from './CreateInsertActivityEditor';
import ActivitySelector from './ActivitySelector';
import { supabase } from '@/backend/config/supabase';
import { ActivityData } from '@/types/activity'; // Assurez-vous que ce type est correctement défini

// Interface pour les données des objectifs (utilisée pour la récupération des descriptions)
interface ObjectiveDescription {
    id: number;
    description_objectif: string;
}

// --- NOUVELLE INTERFACE POUR LES DONNÉES D'ACTIVITÉ À PASSER AU PARENT ---
// Cette interface reflète les propriétés nécessaires pour créer un SequenceItem pour une activité
export interface ActivityForSequence {
    id: number;
    titre_activite: string;
    description?: string | null;
    objectifs?: string[]; // Descriptions des objectifs
    // Ajoutez ici toute autre propriété de l'activité que SequenceForm.tsx pourrait avoir besoin
    role_enseignant?: string | null;
    modalite_deroulement?: string | null;
    materiel?: string | null;
    duree_minutes?: number | null;
    modalite_evaluation?: string | null;
    commentaires?: string | null;
    ressource_urls?: string[] | null;
}

interface ActivityChooserModalProps {
    // MODIFIÉ : onActivityAdded passe désormais un objet ActivityForSequence
    onActivityAdded: (activityData: ActivityForSequence) => void;
    onClose: () => void;
    chapitreId?: number | null;
    niveauId?: number | null;
    optionId?: number | null;
    uniteId?: number | null;
}

const ActivityChooserModal: React.FC<ActivityChooserModalProps> = ({
    onActivityAdded,
    onClose,
    chapitreId,
    niveauId,
    optionId,
    uniteId
}) => {
    const [currentView, setCurrentView] = useState<'create' | 'select'>('create');

    const [newActivityData, setNewActivityData] = useState<Partial<ActivityData>>({
        titre_activite: '',
        description: "",
        role_enseignant: "",
        modalite_deroulement: "",
        materiel: "",
        duree_minutes: null,
        modalite_evaluation: "",
        commentaires: "",
        ressource_urls: [],
        objectifs: [], // Cet état contient les IDs des objectifs
        niveau_id: niveauId,
        option_id: optionId,
        unite_id: uniteId,
        chapitre_id: chapitreId,
    });
    const [isSavingNewActivity, setIsSavingNewActivity] = useState(false);
    const [newActivityError, setNewActivityError] = useState<string | null>(null);
    const [newActivitySuccess, setNewActivitySuccess] = useState<string | null>(null);

    const handleNewActivityUpdate = useCallback((updatedFields: Partial<ActivityData>) => { // Added useCallback
        setNewActivityData(prev => ({ ...prev, ...updatedFields }));
        setNewActivityError(null);
        setNewActivitySuccess(null);
    }, []);

    const handleNewActivitySaveTrigger = async () => {
        setIsSavingNewActivity(true);
        setNewActivityError(null);
        setNewActivitySuccess(null);

        try {
            if (!newActivityData.chapitre_id) {
                throw new Error("Veuillez sélectionner un chapitre.");
            }
            if (!newActivityData.titre_activite || newActivityData.titre_activite.trim() === "") {
                throw new Error("Le titre de l’activité est obligatoire.");
            }
            if (!newActivityData.objectifs || newActivityData.objectifs.length === 0) {
                throw new Error("Veuillez sélectionner au moins un objectif.");
            }

            const dataToInsert = {
                chapitre_id: newActivityData.chapitre_id,
                titre_activite: newActivityData.titre_activite.trim(),
                description: newActivityData.description?.trim() || null,
                role_enseignant: newActivityData.role_enseignant?.trim() || null,
                materiel: newActivityData.materiel?.trim() || null,
                duree_minutes: newActivityData.duree_minutes,
                modalite_deroulement: newActivityData.modalite_deroulement?.trim() || null,
                modalite_evaluation: newActivityData.modalite_evaluation?.trim() || null,
                commentaires: newActivityData.commentaires?.trim() || null,
                ressource_urls: (newActivityData.ressource_urls && newActivityData.ressource_urls.length > 0)
                                     ? newActivityData.ressource_urls
                                     : null,
                created_at: new Date().toISOString(),
            };

            const { data: newActivityResult, error: insertError } = await supabase // Renamed newActivity to newActivityResult
                .from("activites")
                .insert(dataToInsert)
                .select(` // Select all fields relevant for ActivityForSequence
                    id,
                    titre_activite,
                    description,
                    role_enseignant,
                    modalite_deroulement,
                    materiel,
                    duree_minutes,
                    modalite_evaluation,
                    commentaires,
                    ressource_urls
                `)
                .single();

            if (insertError) {
                console.error("❌ Erreur Supabase lors de l'insertion de l'activité :", insertError);
                throw insertError;
            }
            if (!newActivityResult || !newActivityResult.id) {
                console.error("❌ Erreur : Aucune donnée ou ID non retourné après l'insertion de l'activité.");
                throw new Error("Erreur lors de la création de l'activité. ID non retourné.");
            }

            // Récupérer les descriptions des objectifs après la création de l'activité
            let objectiveDescriptions: string[] = [];
            if (newActivityData.objectifs && newActivityData.objectifs.length > 0) {
                const { data: objectivesData, error: objectivesError } = await supabase
                    .from('objectifs')
                    .select('description_objectif')
                    .in('id', newActivityData.objectifs);

                if (objectivesError) {
                    console.error("Erreur lors de la récupération des descriptions d'objectifs:", objectivesError);
                    // Ne pas bloquer la création de l'activité, mais noter l'erreur
                } else {
                    objectiveDescriptions = objectivesData?.map(obj => obj.description_objectif) || [];
                }
            }

            // 2. Insertion des liens vers les objectifs dans la table de jointure `activite_objectifs`
            if (newActivityData.objectifs && newActivityData.objectifs.length > 0) {
                const relations = newActivityData.objectifs.map((objectif_id) => ({
                    activite_id: newActivityResult.id, // Use newActivityResult.id
                    objectif_id: objectif_id,
                }));

                const { error: relError } = await supabase
                    .from("activite_objectifs")
                    .insert(relations);

                if (relError) {
                    console.error("❌ Erreur Supabase lors de l'insertion des liens objectifs :", relError);
                    throw relError;
                }
            }

            setNewActivitySuccess("Activité enregistrée avec succès !");

            // --- MODIFICATION CRUCIALE ICI : Passer un objet complet ---
            onActivityAdded({
                id: newActivityResult.id,
                titre_activite: newActivityResult.titre_activite,
                description: newActivityResult.description,
                objectifs: objectiveDescriptions,
                role_enseignant: newActivityResult.role_enseignant,
                modalite_deroulement: newActivityResult.modalite_deroulement,
                materiel: newActivityResult.materiel,
                duree_minutes: newActivityResult.duree_minutes,
                modalite_evaluation: newActivityResult.modalite_evaluation,
                commentaires: newActivityResult.commentaires,
                ressource_urls: newActivityResult.ressource_urls,
            });
            // --- FIN MODIFICATION ---

            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err: any) {
            console.error("🔥 Erreur globale lors de la sauvegarde de l’activité :", err);
            setNewActivityError(err.message || "Une erreur inconnue est survenue lors de l'enregistrement.");
        } finally {
            setIsSavingNewActivity(false);
        }
    };

    useEffect(() => {
        if (newActivitySuccess) {
            const timer = setTimeout(() => setNewActivitySuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [newActivitySuccess]);

    // MODIFIÉ : handleExistingActivitySelected accepte l'objet complet de l'activité
    // Si ActivitySelector renvoie des paramètres individuels, il faut les mapper ici.
    const handleExistingActivitySelected = useCallback(async ( // Added async
        activityId: number,
        activityTitle: string,
        description_from_selector: string,
        objectifs_from_selector: string[] // Assuming ActivitySelector *might* pass descriptions
    ) => {
        try {
            // Fetch full details of the selected activity, including related objectives descriptions
            const { data: activityDetails, error } = await supabase
                .from('activites')
                .select(`
                    id,
                    titre_activite,
                    description,
                    role_enseignant,
                    modalite_deroulement,
                    materiel,
                    duree_minutes,
                    modalite_evaluation,
                    commentaires,
                    ressource_urls,
                    activite_objectifs (
                        objectifs (
                            description_objectif
                        )
                    )
                `)
                .eq('id', activityId)
                .single();

            if (error) {
                console.error("Error fetching existing activity details:", error.message);
                // toast.error("Failed to load existing activity details."); // Use toast if you have it setup for this part
                return;
            }

            if (activityDetails) {
                const mappedObjectives = activityDetails.activite_objectifs
                    ? activityDetails.activite_objectifs.map(ao => ao.objectifs?.description_objectif).filter(Boolean) as string[]
                    : [];

                onActivityAdded({
                    id: activityDetails.id,
                    titre_activite: activityDetails.titre_activite,
                    description: activityDetails.description,
                    objectifs: mappedObjectives,
                    role_enseignant: activityDetails.role_enseignant,
                    modalite_deroulement: activityDetails.modalite_deroulement,
                    materiel: activityDetails.materiel,
                    duree_minutes: activityDetails.duree_minutes,
                    modalite_evaluation: activityDetails.modalite_evaluation,
                    commentaires: activityDetails.commentaires,
                    ressource_urls: activityDetails.ressource_urls,
                });
                onClose();
            } else {
                 // toast.error("Activité existante non trouvée."); // Use toast here
            }
        } catch (fetchError: any) {
            console.error("Error in handleExistingActivitySelected:", fetchError.message);
            // toast.error("Une erreur est survenue lors de la sélection de l'activité existante."); // Use toast here
        }
    }, [onActivityAdded, onClose]); // Dependencies for useCallback

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Ajouter une Activité</h2>

            <div className="flex justify-center gap-4 mb-6">
                <button
                    type="button"
                    className={`px-6 py-2 rounded-md transition-colors font-medium ${
                        currentView === 'create' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setCurrentView('create')}
                >
                    Créer une nouvelle activité
                </button>
                <button
                    type="button"
                    className={`px-6 py-2 rounded-md transition-colors font-medium ${
                        currentView === 'select' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setCurrentView('select')}
                >
                    Sélectionner une activité existante
                </button>
            </div>

            {currentView === 'create' && (
                <CreateInsertActivityEditor
                    initialData={newActivityData}
                    onUpdate={handleNewActivityUpdate}
                    onSaveTrigger={handleNewActivitySaveTrigger}
                    onCancel={onClose}
                    saving={isSavingNewActivity}
                    error={newActivityError}
                    successMessage={newActivitySuccess}
                    onSuccessRedirectPath={undefined}
                    niveauIdParent={niveauId}
                    optionIdParent={optionId}
                    uniteIdParent={uniteId}
                    chapitreIdParent={chapitreId}
                />
            )}

            {currentView === 'select' && (
                <ActivitySelector
                    onActivitySelected={handleExistingActivitySelected}
                    onCancel={onClose}
                    chapitreId={chapitreId}
                    niveauId={niveauId}
                    optionId={optionId}
                    uniteId={uniteId}
                />
            )}
        </div>
    );
};

export default ActivityChooserModal;