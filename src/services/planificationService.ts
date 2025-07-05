// 📁 src/services/planificationService.ts

import { supabase } from "@/backend/config/supabase";
import {
  PlanChapitre,
  PlanChapterProgressionItem,
} from "@/types/planificationTypes";
import {
  ChapficheDb,
  CreateChapficheDb,
  UpdateChapficheDb,
  ChapitreWithDirectObjectifsDb,
  CreateChapficheSequenceDb,
  CreateChapficheActiviteDb,
  CreateChapficheEvaluationDb,
} from "@/types/dbTypes";

import { chapficheSequenceService } from "./chapficheSequenceService";
import { chapficheActiviteService } from "./chapficheActiviteService";
import { chapficheEvaluationService } from "./chapficheEvaluationService";

const CHAPFICHE_TABLE = "chapfiches";

export const StatutFiche = {
  BROUILLON: "Brouillon",
  VALIDE: "Finalisé",
  ARCHIVE: "Archivé",
} as const;

type StatutFicheType = (typeof StatutFiche)[keyof typeof StatutFiche];

function isValidStatut(statut: string): statut is StatutFicheType {
  return Object.values(StatutFiche).includes(statut as StatutFicheType);
}

export const planificationService = {
  /**
   * 🔄 Charge une fiche complète (chapitre, progression, hiérarchie)
   */
  async loadPlanChapitre(id: string): Promise<PlanChapitre | null> {
    const ficheId = Number(id);
    if (isNaN(ficheId)) {
      console.error(`[PlanifService] ID invalide : ${id}`);
      return null;
    }

    const { data, error } = await supabase
      .from<ChapficheDb>(CHAPFICHE_TABLE)
      .select(`
        id, chapitre_id, statut, created_by, date_creation, updated_at, nom_fiche_planification,
        chapitre:chapitre_id (
          id, titre_chapitre,
          objectifs(id, description_objectif),
          unite:unite_id (
            id, titre_unite,
            option:option_id (
              id, nom_option,
              niveau:niveau_id (id, nom_niveau)
            )
          )
        )
      `)
      .eq("id", ficheId)
      .single();

    if (error || !data) {
      console.error(`[PlanifService] Erreur chargement fiche ${id}`, error);
      return null;
    }

    const chapitre = data.chapitre as ChapitreWithDirectObjectifsDb;
    const progressionItems: PlanChapterProgressionItem[] = [];

    // --- Récupération des éléments liés
    const [seqRes, actRes, evalRes] = await Promise.all([
      chapficheSequenceService.getByChapficheId(ficheId),
      chapficheActiviteService.getByChapficheId(ficheId),
      chapficheEvaluationService.getByChapficheId(ficheId),
    ]);

    seqRes.data?.forEach((item) =>
      progressionItems.push({
        id: `seq-${item.sequence_id}`,
        type: "sequence",
        sourceId: item.sequence_id,
        ordre: item.ordre,
        chapficheId: ficheId,
      })
    );
    actRes.data?.forEach((item) =>
      progressionItems.push({
        id: `act-${item.activite_id}`,
        type: "activity",
        sourceId: item.activite_id,
        ordre: item.ordre,
        chapficheId: ficheId,
      })
    );
    evalRes.data?.forEach((item) =>
      progressionItems.push({
        id: `eval-${item.evaluation_id}`,
        type: "evaluation",
        sourceId: item.evaluation_id,
        ordre: item.ordre,
        chapficheId: ficheId,
      })
    );

    progressionItems.sort((a, b) => a.ordre - b.ordre);

    return {
      id: ficheId.toString(),
      chapitreReferenceId: data.chapitre_id,
      titreChapitre: chapitre?.titre_chapitre || "",
      objectifsReferencesIds: chapitre?.objectifs?.map((o) => o.id) || [],
      objectifsGeneraux:
        chapitre?.objectifs
          ?.map((o) => `${o.id}. ${o.description_objectif}`)
          .join("\n\n") || "",
      niveauId: chapitre?.unite?.option?.niveau?.id || null,
      optionId: chapitre?.unite?.option?.id || null,
      uniteId: chapitre?.unite?.id || null,
      nomFichePlanification: data.nom_fiche_planification || "",
      statut: isValidStatut(data.statut) ? data.statut : StatutFiche.BROUILLON,
      createdBy: data.created_by || "",
      createdAt: data.date_creation,
      updatedAt: data.updated_at,
      progressionItems,
    };
  },

  /**
   * 💾 Sauvegarde une fiche (création ou mise à jour)
   */
  async savePlanChapitre(chapitre: PlanChapitre): Promise<PlanChapitre> {
    const isUpdate = Boolean(chapitre.id);
    const ficheId = Number(chapitre.id);

    const payload: CreateChapficheDb | UpdateChapficheDb = {
      chapitre_id: chapitre.chapitreReferenceId,
      statut: isValidStatut(chapitre.statut)
        ? chapitre.statut
        : StatutFiche.BROUILLON,
      created_by: chapitre.createdBy,
      nom_fiche_planification: chapitre.nomFichePlanification,
    };

    let saved: ChapficheDb | null = null;

    if (isUpdate && !isNaN(ficheId)) {
      const { data, error } = await supabase
        .from<ChapficheDb>(CHAPFICHE_TABLE)
        .update(payload)
        .eq("id", ficheId)
        .select()
        .single();
      if (error) throw error;
      saved = data;
    } else {
      const { data, error } = await supabase
        .from<ChapficheDb>(CHAPFICHE_TABLE)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      saved = data;
      chapitre.id = saved.id.toString();
    }

    if (!saved) throw new Error("Échec de la sauvegarde principale");

    // Supprimer anciennes liaisons
    await Promise.all([
      chapficheSequenceService.deleteByChapficheId(saved.id),
      chapficheActiviteService.deleteByChapficheId(saved.id),
      chapficheEvaluationService.deleteByChapficheId(saved.id),
    ]);

    // Créer nouvelles liaisons
    const seqToInsert: CreateChapficheSequenceDb[] = chapitre.progressionItems
      .filter((item) => item.type === "sequence")
      .map((item) => ({
        chapfiche_id: saved!.id,
        sequence_id: item.sourceId!,
        ordre: item.ordre,
      }));

    const actToInsert: CreateChapficheActiviteDb[] = chapitre.progressionItems
      .filter((item) => item.type === "activity")
      .map((item) => ({
        chapfiche_id: saved!.id,
        activite_id: item.sourceId!,
        ordre: item.ordre,
      }));

    const evalToInsert: CreateChapficheEvaluationDb[] = chapitre.progressionItems
      .filter((item) => item.type === "evaluation")
      .map((item) => ({
        chapfiche_id: saved!.id,
        evaluation_id: item.sourceId!,
        ordre: item.ordre,
      }));

    await Promise.all([
      seqToInsert.length > 0
        ? chapficheSequenceService.insertMany(seqToInsert)
        : Promise.resolve(),
      actToInsert.length > 0
        ? chapficheActiviteService.insertMany(actToInsert)
        : Promise.resolve(),
      evalToInsert.length > 0
        ? chapficheEvaluationService.insertMany(evalToInsert)
        : Promise.resolve(),
    ]);

    return {
      ...chapitre,
      id: saved.id.toString(),
      progressionItems: chapitre.progressionItems.map((item) => ({
        ...item,
        chapficheId: saved!.id,
      })),
      createdAt: saved.date_creation,
      updatedAt: saved.updated_at,
    };
  },
};
