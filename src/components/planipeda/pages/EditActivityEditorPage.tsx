// 📁 src/components/planipeda/pages/EditActivityEditorPage.tsx
// Page pour éditer une activité pédagogique existante

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EditActivityEditor from "@/components/planipeda/ScenarioEditor/EditActivityEditor"; // Le composant que nous avons refactorisé
import { supabase } from "@/backend/config/supabase";
import { ActivityData } from "@/types/activity"; // IMPORTER L'INTERFACE HARMONISÉE

const EditActivityEditorPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // Récupère l'ID de l'URL

    // 🔄 États de chargement et de feedback pour la page
    const [loadingPage, setLoadingPage] = useState(true);
    const [errorPage, setErrorPage] = useState<string | null>(null);

    // 📝 État de l'activité, initialisé selon l'interface ActivityData
    const [activityData, setActivityData] = useState<ActivityData>({
        // Initialiser avec des valeurs par défaut pour éviter les erreurs de type
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

    // 📦 Chargement de l’activité existante
    useEffect(() => {
        if (!id) {
            setErrorPage("ID de l'activité manquant dans l'URL.");
            setLoadingPage(false);
            return;
        }

        const activityId = parseInt(id, 10); // Convertir l'ID en nombre
        if (isNaN(activityId)) {
            setErrorPage("ID d'activité invalide.");
            setLoadingPage(false);
            return;
        }

        // Le chargement de l'activité est désormais géré à l'intérieur de EditActivityEditor (le composant)
        // Ce composant de page passe juste l'ID à EditActivityEditor, qui est responsable de son propre chargement
        // et de sa gestion d'état interne.
        // La raison pour laquelle on maintient un `loadingPage` ici est si `EditActivityEditor`
        // devait être un composant entièrement "muet" qui prend `initialData` complète dès le départ.
        // Cependant, notre `EditActivityEditor` que nous avons refactorisé est déjà un "wrapper" de chargement.
        // Donc, ce `useEffect` ici devient redondant si `EditActivityEditor` gère son propre chargement.

        // Pour notre architecture actuelle (EditActivityEditor est le composant de chargement):
        // Cette page ne fait que passer l'ID au composant EditActivityEditor.
        // EditActivityEditor lui-même va faire le fetch et gérer ses états de chargement/erreur.
        // Donc, nous n'avons pas besoin de fetcher ici.
        // La seule chose à faire est de passer `activityId` à `EditActivityEditor`.
        setLoadingPage(false); // Marquer comme non-chargement puisque le chargement est dans le composant enfant.

    }, [id]);

    // Les fonctions onSaved et onDelete sont les callbacks du composant EditActivityEditor
    // pour gérer les actions globales (redirection après sauvegarde/suppression)
    const handleActivitySaved = () => {
        console.log("✅ Activité sauvegardée avec succès depuis la page.");
        navigate("/planipeda/activites"); // Rediriger après sauvegarde
    };

    const handleActivityDeleted = () => {
        console.log("🗑️ Activité supprimée avec succès depuis la page.");
        navigate("/planipeda/activites"); // Rediriger après suppression
    };

    const handleCancel = () => {
        console.log("↩️ Annulation depuis la page.");
        navigate("/planipeda/activites"); // Rediriger vers la liste des activités
    };

    if (loadingPage) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl text-gray-600">Préparation de la page d'édition...</p>
            </div>
        );
    }

    if (errorPage) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md">
                    <p className="text-xl font-bold mb-4">Erreur :</p>
                    <p>{errorPage}</p>
                    <button
                        onClick={() => navigate("/planipeda/activites")}
                        className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                        Retour à la liste des activités
                    </button>
                </div>
            </div>
        );
    }

    // Le composant EditActivityEditor (que nous avons refactorisé) prend maintenant l'ID et gère son propre chargement.
   return (
        <div className="p-6 space-y-8">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
                Modifier une activité d'apprentissage
                    <div className="flex items-center mb-6">
      <button onClick={() => window.history.back()} 
         className="text-xl btn-outline mb-6 flex text-center gap-1">
        ← Retour
      </button>
    </div>
            </h1>

            <EditActivityEditor
                activityId={parseInt(id || "0", 10)} // Passer l'ID converti
                onSaved={handleActivitySaved}
                onCancel={handleCancel}
            />
        </div>
    );
};

export default EditActivityEditorPage;