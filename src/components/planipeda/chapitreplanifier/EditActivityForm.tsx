// src/components/planipeda/ScenarioEditor/EditActivityForm.tsx

/**
 * Nom du Fichier: EditActivityForm.tsx
 * Chemin: src/components/planipeda/ScenarioEditor/EditActivityForm.tsx
 *
 * Fonctionnalités:
 * - Fournit un formulaire complet pour l'édition d'une activité maître.
 * - Est conçu pour être utilisé comme contenu dans une modale ou un conteneur parent.
 * - Gère le chargement initial des données de l'activité à éditer depuis Supabase.
 * - Gère la soumission des modifications (mise à jour de l'activité et de ses objectifs liés).
 * - Utilise `HierarchicalSelector` pour la sélection du contexte pédagogique (niveau, option, unité, chapitre, objectifs).
 * - Utilise `MultiFileUpload` pour la gestion des ressources associées.
 * - Affiche les messages de chargement, d'erreur et de succès.
 * - Communique les actions de sauvegarde et d'annulation via des callbacks à son parent.
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/backend/config/supabase";
import { ActivityData } from "@/types/activity"; // Interface pour les données de l'activité
import HierarchicalSelector from "@/components/planipeda/ScenarioEditor/HierarchicalSelector"; // Sélecteur hiérarchique
import MultiFileUpload from "@/components/planipeda/ScenarioEditor/MultiFileUpload"; // Composant d'upload de fichiers

// --- Sous-composant : LongTextField ---
interface LongTextFieldProps {
    label: string;
    id: string;
    value: string | null; // Peut être null pour les champs optionnels
    onChange: (val: string | null) => void;
    rows?: number;
    placeholder?: string;
}

const LongTextField: React.FC<LongTextFieldProps> = ({
    label,
    id,
    value,
    onChange,
    rows = 4,
    placeholder = "",
}) => (
    <div className="mb-5">
        <label htmlFor={id} className="block font-semibold mb-1 text-gray-700">
            {label}
        </label>
        <textarea
            id={id}
            rows={rows}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={value || ""} // Afficher une chaîne vide si null
            onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)} // Retourner null si chaîne vide
            placeholder={placeholder || `Entrez ${label.toLowerCase()}...`}
        />
    </div>
);

// --- Propriétés du composant EditActivityForm ---
interface EditActivityFormProps {
    activityId: number; // L'ID de l'activité maître à éditer
    onSaveSuccess: (updatedActivityId: number) => void; // Callback après succès de la sauvegarde
    onCancel: () => void; // Callback pour l'annulation
}

// ============================================================
// Composant principal : EditActivityForm
// ============================================================
const EditActivityForm: React.FC<EditActivityFormProps> = ({
    activityId,
    onSaveSuccess,
    onCancel,
}) => {
    // États pour le chargement et le feedback
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // État des données de l'activité
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
        ressource_urls: [],
        niveau_id: null,
        option_id: null,
        unite_id: null,
        objectifs: [],
    });

    // États pour l'affichage de la position (lecture seule)
    const [niveauOption, setNiveauOption] = useState<{ niveau: string; option: string } | null>(null);
    const [uniteChapitre, setUniteChapitre] = useState<{ unite: string; chapitre: string } | null>(null);

    // 📦 Chargement des données de l'activité existante au montage
    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase
                    .from("activites")
                    .select(
                        `
                        id, created_at, updated_at, titre_activite, description,
                        role_enseignant, materiel, duree_minutes, modalite_deroulement,
                        modalite_evaluation, commentaires, ressource_urls,
                        chapitre:chapitre_id (
                            id, titre_chapitre,
                            unite:unite_id (
                                id, titre_unite,
                                option:option_id (
                                    id, nom_option,
                                    niveau:niveau_id (id, nom_niveau)
                                )
                            )
                        ),
                        activite_objectifs (objectif_id)
                        `
                    )
                    .eq("id", activityId)
                    .maybeSingle();

                if (fetchError || !data) {
                    throw fetchError ?? new Error("Activité introuvable ou erreur de chargement.");
                }

                // Hydrater activityData avec les données chargées
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
                    ressource_urls: data.ressource_urls || [],
                    niveau_id: data.chapitre?.unite?.option?.niveau?.id || null,
                    option_id: data.chapitre?.unite?.option?.id || null,
                    unite_id: data.chapitre?.unite?.id || null,
                    objectifs: data.activite_objectifs?.map((o: any) => o.objectif_id) || [],
                });

                // Mettre à jour les états pour l'affichage de la position
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
    }, [activityId]); // Recharger si l'ID de l'activité change

    // Gestionnaire de mise à jour des champs (déclenché par les inputs du formulaire)
    const handleUpdateActivityData = useCallback((updatedFields: Partial<ActivityData>) => {
        setActivityData(prevData => ({ ...prevData, ...updatedFields }));
    }, []);

    // Gestionnaire de changement pour la sélection hiérarchique
    const handleSelectionChange = useCallback((selection: {
        niveauId: number | null;
        optionId: number | null;
        uniteId: number | null;
        chapitreId?: number | null;
        objectifIds?: number[];
    }) => {
        console.log("🔵 HierarchicalSelector - Sélection mise à jour reçue par EditActivityForm:", selection);
        handleUpdateActivityData({
            niveau_id: selection.niveauId,
            option_id: selection.optionId,
            unite_id: selection.uniteId,
            chapitre_id: selection.chapitreId,
            objectifs: selection.objectifIds || [],
        });
    }, [handleUpdateActivityData]); // handleUpdateActivityData est stable grâce à useCallback

    // Callback pour la réception des URLs de ressources
    const handleResourceUploadComplete = useCallback((urls: string[] | null) => {
        console.log("🔵 MultiFileUpload - URLs reçues et passées à onUpdate :", urls);
        handleUpdateActivityData({ ressource_urls: urls || [] });
    }, [handleUpdateActivityData]); // handleUpdateActivityData est stable

    // 💾 Sauvegarde des données (mise à jour de l'activité maître)
    const handleSave = async () => {
        setError(null);
        setSuccessMessage(null);

        // Validation simple avant sauvegarde
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
            // Préparer les données pour l'update, excluant les champs non mappés directement
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

            // Gérer la relation Many-to-Many avec les objectifs (supprimer puis insérer)
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
            // Appelle le callback du parent pour signaler la réussite et fermer la modale
            onSaveSuccess(activityId);

        } catch (err: any) {
            console.error("Erreur lors de la sauvegarde de l'activité:", err);
            setError("Erreur de sauvegarde : " + (err.message || "inconnue"));
        } finally {
            setSaving(false);
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
            <div className="p-6 bg-white rounded-lg shadow-xl text-center">
                <p className="text-red-600 text-lg mb-4">{error}</p>
                <button
                    onClick={onCancel} // Annuler renvoie au parent
                    className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Fermer
                </button>
            </div>
        );
    }

    return (
        <div className="p-2"> {/* Padding réduit pour la modale */}
            {/* Section Position de l'activité (lecture seule) */}
            <section className="p-4 bg-pink-50 rounded-lg shadow-inner mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">📍 Position de l’activité</h3>
                {niveauOption && (
                    <p className="mb-1 text-gray-700 font-medium text-sm">
                        <span className="italic">Niveau & Option : </span>
                        {niveauOption.niveau} - {niveauOption.option}
                    </p>
                )}
                {uniteChapitre && (
                    <p className="mb-1 text-gray-700 font-medium text-sm">
                        <span className="italic">Unité & Chapitre : </span>
                        {uniteChapitre.unite} - {uniteChapitre.chapitre}
                    </p>
                )}
                {!niveauOption && !uniteChapitre && (
                    <p className="text-gray-500 italic text-sm">Informations de position non disponibles.</p>
                )}
            </section>

            {/* Sélecteur hiérarchique */}
            <div className="p-4 bg-blue-50 rounded-lg shadow-inner mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Contexte Pédagogique (Modifiable)</h3>
                <HierarchicalSelector
                    key={activityId || "new"} // Clé pour forcer la réinitialisation du sélecteur
                    onChange={handleSelectionChange}
                    initialNiveauId={activityData.niveau_id}
                    initialOptionId={activityData.option_id}
                    initialUniteId={activityData.unite_id}
                    initialChapitreId={activityData.chapitre_id}
                    initialObjectifIds={activityData.objectifs}
                    showChapitre={true}
                    showObjectifs={true}
                />
            </div>

            {/* Détails de l'Activité */}
            <div className="p-4 bg-blue-100 rounded-lg shadow-inner mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Détails de l'Activité</h3>
                <label htmlFor="titre_activite" className="block font-semibold mb-1 text-gray-700">
                    Titre de l’activité <span className="text-red-600">*</span>
                </label>
                <input
                    id="titre_activite"
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={activityData.titre_activite || ""}
                    onChange={(e) => handleUpdateActivityData({ titre_activite: e.target.value })}
                    placeholder="Ex: Atelier sur la Photosynthèse"
                    required
                />

                <LongTextField
                    label="Description"
                    id="description"
                    value={activityData.description}
                    onChange={(val) => handleUpdateActivityData({ description: val })}
                    placeholder="Décrivez brièvement l'activité, ses objectifs spécifiques, etc."
                />

                <LongTextField
                    label="Rôle de l'enseignant"
                    id="role_enseignant"
                    value={activityData.role_enseignant}
                    onChange={(val) => handleUpdateActivityData({ role_enseignant: val })}
                    placeholder="Décrivez les actions de l'enseignant pendant l'activité."
                />

                <LongTextField
                    label="Modalités de déroulement"
                    id="modalite_deroulement"
                    value={activityData.modalite_deroulement}
                    onChange={(val) => handleUpdateActivityData({ modalite_deroulement: val })}
                    placeholder="Comment l'activité se déroule-t-elle étape par étape ?"
                />
            </div>

            {/* Durée et Matériel */}
            <div className="p-4 bg-blue-50 rounded-lg shadow-inner mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Logistique de l'Activité</h3>
                <LongTextField
                    label="Matériel"
                    id="materiel"
                    value={activityData.materiel}
                    onChange={(val) => handleUpdateActivityData({ materiel: val })}
                    placeholder="Liste du matériel nécessaire (feuilles, crayons, ordinateur, etc.)."
                />

                <div className="mb-5">
                    <label htmlFor="duree_minutes" className="block font-semibold mb-1 text-gray-700">
                        Durée estimée (en minutes)
                    </label>
                    <input
                        id="duree_minutes"
                        type="number"
                        min={0}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={activityData.duree_minutes === null ? "" : activityData.duree_minutes}
                        onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateActivityData({ duree_minutes: val === "" ? null : Math.max(0, parseInt(val, 10)) });
                        }}
                        placeholder="Ex: 60"
                    />
                </div>
            </div>

            {/* Autres détails */}
            <div className="p-4 bg-blue-100 rounded-lg shadow-inner mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Informations Complémentaires</h3>
                <LongTextField
                    label="Modalités d’évaluation"
                    id="modalite_evaluation"
                    value={activityData.modalite_evaluation}
                    onChange={(val) => handleUpdateActivityData({ modalite_evaluation: val })}
                    placeholder="Comment les apprentissages seront-ils évalués ?"
                />
                <LongTextField
                    label="Commentaires additionnels"
                    id="commentaires"
                    value={activityData.commentaires}
                    onChange={(val) => handleUpdateActivityData({ commentaires: val })}
                    placeholder="Notes supplémentaires ou considérations particulières."
                />
            </div>

            {/* Section Upload de ressources multiples */}
            <div className="mb-6 border-t pt-6 border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Ressources Associées (Optionnel)</h3>
                <MultiFileUpload
                    onUploadComplete={handleResourceUploadComplete}
                    disabled={saving}
                    initialUrls={activityData.ressource_urls}
                />
            </div>

            {/* Messages d’erreur / succès */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md border border-red-200" role="alert">
                    <p className="font-medium">Erreur :</p>
                    <p>{error}</p>
                </div>
            )}
            {successMessage && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md border border-green-200" role="alert">
                    <p className="font-medium">Succès :</p>
                    <p>{successMessage}</p>
                </div>
            )}

            {/* Boutons d’action */}
            <div className="flex justify-end space-x-4 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                >
                    Annuler
                </button>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-8 py-3 rounded-md text-white font-semibold shadow-md ${
                        saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    } transition duration-150 ease-in-out`}
                >
                    {saving ? "Enregistrement en cours..." : "Enregistrer les modifications"}
                </button>
            </div>
        </div>
    );
};

export default EditActivityForm;
