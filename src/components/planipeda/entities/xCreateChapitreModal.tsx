/**
 * 📌 Fichier : CreateChapitreModal.tsx
 * 📍 Chemin : src/components/planipeda/entities/CreateChapitreModal.tsx
 * 🎯 Objectif : Formulaire modale pour ajouter un nouveau chapitre en base Supabase.
 */
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/backend/config/supabase";

interface Unite {
  id: number;
  titre_unite: string;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const CreateChapitreModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [titre, setTitre] = useState("");
  const [unites, setUnites] = useState<Unite[]>([]);
  const [selectedUnite, setSelectedUnite] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form (utile aussi à la fermeture)
  const resetForm = () => {
    setTitre("");
    setSelectedUnite(unites.length > 0 ? unites[0].id : "");
    setErrorMsg(null);
  };

  // Charger la liste des unités au montage
  useEffect(() => {
    const fetchUnites = async () => {
      setErrorMsg(null);
      const { data, error } = await supabase
        .from("unites")
        .select("id, titre_unite")
        .order("titre_unite", { ascending: true });

      if (error) {
        setErrorMsg("Erreur lors du chargement des unités : " + error.message);
        setUnites([]);
        setSelectedUnite("");
      } else {
        setUnites(data ?? []);
        // Sélectionner la première unité si disponible
        if (data && data.length > 0) {
          setSelectedUnite(data[0].id);
        } else {
          setSelectedUnite("");
        }
      }
    };

    fetchUnites();
  }, []);

  // Si la liste d'unités change, on peut aussi reseter la sélection
  useEffect(() => {
    if (unites.length > 0) {
      setSelectedUnite(unites[0].id);
    } else {
      setSelectedUnite("");
    }
  }, [unites]);

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!titre.trim()) {
      setErrorMsg("Le titre du chapitre est requis.");
      return;
    }
    if (!selectedUnite) {
      setErrorMsg("Veuillez sélectionner une unité.");
      return;
    }

    setLoading(true);

    try {
      // Vérification connexion user (optionnel selon contexte)
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setErrorMsg("Vous devez être connecté pour ajouter un chapitre.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("chapitres").insert([
        {
          titre_chapitre: titre.trim(),
          unite_id: selectedUnite,
        },
      ]);

      if (error) {
        setErrorMsg("Erreur lors de l'ajout : " + error.message);
      } else {
        resetForm();
        onCreated();
        onClose();
      }
    } catch (err) {
      setErrorMsg("Erreur inattendue : " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Ajouter un nouveau chapitre</h2>

      {errorMsg && <p className="text-red-600">{errorMsg}</p>}

      <div>
        <label htmlFor="titre" className="block mb-1 font-medium">
          Titre du chapitre
        </label>
        <input
          id="titre"
          type="text"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          className="w-full border rounded px-3 py-2"
          disabled={loading}
          required
          placeholder="Ex : Chapitre 1 - Introduction"
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="unite" className="block mb-1 font-medium">
          Unité
        </label>
        <select
          id="unite"
          value={selectedUnite}
          onChange={(e) => setSelectedUnite(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
          disabled={loading || unites.length === 0}
          required
        >
          {unites.length === 0 && (
            <option value="" disabled>
              Aucune unité disponible
            </option>
          )}
          {unites.map((u) => (
            <option key={u.id} value={u.id}>
              {u.titre_unite}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => { resetForm(); onClose(); }} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Ajout en cours..." : "Ajouter"}
        </Button>
      </div>
    </form>
  );
};

export default CreateChapitreModal;
