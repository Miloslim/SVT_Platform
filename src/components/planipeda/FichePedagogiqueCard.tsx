// ===========================================================================
// 📁 Fichier : FichePedagogiqueCard.tsx
// 📌 Emplacement : src/components/planipeda/FichePedagogiqueCard.tsx
// 🎯 Objectif :
//   - Composant carte pour afficher le résumé d'une fiche pédagogique
//   - Affiche titre, date, statut et actions (modifier, visualiser, supprimer)
//   - Props : fiche (données), callbacks pour les actions
// ===========================================================================

import React from "react";
import { Button } from "@/components/ui/button";
import { EditIcon, EyeIcon, TrashIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// 📄 Type : FichePedagogique
// Description : Définit la structure minimale d'une fiche pédagogique
// ---------------------------------------------------------------------------
export type FichePedagogique = {
  id: number;
  title: string;
  date: string;
  status: "En cours" | "Terminée";
};

// ---------------------------------------------------------------------------
// 📄 Props du composant
// - fiche : données de la fiche à afficher
// - onEdit, onPreview, onDelete : fonctions callback pour actions sur la fiche
// ---------------------------------------------------------------------------
type Props = {
  fiche: FichePedagogique;
  onEdit?: (id: number) => void;
  onPreview?: (id: number) => void;
  onDelete?: (id: number) => void;
};

/**
 * Composant carte affichant une fiche pédagogique avec ses informations
 * et les boutons d'action.
 */
const FichePedagogiqueCard: React.FC<Props> = ({ fiche, onEdit, onPreview, onDelete }) => {
  return (
    <div className="fiche-card shadow-md rounded-lg p-4 border space-y-2">
      {/* Titre de la fiche */}
      <h3 className="text-lg font-semibold">{fiche.title}</h3>
      
      {/* Date formatée */}
      <p className="text-sm text-muted-foreground">
        Date : {new Date(fiche.date).toLocaleDateString()}
      </p>
      
      {/* Statut avec badge coloré */}
      <p>
        Statut :{" "}
        <span className={`status-badge ${fiche.status === "Terminée" ? "completed" : "in-progress"}`}>
          {fiche.status}
        </span>
      </p>

      {/* Boutons d'actions : Modifier, Visualiser, Supprimer */}
      <div className="flex gap-2 pt-2">
        <Button variant="edit" size="sm" onClick={() => onEdit?.(fiche.id)}>
          <EditIcon size={16} />
          <span>Modifier</span>
        </Button>
        <Button variant="view" size="sm" onClick={() => onPreview?.(fiche.id)}>
          <EyeIcon size={16} />
          <span>Visualiser</span>
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete?.(fiche.id)}>
          <TrashIcon size={16} />
          <span>Supprimer</span>
        </Button>
      </div>
    </div>
  );
};

export default FichePedagogiqueCard;
