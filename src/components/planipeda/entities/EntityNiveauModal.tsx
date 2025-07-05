// ===========================================================================
// 📄 Fichier : EntityNiveauModal.tsx
// 📁 Chemin : src/planipeda/entities/EntityNiveauModal.tsx
// 🎯 Objectif : Gérer une modale d'ajout ou de modification pour les niveaux
// ===========================================================================

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/backend/config/supabase";

// ---------------------------------------------------------------------------
// 🔷 Interface des props du composant EntityNiveauModal
// ---------------------------------------------------------------------------
interface EntityNiveauModalProps {
  open: boolean;                         // Contrôle si la modale est ouverte
  onClose: () => void;                   // Fonction à appeler pour fermer
  entity?: { id?: number; nom_niveau?: string }; // Niveau existant (ou vide si nouveau)
  onSaved: () => void;                   // Callback après ajout/modification
  placeholder?: string;                  // Texte d'aide dans le champ
}

// ---------------------------------------------------------------------------
// 🧩 Composant principal
// ---------------------------------------------------------------------------
const EntityNiveauModal: React.FC<EntityNiveauModalProps> = ({
  open,
  onClose,
  entity,
  onSaved,
  placeholder,
}) => {
  const [nomNiveau, setNomNiveau] = useState(""); // État local du champ texte

  // 🔁 Pré-remplit le champ si on édite un niveau existant
  useEffect(() => {
    setNomNiveau(entity?.nom_niveau || "");
  }, [entity]);

  // ✅ Gérer la sauvegarde : insertion si nouveau, mise à jour si existant
const handleSave = async () => {
  const nomNettoye = nomNiveau.trim();
  if (!nomNettoye) {
    alert("Le nom du niveau est requis.");
    return;
  }

  let error;

  if (entity?.id) {
    // Mise à jour (si id existe, on met à jour l'enregistrement existant)
    ({ error } = await supabase
      .from("niveaux")
      .update({ nom_niveau: nomNettoye }) // met à jour le nom du niveau
      .eq("id", entity.id)); // identifie l'enregistrement avec l'ID

  } else {
    // Insertion (si aucun id, on insère un nouveau niveau)
    ({ error } = await supabase
      .from("niveaux")
      .insert([{ nom_niveau: nomNettoye }])) // insère un nouveau niveau avec le nom
  }

  // Gestion des erreurs
  if (error) {
    console.error("❌ Erreur lors de la sauvegarde :", error.message);
  } else {
    onSaved();  // Rafraîchir la liste des niveaux
    onClose();  // Fermer la modale après sauvegarde
  }
};


  // ❌ Supprimer un niveau (si en mode édition)
  const handleDelete = async () => {
    if (!entity?.id) return;

    const { error } = await supabase.from("niveaux").delete().eq("id", entity.id);

    if (error) {
      console.error("❌ Erreur lors de la suppression :", error.message);
    } else {
      onSaved();  // Rafraîchir
      onClose();  // Fermer la modale
    }
  };

  // -------------------------------------------------------------------------
  // 🖼️ Interface de la modale
  // -------------------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {entity?.id ? "Modifier le niveau" : "Ajouter un niveau"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Champ de saisie du nom */}
          <Input
            placeholder={placeholder || "Nom du niveau"}
            value={nomNiveau}
            onChange={(e) => setNomNiveau(e.target.value)}
          />

          {/* Boutons : Supprimer (si existant), Annuler, Valider */}
          <div className="flex justify-between gap-2">
            {entity?.id && (
              <Button variant="destructive" onClick={handleDelete}>
                Supprimer
              </Button>
            )}

            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                {entity?.id ? "Mettre à jour" : "Ajouter"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntityNiveauModal;
