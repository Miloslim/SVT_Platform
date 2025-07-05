// ============================================================
// Titre : CompetenceSelector
// Chemin : src/components/planipeda/ScenarioEditor/CompetenceSelector.tsx
// Fonctionnalités :
//   - Permet la sélection d'une compétence spécifique via une liste déroulante.
//   - Permet la sélection de plusieurs compétences générales via des cases à cocher.
//   - Permet la sélection de MULTIPLES connaissances via des cases à cocher, filtrées par chapitre.
//   - Permet d'ajouter une nouvelle notion de connaissance via un champ texte.
//   - MODIFICATION: Permet la sélection de MULTIPLES capacités/habiletés via des cases à cocher (liste statique).
//   - Les listes (compétences, connaissances) sont dynamiquement peuplées depuis les tables Supabase.
//   - Gère la distinction et l'affichage séparé des compétences et des connaissances.
//   - S'intègre dans le flux d'édition d'une évaluation.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/backend/config/supabase';

// --- Interfaces pour les données ---
interface Competence {
  id: number;
  unite_id: number | null; // Peut être null pour les compétences générales
  titre_competence: string;
  description_competence: string;
  type_competence: string; // 'générale' ou 'spécifique'
}

// MODIFIED: Interface for CapaciteHabileteOption
interface CapaciteHabileteOption {
  id: number;
  label: string; // Uses 'label' for display in the UI
}

interface Connaissance {
  id: number;
  titre_connaissance: string;
  chapitre_id: number; // Used to filter knowledge by chapter
}

// --- Static list of Capacities/Abilities (as requested, for checkboxes) ---
const SVT_CAPACITES_HABILETES: CapaciteHabileteOption[] = [
  { id: 20, label: 'Observer (prélever, mesurer)' },
  { id: 21, label: 'Réaliser (manipuler, expérimenter, utiliser des outils)' },
  { id: 22, label: 'Raisonner (analyser, argumenter, conclure)' },
  { id: 23, label: 'Modéliser (représenter, simuler)' },
  { id: 24, label: 'Communiquer (présenter, débattre, rendre compte)' },
  { id: 25, label: 'Saisir des informations (lire, rechercher, extraire)' },
  { id: 26, label: 'Organiser (classer, structurer)' },
  { id: 27, label: 'Interpréter (donner du sens, expliquer)' },
];


// --- Properties (Props) for the CompetenceSelector component ---
export interface CompetenceSelectorProps { // Exported for use in CreateEvaluationEditor
  initialSpecificCompetenceId: number | null;
  initialGeneralCompetenceIds: number[] | null;
  initialConnaissanceIds: number[] | null;
  initialNewConnaissanceText: string | null;
  initialCapaciteHabileteIds: number[] | null; // MODIFIED: Now an array of IDs

  onSelectionChange: (selection: {
    selectedSpecificCompetenceId: number | null;
    selectedGeneralCompetenceIds: number[];
    selectedConnaissanceIds: number[];
    newConnaissanceText: string;
    selectedCapaciteHabileteIds: number[]; // MODIFIED: An array of IDs
  }) => void;

  chapitreId?: number | null;
  uniteId?: number | null;
}

// ============================================================
// Main component : CompetenceSelector
// ============================================================
const CompetenceSelector: React.FC<CompetenceSelectorProps> = ({
  initialSpecificCompetenceId,
  initialGeneralCompetenceIds,
  initialCapaciteHabileteIds,
  initialConnaissanceIds,
  initialNewConnaissanceText,
  onSelectionChange,
  chapitreId,
  uniteId,
}) => {
  // --- Local States (State) of the Component ---
  const [selectedSpecificCompetenceId, setSelectedSpecificCompetenceId] = useState<number | null>(
    initialSpecificCompetenceId
  );
  const [selectedGeneralCompetenceIds, setSelectedGeneralCompetenceIds] = useState<number[]>(
    initialGeneralCompetenceIds || []
  );
  const [selectedConnaissanceIds, setSelectedConnaissanceIds] = useState<number[]>(
    initialConnaissanceIds || []
  );
  const [newConnaissanceText, setNewConnaissanceText] = useState<string>(
    initialNewConnaissanceText || ''
  );
  // MODIFIED: selectedCapaciteHabileteIds is now an array
  const [selectedCapaciteHabileteIds, setSelectedCapaciteHabileteIds] = useState<number[]>(
    initialCapaciteHabileteIds || []
  );

  const [availableSpecificCompetences, setAvailableSpecificCompetences] = useState<Competence[]>([]);
  const [availableGeneralCompetences, setAvailableGeneralCompetences] = useState<Competence[]>([]);
  const [availableConnaissances, setAvailableConnaissances] = useState<Connaissance[]>([]);

  // REMOVED: availableCapacitesHabiletes state because we use SVT_CAPACITES_HABILETES directly

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showGeneralCompetencesSection, setShowGeneralCompetencesSection] = useState<boolean>(
    (initialGeneralCompetenceIds && initialGeneralCompetenceIds.length > 0) || false
  );

  // --- useEffect for Data Loading from Supabase (Competences & Knowledge) ---
  useEffect(() => {
    const fetchCompetenceData = async () => {
      setLoading(true);
      setError(null);

      try {
        // --- 1. Fetch Specific Competences ---
        let specificCompetenceQuery = supabase.from('competences')
          .select('id, titre_competence, unite_id, description_competence, type_competence')
          .eq('type_competence', 'spécifique');
        
        if (uniteId) {
          specificCompetenceQuery = specificCompetenceQuery.eq('unite_id', uniteId);
        } else {
          setAvailableSpecificCompetences([]); // Resets if no unit
        }

        const { data: specificCompetencesData, error: specificCompetencesError } =
          uniteId ? await specificCompetenceQuery : { data: [], error: null };

        if (specificCompetencesError) throw specificCompetencesError;
        setAvailableSpecificCompetences(specificCompetencesData || []);

        // --- 2. Fetch General Competences ---
        const { data: generalCompetencesData, error: generalCompetencesError } = await supabase
          .from('competences')
          .select('id, titre_competence, unite_id, description_competence, type_competence')
          .eq('type_competence', 'générale');

        if (generalCompetencesError) throw generalCompetencesError;
        setAvailableGeneralCompetences(generalCompetencesData || []);
        
        // --- 3. Capacities/Abilities are now static (no Supabase fetch here) ---
        // setAvailableCapacitesHabiletes(SVT_CAPACITES_HABILETES); // No need for separate state if static

        // --- 4. Fetch Knowledge ---
        // MODIFIED: Filtering by chapitre_id for knowledge
        let connaissanceQuery = supabase.from('connaissances').select('id, titre_connaissance, chapitre_id');
        if (chapitreId) {
          connaissanceQuery = connaissanceQuery.eq('chapitre_id', chapitreId);
        } else {
            setAvailableConnaissances([]); // Resets if no chapter
            setLoading(false);
            return; // Exits the function to avoid executing the Supabase query
        }
        const { data: connaissancesData, error: connaissancesError } = await connaissanceQuery;

        if (connaissancesError) throw connaissancesError;
        setAvailableConnaissances(connaissancesData || []);

      } catch (err: any) {
        console.error("Error loading data for CompetenceSelector:", err.message);
        setError("Error loading data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetenceData();
  }, [chapitreId, uniteId]); // Depends on `chapitreId` and `uniteId`

  // --- useEffect for Initial Selections Synchronization ---
  useEffect(() => {
    setSelectedSpecificCompetenceId(initialSpecificCompetenceId);
    setSelectedGeneralCompetenceIds(initialGeneralCompetenceIds || []);
    setSelectedConnaissanceIds(initialConnaissanceIds || []);
    setNewConnaissanceText(initialNewConnaissanceText || '');
    // MODIFIED: Synchronization of capacities IDs (array)
    setSelectedCapaciteHabileteIds(initialCapaciteHabileteIds || []); 
    
    setShowGeneralCompetencesSection((initialGeneralCompetenceIds && initialGeneralCompetenceIds.length > 0) || false);
  }, [initialSpecificCompetenceId, initialGeneralCompetenceIds, initialCapaciteHabileteIds, initialConnaissanceIds, initialNewConnaissanceText]);

  // --- useEffect to Notify Parent of Selection Changes ---
  useEffect(() => {
    onSelectionChange({
      selectedSpecificCompetenceId: selectedSpecificCompetenceId,
      selectedGeneralCompetenceIds: selectedGeneralCompetenceIds,
      selectedConnaissanceIds: selectedConnaissanceIds,
      newConnaissanceText: newConnaissanceText,
      selectedCapaciteHabileteIds: selectedCapaciteHabileteIds, // MODIFIED: sends the array
    });
  }, [selectedSpecificCompetenceId, selectedGeneralCompetenceIds, selectedConnaissanceIds, newConnaissanceText, selectedCapaciteHabileteIds, onSelectionChange]);

  // --- Event Handlers ---

  const handleSpecificCompetenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setSelectedSpecificCompetenceId(isNaN(value) ? null : value);
  };

  const handleGeneralCompetenceCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const competenceId = parseInt(e.target.value, 10);
    if (e.target.checked) {
      setSelectedGeneralCompetenceIds((prev) => [...prev, competenceId]);
    } else {
      setSelectedGeneralCompetenceIds((prev) => prev.filter((id) => id !== competenceId));
    }
  };

  // Handles selection/deselection of knowledge via checkboxes
  const handleConnaissanceCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const connaissanceId = parseInt(e.target.value, 10);
    if (e.target.checked) {
      setSelectedConnaissanceIds((prev) => [...prev, connaissanceId]);
    } else {
      setSelectedConnaissanceIds((prev) => prev.filter((id) => id !== connaissanceId));
    }
  };

  // Handles changes in the "new knowledge" text field
  const handleNewConnaissanceTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewConnaissanceText(e.target.value);
  };

  // NEW: Handles selection/deselection of a capacity/ability via checkboxes
  const handleCapaciteHabileteCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capaciteId = parseInt(e.target.value, 10);
    if (e.target.checked) {
      setSelectedCapaciteHabileteIds((prev) => [...prev, capaciteId]);
    } else {
      setSelectedCapaciteHabileteIds((prev) => prev.filter((id) => id !== capaciteId));
    }
  };

  // --- Displaying loading and error states ---
  if (loading) {
    return <div className="text-center p-4 text-blue-600">Chargement des données...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-600">Erreur: {error}</div>;
  }

  // --- Component Rendering (JSX) ---
  return (
    <div className="space-y-6">
      {/* Section for Specific Competence selection */}
      <div>
        <label htmlFor="select-specific-competence" className="block font-semibold mb-2 text-gray-800">
          Compétence Spécifique (par unité)
        </label>
        <select
          id="select-specific-competence"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selectedSpecificCompetenceId || ''}
          onChange={handleSpecificCompetenceChange}
        >
          <option value="">Sélectionner une compétence spécifique</option>
          {availableSpecificCompetences.length === 0 && !loading && !error && (
            <option value="" disabled>Aucune compétence spécifique disponible pour cette unité.</option>
          )}
          {availableSpecificCompetences.map((competence) => (
            <option key={competence.id} value={competence.id}>
              {competence.titre_competence}
            </option>
          ))}
        </select>
      </div>

      {/* Checkbox to toggle display of the general competences block */}
      <div className="mb-2 flex items-center">
        <input
          type="checkbox"
          id="show-general-competences-checkbox"
          checked={showGeneralCompetencesSection}
          onChange={(e) => setShowGeneralCompetencesSection(e.target.checked)}
          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="show-general-competences-checkbox" className="text-gray-700 text-sm cursor-pointer">
          Afficher les compétences **générales**
        </label>
      </div>

      {/* Section for General Competences (checkboxes, conditionally displayed) */}
      {showGeneralCompetencesSection && (
        <div className="border border-gray-200 p-4 rounded-md bg-gray-50">
          <h4 className="font-semibold mb-3 text-gray-800">Sélectionner les compétences générales :</h4>
          {availableGeneralCompetences.length === 0 && !loading && !error ? (
            <p className="text-gray-600 text-sm">Aucune compétence générale disponible.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {availableGeneralCompetences.map((competence) => (
                <div key={competence.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`general-comp-${competence.id}`}
                    value={competence.id}
                    checked={selectedGeneralCompetenceIds.includes(competence.id)}
                    onChange={handleGeneralCompetenceCheckboxChange}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`general-comp-${competence.id}`} className="text-gray-700 text-sm cursor-pointer">
                    {competence.titre_competence}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODIFIED: Section for Capacities/Abilities (now checkboxes) */}
      <div className="border border-gray-200 p-4 rounded-md bg-gray-50">
        <h4 className="font-semibold mb-3 text-gray-800">
          Capacité(s) / Habileté(s) développée(s) :
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {SVT_CAPACITES_HABILETES.map((capa) => ( // Uses the static list directly
            <div key={capa.id} className="flex items-center">
              <input
                type="checkbox"
                id={`capacite-${capa.id}`}
                value={capa.id}
                checked={selectedCapaciteHabileteIds.includes(capa.id)}
                onChange={handleCapaciteHabileteCheckboxChange}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`capacite-${capa.id}`} className="text-gray-700 text-sm cursor-pointer">
                {capa.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Section for Knowledge selection (checkboxes) */}
      <div className="border border-gray-200 p-4 rounded-md bg-gray-50">
        <h4 className="font-semibold mb-3 text-gray-800">Sélectionner les Connaissances (par chapitre) :</h4>
        {availableConnaissances.length === 0 && !loading && !error && chapitreId ? (
          <p className="text-gray-600 text-sm">Aucune connaissance disponible pour ce chapitre.</p>
        ) : !chapitreId ? (
            <p className="text-gray-600 text-sm">Sélectionnez un chapitre pour afficher les connaissances associées.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {availableConnaissances.map((connaissance) => (
              <div key={connaissance.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`connaissance-${connaissance.id}`}
                  value={connaissance.id}
                  checked={selectedConnaissanceIds.includes(connaissance.id)}
                  onChange={handleConnaissanceCheckboxChange}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`connaissance-${connaissance.id}`} className="text-gray-700 text-sm cursor-pointer">
                  {connaissance.titre_connaissance}
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Text field for adding new knowledge */}
        <div className="mt-4">
          <label htmlFor="new-connaissance-text" className="block font-semibold mb-2 text-gray-800">
            Ajouter une nouvelle notion de connaissance :
          </label>
          <textarea
            id="new-connaissance-text"
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Ex: La photosynthèse chez les plantes C4 (sera liée au chapitre sélectionné)"
            value={newConnaissanceText}
            onChange={handleNewConnaissanceTextChange}
          />
        </div>
      </div>
    </div>
  );
};

export default CompetenceSelector;
