// ============================================================
// Titre : SequencesPage
// Chemin : src/components/planipeda/pages/SequencesPage.tsx

// ============================================================
// Titre : SequencesPage
// Chemin : src/components/planipeda/pages/SequencesPage.tsx
// Fonctionnalités :
//   - Page d'accueil affichant la liste des séquences pédagogiques.
//   - Permet de filtrer les séquences par niveau, option, unité et chapitre.
//   - Récupère les données des séquences en naviguant la hiérarchie complète.
//   - Offre des actions d'édition et de suppression pour chaque séquence.
//   - AMÉLIORATION: Affichage formaté de la durée estimée (HHh MMmin).
//   - MODIFICATION: Activation du bouton "Modifier" pour naviguer vers une page d'édition via URL.
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/backend/config/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Garde useNavigate pour les autres navigations
import { toast } from "sonner";

// IMPORT CORRIGÉ: Utilise l'exportation nommée pour sequencesService
import { sequencesService } from "@/services/sequencesService";

// --- REMOVED: L'import de EditSequenceModal n'est plus nécessaire car nous naviguons vers une page ---
// import EditSequenceModal from "./EditSequenceModal";

// --- Nouveaux types pour la structure des données avec jointures profondes ---
type Niveau = { id: number; nom_niveau: string };
type Option = { id: number; nom_option: string; niveau_id: number };
type Unite = { id: number; titre_unite: string; option_id: number };
type Chapitre = { id: number; titre_chapitre: string; unite_id: number };

interface FullSequenceDataFromDb {
  id: number;
  titre_sequence: string;
  objectifs_specifiques: string | null;
  duree_estimee: number | null;
  statut: string;
  chapitre: {
    id: number;
    titre_chapitre: string;
    unite: {
      id: number;
      titre_unite: string;
      option: {
        id: number;
        nom_option: string;
        niveau: {
          id: number;
          nom_niveau: string;
        };
      };
    };
  };
  description?: string | null;
  prerequis?: string | null;
  ordre?: number;
  created_by?: string;
  created_at?: string;
}

interface DisplaySequence {
  id: number;
  titre_sequence: string;
  objectifs_specifiques: string;
  duree_estimee_formatted: string;
  statut: string;
  niveauOption: string;
  unite: string;
  chapitre: string;
  niveau_id: number | null;
  option_id: number | null;
  unite_id: number | null;
  chapitre_id: number | null;
}

const SequencesPage: React.FC = () => {
  const navigate = useNavigate();

  const [allSequences, setAllSequences] = useState<DisplaySequence[]>([]);
  const [filteredSequences, setFilteredSequences] = useState<DisplaySequence[]>(
    []
  );

  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<
    { id: number; nom_option: string; niveau_id: number }[]
  >([]);
  const [unites, setUnites] = useState<
    { id: number; titre_unite: string; option_id: number }[]
  >([]);
  const [chapitres, setChapitres] = useState<
    { id: number; titre_chapitre: string; unite_id: number }[]
  >([]);

  const [selectedNiveau, setSelectedNiveau] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedUnite, setSelectedUnite] = useState<number | null>(null);
  const [selectedChapitre, setSelectedChapitre] = useState<number | null>(null);

  const [loadingSequences, setLoadingSequences] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // --- REMOVED: Les états de la modale d'édition ne sont plus nécessaires ---
  // const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // const [editingSequenceId, setEditingSequenceId] = useState<number | null>(null);

  const formatSequenceForDisplay = useCallback(
    (seq: FullSequenceDataFromDb): DisplaySequence => {
      const chapitre = seq.chapitre;
      const unite = chapitre?.unite;
      const option = unite?.option;
      const niveau = option?.niveau;

      const niveauOption = `${niveau?.nom_niveau ?? "-"} - ${
        option?.nom_option ?? "-"
      }`;

      const totalHours = seq.duree_estimee ?? 0;
      const hours = Math.floor(totalHours);
      const minutes = Math.round((totalHours - hours) * 60);

      let duree_estimee_formatted = "N/A";
      if (totalHours > 0) {
        duree_estimee_formatted = `${hours}h`;
        if (minutes > 0) {
          duree_estimee_formatted += ` ${minutes}min`;
        }
      } else if (totalHours === 0) {
        duree_estimee_formatted = "0h 0min";
      }

      return {
        id: seq.id,
        titre_sequence: seq.titre_sequence ?? "-",
        objectifs_specifiques: seq.objectifs_specifiques ?? "Aucun objectif spécifique",
        duree_estimee_formatted: duree_estimee_formatted,
        statut: seq.statut ?? "Inconnu",
        niveauOption,
        unite: unite?.titre_unite ?? "-",
        chapitre: chapitre?.titre_chapitre ?? "-",
        niveau_id: niveau?.id ?? null,
        option_id: option?.id ?? null,
        unite_id: unite?.id ?? null,
        chapitre_id: chapitre?.id ?? null,
      };
    },
    []
  );

  const fetchAndFormatSequences = useCallback(async () => {
    setLoadingSequences(true);
    const { data, error } = await sequencesService.getAllSequencesWithDetails();

    if (error) {
      console.error("Erreur récupération séquences:", error);
      toast.error(`Échec du chargement des séquences : ${error.message || "Erreur inconnue."}`);
      setLoadingSequences(false);
      return;
    }

    const formatted = data ? data.map(formatSequenceForDisplay) : [];
    setAllSequences(formatted);
    setFilteredSequences(formatted);
    setLoadingSequences(false);
  }, [formatSequenceForDisplay]);

  useEffect(() => {
    const fetchFilterData = async () => {
      setLoadingFilters(true);
      const [
        { data: niveauxData, error: niveauxError },
        { data: optionsData, error: optionsError },
        { data: unitesData, error: unitesError },
        { data: chapitresData, error: chapitresError },
      ] = await Promise.all([
        supabase.from("niveaux").select("id, nom_niveau"),
        supabase.from("options").select("id, nom_option, niveau_id"),
        supabase.from("unites").select("id, titre_unite, option_id"),
        supabase.from("chapitres").select("id, titre_chapitre, unite_id"),
      ]);

      if (niveauxError) console.error("Erreur chargement niveaux:", niveauxError);
      if (optionsError) console.error("Erreur chargement options:", optionsError);
      if (unitesError) console.error("Erreur chargement unités:", unitesError);
      if (chapitresError)
        console.error("Erreur chargement chapitres:", chapitresError);

      if (niveauxData) setNiveaux(niveauxData as Niveau[]);
      if (optionsData)
        setOptions(
          optionsData as { id: number; nom_option: string; niveau_id: number }[]
        );
      if (unitesData)
        setUnites(
          unitesData as { id: number; titre_unite: string; option_id: number }[]
        );
      if (chapitresData)
        setChapitres(
          chapitresData as {
            id: number;
            titre_chapitre: string;
            unite_id: number;
          }[]
        );

      setLoadingFilters(false);
    };

    fetchFilterData();
  }, []);

  useEffect(() => {
    if (loadingSequences || loadingFilters) return;

    let currentFilteredList = [...allSequences];

    if (selectedNiveau) {
      currentFilteredList = currentFilteredList.filter(
        (s) => s.niveau_id === selectedNiveau
      );
    }

    if (selectedOption) {
      currentFilteredList = currentFilteredList.filter(
        (s) => s.option_id === selectedOption
      );
    }

    if (selectedUnite) {
      currentFilteredList = currentFilteredList.filter(
        (s) => s.unite_id === selectedUnite
      );
    }

    if (selectedChapitre) {
      currentFilteredList = currentFilteredList.filter(
        (s) => s.chapitre_id === selectedChapitre
      );
    }

    setFilteredSequences(currentFilteredList);
  }, [
    selectedNiveau,
    selectedOption,
    selectedUnite,
    selectedChapitre,
    allSequences,
    loadingSequences,
    loadingFilters,
  ]);

  useEffect(() => {
    fetchAndFormatSequences();
  }, [fetchAndFormatSequences]);

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette séquence ? Cette action est irréversible."
      )
    ) {
      return;
    }

    toast.loading("Suppression en cours...", { id: "deleteToast" });

    const { success, error } = await sequencesService.deleteSequence(id);

    if (error) {
      toast.error(`Erreur lors de la suppression de la séquence : ${error.message}`, { id: "deleteToast" });
      return;
    }

    toast.success("Séquence supprimée avec succès !", { id: "deleteToast" });
    setAllSequences((prev) => prev.filter((s) => s.id !== id));
    setFilteredSequences((prev) => prev.filter((s) => s.id !== id));
  };

  /**
   * --- MODIFIED: Ouvre la page d'édition via React Router, au lieu d'une modale. ---
   * @param id L'ID de la séquence à éditer.
   */
  const handleEditClick = useCallback((id: number) => {
    // Navigue vers la nouvelle page d'édition.
    // Assurez-vous que votre configuration React Router gère cette route.
    navigate(`/planipeda/sequences/${id}/edit`);
  }, [navigate]);

  // --- REMOVED: Cette fonction n'est plus nécessaire car la page gère le rafraîchissement ---
  // const handleCloseEditModal = useCallback(() => {
  //   setIsEditModalOpen(false);
  //   setEditingSequenceId(null);
  //   fetchAndFormatSequences(); // Recharger les séquences pour refléter les modifications
  // }, [fetchAndFormatSequences]);

  return (
    <section className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => navigate("/planipeda")}>
          ← Retour
        </Button>
        <h1 className="text-2xl font-bold">Gestion des séquences pédagogiques</h1>
        <Button onClick={() => navigate("/planipeda/sequences/nouveau")}>
          <Plus className="mr-2 h-4 w-4" />
          Créer une séquence
        </Button>
      </div>

      {/* --- Filtres --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <select
          value={selectedNiveau ?? ""}
          onChange={(e) => {
            const value = Number(e.target.value) || null;
            setSelectedNiveau(value);
            setSelectedOption(null);
            setSelectedUnite(null);
            setSelectedChapitre(null);
          }}
          className="p-2 border rounded-md w-full"
          disabled={loadingFilters}
        >
          <option value="">Tous les niveaux</option>
          {niveaux.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nom_niveau}
            </option>
          ))}
        </select>

        <select
          value={selectedOption ?? ""}
          onChange={(e) => {
            const value = Number(e.target.value) || null;
            setSelectedOption(value);
            setSelectedUnite(null);
            setSelectedChapitre(null);
          }}
          disabled={!selectedNiveau || loadingFilters}
          className="p-2 border rounded-md w-full"
        >
          <option value="">Toutes les options</option>
          {options
            .filter((o) => !selectedNiveau || o.niveau_id === selectedNiveau)
            .map((o) => (
              <option key={o.id} value={o.id}>
                {o.nom_option}
              </option>
            ))}
        </select>

        <select
          value={selectedUnite ?? ""}
          onChange={(e) => {
            const value = Number(e.target.value) || null;
            setSelectedUnite(value);
            setSelectedChapitre(null);
          }}
          disabled={!selectedOption || loadingFilters}
          className="p-2 border rounded-md w-full"
        >
          <option value="">Toutes les unités</option>
          {unites
            .filter((u) => !selectedOption || u.option_id === selectedOption)
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.titre_unite}
              </option>
            ))}
        </select>

        <select
          value={selectedChapitre ?? ""}
          onChange={(e) => {
            const value = Number(e.target.value) || null;
            setSelectedChapitre(value);
          }}
          disabled={!selectedUnite || loadingFilters}
          className="p-2 border rounded-md w-full"
        >
          <option value="">Tous les chapitres</option>
          {chapitres
            .filter((c) => !selectedUnite || c.unite_id === selectedUnite)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.titre_chapitre}
              </option>
            ))}
        </select>
      </div>

      {/* --- Tableau des Séquences --- */}
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white text-left text-sm font-semibold uppercase tracking-wider">
              <th className="p-3 border-r border-blue-700">Niveau & Option</th>
              <th className="p-3 border-r border-blue-700">Unité</th>
              <th className="p-3 border-r border-blue-700">Chapitre</th>
              <th className="p-3 border-r border-blue-700">Titre de la séquence</th>
              <th className="p-3 border-r border-blue-700">Objectifs spécifiques</th>
              <th className="p-3 border-r border-blue-700">Durée estimée</th>
              <th className="p-3 border-r border-blue-700">Statut</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loadingSequences || loadingFilters ? (
              <tr>
                <td colSpan={8} className="text-center p-4 text-gray-600">
                  Chargement des séquences...
                </td>
              </tr>
            ) : filteredSequences.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-4 text-gray-600">
                  Aucune séquence trouvée.
                </td>
              </tr>
            ) : (
              filteredSequences.map((seq) => (
                <tr
                  key={seq.id}
                  className="hover:bg-gray-50 transition duration-150 ease-in-out"
                >
                  <td className="p-3 text-gray-800 font-medium">{seq.niveauOption}</td>
                  <td className="p-3 text-gray-700">{seq.unite}</td>
                  <td className="p-3 text-gray-700">{seq.chapitre}</td>
                  <td className="p-3 text-gray-700">{seq.titre_sequence}</td>
                  <td className="p-3 text-gray-700">{seq.objectifs_specifiques}</td>
                  <td className="p-3 text-gray-700">{seq.duree_estimee_formatted}</td>
                  <td className="p-3 text-gray-700">{seq.statut}</td>
                  <td className="p-3 text-center">
                      {/* MODIFIED: Appel de la nouvelle fonction */}
<Button
  variant="outline"
  size="sm"
  onClick={() => handleEditClick(seq.id)}
  className="mr-2 text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
  title="Modifier la séquence"
>
  <Pencil className="h-4 w-4" />
</Button>

<Button
  variant="outline"
  size="sm"
  onClick={() => handleDelete(seq.id)}
  className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white transition-colors"
  title="Supprimer la séquence"
>
  <Trash2 className="h-4 w-4" />
</Button>

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- REMOVED: Le composant de la modale d'édition n'est plus rendu ici --- */}
      {/*
      <EditSequenceModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        sequenceId={editingSequenceId}
        onSequenceUpdated={handleCloseEditModal}
      />
      */}
    </section>
  );
};

export default SequencesPage;