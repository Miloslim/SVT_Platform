// ============================================================================
// 📁 Fichier : FicheEditor.tsx
// 📌 Emplacement : src/components/planipeda/ScenarioEditor/FicheEditor.tsx
// 🎯 Objectif :
//   - Éditeur principal d’une fiche pédagogique
//   - Permet la construction d’un scénario : ajout de séquences, activités, évaluations
//   - Intègre des composants enfants pour chaque type de contenu
// ============================================================================

import React, { useState } from "react";
import SequenceEditor from "./SequenceEditor";
import EvaluationEditor from "./EvaluationEditor";
import ObjectivesSelector from "./ObjectivesSelector"; // ✅ Composant importé
import { Button } from "@/components/ui/button";

// 🧩 Types pour la structure du scénario pédagogique
type Sequence = {
  id: number;
  titre: string;
  activites: string[]; // À remplacer ultérieurement par des objets d'activité plus détaillés
};

type Evaluation = {
  id: number;
  consigne: string;
};

type Objective = {
  id: number;
  description: string;
};

// 📌 Composant principal
const FicheEditor: React.FC = () => {
  // États locaux de la fiche pédagogique
  const [titreFiche, setTitreFiche] = useState("");
  const [description, setDescription] = useState("");
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [objectifsSelectionnes, setObjectifsSelectionnes] = useState<Objective[]>([]);

  // ➕ Fonction pour ajouter une nouvelle séquence au scénario
  const ajouterSequence = () => {
    const nouvelleSequence: Sequence = {
      id: Date.now(),
      titre: `Séquence ${sequences.length + 1}`,
      activites: [],
    };
    setSequences([...sequences, nouvelleSequence]);
  };

  // ➕ Fonction pour ajouter une nouvelle évaluation
  const ajouterEvaluation = () => {
    const nouvelleEval: Evaluation = {
      id: Date.now(),
      consigne: "Nouvelle évaluation",
    };
    setEvaluations([...evaluations, nouvelleEval]);
  };

  // 📤 Gestion de la soumission (à connecter avec un backend plus tard)
  const handleSubmit = () => {
    const fiche = {
      titre: titreFiche,
      description,
      sequences,
      evaluations,
      objectifs: objectifsSelectionnes,
    };
    console.log("📤 Fiche soumise :", fiche);
    // TODO : remplacer par appel API pour sauvegarde
  };

  return (
    <div className="fiche-editor space-y-4 p-4">
      {/* 🏷️ En-tête avec titre et description */}
      <div className="fiche-header space-y-2">
        <input
          type="text"
          placeholder="Titre de la fiche"
          value={titreFiche}
          onChange={(e) => setTitreFiche(e.target.value)}
          className="input w-full"
        />
        <textarea
          placeholder="Description de la fiche..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="textarea w-full"
        />
      </div>

      {/* 🎯 Sélecteur d’objectifs */}
      <div className="objectives-selector mb-6">
        <h3 className="text-lg font-semibold">Objectifs pédagogiques</h3>
        <ObjectivesSelector
          selectedObjectives={objectifsSelectionnes}
          onChange={setObjectifsSelectionnes}
        />
      </div>

      {/* 🧩 Section des séquences pédagogiques */}
      <div className="sequences space-y-3">
        <h3 className="text-lg font-semibold">Séquences pédagogiques</h3>
        {sequences.map((sequence) => (
          <SequenceEditor
            key={sequence.id}
            sequence={sequence}
            onUpdate={(updated) =>
              setSequences((prev) =>
                prev.map((seq) => (seq.id === updated.id ? updated : seq))
              )
            }
          />
        ))}
        <Button onClick={ajouterSequence} variant="default">
          ➕ Ajouter une séquence
        </Button>
      </div>

      {/* ✅ Section des évaluations */}
      <div className="evaluations space-y-3">
        <h3 className="text-lg font-semibold">Évaluations</h3>
        {evaluations.map((evalItem) => (
          <EvaluationEditor
            key={evalItem.id}
            evaluation={evalItem}
            onUpdate={(updatedEval) =>
              setEvaluations((prev) =>
                prev.map((e) => (e.id === updatedEval.id ? updatedEval : e))
              )
            }
          />
        ))}
        <Button onClick={ajouterEvaluation} variant="secondary">
          ➕ Ajouter une évaluation
        </Button>
      </div>

      {/* ✅ Bouton de sauvegarde */}
      <div className="actions pt-4">
        <Button onClick={handleSubmit} variant="success">
          💾 Enregistrer la fiche
        </Button>
      </div>
    </div>
  );
};

export default FicheEditor;
