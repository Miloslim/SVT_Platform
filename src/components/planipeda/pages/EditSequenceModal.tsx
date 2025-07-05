// ============================================================
// Titre : EditSequenceModal
// Chemin : src/components/planipeda/pages/EditSequenceModal.tsx
// Fonctionnalités :
//   - Affiche une modale pour l'édition d'une séquence pédagogique.
//   - Intègre le composant EditSequenceEditor.
//   - Gère la fermeture et la notification après la sauvegarde.
// ============================================================

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EditSequenceEditor from "@/components/planipeda/ScenarioEditor/EditSequenceEditor";

interface EditSequenceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sequenceId: number | null;
  onSequenceUpdated: () => void;
}

const EditSequenceModal: React.FC<EditSequenceModalProps> = ({
  isOpen,
  onOpenChange,
  sequenceId,
  onSequenceUpdated,
}) => {
  // Fermer la modale (appelé par EditSequenceEditor)
  const handleCancel = () => {
    onOpenChange(false);
  };

  // Callback appelé après une sauvegarde réussie dans EditSequenceEditor
  const handleSaveSuccess = () => {
    onSequenceUpdated();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center text-2xl font-bold">
            Modifier la Séquence Pédagogique
          </DialogTitle>
        </DialogHeader>

        {/* Affiche EditSequenceEditor uniquement si la modale est ouverte et un ID est présent */}
        {isOpen && sequenceId && (
          <div className="p-6">
            <EditSequenceEditor
              sequenceId={sequenceId}
              onSaveSuccess={handleSaveSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditSequenceModal;
