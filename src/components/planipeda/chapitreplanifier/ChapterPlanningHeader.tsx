/**
 * Nom du Fichier: ChapterPlanningHeader.tsx
 * Chemin: src/components/planipeda/chapitreplanifier/ChapterPlanningHeader.tsx
 *
 * Fonctionnalités:
 * - Gère l'en-tête de la planification d'un chapitre, incluant le sélecteur hiérarchique.
 * - Récupère et affiche les détails (titre, objectifs) du chapitre de référence sélectionné.
 * - Remonte les sélections et les détails mis à jour au composant parent.
 * - Améliorations : Ajout d'indicateurs de chargement, affichage clair du titre (non modifiable),
 * et messages contextuels pour les objectifs.
 */

import React, { useEffect } from 'react';
import { supabase } from '@/backend/config/supabase';
// Assurez-vous que ce type est correct et accessible, et que lucide-react est installé.
// npm install lucide-react ou yarn add lucide-react
import { ChapitreWithDirectObjectifsDb } from '@/types/dbTypes';
import ChapterTargetSelector from './ChapterTargetSelector';
import { Loader2, Info } from 'lucide-react'; // Importation des icônes pour le spinner et l'info

// Définition des props que ce composant recevra de son parent
interface ChapterPlanningHeaderProps {
  chapitreReferenceId: number | null;
  niveauId: number | null;
  optionId: number | null;
  uniteId: number | null;
  titreChapitre: string;
  objectifsGeneraux: string; // Cette prop est toujours là mais l'affichage est maintenant une liste
  onTargetSelectionChange: (selection: {
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
    chapitreReferenceId: number | null;
    chapitreReferenceTitle: string | null; // Remontée du titre pour le composant parent
  }) => void;
  onUpdateChapitreDetails: (details: {
    titreChapitre: string;
    objectifsGeneraux: string; // La chaîne formatée des objectifs
    objectifsReferencesIds: number[];
    niveauId: number | null;
    optionId: number | null;
    uniteId: number | null;
  }, objectifsDetails: { id: number; description: string }[]) => void; // Remonte aussi les détails structurés
}

const ChapterPlanningHeader: React.FC<ChapterPlanningHeaderProps> = ({
  chapitreReferenceId,
  niveauId,
  optionId,
  uniteId,
  titreChapitre,
  objectifsGeneraux, // Gardé ici au cas où une logique interne l'utiliserait, bien que l'affichage soit changé
  onTargetSelectionChange,
  onUpdateChapitreDetails,
}) => {
  // État local pour stocker l'ID et la description des objectifs de référence pour l'affichage
  const [referenceObjectifsDetails, setReferenceObjectifsDetails] = React.useState<
    { id: number; description: string }[]
  >([]);
  // Nouvel état pour gérer l'état de chargement des détails du chapitre de référence
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);

  // Effect pour le pré-remplissage automatique (titre & objectifs) du chapitre de référence
  useEffect(() => {
    const fetchChapitreReferenceDetails = async () => {
      // Si aucun chapitre de référence n'est sélectionné, réinitialise les champs et les détails des objectifs.
      if (!chapitreReferenceId) {
        onUpdateChapitreDetails({
          titreChapitre: '',
          objectifsGeneraux: '',
          objectifsReferencesIds: [],
          niveauId: null,
          optionId: null,
          uniteId: null,
        }, []);
        setReferenceObjectifsDetails([]);
        setIsLoadingDetails(false); // S'assurer que le chargement est à faux si pas de chapitre
        return;
      }

      setIsLoadingDetails(true); // Démarre le chargement des détails
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
          onUpdateChapitreDetails({
            titreChapitre: '',
            objectifsGeneraux: '',
            objectifsReferencesIds: [],
            niveauId: null,
            optionId: null,
            uniteId: null,
          }, []);
          setReferenceObjectifsDetails([]);
        } else if (data) {
          const objectifsIds = (data.objectifs || [])
            .map((obj) => obj.id)
            .filter((id): id is number => id !== null);

          const extractedObjectifsDetails = (data.objectifs || []).map((obj) => ({
            id: obj.id,
            description: obj.description_objectif || 'Aucune description',
          }));
          setReferenceObjectifsDetails(extractedObjectifsDetails); // Mise à jour de l'état local

          // Création d'une chaîne formatée pour 'objectifsGeneraux' si le composant parent en a besoin
          const formattedObjectifsGeneraux = extractedObjectifsDetails
            .map((obj) => `${obj.id}. ${obj.description}`)
            .join('\n\n');

          onUpdateChapitreDetails({
            titreChapitre: data.titre_chapitre || '',
            objectifsGeneraux: formattedObjectifsGeneraux, // La chaîne formatée des objectifs
            objectifsReferencesIds: objectifsIds,
            niveauId: data.unite?.option?.niveau?.id || null,
            optionId: data.unite?.option?.id || null,
            uniteId: data.unite?.id || null,
          }, extractedObjectifsDetails); // Remonte les détails des objectifs aussi
        }
      } catch (err) {
        console.error("[ChapterPlanningHeader] Erreur inattendue lors du chargement des détails du chapitre de référence:", err);
      } finally {
        setIsLoadingDetails(false); // Arrête le chargement quelle que soit l'issue
      }
    };

    fetchChapitreReferenceDetails();
  }, [chapitreReferenceId, onUpdateChapitreDetails]); // Dépendances de l'useEffect

  return (
    <>
      {/* --- SECTION 1: Ciblage du Chapitre (ENTÊTE) --- */}
      <div className="mb-4 ">

        <ChapterTargetSelector
          onChange={onTargetSelectionChange}
          initialNiveauId={niveauId}
          initialOptionId={optionId}
          initialUniteId={uniteId}
          initialChapitreReferenceId={chapitreReferenceId}
        />
      </div>
      <hr className="my-2 border-gray-200" /> {/* Ligne de séparation */}

      {/* --- SECTION 2: Informations Générales du Chapitre (Pré-remplies si chapitre de référence sélectionné) --- */}
{/* Wrapper en flex */}
<div className="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50 flex flex-col md:flex-row md:space-x-6 px-3 py-1">

  {/* Titre du chapitre - 1/3 largeur sur md+ */}
  <div className="md:basis-1/3 mb-6 md:mb-0">
    <h3 className="text-gray-700 text-sm font-bold mb-2 flex items-center">
      Titre du chapitre (à planifier) :
      <span
        className="ml-2 text-gray-400 cursor-help"
        title="Le titre est automatiquement rempli à partir du chapitre de référence sélectionné et ne peut pas être modifié ici."
      >
        <Info size={16} />
      </span>
    </h3>

    {isLoadingDetails ? (
      <p className="flex items-center text-gray-500 italic">
        <Loader2 className="animate-spin mr-2 h-4 w-4" /> Chargement du titre...
      </p>
    ) : (
      <p className="text-lg font-medium text-gray-900 break-words">
        {titreChapitre || (
          <span className="italic text-gray-500">
            Aucun chapitre de référence sélectionné
          </span>
        )}
      </p>
    )}
  </div>

  {/* Objectifs du chapitre - 2/3 largeur sur md+ */}
  <div className="md:basis-2/3">
    <label
      htmlFor="objectifsGeneraux"
      className="block text-gray-700 text-sm font-bold mb-2"
    >
      Objectifs du chapitre :
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
</div>

      <hr className="my-6 border-gray-200" /> {/* Ligne de séparation */}
    </>
  );
};

export default ChapterPlanningHeader;