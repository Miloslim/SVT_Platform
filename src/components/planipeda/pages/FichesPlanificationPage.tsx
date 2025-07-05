// 📁 src/components/planipeda/pages/FichesPlanificationPage.tsx

/**
 * Page de gestion des fiches de planification de chapitre
 * 
 * Fonctionnalités:
 * - Affiche liste paginée filtrable par hiérarchie (niveau, option, unité, chapitre)
 * - Recherche textuelle sur le titre de la fiche pédagogique
 * - Actions: créer, modifier, supprimer, exporter (CSV simple)
 * - Utilise Supabase pour données et notifications toast pour retours utilisateur
 * - Suppression de la colonne "Créé par"
 * - Exporter les données d'une fiche vers un format Doc
 */

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/backend/config/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { notifySuccess, notifyError } from "@/backend/utils/notificationHelpers";
import CustomModal from '@/components/common/CustomModal';
import { Loader2 } from 'lucide-react';
//Gérer les importation EXPORT
import { FileText } from "lucide-react";
import { generateFicheDocx } from "@/exports/generators/docx/ficheToDocx";
import { exportFicheDocx } from "@/exports/generators/docx/ficheToDocx";

// --- TYPES ---
interface FichePlanificationList {
  id: number;
  nom_fiche_planification: string;
  statut: 'Brouillon' | 'Finalisé' | 'Archivé';
  date_creation: string;
  titre_chapitre: string;
  titre_unite: string;
  nom_option: string;
  nom_niveau: string;
  niveauOption: string;
}

type Niveau = { id: number; nom_niveau: string };
type Option = { id: number; nom_option: string; niveau_id: number };
type Unite = { id: number; titre_unite: string; option_id: number };
type Chapitre = { id: number; titre_chapitre: string; unite_id: number };

// --- COMPOSANT PRINCIPAL ---
const FichesPlanificationPage: React.FC = () => {
  const navigate = useNavigate();

  // --- États ---
  const [fichesPlanification, setFichesPlanification] = useState<FichePlanificationList[]>([]);
  const [filteredFiches, setFilteredFiches] = useState<FichePlanificationList[]>([]);

  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [unites, setUnites] = useState<Unite[]>([]);
  const [chapitres, setChapitres] = useState<Chapitre[]>([]);

  const [selectedNiveau, setSelectedNiveau] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedUnite, setSelectedUnite] = useState<number | null>(null);
  const [selectedChapitre, setSelectedChapitre] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [filtersReady, setFiltersReady] = useState(false);

  // Modal confirmation suppression
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [ficheToDeleteId, setFicheToDeleteId] = useState<number | null>(null);

  // Recherche textuelle sur le titre de la fiche pédagogique
  const [searchTerm, setSearchTerm] = useState("");

  // --- Fonction d'application des filtres (sélection + recherche) ---
  const applyFilters = useCallback(() => {
    let currentFiltered = [...fichesPlanification];

    // Filtrage par niveau
    if (selectedNiveau) {
      const niveauNom = niveaux.find(n => n.id === selectedNiveau)?.nom_niveau;
      if (niveauNom) currentFiltered = currentFiltered.filter(f => f.nom_niveau === niveauNom);
    }

    // Filtrage par option
    if (selectedOption) {
      const optionNom = options.find(o => o.id === selectedOption)?.nom_option;
      if (optionNom) currentFiltered = currentFiltered.filter(f => f.nom_option === optionNom);
    }

    // Filtrage par unité
    if (selectedUnite) {
      const uniteNom = unites.find(u => u.id === selectedUnite)?.titre_unite;
      if (uniteNom) currentFiltered = currentFiltered.filter(f => f.titre_unite === uniteNom);
    }

    // Filtrage par chapitre
    if (selectedChapitre) {
      const chapitreNom = chapitres.find(c => c.id === selectedChapitre)?.titre_chapitre;
      if (chapitreNom) currentFiltered = currentFiltered.filter(f => f.titre_chapitre === chapitreNom);
    }

    // Filtrage recherche textuelle sur nom_fiche_planification
    if (searchTerm.trim() !== "") {
      currentFiltered = currentFiltered.filter(f =>
        f.nom_fiche_planification.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFiches(currentFiltered);
  }, [
    fichesPlanification,
    selectedNiveau,
    selectedOption,
    selectedUnite,
    selectedChapitre,
    niveaux,
    options,
    unites,
    chapitres,
    searchTerm,
  ]);

  // --- Effet: appliquer filtres quand dépendances changent ---
  useEffect(() => {
    if (filtersReady) {
      applyFilters();
    }
  }, [selectedNiveau, selectedOption, selectedUnite, selectedChapitre, fichesPlanification, filtersReady, applyFilters, searchTerm]);

  // --- Chargement initial des fiches ---
  useEffect(() => {
    const fetchFichesPlanification = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("chapfiches")
        .select(`
          id,
          nom_fiche_planification,
          statut,
          date_creation,
          chapitre_id(
            id,
            titre_chapitre,
            unite:unite_id(
              id,
              titre_unite,
              option:option_id(
                id,
                nom_option,
                niveau:niveau_id(
                  id,
                  nom_niveau
                )
              )
            )
          )
        `);

      if (error) {
        console.error("Erreur récupération fiches :", error);
        notifyError(`Échec du chargement : ${error.message || "Erreur inconnue."}`);
        setLoading(false);
        return;
      }

      // Mise en forme des données pour l'affichage
      const formattedData = data.map((fiche: any) => {
        const chapitre = fiche.chapitre_id;
        const unite = chapitre?.unite;
        const option = unite?.option;
        const niveau = option?.niveau;

        const niveauOption = `${niveau?.nom_niveau ?? "N/A"} - ${option?.nom_option ?? "N/A"}`;

        return {
          id: fiche.id,
          nom_fiche_planification: fiche.nom_fiche_planification ?? "Sans titre",
          statut: fiche.statut as 'Brouillon' | 'Finalisé' | 'Archivé' ?? "Brouillon",
          date_creation: new Date(fiche.date_creation).toLocaleDateString('fr-FR'),
          titre_chapitre: chapitre?.titre_chapitre ?? "N/A",
          titre_unite: unite?.titre_unite ?? "N/A",
          nom_option: option?.nom_option ?? "N/A",
          nom_niveau: niveau?.nom_niveau ?? "N/A",
          niveauOption,
        };
      });

      setFichesPlanification(formattedData);
      setFilteredFiches(formattedData);
      setLoading(false);
    };

    fetchFichesPlanification();
  }, []);

  // --- Chargement des données de filtres ---
  useEffect(() => {
    const fetchFilters = async () => {
      const [
        { data: niveauxData },
        { data: optionsData },
        { data: unitesData },
        { data: chapitresData }
      ] = await Promise.all([
        supabase.from("niveaux").select("*"),
        supabase.from("options").select("*"),
        supabase.from("unites").select("*"),
        supabase.from("chapitres").select("*"),
      ]);

      if (niveauxData) setNiveaux(niveauxData);
      if (optionsData) setOptions(optionsData);
      if (unitesData) setUnites(unitesData);
      if (chapitresData) setChapitres(chapitresData);

      setFiltersReady(true);
    };

    fetchFilters();
  }, []);

  // --- Navigation ---
  const handleCreate = () => navigate("/planipeda/planification-chapitre/nouveau");
  const handleEdit = (id: number) => navigate(`/planipeda/planification-chapitre/${id}/edit`);

  // --- Suppression de fiche ---
  const confirmDelete = (id: number) => {
    setFicheToDeleteId(id);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (ficheToDeleteId === null) return;

    setShowConfirmModal(false);
    setLoading(true);

    try {
      const { error } = await supabase.from("chapfiches").delete().eq("id", ficheToDeleteId);
      if (error) {
        notifyError(`Échec suppression : ${error.message}`);
        setLoading(false);
        return;
      }
      notifySuccess("Fiche supprimée avec succès !");
      setFichesPlanification(prev => prev.filter(f => f.id !== ficheToDeleteId));
      setFicheToDeleteId(null);
    } catch (err: any) {
      notifyError(`Erreur inattendue : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setFicheToDeleteId(null);
  };

  // --- Export CSV simple ---
  const handleExport = (fiche: FichePlanificationList) => {
    // Prépare un CSV basique (adaptable selon besoins)
    const headers = ["ID", "Statut", "Niveau - Option", "Unité", "Chapitre", "Date de création"];
    const rows = [
      [
        fiche.id,
        fiche.statut,
        fiche.niveauOption,
        fiche.titre_unite,
        fiche.titre_chapitre,
        fiche.date_creation
      ]
    ];
    const csvContent = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `fiche_planification_${fiche.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notifySuccess(`Export CSV fiche #${fiche.id} téléchargé`);
  };
//----EXPORT DOC WORD ---
const handleExportWord = async (id: number) => {
  try {
    await exportFicheDocx(id);
    notifySuccess("Export DOCX généré avec succès !");
  } catch (error: any) {
    notifyError("Erreur lors de l’export DOCX : " + error.message);
  }
};

  // --- Rendu JSX ---
  return (
    <section className="p-6 space-y-8 bg-gray-100 min-h-screen font-inter">
      {/* Overlay chargement global */}
      {loading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl flex items-center">
            <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" />
            <p className="text-gray-700">Chargement ou opération en cours...</p>
          </div>
        </div>
      )}

      {/* En-tête avec navigation + création */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
        <Button variant="outline" onClick={() => navigate("/planipeda")} className="border-gray-300 hover:bg-gray-100">
          ← Retour au tableau de bord
        </Button>
        <h1 className="text-3xl font-bold text-gray-800">Gestion des Fiches de Planification de Chapitre</h1>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Créer une fiche de planification
        </Button>
      </div>

{/* Filtres + Recherche */}
<div className="bg-white p-6 rounded-lg shadow-md flex flex-row flex-wrap gap-4">
  {/* Recherche par titre */}
  <div className="flex-1 min-w-[200px] max-w-xs">
    <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-1">
      Rechercher par titre de fiche pédagogique
    </label>
    <input
      type="text"
      id="search-input"
      placeholder="Tapez un mot-clé..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
    />
  </div>

  {/* Niveau */}
  <div className="flex-1 min-w-[150px] max-w-[180px]">
    <label htmlFor="niveau-select" className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
    <select
      id="niveau-select"
      value={selectedNiveau ?? ""}
      onChange={e => {
        const val = Number(e.target.value) || null;
        setSelectedNiveau(val);
        setSelectedOption(null);
        setSelectedUnite(null);
        setSelectedChapitre(null);
      }}
      className="p-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">Tous les niveaux</option>
      {niveaux.map(n => (
        <option key={n.id} value={n.id}>{n.nom_niveau}</option>
      ))}
    </select>
  </div>

  {/* Option */}
  <div className="flex-1 min-w-[150px] max-w-[180px]">
    <label htmlFor="option-select" className="block text-sm font-medium text-gray-700 mb-1">Option</label>
    <select
      id="option-select"
      value={selectedOption ?? ""}
      onChange={e => {
        const val = Number(e.target.value) || null;
        setSelectedOption(val);
        setSelectedUnite(null);
        setSelectedChapitre(null);
      }}
      disabled={!selectedNiveau}
      className="p-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
    >
      <option value="">Toutes les options</option>
      {options.filter(o => !selectedNiveau || o.niveau_id === selectedNiveau).map(o => (
        <option key={o.id} value={o.id}>{o.nom_option}</option>
      ))}
    </select>
  </div>

  {/* Unité */}
  <div className="flex-1 min-w-[150px] max-w-[180px]">
    <label htmlFor="unite-select" className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
    <select
      id="unite-select"
      value={selectedUnite ?? ""}
      onChange={e => {
        const val = Number(e.target.value) || null;
        setSelectedUnite(val);
        setSelectedChapitre(null);
      }}
      disabled={!selectedOption}
      className="p-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
    >
      <option value="">Toutes les unités</option>
      {unites.filter(u => !selectedOption || u.option_id === selectedOption).map(u => (
        <option key={u.id} value={u.id}>{u.titre_unite}</option>
      ))}
    </select>
  </div>

  {/* Chapitre */}
  <div className="flex-1 min-w-[150px] max-w-[180px]">
    <label htmlFor="chapitre-select" className="block text-sm font-medium text-gray-700 mb-1">Chapitre</label>
    <select
      id="chapitre-select"
      value={selectedChapitre ?? ""}
      onChange={e => setSelectedChapitre(Number(e.target.value) || null)}
      disabled={!selectedUnite}
      className="p-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
    >
      <option value="">Tous les chapitres</option>
      {chapitres.filter(c => !selectedUnite || c.unite_id === selectedUnite).map(c => (
        <option key={c.id} value={c.id}>{c.titre_chapitre}</option>
      ))}
    </select>
  </div>
</div>

      {/* Tableau des fiches */}
      <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-blue-600 text-white text-left text-sm font-semibold uppercase tracking-wider">
              <th className="p-3 border-r border-blue-700">Statut</th>
              <th className="p-3 border-r border-blue-700">Titre de la fiche pédagogique</th>
              <th className="p-3 border-r border-blue-700">Niveau & Option</th>
              <th className="p-3 border-r border-blue-700">Unité</th>
              <th className="p-3 border-r border-blue-700">Chapitre de Référence</th>
              <th className="p-3 border-r border-blue-700">Date de Création</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-6 text-gray-600">
                  <Loader2 className="animate-spin inline-block mr-2 h-5 w-5 text-blue-500" /> Chargement des fiches de planification...
                </td>
              </tr>
            ) : filteredFiches.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-6 text-gray-600">
                  Aucune fiche de planification trouvée pour les critères sélectionnés.
                </td>
              </tr>
            ) : (
              filteredFiches.map(fiche => (
                <tr key={fiche.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${fiche.statut === 'Brouillon' ? 'bg-yellow-100 text-yellow-800' :
                          fiche.statut === 'Finalisé' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'}`}
                    >
                      {fiche.statut}
                    </span>
                  </td>
                  <td className="p-3 text-gray-700 font-medium">{fiche.nom_fiche_planification}</td>
                  <td className="p-3 text-gray-700">{fiche.niveauOption}</td>
                  <td className="p-3 text-gray-700">{fiche.titre_unite}</td>
                  <td className="p-3 text-gray-700">{fiche.titre_chapitre}</td>
                  <td className="p-3 text-gray-700">{fiche.date_creation}</td>
                  <td className="p-3 text-center flex items-center justify-center space-x-2">
                    {/* Modifier */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(fiche.id)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
                      title="Modifier la fiche"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {/* Supprimer */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => confirmDelete(fiche.id)}
                      className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white transition-colors"
                      title="Supprimer la fiche"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* Exporter CSV */}
                {/*    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(fiche)}
                      className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white transition-colors"
                      title="Exporter la fiche au format CSV"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                 */}   
                     {/* Exporter export word test */}
                    <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportWord(fiche.id)}
                            className="text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white transition-colors"
                            title="Exporter la fiche au format Word"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            DOCX
                          </Button>


                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal confirmation suppression */}
      <CustomModal
        isOpen={showConfirmModal}
        onClose={handleCancelDelete}
        title="Confirmer la suppression"
      >
        <div className="p-4">
          <p className="text-gray-700 mb-4">
            Êtes-vous sûr de vouloir supprimer cette fiche de planification ? Cette action est irréversible et supprimera également tous les éléments de progression liés.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              className="text-gray-700 border-gray-300 hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </Button>
          </div>
        </div>
      </CustomModal>
    </section>
  );
};

export default FichesPlanificationPage;
