// ============================================================
// Titre : CreateActivityEditor_ancien
// Chemin : src/components/planipeda/ScenarioEditor/CreateActivityEditor.tsx
// Fonctionnalités : 
//   - Formulaire complet pour créer une nouvelle activité pédagogique.
//   - Gère tous les champs requis en local.
//   - Intègre une sélection hiérarchique : niveau > option > unité > chapitre > objectifs.
//   - Sauvegarde dans Supabase avec gestion de la table de jointure `activite_objectifs`.
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HierarchicalSelector from "./HierarchicalSelector";
import { supabase } from "@/backend/config/supabase";

const CreateActivityEditor: React.FC<{ onSaved?: () => void; onCancel?: () => void }> = ({
  onSaved,
  onCancel,
}) => {
  // =========================
  // États locaux du formulaire
  // =========================
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [roleEnseignant, setRoleEnseignant] = useState("");
  const [materiel, setMateriel] = useState("");
  const [dureeMinutes, setDureeMinutes] = useState<number | "">("");
  const [modaliteDeroulement, setModaliteDeroulement] = useState("");
  const [modaliteEvaluation, setModaliteEvaluation] = useState("");
  const [commentaires, setCommentaires] = useState("");

  const [formKey, setFormKey] = useState(Date.now());

  // Identifiants liés à la hiérarchie
  const [chapitreId, setChapitreId] = useState<number | null>(null);
  const [objectifIds, setObjectifIds] = useState<number[]>([]);

  // États de feedback
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  // ===========================
  // Gestion du sélecteur hiérarchique
  // ===========================
  const handleSelectionChange = (selection: {
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
    chapitreId?: number | null;
    objectifIds?: number[];
  }) => {
    setChapitreId(selection.chapitreId || null);
    setObjectifIds(selection.objectifIds ?? []);
  };

  // =====================
  // Réinitialisation du formulaire
  // =====================
  const resetForm = () => {
  setTitre("");
  setDescription("");
  setRoleEnseignant("");
  setMateriel("");
  setDureeMinutes("");
  setModaliteDeroulement("");
  setModaliteEvaluation("");
  setCommentaires("");
  setChapitreId(null);
  setObjectifIds([]);
  setError(null);
  setFormKey(Date.now()); // ⚠️ Important : force le rechargement du HierarchicalSelector
};


  // ===============================
  // Affichage temporaire du succès
  // ===============================
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // =====================
  // Fonction de sauvegarde
  // =====================
  const handleSave = async () => {
    setSuccessMessage(null);

    // Validation de base
    if (!chapitreId || chapitreId <= 0) {
      setError("Veuillez sélectionner un chapitre.");
      return;
    }
    if (objectifIds.length === 0) {
      setError("Veuillez sélectionner au moins un objectif.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Insertion de l'activité
      const { data: savedActivity, error: errorActivity } = await supabase
        .from("activites")
        .insert({
          chapitre_id: chapitreId,
          titre_activite: titre,
          description,
          role_enseignant: roleEnseignant,
          materiel,
          duree_minutes: typeof dureeMinutes === "number" ? dureeMinutes : null,
          modalite_deroulement: modaliteDeroulement,
          modalite_evaluation: modaliteEvaluation,
          commentaires,
        })
        .select()
        .single();

      if (errorActivity) throw errorActivity;

      // Insertion des liens objectifs
      if (objectifIds.length > 0) {
        const relations = objectifIds.map((objectif_id) => ({
          activite_id: savedActivity.id,
          objectif_id,
        }));

        const { error: errorLink } = await supabase
          .from("activite_objectifs")
          .insert(relations);

        if (errorLink) throw errorLink;
      }

      setSuccessMessage("Activité créée avec succès.");
      resetForm();
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde :", err);
      setError("Erreur : " + (err.message ?? String(err)));
    } finally {
      setSaving(false);
    }
  };

  // ========================
  // Gestion du bouton retour
  // ========================
  const handleBack = () => {
    if (onCancel) onCancel();
    else navigate(-1);
  };

  // ========================
  // Rendu du formulaire
  // ========================
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Formulaire de création d'une activité d’apprentissage</h2>

      <form onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}>
        {/* Sélecteur hiérarchique */}
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Emplacement de l’activité</h3>
        <HierarchicalSelector
          key={formKey} // <- forcer le remount à chaque reset
          showChapitre
          showObjectifs
          onChange={handleSelectionChange}
          initialChapitreId={chapitreId}
          initialObjectifIds={objectifIds}
        />

        </section>

        {/* Champs texte */}
        {[
          { label: "Titre de l’activité", id: "titre", value: titre, setter: setTitre, type: "text" },
          { label: "Matériel", id: "materiel", value: materiel, setter: setMateriel, type: "text" },
          { label: "Durée (minutes)", id: "dureeMinutes", value: dureeMinutes, setter: (v: any) => setDureeMinutes(v === "" ? "" : Number(v)), type: "number", min: 0 },
        ].map(({ label, id, value, setter, type, min }) => (
          <section key={id} className="mb-4">
            <label htmlFor={id} className="block font-semibold mb-1">{label}</label>
            <input
              id={id}
              type={type}
              min={min}
              className="w-full border rounded px-3 py-2"
              value={value}
              onChange={(e) => setter(e.target.value)}
            />
          </section>
        ))}

        {/* Textareas longs */}
        {[
          { label: "Description", id: "description", value: description, setter: setDescription },
          { label: "Rôle de l’enseignant", id: "roleEnseignant", value: roleEnseignant, setter: setRoleEnseignant },
          { label: "Modalité de déroulement", id: "modaliteDeroulement", value: modaliteDeroulement, setter: setModaliteDeroulement },
          { label: "Modalité d’évaluation", id: "modaliteEvaluation", value: modaliteEvaluation, setter: setModaliteEvaluation },
          { label: "Commentaires", id: "commentaires", value: commentaires, setter: setCommentaires },
        ].map(({ label, id, value, setter }) => (
          <section key={id} className="mb-4">
            <label htmlFor={id} className="block font-semibold mb-1">{label}</label>
            <textarea
              id={id}
              className="w-full border rounded px-3 py-2"
              value={value}
              onChange={(e) => setter(e.target.value)}
              rows={3}
            />
          </section>
        ))}

        {/* Messages de feedback */}
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}

        {/* Boutons d'action */}
        <div className="flex justify-between items-center mt-6">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 rounded border border-gray-500 hover:bg-gray-100"
            disabled={saving}
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {saving ? "Création..." : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateActivityEditor;
