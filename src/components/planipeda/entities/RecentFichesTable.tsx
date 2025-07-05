// src/components/planipeda/RecentFichesTable.tsx

import React, { useEffect, useState } from "react";
import { Pencil, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/backend/config/supabase";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FichePlanificationItem {
  id: number;
  nom_fiche_planification: string;
  statut: "Brouillon" | "Finalisé" | "Archivé";
  date_creation: string;
  chapitre_id: {
    titre_chapitre: string;
    unite: {
      titre_unite: string;
      option: {
        nom_option: string;
        niveau: {
          nom_niveau: string;
        };
      };
    };
  };
}

const RecentFichesTable: React.FC = () => {
  const [recentFiches, setRecentFiches] = useState<FichePlanificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentFiches = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("chapfiches")
        .select(`
          id,
          nom_fiche_planification,
          statut,
          date_creation,
          chapitre_id(
            titre_chapitre,
            unite:unite_id(
              titre_unite,
              option:option_id(
                nom_option,
                niveau:niveau_id(nom_niveau)
              )
            )
          )
        `)
        .order("updated_at", { ascending: false })
        .limit(3);

      if (!error && data) {
        setRecentFiches(data);
      } else {
        console.error("Erreur lors de la récupération des dernières fiches:", error);
      }
      setLoading(false);
    };

    fetchRecentFiches();
  }, []);

return (
  <section className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200">
    <div className="p-6 flex items-center justify-between">
      <h2 className="text-2xl font-semibold text-gray-800">
        🕓 Dernières fiches modifiées
      </h2>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-gray-700">
        <thead className="bg-green-50 text-xs text-gray-500 uppercase border-t border-b border-gray-200">
          <tr>
            <th className="px-5 py-3 text-left">Titre</th>
            <th className="px-5 py-3 text-left">Niveau & Option</th>
            <th className="px-5 py-3 text-left">Chapitre</th>
            <th className="px-5 py-3 text-left">Statut</th>
            <th className="px-5 py-3 text-left">Date</th>
            <th className="px-5 py-3 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-6 text-gray-500 italic">
                Chargement...
              </td>
            </tr>
          ) : recentFiches.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-6 text-gray-500 italic">
                Aucune fiche récente trouvée.
              </td>
            </tr>
          ) : (
            recentFiches.map((fiche) => {
              const niveauOption = `${fiche.chapitre_id?.unite?.option?.niveau?.nom_niveau ?? "-"} - ${fiche.chapitre_id?.unite?.option?.nom_option ?? "-"}`;

              return (
                <tr key={fiche.id} className="hover:bg-gray-50 transition duration-150 border-t">
                  <td className="px-5 py-3 font-medium text-gray-800">{fiche.nom_fiche_planification}</td>
                  <td className="px-5 py-3">{niveauOption}</td>
                  <td className="px-5 py-3">{fiche.chapitre_id?.titre_chapitre ?? "-"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-3 py-1 text-xs rounded-full font-semibold
                        ${fiche.statut === "Finalisé"
                          ? "bg-green-100 text-green-800"
                          : fiche.statut === "Archivé"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {fiche.statut}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {new Date(fiche.date_creation).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/planipeda/planification-chapitre/${fiche.id}/edit`)}
                        className="text-blue-600 border-blue-500 hover:bg-blue-600 hover:text-white"
                      >
                        <Pencil size={16} className="mr-1" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-gray-600 border-gray-400 hover:bg-gray-100"
                      >
                        <Eye size={16} className="mr-1" />
                        Voir
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </section>
);

};

export default RecentFichesTable;
