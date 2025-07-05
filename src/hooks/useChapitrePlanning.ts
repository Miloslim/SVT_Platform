import { useState, useCallback } from "react";
import {
  PlanChapitre,
  PlanChapterProgressionItem,
} from "@/types";
import planificationService from "@/services/planificationService";

// Fournir un chapitre initial vide si rien n'est passé
const createEmptyChapitre = (): PlanChapitre => ({
  id: null,
  niveauId: null,
  optionId: null,
  uniteId: null,
  chapitreReferenceId: null,
  titreChapitre: "",
  objectifsGeneraux: "",
  statut: "brouillon",
  progressionItems: [],
});

export function useChapitrePlanning(initialChapitre?: PlanChapitre) {
  const [chapitre, setChapitre] = useState<PlanChapitre>(
    initialChapitre ?? createEmptyChapitre()
  );
  const [selectedProgressionItem, setSelectedProgressionItem] = useState<PlanChapterProgressionItem | null>(null);
  const [isSavingOrLoading, setIsSavingOrLoading] = useState(false);

  // Générer l'ordre suivant
  const getNextOrder = useCallback(() => {
    if (!chapitre?.progressionItems?.length) return 1;
    return Math.max(...chapitre.progressionItems.map((item) => item.ordre)) + 1;
  }, [chapitre.progressionItems]);

  // Ajouter un élément
  const addProgressionItem = useCallback(
    async (
      newItem: Omit<PlanChapterProgressionItem, "id" | "ordre" | "chapficheId">
    ) => {
      let currentChapficheId = chapitre.id;

      // Si le chapitre n'a pas encore été sauvegardé
      if (!currentChapficheId) {
        setIsSavingOrLoading(true);
        try {
          const saved = await planificationServicechptr.savePlanChapitre({
            ...chapitre,
            id: null,
            progressionItems: [],
          });
          currentChapficheId = saved.id;
          setChapitre({ ...saved, progressionItems: chapitre.progressionItems });
        } catch (error) {
          setIsSavingOrLoading(false);
          throw error;
        }
        setIsSavingOrLoading(false);
      }

      const completeItem: PlanChapterProgressionItem = {
        ...newItem,
        id: crypto.randomUUID(),
        ordre: getNextOrder(),
        chapficheId: Number(currentChapficheId),
      };

      setChapitre((prev) => ({
        ...prev,
        progressionItems: [...prev.progressionItems, completeItem],
      }));
      setSelectedProgressionItem(completeItem);
    },
    [chapitre, getNextOrder]
  );

  // Mettre à jour un item
  const updateProgressionItem = useCallback(
    (updatedItem: PlanChapterProgressionItem) => {
      setChapitre((prev) => ({
        ...prev,
        progressionItems: prev.progressionItems.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        ),
      }));
      if (selectedProgressionItem?.id === updatedItem.id) {
        setSelectedProgressionItem(updatedItem);
      }
    },
    [selectedProgressionItem]
  );

  // Supprimer un item avec réordonnancement
  const removeProgressionItem = useCallback(
    (itemId: string) => {
      setChapitre((prev) => {
        const filtered = prev.progressionItems.filter((item) => item.id !== itemId);
        const reordered = filtered.map((item, idx) => ({ ...item, ordre: idx + 1 }));
        if (selectedProgressionItem?.id === itemId) {
          setSelectedProgressionItem(reordered.length > 0 ? reordered[0] : null);
        }
        return { ...prev, progressionItems: reordered };
      });
    },
    [selectedProgressionItem]
  );

  // Sauvegarder la fiche
  const saveChapitre = useCallback(async () => {
    if (!chapitre.chapitreReferenceId) {
      throw new Error("Veuillez sélectionner un chapitre de référence avant d'enregistrer.");
    }
    setIsSavingOrLoading(true);
    try {
      const saved = await planificationServicechptr.savePlanChapitre(chapitre);
      setChapitre(saved);
      return saved;
    } finally {
      setIsSavingOrLoading(false);
    }
  }, [chapitre]);

  // Réordonnancement des éléments (ex: drag & drop)
  const reorderProgressionItems = useCallback((items: PlanChapterProgressionItem[]) => {
    const reordered = items.map((item, idx) => ({
      ...item,
      ordre: idx + 1,
    }));
    setChapitre((prev) => ({
      ...prev,
      progressionItems: reordered,
    }));
  }, []);

  return {
    chapitre,
    setChapitre,
    selectedProgressionItem,
    setSelectedProgressionItem,
    isSavingOrLoading,
    addProgressionItem,
    updateProgressionItem,
    removeProgressionItem,
    saveChapitre,
    reorderProgressionItems,
  };
}
