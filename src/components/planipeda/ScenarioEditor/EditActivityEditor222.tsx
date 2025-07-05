// 🌐 Chemin : src/components/activities/EditActivityEditor.tsx (ancien complet)

// 📄 Composant de modification d'une activité d'apprentissage

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/backend/config/supabase";
import HierarchicalSelector from "./HierarchicalSelector";

interface Props {
  initialData: { id: number }; // Seul l'id est passé, les données sont chargées dans le composant
  onSaved?: () => void;
  onCancel?: () => void;
}

const EditActivityEditor: React.FC<Props> = ({ initialData, onSaved, onCancel }) => {
  const navigate = useNavigate();

  // 🔄 États de chargement, erreur, succès
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 📦 États des champs de formulaire
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [roleEnseignant, setRoleEnseignant] = useState("");
  const [materiel, setMateriel] = useState("");
  const [dureeMinutes, setDureeMinutes] = useState<number | "">("");
  const [modaliteDeroulement, setModaliteDeroulement] = useState("");
  const [modaliteEvaluation, setModaliteEvaluation] = useState("");
  const [commentaires, setCommentaires] = useState("");
  const [chapitreId, setChapitreId] = useState<number | null>(null);
  const [objectifIds, setObjectifIds] = useState<number[]>([]);

  // 📥 Chargement initial de l’activité et des objectifs liés
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: activite, error: errAct } = await supabase
          .from("activites")
          .select("*")
          .eq("id", initialData.id)
          .single();

        if (errAct || !activite) throw errAct ?? new Error("Activité introuvable");

        const { data: objectifs, error: errObj } = await supabase
          .from("activite_objectifs")
          .select("objectif_id")
          .eq("activite_id", initialData.id);

        if (errObj) throw errObj;

        // 🧠 Pré-remplissage du formulaire
        setTitre(activite.titre_activite ?? "");
        setDescription(activite.description ?? "");
        setRoleEnseignant(activite.role_enseignant ?? "");
        setMateriel(activite.materiel ?? "");
        setDureeMinutes(activite.duree_minutes ?? "");
        setModaliteDeroulement(activite.modalite_deroulement ?? "");
        setModaliteEvaluation(activite.modalite_evaluation ?? "");
        setCommentaires(activite.commentaires ?? "");
        setChapitreId(activite.chapitre_id ?? null);
        setObjectifIds(objectifs?.map((o) => o.objectif_id) ?? []);
      } catch (err: any) {
        setError("Erreur de chargement : " + (err.message ?? "inconnue"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialData.id]);

  // 🧭 Mise à jour du chapitre et des objectifs depuis le composant hiérarchique
  const handleSelectionChange = (selection: {
    chapitreId?: number | null;
    objectifIds?: number[];
  }) => {
    setChapitreId(selection.chapitreId ?? null);
    setObjectifIds(selection.objectifIds ?? []);
  };

  // 💾 Sauvegarde des données
  const handleSave = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!chapitreId) return setError("Veuillez sélectionner un chapitre.");
    if (!objectifIds.length) return setError("Veuillez sélectionner au moins un objectif.");

    setSaving(true);
    try {
      const updateData = {
        chapitre_id: chapitreId,
        titre_activite: titre,
        description,
        role_enseignant: roleEnseignant,
        materiel,
        duree_minutes: typeof dureeMinutes === "number" ? dureeMinutes : null,
        modalite_deroulement: modaliteDeroulement,
        modalite_evaluation: modaliteEvaluation,
        commentaires,
      };

      const { error: errorUpdate } = await supabase
        .from("activites")
        .update(updateData)
        .eq("id", initialData.id);

      if (errorUpdate) throw errorUpdate;

      await supabase.from("activite_objectifs").delete().eq("activite_id", initialData.id);
      const insertData = objectifIds.map((id) => ({ activite_id: initialData.id, objectif_id: id }));
      const { error: errorInsert } = await supabase.from("activite_objectifs").insert(insertData);
      if (errorInsert) throw errorInsert;

      setSuccessMessage("Activité mise à jour avec succès.");

      // ✅ Redirection vers la page des activités après 1 seconde
      setTimeout(() => {
        navigate("/planipeda/activites");
      }, 1000);
    } catch (err: any) {
      setError("Erreur de sauvegarde : " + (err.message || "inconnue"));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    onCancel ? onCancel() : navigate(-1);
  };

  if (loading) return <div className="p-6 text-center">Chargement des données…</div>;

  return (
  <div className="max-w-6xl mx-auto p-6 bg-white rounded shadow">
    <h2 className="text-2xl font-bold mb-6">Modifier une activité d'apprentissage</h2>

    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

      {/* Section 1 – Emplacement pédagogique */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">🗂️ Emplacement pédagogique</h3>
        <HierarchicalSelector
          showChapitre
          showObjectifs
          initialChapitreId={chapitreId}
          initialObjectifIds={objectifIds}
          onChange={handleSelectionChange}
        />
      </section>

      {/* Section 2 – Données générales */}
      <section className="bg-blue-50 border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">📌 Données générales</h3>
        <div className="mb-4">
          <label className="block font-medium mb-1">Titre de l’activité</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Durée de l’activité (en minutes)</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded px-3 py-2"
            value={dureeMinutes}
            onChange={(e) => setDureeMinutes(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
      </section>

      {/* Section 3 – Contenu pédagogique */}
     <section className="bg-blue-50 border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">🎯 Situation d’apprentissage</h3>
        <div className="mb-4">
          <label className="block font-medium mb-1">Description de l’activité</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        {/* Section 4 – Situation d’apprentissage (regroupement côte à côte) */}
        <div className="flex flex-col md:flex-row md:space-x-6">
          {/* Rôle de l’enseignant */}
          <div className="flex-1 mb-4 md:mb-0">
            <label className="block font-medium mb-1">Rôle de l’enseignant</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={roleEnseignant}
              onChange={(e) => setRoleEnseignant(e.target.value)}
              rows={5}
            />
          </div>

          {/* Modalités de déroulement */}
          <div className="flex-1">
            <label className="block font-medium mb-1">Modalités de déroulement (Rôle de l’apprenant)</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={modaliteDeroulement}
              onChange={(e) => setModaliteDeroulement(e.target.value)}
              rows={5}
            />
          </div>
        </div>
      </section>

      {/* Section 5 – Organisation pratique */}
   <section className="bg-blue-50 border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">🧰 Organisation pratique</h3>
        <div className="mb-4">
          <label className="block font-medium mb-1">Matériel requis</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={materiel}
            onChange={(e) => setMateriel(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Modalités d’évaluation</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={modaliteEvaluation}
            onChange={(e) => setModaliteEvaluation(e.target.value)}
            rows={3}
          />
        </div>
      </section>

      {/* Section 6 – Commentaires */}
  <section className="bg-blue-50 border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">📝 Commentaires</h3>
        <label className="block font-medium mb-1">Commentaires complémentaires</label>
        <textarea
          className="w-full border rounded px-3 py-2"
          value={commentaires}
          onChange={(e) => setCommentaires(e.target.value)}
          rows={3}
        />
      </section>

      {/* Messages de feedback */}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}

      {/* Boutons de contrôle */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 border border-gray-500 rounded hover:bg-gray-100"
          disabled={saving}
        >
          Retour
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          disabled={saving}
        >
          {saving ? "Sauvegarde..." : "Enregistrer"}
        </button>
      </div>

    </form>
  </div>
);

};

export default EditActivityEditor;