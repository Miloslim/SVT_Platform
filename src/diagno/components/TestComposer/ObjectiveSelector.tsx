// =============================================================
// 📄 Fichier : ObjectiveSelector.tsx
// 📁 Chemin : src/diagno/components/TestComposer/ObjectiveSelector.tsx
// 📌 Sélecteur d’objectifs pédagogiques filtré par niveau et option,
//     utilisé dans la composition d’un test diagnostique.
// =============================================================

import React, { useEffect, useState } from 'react';
import { testsService } from '@/diagno/services/testsService';

type Objectif = {
  id: number;
  description_objectif: string;
  chapitre_nom: string;
  unite_nom: string;
  option_nom: string;
  niveau_nom: string;
};

interface ObjectiveSelectorProps {
  niveauId: number | null;
  optionId: number | null;
  selectedObjectifs: number[];
  onChange: (selectedIds: number[]) => void;
}

const ObjectiveSelector: React.FC<ObjectiveSelectorProps> = ({
  niveauId,
  optionId,
  selectedObjectifs,
  onChange,
}) => {
  const [objectifs, setObjectifs] = useState<Objectif[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (niveauId && optionId) {
      setLoading(true);
      testsService
        .getObjectifsByClass(niveauId, optionId)
        .then((data: any[]) => {
          // Formatage des objectifs pour affichage
          const formatted = data.map((o) => ({
            id: o.id,
            description_objectif: o.description_objectif,
            chapitre_nom: o.chapitres?.titre_chapitre ?? '',
            unite_nom: o.chapitres?.unites?.titre_unite ?? '',
            option_nom: o.chapitres?.unites?.options?.nom_option ?? '',
            niveau_nom: o.chapitres?.unites?.options?.niveaux?.nom_niveau ?? '',
          }));
          setObjectifs(formatted);
        })
        .catch((err) => {
          console.error('Erreur chargement objectifs :', err);
          setObjectifs([]);
        })
        .finally(() => setLoading(false));
    } else {
      setObjectifs([]);
    }
  }, [niveauId, optionId]);

  const toggleSelection = (id: number) => {
    if (selectedObjectifs.includes(id)) {
      onChange(selectedObjectifs.filter((sid) => sid !== id));
    } else {
      onChange([...selectedObjectifs, id]);
    }
  };

  if (loading) return <p>Chargement des objectifs...</p>;

  if (objectifs.length === 0)
    return <p>Aucun objectif disponible pour ce niveau et cette option.</p>;

  return (
    <div>
      <h3 className="mb-2 font-semibold">Sélectionnez les objectifs</h3>
      <ul className="max-h-48 overflow-auto border rounded p-2">
        {objectifs.map((obj) => (
          <li key={obj.id} className="mb-1">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedObjectifs.includes(obj.id)}
                onChange={() => toggleSelection(obj.id)}
                className="mr-2"
              />
              <span>
                {obj.description_objectif}{" "}
                <small className="text-gray-500">
                  ({obj.niveau_nom} / {obj.option_nom} / {obj.unite_nom} / {obj.chapitre_nom})
                </small>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ObjectiveSelector;
