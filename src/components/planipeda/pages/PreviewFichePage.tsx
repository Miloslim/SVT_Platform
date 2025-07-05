// ===========================================================================
// 📁 Fichier : PreviewFichePage.tsx
// 📌 Emplacement : src/pages/PreviewFichePage.tsx
// 🎯 Objectif :
//   - Page de prévisualisation d'une fiche pédagogique avant export/impression
//   - Affichage complet des données de la fiche, séquences, activités, évaluations
//   - Chargement des données via l'ID en paramètre d'URL
// ===========================================================================

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Types simplifiés pour les données de la fiche et ses éléments
type Sequence = {
  id: number;
  title: string;
  description: string;
};

type Activity = {
  id: number;
  title: string;
  type: string;
  description: string;
};

type Evaluation = {
  id: number;
  title: string;
  criteria: string;
};

type FicheData = {
  id: string;
  title: string;
  date: string;
  status: string;
  sequences: Sequence[];
  activities: Activity[];
  evaluations: Evaluation[];
};

/**
 * Composant page pour prévisualiser une fiche pédagogique
 */
const PreviewFichePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [fiche, setFiche] = useState<FicheData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiche = async () => {
      setLoading(true);

      // TODO : remplacer par appel API réel ou récupération BD
      await new Promise((r) => setTimeout(r, 500));

      // Données mock pour exemple
      const mockFiche: FicheData = {
        id: id || "0",
        title: `Fiche pédagogique #${id}`,
        date: "2025-05-01",
        status: "En cours",
        sequences: [
          { id: 1, title: "Séquence 1", description: "Introduction au chapitre" },
          { id: 2, title: "Séquence 2", description: "Approfondissement des concepts" },
        ],
        activities: [
          { id: 1, title: "Activité 1", type: "Exercice", description: "Exercice de compréhension" },
          { id: 2, title: "Activité 2", type: "Travail de groupe", description: "Discussion en équipe" },
        ],
        evaluations: [
          { id: 1, title: "Évaluation formative", criteria: "Questions à choix multiples" },
        ],
      };

      setFiche(mockFiche);
      setLoading(false);
    };

    fetchFiche();
  }, [id]);

  if (loading || !fiche) {
    return <p>Chargement de la fiche...</p>;
  }

  return (
    <main className="preview-fiche-page p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{fiche.title}</h1>
      <p>
        <strong>Date :</strong> {new Date(fiche.date).toLocaleDateString()}
      </p>
      <p>
        <strong>Statut :</strong> {fiche.status}
      </p>

      <section className="sequences mt-6">
        <h2 className="text-2xl font-semibold mb-2">Séquences</h2>
        {fiche.sequences.map((seq) => (
          <article key={seq.id} className="mb-4 p-3 border rounded">
            <h3 className="text-xl font-medium">{seq.title}</h3>
            <p>{seq.description}</p>
          </article>
        ))}
      </section>

      <section className="activities mt-6">
        <h2 className="text-2xl font-semibold mb-2">Activités</h2>
        {fiche.activities.map((act) => (
          <article key={act.id} className="mb-4 p-3 border rounded">
            <h3 className="text-xl font-medium">
              {act.title} <small className="italic text-sm">({act.type})</small>
            </h3>
            <p>{act.description}</p>
          </article>
        ))}
      </section>

      <section className="evaluations mt-6">
        <h2 className="text-2xl font-semibold mb-2">Évaluations</h2>
        {fiche.evaluations.map((evalItem) => (
          <article key={evalItem.id} className="mb-4 p-3 border rounded">
            <h3 className="text-xl font-medium">{evalItem.title}</h3>
            <p>{evalItem.criteria}</p>
          </article>
        ))}
      </section>

      <div className="mt-8 flex justify-between">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Retour
        </Button>
        <Button variant="primary" onClick={() => alert("Fonction d'export à implémenter")}>
          Exporter / Imprimer
        </Button>
      </div>
    </main>
  );
};

export default PreviewFichePage;
