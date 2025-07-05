// 📁 src/components/planipeda/pages/EditEvaluationEditorPage.tsx
// Page pour éditer une évaluation existante

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
// NOTE : Assurez-vous que ce chemin est correct pour votre projet
import EditEvaluationEditor from "@/components/planipeda/ScenarioEditor/EditEvaluationEditor"; 
import { supabase } from "@/backend/config/supabase";
import { EvaluationData } from "@/types/evaluation"; // IMPORTER L'INTERFACE HARMONISÉE POUR LES ÉVALUATIONS
import toast from "react-hot-toast"; // Pour les notifications

const EditEvaluationEditorPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // Récupère l'ID de l'URL

    // 🔄 États de chargement et de feedback pour la page
    const [loadingPage, setLoadingPage] = useState(true);
    const [errorPage, setErrorPage] = useState<string | null>(null);

    // 📝 État de l'évaluation, initialisé selon l'interface EvaluationData
    const [evaluationData, setEvaluationData] = useState<EvaluationData>({
        // Initialiser avec des valeurs par défaut pour éviter les erreurs de type
        chapitre_id: null,
        titre_evaluation: "",
        competence_ids: [], // Supposons que l'éditeur gérera les IDs des compétences
        objectif_ids: [],   // Supposons que l'éditeur gérera les IDs des objectifs
        modalite_evaluation_ids: [],
        modalite_evaluation_autre_texte: null,
        grille_correction: null,
        introduction_activite: "<p></p>",
        contenu_blocs: [],
        consignes_specifiques: null,
        ressource_urls: null,
        ressources_eleve_urls: null,
        type_evaluation: null,
        selected_competence_id: null,
        selected_general_competence_ids: [],
        selected_connaissance_ids: [],
        new_connaissance_text: null,
        selected_capacite_habilete_ids: [], // MODIFIÉ: Initialisé comme tableau
        niveau_id: null,
        option_id: null,
        unite_id: null,
        sequence_id: null,
        activite_id: null,
    });

    // 📦 Chargement de l'évaluation existante
    useEffect(() => {
        if (!id) {
            setErrorPage("ID de l'évaluation manquant dans l'URL.");
            setLoadingPage(false);
            return;
        }

        const evaluationIdNum = parseInt(id, 10); // Convertir l'ID en nombre
        if (isNaN(evaluationIdNum)) {
            setErrorPage("ID d'évaluation invalide.");
            setLoadingPage(false);
            return;
        }

        // Le composant enfant EditEvaluationEditor (qui est une version réutilisée de CreateEvaluationEditor)
        // gère son propre chargement en utilisant l'ID passé.
        // Cette page ne fait que passer l'ID.
        setLoadingPage(false); // Marquer comme non-chargement puisque le chargement est dans le composant enfant.

    }, [id]);

    // Les fonctions onSaved et onCancel sont les callbacks du composant EditEvaluationEditor
    // pour gérer les actions globales (redirection après sauvegarde/annulation)
    const handleEvaluationSaved = () => {
        // Rediriger vers la liste des évaluations
        navigate("/planipeda/evaluations"); 
       
    };

    const handleCancel = () => {
        console.log("↩️ Annulation depuis la page.");
        // Rediriger vers la liste des évaluations
        navigate("/planipeda/evaluations"); 
    };

    if (loadingPage) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-xl text-gray-600">Préparation de la page d'édition de l'évaluation...</p>
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
                        onClick={() => navigate("/planipeda/evaluations")}
                        className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                        Retour à la liste des évaluations
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-8 text-center">
                Modifier une évaluation
                <div className="flex items-center mb-6">
                    <button onClick={() => navigate("/planipeda/evaluations")} // Retour à la liste plutôt qu'historique
                             className="text-xl btn-outline mb-6 flex text-center gap-1">
                        ← Retour à la liste
                    </button>
                </div>
            </h1>

            <EditEvaluationEditor
                evaluationId={parseInt(id || "0", 10)} // Passer l'ID converti
                onSaved={handleEvaluationSaved}
                onCancel={handleCancel}
                // onDelete={handleEvaluationDeleted} // Si un bouton supprimer est dans l'éditeur lui-même
            />
        </div>
    );
};

export default EditEvaluationEditorPage;
