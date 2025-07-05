/**
 * Nom du Fichier: ChapterPlanningHeader.tsx
 * Chemin: src/components/planipeda/chapitreplanifier/ChapterPlanningHeader.tsx
 *
 * Fonctionnalités:
 * - Gère l'en-tête de la fiche de planification d'un chapitre.
 * - Intègre un sélecteur hiérarchique (Niveau, Option, Unité, Chapitre de référence) pour définir le contexte de la planification.
 * - Récupère automatiquement le titre et les objectifs généraux du **chapitre de référence sélectionné** depuis la base de données (ces informations sont affichées mais non modifiables directement ici).
 * - **MODIFIÉ : Inclut un champ de saisie pour le nom spécifique de la fiche de planification et un sélecteur pour son statut, positionnés sous les objectifs du chapitre de référence et alignés sur une seule ligne.**
 * - Affiche des indicateurs de chargement et des messages contextuels pour une meilleure expérience utilisateur.
 * - Remonte toutes les sélections hiérarchiques et les détails de la fiche de planification
 * (incluant le nom et le statut) au composant parent (`PlanifierChapitreEditor`) pour la persistance des données.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/backend/config/supabase';
import { ChapitreWithDirectObjectifsDb } from '@/types/dbTypes';
import ChapterTargetSelector from './ChapterTargetSelector';
import { Loader2, Info } from 'lucide-react';

// --- Définition des Props du Composant ChapterPlanningHeader ---
interface ChapterPlanningHeaderProps {
  chapitreReferenceId: number | null;
  niveauId: number | null;
  optionId: number | null;
  uniteId: number | null;
  titreChapitre: string;
  objectifsGeneraux: string;
  nomFichePlanification: string; // Nom spécifique de cette fiche de planification
  statutFiche: 'Brouillon' | 'Publié' | 'Archivé'; // Statut de cette fiche de planification
  onTargetSelectionChange: (selection: {
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
    chapitreReferenceId: number | null;
    chapitreReferenceTitle: string | null;
  }) => void;
  onUpdateChapitreDetails: (
    details: {
      titreChapitre: string;
      objectifsGeneraux: string;
      objectifsReferencesIds: number[];
      niveauId: number | null;
      optionId: number | null;
      uniteId: number | null;
      nomFichePlanification: string;
      statutFiche: 'Brouillon' | 'Publié' | 'Archivé';
    },
    objectifsDetails: { id: number; description: string }[]
  ) => void;
}

// --- Composant Fonctionnel ChapterPlanningHeader ---
const ChapterPlanningHeader: React.FC<ChapterPlanningHeaderProps> = ({
  chapitreReferenceId,
  niveauId,
  optionId,
  uniteId,
  titreChapitre: initialTitreChapitreReference,
  objectifsGeneraux,
  nomFichePlanification: initialNomFichePlanification,
  statutFiche: initialStatutFiche,
  onTargetSelectionChange,
  onUpdateChapitreDetails,
}) => {
  const [localNomFichePlanification, setLocalNomFichePlanification] = useState(initialNomFichePlanification);
  const [localStatutFiche, setLocalStatutFiche] = useState(initialStatutFiche);
  const [referenceObjectifsDetails, setReferenceObjectifsDetails] = useState<
    { id: number; description: string }[]
  >([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    setLocalNomFichePlanification(initialNomFichePlanification);
  }, [initialNomFichePlanification]);

  useEffect(() => {
    setLocalStatutFiche(initialStatutFiche);
  }, [initialStatutFiche]);

  const updateParentDetails = useCallback((
    newTitreChapitreReference: string,
    newObjectifsGeneraux: string,
    newObjectifsReferencesIds: number[],
    newNiveauId: number | null,
    newOptionId: number | null,
    newUniteId: number | null,
    newObjectifsDetails: { id: number; description: string }[]
  ) => {
    onUpdateChapitreDetails({
      titreChapitre: newTitreChapitreReference,
      objectifsGeneraux: newObjectifsGeneraux,
      objectifsReferencesIds: newObjectifsReferencesIds,
      niveauId: newNiveauId,
      optionId: newOptionId,
      uniteId: newUniteId,
      nomFichePlanification: localNomFichePlanification,
      statutFiche: localStatutFiche,
    }, newObjectifsDetails);
  }, [onUpdateChapitreDetails, localNomFichePlanification, localStatutFiche]);

  useEffect(() => {
    const fetchChapitreReferenceDetails = async () => {
      if (!chapitreReferenceId) {
        updateParentDetails('', '', [], null, null, null, []);
        setReferenceObjectifsDetails([]);
        setIsLoadingDetails(false);
        return;
      }

      setIsLoadingDetails(true);
      try {
        const { data, error } = await supabase
          .from('chapitres')
          .select<ChapitreWithDirectObjectifsDb>(
            `
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
            ),
            objectifs(
              id,
              description_objectif
            )
            `
          )
          .eq('id', chapitreReferenceId)
          .single();

        if (error) {
          console.error(
            '[ChapterPlanningHeader] Erreur Supabase lors de la récupération des détails du chapitre de référence:',
            error.message
          );
          updateParentDetails('', '', [], null, null, null, []);
          setReferenceObjectifsDetails([]);
        } else if (data) {
          const objectifsIds = (data.objectifs || [])
            .map((obj) => obj.id)
            .filter((id): id is number => id !== null);

          const extractedObjectifsDetails = (data.objectifs || []).map((obj) => ({
            id: obj.id,
            description: obj.description_objectif || 'Aucune description',
          }));
          setReferenceObjectifsDetails(extractedObjectifsDetails);

          const formattedObjectifsGeneraux = extractedObjectifsDetails
            .map((obj) => `${obj.id}. ${obj.description}`)
            .join('\n\n');

          updateParentDetails(
            data.titre_chapitre || '',
            formattedObjectifsGeneraux,
            objectifsIds,
            data.unite?.option?.niveau?.id || null,
            data.unite?.option?.id || null,
            data.unite?.id || null,
            extractedObjectifsDetails
          );
        }
      } catch (err) {
        console.error("[ChapterPlanningHeader] Erreur inattendue lors du chargement des détails du chapitre de référence:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchChapitreReferenceDetails();
  }, [chapitreReferenceId, updateParentDetails]);

  const handleNomFicheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setLocalNomFichePlanification(newName);
    onUpdateChapitreDetails({
      titreChapitre: initialTitreChapitreReference,
      objectifsGeneraux: objectifsGeneraux,
      objectifsReferencesIds: referenceObjectifsDetails.map(obj => obj.id),
      niveauId: niveauId,
      optionId: optionId,
      uniteId: uniteId,
      nomFichePlanification: newName,
      statutFiche: localStatutFiche,
    }, referenceObjectifsDetails);
  };

  const handleStatutFicheChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatut = e.target.value as 'Brouillon' | 'Publié' | 'Archivé';
    setLocalStatutFiche(newStatut);
    onUpdateChapitreDetails({
      titreChapitre: initialTitreChapitreReference,
      objectifsGeneraux: objectifsGeneraux,
      objectifsReferencesIds: referenceObjectifsDetails.map(obj => obj.id),
      niveauId: niveauId,
      optionId: optionId,
      uniteId: uniteId,
      nomFichePlanification: localNomFichePlanification,
      statutFiche: newStatut,
    }, referenceObjectifsDetails);
  };

  return (
    <>
      {/* --- SECTION 1: Ciblage du Chapitre de Référence --- */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Ciblage du Chapitre de Référence
        </h2>
        <ChapterTargetSelector
          onChange={onTargetSelectionChange}
          initialNiveauId={niveauId}
          initialOptionId={optionId}
          initialUniteId={uniteId}
          initialChapitreReferenceId={chapitreReferenceId}
        />
      </div>
      <hr className="my-6 border-gray-200" />

      {/* --- SECTION 2: Informations du Chapitre de Référence (Automatiques et non modifiables) --- */}
      <div className="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
        <h3 className="text-gray-700 text-sm font-bold mb-2 flex items-center">
          Titre du chapitre de référence :
          <span className="ml-2 text-gray-400 cursor-help" title="Ce titre est automatiquement rempli à partir du chapitre de référence sélectionné et ne peut pas être modifié ici.">
            <Info size={16} />
          </span>
        </h3>
        {isLoadingDetails ? (
          <p className="flex items-center text-gray-500 italic">
            <Loader2 className="animate-spin mr-2 h-4 w-4" /> Chargement du titre...
          </p>
        ) : (
          <p className="text-lg font-medium text-gray-900 break-words">
            {initialTitreChapitreReference || <span className="italic text-gray-500">Aucun chapitre de référence sélectionné</span>}
          </p>
        )}
      </div>

      <div className="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
        <label
          htmlFor="objectifsGeneraux"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Objectifs généraux du chapitre de référence :
        </label>
        {isLoadingDetails ? (
          <p className="flex items-center text-gray-500 italic mt-4">
            <Loader2 className="animate-spin mr-2 h-4 w-4" /> Chargement des objectifs...
          </p>
        ) : (
          <>
            {referenceObjectifsDetails.length > 0 ? (
              <div className="mt-4 p-3 bg-blue-100 border border-gray-200 rounded-md">
                <ul className="list-disc list-inside text-gray-900 space-y-2">
                  {referenceObjectifsDetails.map((obj, index) => (
                    <li key={obj.id} className="text-sm">
                      <strong>Objectif {index + 1} :</strong> {obj.description}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 italic mt-4">
                {chapitreReferenceId
                  ? "Aucun objectif général n'est défini pour ce chapitre de référence."
                  : "Sélectionnez un chapitre de référence pour afficher ses objectifs."}
              </p>
            )}
          </>
        )}
      </div>

      {/* --- NOUVELLE SECTION : Nom et Statut de la Fiche de Planification (Alignés en ligne) --- */}
      {/* Ces champs sont maintenant positionnés sous la section des objectifs, alignés sur une seule ligne. */}
      <hr className="my-6 border-gray-200" /> {/* Ligne de séparation */}
      <div className="mb-8 p-4 border border-gray-200 rounded-md bg-white shadow-sm flex flex-wrap gap-4 items-end">
        {/* Champ de saisie pour le Nom de la Fiche de Planification */}
        <div className="flex-1 min-w-[280px]"> {/* Utilise flex-1 pour occuper l'espace et min-width pour le responsive */}
          <label htmlFor="nomFichePlanification" className="block text-sm font-medium text-gray-700 mb-1">
            Nom de la Fiche de Planification :
          </label>
          <input
            type="text"
            id="nomFichePlanification"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 text-gray-900"
            value={localNomFichePlanification}
            onChange={handleNomFicheChange}
            placeholder="Ex: Planification Chapitre 1 - Introduction à l'Algèbre (V.2)"
          />
        </div>

        {/* Sélecteur pour le Statut de la Fiche */}
        <div className="flex-1 min-w-[180px]"> {/* Ajuste la largeur minimale pour le sélecteur */}
          <label htmlFor="statutFiche" className="block text-sm font-medium text-gray-700 mb-1">
            Statut de la Fiche :
          </label>
          <select
            id="statutFiche"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 text-gray-900"
            value={localStatutFiche}
            onChange={handleStatutFicheChange}
          >
            <option value="Brouillon">Brouillon</option>
            <option value="Publié">Publié</option>
            <option value="Archivé">Archivé</option>
          </select>
        </div>
      </div>
      <hr className="my-6 border-gray-200" />
    </>
  );
};

export default ChapterPlanningHeader;