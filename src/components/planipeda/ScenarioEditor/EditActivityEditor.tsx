// 🌐 Chemin : src/components/activities/EditActivityEditor.tsx

// 📄 Composant de modification d'une activité d'apprentissage

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/backend/config/supabase";
import { ActivityData } from "@/types/activity"; // Utilisation de l'interface partagée
import CreateActivityEditor from "@/components/planipeda/ScenarioEditor/CreateActivityEditor"; // Import du formulaire générique

interface EditActivityEditorProps {
    activityId: number;
    onSaved?: () => void; // Callback appelé après sauvegarde réussie
    onCancel?: () => void; // Callback appelé lors de l'annulation
}

const EditActivityEditor: React.FC<EditActivityEditorProps> = ({
    activityId,
    onSaved,
    onCancel
}) => {
    const navigate = useNavigate();

    // 🔄 États de chargement et de feedback
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 📝 État de l'activité, initialisé comme une activité vide (ou avec des valeurs null)
    // Nous utiliserons cet objet pour stocker toutes les données du formulaire
    const [activityData, setActivityData] = useState<ActivityData>({
        chapitre_id: null,
        titre_activite: "",
        description: null,
        role_enseignant: null,
        materiel: null,
        duree_minutes: null,
        modalite_deroulement: null,
        modalite_evaluation: null,
        commentaires: null,
        ressource_urls: [], // Initialisé comme un tableau vide pour les URLs
        niveau_id: null,
        option_id: null,
        unite_id: null,
        objectifs: [], // Initialisé comme un tableau vide pour les IDs d'objectifs
    });

    // NOUVEAU: États pour stocker les noms des niveaux, options, unités et chapitres pour l'affichage
    const [niveauOption, setNiveauOption] = useState<{ niveau: string; option: string } | null>(null);
    const [uniteChapitre, setUniteChapitre] = useState<{ unite: string; chapitre: string } | null>(null);

    // 📦 Chargement de l’activité existante
    useEffect(() => {
        if (!activityId) {
            setError("ID de l'activité manquant pour l'édition.");
            setLoading(false);
            return;
        }

        const fetchActivity = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase
                    .from("activites")
                    .select(
                        `
                        id,
                        created_at,
                        updated_at,
                        titre_activite,
                        description,
                        role_enseignant,
                        materiel,
                        duree_minutes,
                        modalite_deroulement,
                        modalite_evaluation,
                        commentaires,
                        ressource_urls,
                        chapitre:chapitre_id (
                            id,
                            titre_chapitre,
                            unite:unite_id (
                                id,
                                titre_unite,
                                option:option_id (
                                    id,
                                    nom_option,
                                    niveau:niveau_id (
                                        id,
                                        nom_niveau
                                    )
                                )
                            )
                        ),
                        activite_objectifs (
                            objectif_id
                        )
                        `
                    )
                    .eq("id", activityId)
                    .maybeSingle();

                if (fetchError || !data) {
                    throw fetchError ?? new Error("Activité introuvable ou erreur de chargement.");
                }

                // Construction de l'objet ActivityData à partir des données chargées
                setActivityData({
                    id: data.id,
                    created_at: data.created_at,
                    updated_at: data.updated_at,
                    chapitre_id: data.chapitre?.id || null,
                    titre_activite: data.titre_activite || "",
                    description: data.description,
                    role_enseignant: data.role_enseignant,
                    materiel: data.materiel,
                    duree_minutes: data.duree_minutes,
                    modalite_deroulement: data.modalite_deroulement,
                    modalite_evaluation: data.modalite_evaluation,
                    commentaires: data.commentaires,
                    ressource_urls: data.ressource_urls || [], // S'assurer que c'est un tableau
                    niveau_id: data.chapitre?.unite?.option?.niveau?.id || null,
                    option_id: data.chapitre?.unite?.option?.id || null,
                    unite_id: data.chapitre?.unite?.id || null,
                    objectifs: data.activite_objectifs?.map((o: any) => o.objectif_id) || [], // S'assurer que c'est un tableau
                });

                // NOUVEAU: Mettre à jour les états pour l'affichage de la position
                if (data.chapitre?.unite?.option?.niveau && data.chapitre?.unite?.option) {
                    setNiveauOption({
                        niveau: data.chapitre.unite.option.niveau.nom_niveau,
                        option: data.chapitre.unite.option.nom_option,
                    });
                } else {
                    setNiveauOption(null);
                }

                if (data.chapitre?.unite && data.chapitre) {
                    setUniteChapitre({
                        unite: data.chapitre.unite.titre_unite,
                        chapitre: data.chapitre.titre_chapitre,
                    });
                } else {
                    setUniteChapitre(null);
                }


            } catch (err: any) {
                console.error("Erreur de chargement de l'activité:", err);
                setError("Erreur de chargement : " + (err.message ?? "inconnue"));
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [activityId]);

    // Gestionnaire de mise à jour des champs (passé au CreateActivityEditor)
    const handleUpdateActivityData = (updatedFields: Partial<ActivityData>) => {
        setActivityData(prevData => ({ ...prevData, ...updatedFields }));
    };

    // 💾 Sauvegarde des données (mise à jour)
    const handleSave = async () => {
        setError(null);
        setSuccessMessage(null);

        if (!activityData.chapitre_id) {
            setError("Veuillez sélectionner un chapitre.");
            return;
        }
        if (activityData.objectifs.length === 0) {
            setError("Veuillez sélectionner au moins un objectif.");
            return;
        }
        if (!activityData.titre_activite) {
            setError("Le titre de l'activité est obligatoire.");
            return;
        }

        setSaving(true);
        try {
            const { id, niveau_id, option_id, unite_id, objectifs, created_at, updated_at, ...fieldsToUpdate } = activityData;

            const finalFieldsToUpdate = {
                ...fieldsToUpdate,
                updated_at: new Date().toISOString()
            };

            const { error: updateActivityError } = await supabase
                .from("activites")
                .update(finalFieldsToUpdate)
                .eq("id", activityId);

            if (updateActivityError) throw updateActivityError;

            const { error: deleteObjectivesError } = await supabase
                .from("activite_objectifs")
                .delete()
                .eq("activite_id", activityId);
            if (deleteObjectivesError) throw deleteObjectivesError;

            if (activityData.objectifs && activityData.objectifs.length > 0) {
                const insertData = activityData.objectifs.map((objId) => ({
                    activite_id: activityId,
                    objectif_id: objId,
                }));
                const { error: insertObjectivesError } = await supabase
                    .from("activite_objectifs")
                    .insert(insertData);
                if (insertObjectivesError) throw insertObjectivesError;
            }

            setSuccessMessage("Activité mise à jour avec succès.");
            if (onSaved) {
                onSaved();
            }

        } catch (err: any) {
            console.error("Erreur lors de la sauvegarde de l'activité:", err);
            setError("Erreur de sauvegarde : " + (err.message || "inconnue"));
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        if (onCancel) {
            onCancel();
        } else {
            navigate(-1);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-xl font-semibold text-gray-700">Chargement de l'activité...</p>
            </div>
        );
    }

    if (error && !loading) {
        return (
            <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-xl text-center">
                <p className="text-red-600 text-lg mb-4">{error}</p>
                <button
                    onClick={handleBack}
                    className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Retour
                </button>
            </div>
        );
    }

    return (
        <>
            <section className="max-w-3xl mx-auto p-6 bg-pink-50 rounded-lg shadow-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">📍 Position de l’activité</h3>
                {niveauOption && (
                    <p className="mb-1 text-gray-700 font-medium">
                        <span className="italic">Niveau & Option : </span>
                        {niveauOption.niveau} - {niveauOption.option}
                    </p>
                )}
                {uniteChapitre && (
                    <p className="mb-1 text-gray-700 font-medium">
                        <span className="italic">Unité & Chapitre : </span>
                        {uniteChapitre.unite} - {uniteChapitre.chapitre}
                    </p>
                )}
                {!niveauOption && !uniteChapitre && (
                    <p className="text-gray-500 italic">Informations de position non disponibles.</p>
                )}
            </section>

            <CreateActivityEditor
                initialData={activityData}
                onUpdate={handleUpdateActivityData}
                onSaveTrigger={handleSave}
                onCancel={handleBack}
                saving={saving}
                error={error}
                successMessage={successMessage}
            />
        </>
    );
};

export default EditActivityEditor;
