import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // navigation react-router
import HierarchicalSelector from "./HierarchicalSelector";
import { supabase } from "@/backend/config/supabase";

interface Activity {
  id?: number;
  chapitre_id: number | null;
  titre: string;
  description: string;
  roleEnseignant: string;
  materiel: string;
  duree_minutes: number | null;
  modaliteDeroulement: string;
  modaliteEvaluation: string;
  commentaires: string;
  objectifIds: number[];
}

interface ActivityEditorProps {
  initialData?: Activity;
  onSaved?: () => void;
  onCancel?: () => void; // callback pour bouton retour
}

const ActivityEditor: React.FC<ActivityEditorProps> = ({
  initialData,
  onSaved,
  onCancel,
}) => {
  const navigate = useNavigate();

  // États des champs du formulaire
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

  // États pour gestion UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialisation des champs au montage ou changement de initialData
  useEffect(() => {
    if (initialData) {
      setTitre(initialData.titre || "");
      setDescription(initialData.description || "");
      setRoleEnseignant(initialData.roleEnseignant || "");
      setMateriel(initialData.materiel || "");
      setDureeMinutes(
        typeof initialData.duree_minutes === "number" && initialData.duree_minutes >= 0
          ? initialData.duree_minutes
          : ""
      );
      setModaliteDeroulement(initialData.modaliteDeroulement || "");
      setModaliteEvaluation(initialData.modaliteEvaluation || "");
      setCommentaires(initialData.commentaires || "");
      setChapitreId(
        typeof initialData.chapitre_id === "number" && initialData.chapitre_id > 0
          ? initialData.chapitre_id
          : null
      );
      setObjectifIds(initialData.objectifIds || []);
    }
  }, [initialData]);

  // Nettoyage des timers au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Gestion du changement dans le sélecteur hiérarchique
  const handleSelectionChange = (selection: {
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
    chapitreId?: number | null;
    objectifIds?: number[];
  }) => {
    setChapitreId(selection.chapitreId && selection.chapitreId > 0 ? selection.chapitreId : null);
    setObjectifIds(selection.objectifIds ?? []);
  };

  // Réinitialisation complète du formulaire
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
  };

  // Sauvegarde de l'activité dans la base
  const handleSave = async () => {
    setSuccessMessage(null);

    // Validation avant soumission
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
      // Préparation des données pour upsert
const upsertData: any = {
  chapitre_id: chapitreId,
  titre_activite: titre,
  description,
  role_enseignant: roleEnseignant, // OK car la clé correspond à la colonne
  materiel,
  duree_minutes: typeof dureeMinutes === "number" ? dureeMinutes : null,
  modalite_deroulement: modaliteDeroulement,
  modalite_evaluation: modaliteEvaluation,
  commentaires,
};


      // Ajout de l'id si on est en modification
      if (typeof initialData?.id === "number" && initialData.id > 0) {
        upsertData.id = initialData.id;
      }

      // Enregistrement activité (insert ou update)
      const { data: savedActivity, error: errorActivity } = await supabase
        .from("activites")
        .upsert(upsertData)
        .select()
        .single();

      if (errorActivity) throw errorActivity;

      // Mise à jour des liens objectifs (suppression puis insertion)
      await supabase.from("activite_objectifs").delete().eq("activite_id", savedActivity.id);
      if (objectifIds.length > 0) {
        const liens = objectifIds.map((objectif_id) => ({
          activite_id: savedActivity.id,
          objectif_id,
        }));
        const { error: errorInsert } = await supabase.from("activite_objectifs").insert(liens);
        if (errorInsert) throw errorInsert;
      }

      setSaving(false);
      setSuccessMessage(
        initialData?.id ? "Activité modifiée avec succès." : "Activité créée avec succès."
      );
      if (!initialData?.id) resetForm();

      timeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error("Erreur de sauvegarde :", err);
      setError("Erreur : " + (err.message ?? String(err)));
      setSaving(false);
    }
  };

  // Gestion du bouton retour : callback ou navigation arrière
  const handleBack = () => {
    if (onCancel) onCancel();
    else navigate(-1);
  };

  // Formulaire commun à création et modification
  const commonFormSections = (
    <>
      {/* Sélecteur hiérarchique emplacement + objectifs */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Emplacement de l’activité</h3>
        <HierarchicalSelector
          showChapitre
          showObjectifs
          onChange={handleSelectionChange}
          initialChapitreId={chapitreId}
          initialObjectifIds={objectifIds}
        />
      </section>

      {/* Informations générales */}
      <section className="mb-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Informations générales</h3>
        <div>
          <label className="block font-medium mb-1">Titre de l’activité</label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Titre de l’activité"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Décrire l'activité dans ses grandes lignes"
          />
        </div>
      </section>

      {/* Détails pédagogiques */}
      <section className="mb-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Détails pédagogiques</h3>
        <div>
          <label className="block font-medium mb-1">Rôle de l’enseignant</label>
          <textarea
            value={roleEnseignant}
            onChange={(e) => setRoleEnseignant(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Ex : guider les élèves dans la manipulation"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Matériel nécessaire</label>
          <textarea
            value={materiel}
            onChange={(e) => setMateriel(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Ex : microscopes, lames, colorant"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Durée (en minutes)</label>
          <input
            type="number"
            min={0}
            value={dureeMinutes}
            onChange={(e) =>
              setDureeMinutes(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full border rounded px-3 py-2"
            placeholder="Ex : 45"
          />
        </div>
      </section>

      {/* Modalités */}
      <section className="mb-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Modalités</h3>
        <div>
          <label className="block font-medium mb-1">Déroulement</label>
          <textarea
            value={modaliteDeroulement}
            onChange={(e) => setModaliteDeroulement(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Décrire comment se déroule l’activité"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Évaluation</label>
          <textarea
            value={modaliteEvaluation}
            onChange={(e) => setModaliteEvaluation(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Comment les acquis seront-ils évalués ?"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Commentaires</label>
          <textarea
            value={commentaires}
            onChange={(e) => setCommentaires(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Commentaires ou remarques supplémentaires"
          />
        </div>
      </section>
    </>
  );

 return (
  <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
    <h2 className="text-2xl font-bold mb-6">
      {initialData?.id
        ? "Modifier une activité d’apprentissage"
        : "Créer une nouvelle activité d’apprentissage"}
    </h2>

    {/* On supprime les messages ici (en haut) */}
    {/* {error && <p className="text-red-600 mb-4">{error}</p>}
    {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>} */}

    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      {commonFormSections}

      {/* Message affiché ici, juste avant les boutons */}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}

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
          {saving
            ? initialData?.id
              ? "Modification..."
              : "Création..."
            : initialData?.id
            ? "Modifier"
            : "Créer"}
        </button>
      </div>
    </form>
  </div>
);

};

export default ActivityEditor;
