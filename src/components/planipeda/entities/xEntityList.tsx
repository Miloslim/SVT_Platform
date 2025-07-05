import React, { useEffect, useState } from "react";
import { supabase } from "@/backend/config/supabase";

interface EntityListProps {
  entityType: "niveaux" | "options" | "unites" | "chapitres" | "objectifs";
}

const EntityList: React.FC<EntityListProps> = ({ entityType }) => {
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const fetchEntities = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(entityType).select("*");

    if (error) {
      console.error(`Erreur lors du chargement des ${entityType}:`, error.message);
    } else {
      setEntities(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchEntities();
  }, [entityType]);

  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setEditValue(item.nom || item.titre || item.libelle || "");
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    const fieldName =
      entityType === "niveaux" ? "nom" :
      entityType === "options" ? "nom" :
      entityType === "unites" ? "titre" :
      entityType === "chapitres" ? "titre" :
      entityType === "objectifs" ? "libelle" :
      "nom";

    const { error } = await supabase
      .from(entityType)
      .update({ [fieldName]: editValue })
      .eq("id", editingId);

    if (error) {
      console.error("Erreur lors de la mise à jour :", error.message);
    } else {
      setEditingId(null);
      setEditValue("");
      fetchEntities();
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-4">Liste des {entityType}</h3>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <ul className="space-y-2">
          {entities.map((item) => (
            <li key={item.id} className="p-2 border rounded shadow-sm bg-white flex justify-between items-center">
              {editingId === item.id ? (
                <div className="flex gap-2 w-full">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="border p-1 flex-1"
                  />
                  <button onClick={handleUpdate} className="bg-blue-500 text-white px-2 rounded">Enregistrer</button>
                  <button onClick={() => setEditingId(null)} className="bg-gray-300 px-2 rounded">Annuler</button>
                </div>
              ) : (
                <>
                  <span>{item.nom || item.titre || item.libelle || item.id}</span>
                  <button onClick={() => handleEditClick(item)} className="text-blue-500 hover:underline">Modifier</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EntityList;
