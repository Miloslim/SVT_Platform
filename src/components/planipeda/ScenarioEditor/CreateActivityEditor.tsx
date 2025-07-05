// ============================================================
// Titre : CreateActivityEditor/version 100% ancienne reference
// Chemin : src/components/planipeda/ScenarioEditor/CreateActivityEditor.tsx
// Fonctionnalités :
//    - Formulaire complet pour la création d'une activité pédagogique (maintenant CONTRÔLÉ par le parent).
//    - Intégration de la sélection hiérarchique (niveau > option > unité > chapitre > objectifs).
//    - Utilise le composant MultiFileUpload pour gérer l'upload de MULTIPLES fichiers ressources.
//    - Envoie toutes les mises à jour des champs au parent via `onUpdate`.
//    - Déclenche la fonction de sauvegarde du parent via `onSaveTrigger`.
//    - Affiche les messages d'erreur/succès et l'état de sauvegarde reçus du parent.
// ============================================================

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HierarchicalSelector from "./HierarchicalSelector";
import MultiFileUpload from "./MultiFileUpload";
import { ActivityData } from "@/types/activity";

// --- Sous-composant : LongTextField ---
interface LongTextFieldProps {
    label: string;
    id: string;
    value: string | null; // Peut être null
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
            value={value || ""}
            onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
            placeholder={placeholder || `Entrez ${label.toLowerCase()}...`}
        />
    </div>
);

// --- Propriétés du composant CreateActivityEditor ---
interface CreateActivityEditorProps {
    initialData: ActivityData;
    onUpdate: (updatedFields: Partial<ActivityData>) => void;
    onSaveTrigger: () => void;
    onCancel?: () => void;
    saving: boolean;
    error: string | null;
    successMessage: string | null;
    onSuccessRedirectPath?: string;
}

// ============================================================
// Composant principal : CreateActivityEditor
// ============================================================
const CreateActivityEditor: React.FC<CreateActivityEditorProps> = ({
    initialData,
    onUpdate,
    onSaveTrigger,
    onCancel,
    saving,
    error,
    successMessage,
    onSuccessRedirectPath,
}) => {
    const navigate = useNavigate();

    // Cette useEffect est pour les redirections automatiques.
    // Dans le cas de EditActivityForm, onSuccessRedirectPath ne sera pas fourni,
    // donc cette logique ne s'activera pas, ce qui est le comportement attendu.
    useEffect(() => {
        if (successMessage && onSuccessRedirectPath && !saving) {
            const timer = setTimeout(() => {
                navigate(onSuccessRedirectPath);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [successMessage, onSuccessRedirectPath, saving, navigate]);

    const handleSelectionChange = (selection: {
        niveauId: number | null;
        optionId: number | null;
        uniteId: number | null;
        chapitreId?: number | null;
        objectifIds?: number[];
    }) => {
        console.log("🔵 HierarchicalSelector - Sélection mise à jour reçue par CreateActivityEditor:", selection);
        onUpdate({
            niveau_id: selection.niveauId,
            option_id: selection.optionId,
            unite_id: selection.uniteId,
            chapitre_id: selection.chapitreId,
            objectifs: selection.objectifIds || [],
        });
    };

    const handleResourceUploadComplete = (urls: string[] | null) => {
        console.log("🔵 MultiFileUpload - URLs reçues et passées à onUpdate :", urls);
        onUpdate({ ressource_urls: urls || [] });
    };

    const handleBack = () => {
        console.log("ℹ️ Bouton Annuler cliqué.");
        if (onCancel) onCancel();
        else navigate(-1);
    };

    return (
       <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-xl">
    <h1 className="text-2xl font-semibold text- mb-8 text-center">
        Saisir et modifier les éléments d'une activité d’apprentissage
    </h1>

            <div className="max-w-3xl mx-auto p-6 bg-blue-50 rounded-lg shadow-xl mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Contexte Pédagogique</h3>
                <HierarchicalSelector
                    key={initialData.id || "new"} // TRÈS IMPORTANT: Maintenu pour la stabilité du sélecteur
                    onChange={handleSelectionChange}
                    initialNiveauId={initialData.niveau_id}
                    initialOptionId={initialData.option_id}
                    initialUniteId={initialData.unite_id}
                    initialChapitreId={initialData.chapitre_id}
                    initialObjectifIds={initialData.objectifs}
                    showChapitre={true}
                    showObjectifs={true}
                />
            </div>

            <div className="max-w-3xl mx-auto p-6 bg-blue-100 rounded-lg shadow-xl mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Détails de l'Activité</h3>
                <label htmlFor="titre_activite" className="block font-semibold mb-1 text-gray-700">
                    Titre de l’activité <span className="text-red-600">*</span>
                </label>
                <input
                    id="titre_activite"
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={initialData.titre_activite || ""}
                    onChange={(e) => onUpdate({ titre_activite: e.target.value })}
                    placeholder="Ex: Atelier sur la Photosynthèse"
                    required
                />

                <LongTextField
                    label="Description"
                    id="description"
                    value={initialData.description}
                    onChange={(val) => onUpdate({ description: val })}
                    placeholder="Décrivez brièvement l'activité, ses objectifs spécifiques, etc."
                />

                <LongTextField
                    label="Rôle de l'enseignant"
                    id="role_enseignant"
                    value={initialData.role_enseignant}
                    onChange={(val) => onUpdate({ role_enseignant: val })}
                    placeholder="Décrivez les actions de l'enseignant pendant l'activité."
                />

                <LongTextField
                    label="Modalités de déroulement"
                    id="modalite_deroulement"
                    value={initialData.modalite_deroulement}
                    onChange={(val) => onUpdate({ modalite_deroulement: val })}
                    placeholder="Comment l'activité se déroule-t-elle étape par étape ?"
                />
            </div>

            <div className="max-w-3xl mx-auto p-6 bg-blue-50 rounded-lg shadow-xl mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Logistique de l'Activité</h3>
                <LongTextField
                    label="Matériel"
                    id="materiel"
                    value={initialData.materiel}
                    onChange={(val) => onUpdate({ materiel: val })}
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
                        value={initialData.duree_minutes === null ? "" : initialData.duree_minutes}
                        onChange={(e) => {
                            const val = e.target.value;
                            onUpdate({ duree_minutes: val === "" ? null : Math.max(0, parseInt(val, 10)) });
                        }}
                        placeholder="Ex: 60"
                    />
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-6 bg-blue-100 rounded-lg shadow-xl mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Informations Complémentaires</h3>
                <LongTextField
                    label="Modalités d’évaluation"
                    id="modalite_evaluation"
                    value={initialData.modalite_evaluation}
                    onChange={(val) => onUpdate({ modalite_evaluation: val })}
                    placeholder="Comment les apprentissages seront-ils évalués ?"
                />
                <LongTextField
                    label="Commentaires additionnels"
                    id="commentaires"
                    value={initialData.commentaires}
                    onChange={(val) => onUpdate({ commentaires: val })}
                    placeholder="Notes supplémentaires ou considérations particulières."
                />
            </div>

            <div className="mb-6 border-t pt-6 border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Ressources Associées (Optionnel)</h3>
                <MultiFileUpload
                    onUploadComplete={handleResourceUploadComplete}
                    disabled={saving}
                    initialUrls={initialData.ressource_urls}
                />
            </div>

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

            <div className="flex justify-between mt-8">
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={saving}
                    className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                >
                    Annuler
                </button>

                <button
                    type="button"
                    onClick={onSaveTrigger}
                    disabled={saving}
                    className={`px-8 py-3 rounded-md text-white font-semibold shadow-md ${
                        saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    } transition duration-150 ease-in-out`}
                >
                    {saving ? "Enregistrement en cours..." : "Enregistrer l'activité"}
                </button>
            </div>
        </div>
    );
};

export default CreateActivityEditor;
