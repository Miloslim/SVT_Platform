// 📁 Gestion des activités pédagogiques avec filtres hiérarchiques
// src/components/planipeda/pages/ActivitesPage2.tsx

import React, { useEffect, useState } from "react";
import { supabase } from "@/backend/config/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// 🧩 Types
type Activite = {
  id: number;
  titre_activite: string | null;
  niveauOption: string; // ex: "1ère S - Option Bio"
  unite: string | null;
  chapitre: string | null;
  objectifs: string;
};

type Niveau = { id: number; nom_niveau: string };
type Option = { id: number; nom_option: string; niveau_id: number };
type Unite = { id: number; titre_unite: string; option_id: number };
type Chapitre = { id: number; titre_chapitre: string; unite_id: number };

const ActivitesPage: React.FC = () => {
  const navigate = useNavigate();

  // États des données
  const [activites, setActivites] = useState<Activite[]>([]);
  const [filtered, setFiltered] = useState<Activite[]>([]);

  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [chapitres, setChapitres] = useState<Chapitre[]>([]);

  // États des sélections
  const [selectedNiveau, setSelectedNiveau] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedUnite, setSelectedUnite] = useState<number | null>(null);
  const [selectedChapitre, setSelectedChapitre] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [filtersReady, setFiltersReady] = useState<boolean>(false);

  // 🔄 Charger les activités avec jointures pour récupérer hiérarchie + objectifs
  useEffect(() => {
    const fetchActivites = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("activites")
        .select(`
          id,
          titre_activite,
          chapitre:chapitre_id (
            id,
            titre_chapitre,
            unite:unite_id (
              id,
              titre_unite,
              option:option_id (
                id,
                nom_option,
                niveau:niveau_id (
                  id,
                  nom_niveau
                )
              )
            )
          ),
          activite_objectifs (
            objectifs:objectifs (
              description_objectif
            )
          )
        `);

      if (error) {
        console.error("Erreur récupération activités:", error);
        setLoading(false);
        return;
      }

      // Formatage des données pour affichage clair
      const formatted = data?.map((act: any) => {
        const chapitre = act.chapitre;
        const unite = chapitre?.unite;
        const option = unite?.option;
        const niveau = option?.niveau;

        const niveauOption = `${niveau?.nom_niveau ?? "-"} - ${option?.nom_option ?? "-"}`;
        const objectifsArr = act.activite_objectifs?.map((ao: any) => ao.objectifs?.description_objectif).filter(Boolean) || [];
    

       return {
    id: act.id,
    titre_activite: act.titre_activite ?? "-",
    niveauOption,
    unite: unite?.titre_unite ?? "-",
    chapitre: chapitre?.titre_chapitre ?? "-",
    objectifs: objectifsArr.length > 0 ? objectifsArr : ["Aucun objectif"],
  };
}) || [];

      setActivites(formatted);
      setFiltered(formatted);
      setLoading(false);
    };

    fetchActivites();
  }, []);

  // 🔄 Charger les données pour les filtres hiérarchiques (niveaux, options, unités, chapitres)
  useEffect(() => {
    const fetchFilters = async () => {
      const [
        { data: niveaux, error: errNiveaux },
        { data: options, error: errOptions },
        { data: unites, error: errUnites },
        { data: chapitres, error: errChapitres },
      ] = await Promise.all([
        supabase.from("niveaux").select("*"),
        supabase.from("options").select("*"),
        supabase.from("unites").select("*"),
        supabase.from("chapitres").select("*"),
      ]);

      if (errNiveaux || errOptions || errUnites || errChapitres) {
        console.error("Erreur récupération filtres:", errNiveaux || errOptions || errUnites || errChapitres);
        return;
      }

      if (niveaux) setNiveaux(niveaux);
      if (options) setOptions(options);
      if (unites) setUnites(unites);
      if (chapitres) setChapitres(chapitres);

      setFiltersReady(true);
    };

    fetchFilters();
  }, []);

  // 🔍 Fonction d'application des filtres
  const applyFilters = () => {
    let filteredList = [...activites];

    if (selectedNiveau) {
      const niveauNom = niveaux.find((n) => n.id === selectedNiveau)?.nom_niveau ?? "";
      filteredList = filteredList.filter((a) => a.niveauOption.startsWith(niveauNom));
    }

    if (selectedOption) {
      const optionNom = options.find((o) => o.id === selectedOption)?.nom_option ?? "";
      filteredList = filteredList.filter((a) => a.niveauOption.includes(optionNom));
    }

    if (selectedUnite) {
      const uniteNom = unites.find((u) => u.id === selectedUnite)?.titre_unite ?? "";
      filteredList = filteredList.filter((a) => a.unite === uniteNom);
    }

    if (selectedChapitre) {
      const chapitreNom = chapitres.find((c) => c.id === selectedChapitre)?.titre_chapitre ?? "";
      filteredList = filteredList.filter((a) => a.chapitre === chapitreNom);
    }

    setFiltered(filteredList);
  };

  // 🔁 Réappliquer les filtres à chaque changement de sélection ou données chargées
  useEffect(() => {
    if (!filtersReady) return;
    applyFilters();
  }, [selectedNiveau, selectedOption, selectedUnite, selectedChapitre, activites, filtersReady]);

  // ❌ Suppression d’une activité
  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer cette activité ?")) return;

    const { error } = await supabase.from("activites").delete().eq("id", id);
    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
      return;
    }

    // Mise à jour locale
    setActivites((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <section className="p-6 space-y-8">
      {/* En-tête avec bouton retour et création */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate(-1)}>← Retour</Button>
        <h1 className="text-2xl font-bold">Gestion des activités d’apprentissage</h1>
        <Button onClick={() => navigate("/activites/nouveau")}>
          <Plus className="mr-2 h-4 w-4" />
          Créer une activité
        </Button>
      </div>

      {/* Filtres hiérarchiques */}
      <div className="grid grid-cols-4 gap-4">
        {/* Niveau */}
        <select
          value={selectedNiveau ?? ""}
          onChange={(e) => {
            const value = Number(e.target.value) || null;
            setSelectedNiveau(value);
            setSelectedOption(null);
            setSelectedUnite(null);
            setSelectedChapitre(null);
          }}
        >
          <option value="">Tous les niveaux</option>
          {niveaux.map((n) => (
            <option key={n.id} value={n.id}>{n.nom_niveau}</option>
          ))}
        </select>

        {/* Option */}
        <select
          value={selectedOption ?? ""}
          onChange={(e) => {
            const value = Number(e.target.value) || null;
            setSelectedOption(value);
            setSelectedUnite(null);
            setSelectedChapitre(null);
          }}
          disabled={!selectedNiveau}
        >
          <option value="">Toutes les options</option>
          {options
            .filter((o) => !selectedNiveau || o.niveau_id === selectedNiveau)
            .map((o) => (
              <option key={o.id} value={o.id}>{o.nom_option}</option>
            ))}
        </select>

        {/* Unité */}
        <select
          value={selectedUnite ?? ""}
          onChange={(e) => {
            const value = Number(e.target.value) || null;
            setSelectedUnite(value);
            setSelectedChapitre(null);
          }}
          disabled={!selectedOption}
        >
          <option value="">Toutes les unités</option>
          {unites
            .filter((u) => !selectedOption || u.option_id === selectedOption)
            .map((u) => (
              <option key={u.id} value={u.id}>{u.titre_unite}</option>
            ))}
        </select>

        {/* Chapitre */}
        <select
          value={selectedChapitre ?? ""}
          onChange={(e) => {
            const value = Number(e.target.value) || null;
            setSelectedChapitre(value);
          }}
          disabled={!selectedUnite}
        >
          <option value="">Tous les chapitres</option>
          {chapitres
            .filter((c) => !selectedUnite || c.unite_id === selectedUnite)
            .map((c) => (
              <option key={c.id} value={c.id}>{c.titre_chapitre}</option>
            ))}
        </select>
      </div>

      {/* Tableau des activités */}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">Niveau & Option</th>
              <th className="border px-3 py-2">Unité</th>
              <th className="border px-3 py-2">Chapitre</th>
              <th className="border px-3 py-2">Titre activité</th>
              <th className="border px-3 py-2">Objectifs</th>
              <th className="border px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-4">Chargement...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4">Aucune activité trouvée.</td>
              </tr>
            ) : (
              filtered.map((act) => (
                <tr key={act.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{act.niveauOption}</td>
                  <td className="border px-3 py-2">{act.unite}</td>
                  <td className="border px-3 py-2">{act.chapitre}</td>
                  <td className="border px-3 py-2">{act.titre_activite}</td>
                  <td className="border px-3 py-2 max-w-xs">
                        <ul className="list-disc list-inside">
                          {act.objectifs.map((obj: string, idx: number) => (
                            <li key={idx}>{obj}</li>
                          ))}
                        </ul>
                   </td>

                  <td className="border px-3 py-2 text-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Modifier"
                      onClick={() => navigate(`/activites/modifier/${act.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Supprimer"
                      onClick={() => handleDelete(act.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ActivitesPage;
