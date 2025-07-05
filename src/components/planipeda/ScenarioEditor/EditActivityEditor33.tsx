// 🌐 src/components/activities/EditActivityEditor33.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/backend/config/supabase";
import HierarchicalSelector from "./HierarchicalSelector";

// 🧩 Props attendues
interface Props {
  initialData: { id: number };
  onSaved?: () => void;
  onCancel?: () => void;
}

const EditActivityEditor: React.FC<Props> = ({ initialData, onSaved, onCancel }) => {
  const navigate = useNavigate();

  // 🔄 États de chargement
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 📝 États du formulaire
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [roleEnseignant, setRoleEnseignant] = useState("");
  const [materiel, setMateriel] = useState("");
  const [dureeMinutes, setDureeMinutes] = useState<number | "">("");
  const [modaliteDeroulement, setModaliteDeroulement] = useState("");
  const [modaliteEvaluation, setModaliteEvaluation] = useState("");
  const [commentaires, setCommentaires] = useState("");

  // 📚 États liés à l’emplacement pédagogique
  const [chapitreId, setChapitreId] = useState<number | null>(null);
  const [objectifIds, setObjectifIds] = useState<number[]>([]);
  const [niveauOption, setNiveauOption] = useState<{ niveau: string; option: string } | null>(null);
  const [uniteChapitre, setUniteChapitre] = useState<{ unite: string; chapitre: string } | null>(null);

  // 📦 Chargement de l’activité
  useEffect(() => {
    if (!initialData.id) return;

    const fetchActivity = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("activites")
          .select(`
            id,
            titre_activite,
            description,
            role_enseignant,
            materiel,
            duree_minutes,
            modalite_deroulement,
            modalite_evaluation,
            commentaires,
            chapitre:chapitre_id (
              id,
              titre_chapitre,
              unite:unite_id (
                titre_unite,
                option:option_id (
                  nom_option,
                  niveau:niveau_id (
                    nom_niveau
                  )
                )
              )
            ),
            activite_objectifs (
              objectif_id
            )
          `)
          .eq("id", initialData.id)
          .maybeSingle();

        if (error || !data) throw error ?? new Error("Activité introuvable");

        // 📝 Mise à jour des champs du formulaire
        setTitre(data.titre_activite ?? "");
        setDescription(data.description ?? "");
        setRoleEnseignant(data.role_enseignant ?? "");
        setMateriel(data.materiel ?? "");
        setDureeMinutes(data.duree_minutes ?? "");
        setModaliteDeroulement(data.modalite_deroulement ?? "");
        setModaliteEvaluation(data.modalite_evaluation ?? "");
        setCommentaires(data.commentaires ?? "");

        // 🗂️ Hiérarchie pédagogique
        const chapitre = data.chapitre;
        if (chapitre) {
          setChapitreId(chapitre.id);
          setUniteChapitre({
            unite: chapitre.unite?.titre_unite ?? "",
            chapitre: chapitre.titre_chapitre ?? "",
          });
          setNiveauOption({
            niveau: chapitre.unite?.option?.niveau?.nom_niveau ?? "",
            option: chapitre.unite?.option?.nom_option ?? "",
          });
        }

        // 🎯 Objectifs liés
        const objectifs = data.activite_objectifs?.map((o: any) => o.objectif_id) ?? [];
        setObjectifIds(objectifs);

      } catch (err: any) {
        setError("Erreur de chargement : " + (err.message ?? "inconnue"));
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [initialData.id]);

  // 🔁 Gestion des changements dans la sélection hiérarchique
  const handleSelectionChange = (selection: { chapitreId?: number | null; objectifIds?: number[] }) => {
    setChapitreId(selection.chapitreId ?? null);
    setObjectifIds(selection.objectifIds ?? []);
  };

  // 💾 Sauvegarde de l’activité modifiée
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

      // 🔁 Mise à jour des objectifs liés
      await supabase.from("activite_objectifs").delete().eq("activite_id", initialData.id);
      const insertData = objectifIds.map((id) => ({
        activite_id: initialData.id,
        objectif_id: id,
      }));
      const { error: errorInsert } = await supabase.from("activite_objectifs").insert(insertData);
      if (errorInsert) throw errorInsert;

      setSuccessMessage("Activité mise à jour avec succès.");
      setTimeout(() => {
        onSaved ? onSaved() : navigate("/planipeda/activites");
      }, 1000);
    } catch (err: any) {
      setError("Erreur de sauvegarde : " + (err.message || "inconnue"));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => onCancel ? onCancel() : navigate(-1);

  if (loading) return <div className="p-6 text-center">Chargement de l’activité…</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-xl">
      <h2 className="text-2xl font-bold mb-6">✏️ Modifier une activité d’apprentissage</h2>

      {/* 🛑 Message d’erreur */}
      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 border rounded">{error}</div>}

      {/* ✅ Message de succès */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 border rounded">{successMessage}</div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
        {/* 🔎 Position actuelle */}
        <section className="bg-gray-50 border rounded p-4">
          <h3 className="text-lg font-semibold mb-2">📍 Position actuelle</h3>
          {niveauOption && <p><strong>Niveau & Option :</strong> {niveauOption.niveau} - {niveauOption.option}</p>}
          {uniteChapitre && <p><strong>Unité & Chapitre :</strong> {uniteChapitre.unite} - {uniteChapitre.chapitre}</p>}
        </section>

        {/* 🧭 Emplacement pédagogique */}
        <section className="bg-blue-50 border rounded p-4">
          <h3 className="text-lg font-semibold mb-2">🏷️ Modifier l’emplacement</h3>
          <HierarchicalSelector
            showChapitre
            showObjectifs
            initialChapitreId={chapitreId}
            initialObjectifIds={objectifIds}
            onChange={handleSelectionChange}
          />
        </section>

        {/* 📝 Données générales */}
        <section className="bg-blue-50 border rounded p-4">
          <h3 className="text-lg font-semibold mb-2">📌 Informations générales</h3>
          <input className="input" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre" required />
          <input className="input mt-2" type="number" min={0} value={dureeMinutes} onChange={(e) => setDureeMinutes(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Durée en minutes" />
        </section>

        {/* 🎓 Contenu pédagogique */}
        <section className="bg-blue-50 border rounded p-4">
          <h3 className="text-lg font-semibold mb-2">🎯 Contenu pédagogique</h3>
          <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description de l’activité" rows={4} />
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <textarea className="textarea" value={roleEnseignant} onChange={(e) => setRoleEnseignant(e.target.value)} placeholder="Rôle de l’enseignant" rows={4} />
            <textarea className="textarea" value={modaliteDeroulement} onChange={(e) => setModaliteDeroulement(e.target.value)} placeholder="Modalités de déroulement" rows={4} />
          </div>
        </section>

        {/* 🧰 Modalités pratiques */}
        <section className="bg-blue-50 border rounded p-4">
          <h3 className="text-lg font-semibold mb-2">🔧 Organisation pratique</h3>
          <textarea className="textarea" value={materiel} onChange={(e) => setMateriel(e.target.value)} placeholder="Matériel nécessaire" rows={3} />
          <textarea className="textarea mt-2" value={modaliteEvaluation} onChange={(e) => setModaliteEvaluation(e.target.value)} placeholder="Modalités d’évaluation" rows={3} />
          <textarea className="textarea mt-2" value={commentaires} onChange={(e) => setCommentaires(e.target.value)} placeholder="Commentaires complémentaires" rows={2} />
        </section>

        {/* ✅ Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={handleBack} className="btn-secondary">Annuler</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Enregistrement…" : "💾 Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditActivityEditor;
