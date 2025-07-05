// ===========================================================================
// 📄 Fichier : EntityModal.tsx
// 📁 Chemin : src/planipeda/entities/EntityModal.tsx
// 🎯 Objectif : Gérer une modale de modification pour les options.
// ===========================================================================

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/backend/config/supabase";

// ---------------------------------------------------------------------------
// 🔷 Props du composant EntityModal
// ---------------------------------------------------------------------------
// Ce composant prend des props spécifiques pour gérer l'affichage de la modale
// ainsi que les actions liées aux options : modification et suppression.

interface EntityModalProps {
  open: boolean; // Indique si la modale est ouverte ou fermée
  onClose: () => void; // Fonction pour fermer la modale
  entity: { id: number; nom_option: string; niveau_id: number }; // Entité option à modifier
  onSaved: () => void; // Fonction appelée après la sauvegarde des modifications
  placeholder?: string; // Valeur par défaut pour le champ de saisie (optionnelle)
}

// ---------------------------------------------------------------------------
// 🧩 Composant EntityModal
// ---------------------------------------------------------------------------
// Ce composant est responsable de l'affichage de la modale pour la gestion des options,
// permettant à l'utilisateur de modifier ou de supprimer une option.

const EntityModal: React.FC<EntityModalProps> = ({ open, onClose, entity, onSaved, placeholder }) => {
  const [nom, setNom] = useState(""); // État pour stocker le nom de l'option

  // Mise à jour du nom lorsque l'entité change (par exemple, lorsque l'option est sélectionnée pour la modification)
  useEffect(() => {
    if (entity) {
      setNom(entity.nom_option); // Initialise le champ de saisie avec le nom de l'option à modifier
    }
  }, [entity]);

  // Fonction pour sauvegarder l'option modifiée dans la base de données
  const handleSave = async () => {
    if (!nom.trim()) return; // Vérifie que le nom n'est pas vide

    // Mise à jour de l'option dans la table "options"
    const { error } = await supabase
      .from("options")
      .update({ nom_option: nom }) // Met à jour le nom de l'option
      .eq("id", entity.id); // Correspondance de l'ID de l'option

    if (error) {
      console.error("❌ Erreur lors de la mise à jour de l'option :", error.message);
      return;
    }

    onSaved(); // Appel de la fonction de sauvegarde après mise à jour
    onClose(); // Fermeture de la modale après sauvegarde
  };

  // Fonction pour supprimer l'option de la base de données
  const handleDelete = async () => {
    // Suppression de l'option dans la table "options"
    const { error } = await supabase.from("options").delete().eq("id", entity.id);

    if (error) {
      console.error("❌ Erreur lors de la suppression de l'option :", error.message);
      return;
    }

    onSaved(); // Appel de la fonction de sauvegarde après suppression
    onClose(); // Fermeture de la modale après suppression
  };

  return (
    // Affichage de la modale avec le composant Dialog
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'option</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Champ de saisie pour le nom de l'option */}
          <Input
            placeholder={placeholder || "Nom de l'option"} // Placeholder par défaut si aucune valeur n'est fournie
            value={nom} // Valeur actuelle du champ de saisie
            onChange={(e) => setNom(e.target.value)} // Mise à jour du nom dans l'état
          />

          {/* Conteneur pour les boutons */}
          <div className="flex justify-between gap-2">
            {/* Bouton pour supprimer l'option */}
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>

            <div className="ml-auto flex gap-2">
              {/* Bouton pour annuler la modification */}
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              {/* Bouton pour sauvegarder les modifications */}
              <Button onClick={handleSave}>Mettre à jour</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntityModal;
