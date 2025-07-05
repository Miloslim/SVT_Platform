// ============================================================
// Titre : ModaliteSelector
// Chemin : src/components/planipeda/ScenarioEditor/ModaliteSelector.tsx
// Fonctionnalités :
//   - Permet la sélection de MULTIPLES modalités d'évaluation à partir d'une liste prédéfinie et statique.
//   - Inclut une option "Autre" avec un champ de texte libre pour des modalités non listées.
//   - Organise les modalités en groupes (ex: Écrites, Orales, Projets) avec affichage/masquage.
//   - Gère l'état des sélections et du texte "Autre".
//   - Notifie le composant parent des changements via la prop `onSelectionChange`.
//   - MODIFICATION: Les modalités sont de nouveau gérées via une liste statique.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
// Supabase et toast ne sont plus nécessaires car les données sont statiques
// import { supabase } from '@/backend/config/supabase';
// import toast from 'react-hot-toast';

// ---
// Interface : ModaliteOption
// Définit la structure d'une modalité d'évaluation.
// ---
interface ModaliteOption {
  id: number;
  label: string;
}

// ---
// Interface : ModaliteGroup
// Définit la structure d'un groupe de modalités.
// ---
interface ModaliteGroup {
  id: string; // Utiliser un ID de chaîne pour les groupes (ex: 'ecrites')
  title: string;
  modalites: ModaliteOption[];
}

// ---
// Liste statique des modalités d'évaluation en SVT, organisée par groupes
// (Réintégrée comme demandé)
// ---
const SVT_MODALITES_GROUPS: ModaliteGroup[] = [
  {
    id: 'ecrites',
    title: 'Modalités Écrites',
    modalites: [
      { id: 1, label: 'Examen écrit (classique)' },
      { id: 2, label: 'Dissertation scientifique' },
      { id: 3, label: 'Analyse de documents scientifiques' },
      { id: 4, label: 'Exercices de schématisation/modélisation' },
      { id: 5, label: 'Synthèse de documents' },
      { id: 6, label: 'Cas pratique / Résolution de problème' },
      { id: 7, label: 'Compte-rendu à domicile' },
    ],
  },
  {
    id: 'orales_pratiques',
    title: 'Modalités Orales et Pratiques',
    modalites: [
      { id: 8, label: 'Présentation orale' },
      { id: 9, label: 'Interrogation orale' },
      { id: 10, label: 'Débat scientifique' },
      { id: 11, label: 'Manipulation / Expérimentation pratique' },
      { id: 12, label: 'Identification de spécimens/structures' },
      { id: 13, label: 'Dissection / Observation microscopique' },
      { id: 14, label: 'Sortie de terrain / Enquête écologique' },
    ],
  },
  {
    id: 'projets_creatives',
    title: 'Modalités de Projet et Créatives',
    modalites: [
      { id: 15, label: 'Projet de recherche bibliographique' },
      { id: 16, label: 'Conception d\'une affiche scientifique' },
      { id: 17, label: 'Réalisation d\'un carnet de bord/portfolio' },
      { id: 18, label: 'Production multimédia (vidéo, podcast...)' },
      { id: 19, label: 'Modélisation 3D / Maquette' },
    ],
  },
];

// ---
// Propriétés (Props) du composant ModaliteSelector
// ---
interface ModaliteSelectorProps {
  initialSelectedModaliteIds?: number[];
  initialAutreModaliteText?: string | null;
  onSelectionChange: (selection: { selectedModaliteIds: number[]; autreModaliteText: string }) => void;
}

const ModaliteSelector: React.FC<ModaliteSelectorProps> = ({
  initialSelectedModaliteIds = [],
  initialAutreModaliteText = '',
  onSelectionChange,
}) => {
  // État local pour les IDs des modalités sélectionnées
  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedModaliteIds);
  // État local pour le texte de l'option "Autre"
  const [autreText, setAutreText] = useState<string>(initialAutreModaliteText || '');
  // État local pour savoir si la case "Autre" est cochée
  const [isAutreChecked, setIsAutreChecked] = useState<boolean>(
    !!initialAutreModaliteText // Si un texte "Autre" initial est fourni, la case est cochée
  );
  // NOUVEAU: État pour gérer les groupes ouverts/fermés
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({});

  // Synchronise les états internes avec les props initiales lors du montage ou de la mise à jour
  useEffect(() => {
    setSelectedIds(initialSelectedModaliteIds);
    setAutreText(initialAutreModaliteText || '');
    setIsAutreChecked(!!initialAutreModaliteText);

    // Initialise les groupes ouverts si des modalités y sont déjà sélectionnées
    const initialOpenGroups: { [key: string]: boolean } = {};
    SVT_MODALITES_GROUPS.forEach(group => { // Utilise la liste statique
      const hasSelectedInGroup = group.modalites.some(modalite => initialSelectedModaliteIds.includes(modalite.id));
      if (hasSelectedInGroup) {
        initialOpenGroups[group.id] = true;
      }
    });
    // Ouvre le groupe "Autre" si un texte est initialisé
    if (!!initialAutreModaliteText) {
      initialOpenGroups['autre'] = true; // Utiliser un ID 'autre' pour le groupe logique de "Autre"
    }
    setOpenGroups(initialOpenGroups);

  }, [initialSelectedModaliteIds, initialAutreModaliteText]); // Dépendances inchangées

  // Fonction pour notifier le parent des changements
  const triggerChange = useCallback((
    currentSelectedIds: number[],
    currentAutreText: string,
    currentIsAutreChecked: boolean
  ) => {
    const finalAutreText = currentIsAutreChecked ? currentAutreText : '';
    onSelectionChange({
      selectedModaliteIds: currentSelectedIds,
      autreModaliteText: finalAutreText,
    });
  }, [onSelectionChange]);

  // Gère le changement d'état d'une checkbox de modalité
  const handleCheckboxChange = useCallback((modaliteId: number) => {
    let newSelectedIds: number[];
    if (selectedIds.includes(modaliteId)) {
      // Décocher
      newSelectedIds = selectedIds.filter(id => id !== modaliteId);
    } else {
      // Cocher
      newSelectedIds = [...selectedIds, modaliteId];
    }
    setSelectedIds(newSelectedIds);
    triggerChange(newSelectedIds, autreText, isAutreChecked);
  }, [selectedIds, autreText, isAutreChecked, triggerChange]);

  // Gère le changement d'état de la checkbox "Autre"
  const handleAutreCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsAutreChecked(checked);
    // Si "Autre" est décoché, vider le champ texte correspondant
    const newAutreText = checked ? autreText : '';
    setAutreText(newAutreText);
    triggerChange(selectedIds, newAutreText, checked);

    // Ouvre/ferme le groupe "Autre"
    setOpenGroups(prev => ({ ...prev, ['autre']: checked }));
  }, [selectedIds, autreText, triggerChange]);

  // Gère le changement du texte du champ "Autre"
  const handleAutreTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setAutreText(text);
    triggerChange(selectedIds, text, isAutreChecked);
  }, [selectedIds, isAutreChecked, triggerChange]);

  // Gère le clic sur un titre de groupe pour l'ouvrir/le fermer
  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  // Le message de chargement est supprimé car les données sont statiques
  // if (loadingModalites) {
  //   return <div className="text-center p-4 text-gray-500">Chargement des modalités...</div>;
  // }

  return (
    <div className="border border-gray-300 rounded-md p-4 bg-white shadow-sm">
      <p className="text-gray-700 mb-3 font-semibold">Veuillez sélectionner une ou plusieurs modalités :</p>

      {/* Le message "Aucune modalité..." est supprimé car la liste est statique et connue */}
      {/* {modalitesGroups.length === 0 && !loadingModalites && (
        <p className="text-gray-500 text-sm">Aucune modalité d'évaluation disponible. Veuillez contacter l'administrateur.</p>
      )} */}

      {SVT_MODALITES_GROUPS.map(group => ( // Utilise la liste statique directement
        <div key={group.id} className="mb-4 last:mb-0">
          <div
            className="flex items-center justify-between bg-gray-100 p-3 rounded-md cursor-pointer hover:bg-gray-200 transition duration-150 ease-in-out"
            onClick={() => toggleGroup(group.id)}
          >
            <h5 className="font-semibold text-gray-800">{group.title}</h5>
            <span className="text-gray-600 text-lg">
              {openGroups[group.id] ? '▲' : '▼'}
            </span>
          </div>
          {openGroups[group.id] && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 pl-4 border-l border-gray-200">
              {group.modalites.map(modalite => (
                <div key={modalite.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`modalite-${modalite.id}`}
                    name="modalites"
                    value={modalite.id}
                    checked={selectedIds.includes(modalite.id)}
                    onChange={() => handleCheckboxChange(modalite.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`modalite-${modalite.id}`} className="ml-2 text-gray-700 cursor-pointer">
                    {modalite.label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Option "Autre" - Gérée comme un groupe dépliable */}
      <div className="mb-4 last:mb-0 mt-5">
        <div
          className="flex items-center justify-between bg-gray-100 p-3 rounded-md cursor-pointer hover:bg-gray-200 transition duration-150 ease-in-out"
          onClick={() => toggleGroup('autre')} // Utilise un ID 'autre' pour ce groupe
        >
          <h5 className="font-semibold text-gray-800">
            <input
              type="checkbox"
              id="modalite-autre-title-checkbox"
              name="modalites-autre-title"
              checked={isAutreChecked}
              onChange={handleAutreCheckboxChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
              onClick={(e) => e.stopPropagation()} // Empêche le clic sur la checkbox de propager au toggleGroup
            />
            Autre (précisez) :
          </h5>
          <span className="text-gray-600 text-lg">
            {openGroups['autre'] ? '▲' : '▼'}
          </span>
        </div>
        {openGroups['autre'] && ( // Affiche le textarea si le groupe "Autre" est ouvert
          <div className="mt-4 pl-4 border-l border-gray-200">
            <textarea
              id="autre-modalite-text"
              rows={2}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={autreText}
              onChange={handleAutreTextChange}
              placeholder="Ex: Évaluation par les pairs, Simulation numérique avancée..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ModaliteSelector;
