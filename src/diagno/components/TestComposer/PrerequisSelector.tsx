import React, { useEffect, useState } from "react";
import { supabase } from "@/backend/config/supabase";

interface Prerequis {
  id: number;
  description: string;
}

interface Props {
  chapitreId: number | null;
  selectedPrerequis: number[];
  onChange: (selected: number[]) => void;
}

const PrerequisSelector: React.FC<Props> = ({ chapitreId, selectedPrerequis, onChange }) => {
  const [prerequisList, setPrerequisList] = useState<Prerequis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chapitreId === null) {
      setPrerequisList([]);
      setError(null);
      return;
    }
    fetchPrerequis(chapitreId);
  }, [chapitreId]);

  const fetchPrerequis = async (chapId: number) => {
    setLoading(true);
    setError(null);
    setPrerequisList([]);

    try {
      // 1. Récupérer les prerequis_id liés au chapitre
      const { data: liaisonData, error: liaisonError } = await supabase
        .from("chapitre_prerequis")
        .select("prerequis_id")
        .eq("chapitre_id", chapId);

      if (liaisonError) throw liaisonError;

      if (!liaisonData || liaisonData.length === 0) {
        setPrerequisList([]);
        setError("Aucun prérequis associé à ce chapitre.");
        return;
      }

      const prerequisIds = liaisonData.map(item => item.prerequis_id);

      // 2. Récupérer les prérequis avec ces IDs
      const { data: prerequisData, error: prerequisError } = await supabase
        .from("prerequis")
        .select("id, description")
        .in("id", prerequisIds);

      if (prerequisError) throw prerequisError;

      if (!prerequisData || prerequisData.length === 0) {
        setPrerequisList([]);
        setError("Aucun prérequis trouvé pour les IDs donnés.");
        return;
      }

      setPrerequisList(prerequisData);
    } catch (err: any) {
      setError("Impossible de charger les prérequis.");
      console.error("Erreur chargement prérequis:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePrerequis = (id: number) => {
    if (selectedPrerequis.includes(id)) {
      onChange(selectedPrerequis.filter((pid) => pid !== id));
    } else {
      onChange([...selectedPrerequis, id]);
    }
  };

  if (chapitreId === null) {
    return <p className="italic text-gray-500">Veuillez sélectionner un chapitre pour voir les prérequis.</p>;
  }

  if (loading) {
    return <p className="italic text-gray-500">Chargement des prérequis...</p>;
  }

  if (error) {
    return <p className="text-red-600 italic">{error}</p>;
  }

  if (prerequisList.length === 0) {
    return <p className="italic text-gray-500">Aucun prérequis associé à ce chapitre.</p>;
  }

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">🔁 Prérequis associés</h3>
      <div className="flex flex-col gap-2 max-h-48 overflow-auto border border-gray-200 rounded p-2 bg-white">
        {prerequisList.map((p) => (
          <label key={p.id} className="inline-flex items-start gap-2">
            <input
              type="checkbox"
              checked={selectedPrerequis.includes(p.id)}
              onChange={() => togglePrerequis(p.id)}
            />
            <span>{p.description}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default PrerequisSelector;
