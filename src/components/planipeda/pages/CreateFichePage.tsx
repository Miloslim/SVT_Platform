// ===========================================================================
// 📁 Fichier : CreateFichePage.tsx
// 📌 Emplacement : src/pages/CreateFichePage.tsx
// 🎯 Objectif :
//   - Page de création d'une nouvelle fiche pédagogique
//   - Contient un formulaire basique pour saisir les informations initiales
//   - Intégration future avec l'éditeur de scénario pédagogique
// ===========================================================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * Type pour les données du formulaire de création de fiche
 */
type FormData = {
  title: string;
  date: string;
  status: "En cours" | "Terminée";
};

/**
 * Composant page pour créer une nouvelle fiche pédagogique
 */
const CreateFichePage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    status: "En cours",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Fiche créée:", formData);
    navigate("/edit-fiche/1"); // TODO: remplacer par ID réel
  };

  return (
    <main className="create-fiche-page p-6 max-w-lg mx-auto space-y-6">
      {/* 🔙 Bouton retour */}
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="btn-outline">
          ← Retour
        </button>
        <h1 className="text-2xl font-bold">Créer une nouvelle fiche pédagogique</h1>
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

        {/* Bouton de soumission */}
        <div>
          <Button type="submit" variant="primary" size="md">
            Créer la fiche
          </Button>
        </div>
      </form>
    </main>
  );
};

export default CreateFichePage;
