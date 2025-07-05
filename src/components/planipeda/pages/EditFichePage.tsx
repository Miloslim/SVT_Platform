// ===========================================================================
// 📁 Fichier : EditFichePage.tsx
// 📌 Emplacement : src/pages/EditFichePage.tsx
// 🎯 Objectif :
//   - Page de modification d'une fiche pédagogique existante
//   - Chargement des données via l'ID passé en paramètre d'URL
//   - Formulaire pré-rempli avec possibilité d'éditer les champs principaux
//   - Préparation à l’intégration future de l’éditeur de scénario pédagogique
// ===========================================================================

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

type FormData = {
  title: string;
  date: string;
  status: "En cours" | "Terminée";
};

const EditFichePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFiche = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const ficheData: FormData = {
        title: `Fiche de planification #${id}`,
        date: "2025-05-01",
        status: "En cours",
      };

      setFormData(ficheData);
      setLoading(false);
    };

    fetchFiche();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    console.log("Fiche modifiée:", formData);
    navigate("/planipeda");
  };

  if (loading || !formData) {
    return <p>Chargement de la fiche...</p>;
  }

  return (
    <main className="edit-fiche-page p-6 max-w-lg mx-auto space-y-6">
      {/* 🔙 Bouton retour */}
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="btn-outline">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold">Modifier la fiche pédagogique #{id}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Titre */}
        <div>
          <label htmlFor="title" className="block font-medium mb-1">
            Titre
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            required
            className="input input-bordered w-full"
            placeholder="Ex : Fiche de planification Chapitre 1"
          />
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="block font-medium mb-1">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="input input-bordered w-full"
          />
        </div>

        {/* Statut */}
        <div>
          <label htmlFor="status" className="block font-medium mb-1">
            Statut
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="select select-bordered w-full"
          >
            <option value="En cours">En cours</option>
            <option value="Terminée">Terminée</option>
          </select>
        </div>

        {/* Bouton sauvegarde */}
        <div>
          <Button type="submit" variant="primary" size="md">
            Sauvegarder les modifications
          </Button>
        </div>
      </form>
    </main>
  );
};

export default EditFichePage;
