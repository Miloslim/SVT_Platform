import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/backend/config/supabase";

interface Niveau {
  id: number;
  nom_niveau: string;
}

interface Option {
  id: number;
  nom_option: string;
  niveau_id: number;
}

interface Props {
  onUniteAdded: () => void;
}

const EntityUniteModal: React.FC<Props> = ({ onUniteAdded }) => {
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [selectedNiveau, setSelectedNiveau] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [titreUnite, setTitreUnite] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: niveauxData } = await supabase.from("niveaux").select("*").order("id");
      const { data: optionsData } = await supabase.from("options").select("*").order("id");
      if (niveauxData) setNiveaux(niveauxData);
      if (optionsData) setOptions(optionsData);
    };
    fetchData();
  }, []);

  const handleAddUnite = async () => {
    if (!selectedNiveau || !selectedOption || !titreUnite.trim()) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    const { error } = await supabase.from("unites").insert({
      titre_unite: titreUnite.trim(),
      classe_id: selectedNiveau,
      option_id: selectedOption,
    });

    if (error) {
      console.error("Erreur lors de l'ajout :", error);
      alert("Erreur lors de l'ajout.");
    } else {
      setTitreUnite("");
      onUniteAdded();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Ajouter une Unité</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter une Unité</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          {/* Sélection du niveau */}
          <div>
            <label htmlFor="niveau" className="block mb-1">Niveau</label>
            <select
              id="niveau"
              className="border rounded w-full px-3 py-2"
              value={selectedNiveau ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedNiveau(value === "" ? null : Number(value));
                setSelectedOption(null);
              }}
            >
              <option value="">Sélectionner un niveau</option>
              {niveaux.map((niveau) => (
                <option key={niveau.id} value={niveau.id}>
                  {niveau.nom_niveau}
                </option>
              ))}
            </select>
          </div>

          {/* Sélection de l’option */}
          <div>
            <label htmlFor="option" className="block mb-1">Option</label>
            <select
              id="option"
              className="border rounded w-full px-3 py-2"
              value={selectedOption ?? ""}
              onChange={(e) => setSelectedOption(Number(e.target.value))}
            >
              <option value="">Sélectionner une option</option>
              {options
                .filter((opt) => selectedNiveau === null || opt.niveau_id === selectedNiveau)
                .map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.nom_option}
                  </option>
                ))}
            </select>
          </div>

          {/* Titre de l’unité */}
          <div>
            <label htmlFor="titre" className="block mb-1">Titre de l’unité</label>
            <input
              id="titre"
              type="text"
              value={titreUnite}
              onChange={(e) => setTitreUnite(e.target.value)}
              placeholder="Ex: Unité 1 - Les cellules"
              className="border rounded w-full px-3 py-2"
            />
          </div>

          {/* Bouton ajouter */}
          <Button onClick={handleAddUnite} className="self-end">
            Enregistrer l’unité
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntityUniteModal;
