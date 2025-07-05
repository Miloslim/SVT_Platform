// 📁 src/components/planipeda/ScenarioEditor/SequenceForm.tsx

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"; // adapte selon ton projet
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react"; // ou autre icône
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem"; // adapte le chemin

// Exemple types (adapter selon ton projet)
interface Niveau {
  id: number;
  nom_niveau: string;
}
interface Option {
  id: number;
  nom_option: string;
  niveau_id: number;
}
interface Unite {
  id: number;
  titre_unite: string;
  option_id: number;
}
interface Chapitre {
  id: number;
  titre_chapitre: string;
  unite_id: number;
}

interface SequenceData {
  titre_sequence?: string;
  objectifs_specifiques?: string;
  description?: string;
  duree_estimee?: number;
  prerequis?: string;
  statut?: string;
}

interface SequenceItem {
  id: number;
  type: "activite" | "evaluation";
  titre: string;
  description?: string;
}

interface SequenceFormProps {
  // Props que tu passes
  initialSequenceData?: SequenceData;
  onCancel: () => void;
  // autres props comme niveau, option, ...
}

const SequenceForm: React.FC<SequenceFormProps> = ({
  initialSequenceData,
  onCancel,
}) => {
  // États sélection hiérarchique
  const [selectedNiveauId, setSelectedNiveauId] = useState<number | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [selectedUniteId, setSelectedUniteId] = useState<number | null>(null);
  const [selectedChapitreId, setSelectedChapitreId] = useState<number | null>(
    null
  );

  // Données hiérarchiques (à remplacer par fetch ou props)
  const [niveaux, setNiveaux] = useState<Niveau[]>([
    { id: 1, nom_niveau: "Niveau 1" },
    { id: 2, nom_niveau: "Niveau 2" },
  ]);
  const [options, setOptions] = useState<Option[]>([
    { id: 1, nom_option: "Option A", niveau_id: 1 },
    { id: 2, nom_option: "Option B", niveau_id: 1 },
    { id: 3, nom_option: "Option C", niveau_id: 2 },
  ]);
  const [unites, setUnites] = useState<Unite[]>([
    { id: 1, titre_unite: "Unité 1", option_id: 1 },
    { id: 2, titre_unite: "Unité 2", option_id: 2 },
  ]);
  const [chapitres, setChapitres] = useState<Chapitre[]>([
    { id: 1, titre_chapitre: "Chapitre 1", unite_id: 1 },
    { id: 2, titre_chapitre: "Chapitre 2", unite_id: 2 },
  ]);

  // Filtrage selon hiérarchie
  const filteredOptions = options.filter(
    (o) => o.niveau_id === selectedNiveauId
  );
  const filteredUnites = unites.filter((u) => u.option_id === selectedOptionId);
  const filteredChapitres = chapitres.filter(
    (c) => c.unite_id === selectedUniteId
  );

  // Données du formulaire
  const [sequenceData, setSequenceData] = useState<SequenceData>(
    initialSequenceData || {
      statut: "brouillon",
    }
  );

  // Items de la séquence (activités, évaluations)
  const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>([]);

  // Loading / erreurs / sauvegarde
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal d'ajout
  const [showActivityEditor, setShowActivityEditor] = useState(false);
  const [showEvaluationEditor, setShowEvaluationEditor] = useState(false);

  // Validité formulaire
  const isFormValid = Boolean(sequenceData.titre_sequence && selectedChapitreId);

  // Handlers de sélection hiérarchique
  function handleNiveauChange(value: string) {
    const id = value ? parseInt(value, 10) : null;
    setSelectedNiveauId(id);
    setSelectedOptionId(null);
    setSelectedUniteId(null);
    setSelectedChapitreId(null);
  }

  function handleOptionChange(value: string) {
    const id = value ? parseInt(value, 10) : null;
    setSelectedOptionId(id);
    setSelectedUniteId(null);
    setSelectedChapitreId(null);
  }

  function handleUniteChange(value: string) {
    const id = value ? parseInt(value, 10) : null;
    setSelectedUniteId(id);
    setSelectedChapitreId(null);
  }

  function handleChapitreChange(value: string) {
    const id = value ? parseInt(value, 10) : null;
    setSelectedChapitreId(id);
  }

  // Handler statut
  function handleStatusChange(value: string) {
    setSequenceData((prev) => ({ ...prev, statut: value }));
  }

  // Handler input classique
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setSequenceData((prev) => ({ ...prev, [name]: value }));
  }

  // Gestion des items (ajout, suppression, déplacement) - placeholders
  function handleAddActivityClick() {
    setShowActivityEditor(true);
  }
  function handleAddEvaluationClick() {
    setShowEvaluationEditor(true);
  }
  function handleActivityCreated(newActivity: SequenceItem) {
    setSequenceItems((prev) => [...prev, newActivity]);
    setShowActivityEditor(false);
  }
  function handleEvaluationCreated(newEvaluation: SequenceItem) {
    setSequenceItems((prev) => [...prev, newEvaluation]);
    setShowEvaluationEditor(false);
  }
  function handleRemoveSequenceItem(id: number) {
    setSequenceItems((prev) => prev.filter((item) => item.id !== id));
  }
  function handleMoveSequenceItem(id: string, direction: "up" | "down") {
    // À implémenter selon ta logique de tri
  }
  function handleDragEnd(event: any) {
    // À implémenter selon ta logique de DnD
  }

  // Soumission formulaire (placeholder)
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSaving(true);
    // Sauvegarde à faire ici (API / supabase / etc.)
    setTimeout(() => {
      setIsSaving(false);
      alert("Sauvegarde effectuée !");
    }, 1500);
  }

  // Rendu conditionnel selon loading / erreur
  if (isLoadingForm) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-lg text-gray-600">
          Chargement des données du formulaire...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col justify-center items-center h-48 text-red-600">
        <p className="text-lg">Erreur lors du chargement du formulaire :</p>
        <p className="text-sm">{loadError}</p>
        <Button onClick={onCancel} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  // === Rendu principal ===
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 bg-white p-6 rounded-lg shadow-xl max-w-[100vw] mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche */}
        <div className="space-y-6">
          {/* Section 1 */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
            <h2 className="text-xl font-bold text-blue-800 mb-4">
              Liaison de la Séquence au Programme Pédagogique
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="niveau">Niveau</Label>
                <Select
                  onValueChange={handleNiveauChange}
                  value={selectedNiveauId?.toString() || ""}
                >
                  <SelectTrigger id="niveau">
                    <SelectValue placeholder="Sélectionner un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {niveaux.map((n) => (
                      <SelectItem key={n.id} value={n.id.toString()}>
                        {n.nom_niveau}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="option">Option</Label>
                <Select
                  onValueChange={handleOptionChange}
                  value={selectedOptionId?.toString() || ""}
                  disabled={!selectedNiveauId}
                >
                  <SelectTrigger id="option">
                    <SelectValue placeholder="Sélectionner une option" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id.toString()}>
                        {o.nom_option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unite">Unité</Label>
                <Select
                  onValueChange={handleUniteChange}
                  value={selectedUniteId?.toString() || ""}
                  disabled={!selectedOptionId}
                >
                  <SelectTrigger id="unite">
                    <SelectValue placeholder="Sélectionner une unité" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUnites.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.titre_unite}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="chapitre">Chapitre</Label>
                <Select
                  onValueChange={handleChapitreChange}
                  value={selectedChapitreId?.toString() || ""}
                  disabled={!selectedUniteId}
                >
                  <SelectTrigger id="chapitre">
                    <SelectValue placeholder="Sélectionner un chapitre" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredChapitres.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.titre_chapitre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="relative p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Détails de la Séquence
            </h2>
            <div className="absolute top-4 right-4">
              <Label htmlFor="statut" className="sr-only">
                Statut
              </Label>
              <Select
                onValueChange={handleStatusChange}
                value={sequenceData.statut || "brouillon"}
              >
                <SelectTrigger
                  id="statut"
                  className="h-9 w-[120px] text-sm bg-white shadow-sm"
                >
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="validee">Validée</SelectItem>
                  <SelectItem value="archivee">Archivée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titre_sequence">Titre</Label>
                <Input
                  id="titre_sequence"
                  name="titre_sequence"
                  value={sequenceData.titre_sequence || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="objectifs_specifiques">Objectif général</Label>
                <Input
                  id="objectifs_specifiques"
                  name="objectifs_specifiques"
                  value={sequenceData.objectifs_specifiques || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={sequenceData.description || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="duree_estimee">Durée estimée</Label>
                <Input
                  id="duree_estimee"
                  name="duree_estimee"
                  type="number"
                  value={sequenceData.duree_estimee || ""}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="prerequis">Prérequis</Label>
                <Input
                  id="prerequis"
                  name="prerequis"
                  value={sequenceData.prerequis || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col h-full justify-between space-y-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
            <h3 className="text-lg font-bold text-blue-800 mb-3">
              Éléments de la Séquence
            </h3>
            <div className="flex gap-4 mb-6">
              <Button
                type="button"
                onClick={handleAddActivityClick}
                disabled={isSaving || !selectedChapitreId}
                className="flex-1 bg-blue-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Ajouter une Activité
              </Button>
              <Button
                type="button"
                onClick={handleAddEvaluationClick}
                disabled={isSaving || !selectedChapitreId}
                className="flex-1 bg-orange-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Ajouter une Évaluation
              </Button>
            </div>
            {sequenceItems.length === 0 ? (
              <p className="text-center text-gray-600">Aucun élément ajouté.</p>
            ) : (
              <div className="overflow-x-auto border rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-xs font-medium text-gray-500">
                        Ordre
                      </th>
                      <th className="px-2 py-2 text-xs font-medium text-gray-500">
                        Type
                      </th>
                      <th className="px-4 py-2 text-xs font-medium text-gray-500">
                        Titre / Description
                      </th>
                      <th className="px-2 py-2 text-xs font-medium text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <DndContext
                    sensors={[]}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={sequenceItems.map(
                        (item) => `${item.type}-${item.id}`
                      )}
                      strategy={verticalListSortingStrategy}
                    >
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sequenceItems.map((item, index) => (
                          <SortableItem
                            key={`${item.type}-${item.id}`}
                            id={`${item.type}-${item.id}`}
                            item={item}
                            index={index}
                            onRemove={handleRemoveSequenceItem}
                            onMoveUp={(id) => handleMoveSequenceItem(id, "up")}
                            onMoveDown={(id) =>
                              handleMoveSequenceItem(id, "down")
                            }
                            isFirst={index === 0}
                            isLast={index === sequenceItems.length - 1}
                          />
                        ))}
                      </tbody>
                    </SortableContext>
                  </DndContext>
                </table>
              </div>
            )}
          </div>
          <div className="flex justify-start gap-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving || !isFormValid}>
              {isSaving ? "Sauvegarde en cours..." : initialSequenceData ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </div>
      </div>

      {showActivityEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl mx-auto overflow-y-auto max-h-[90vh]">
            {/* Remplace par ton modal */}
            <p>Modal Ajout Activité (à implémenter)</p>
            <Button onClick={() => setShowActivityEditor(false)}>Fermer</Button>
          </div>
        </div>
      )}

      {showEvaluationEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-5xl mx-auto overflow-y-auto max-h-[90vh]">
            {/* Remplace par ton modal */}
            <p>Modal Ajout Évaluation (à implémenter)</p>
            <Button onClick={() => setShowEvaluationEditor(false)}>Fermer</Button>
          </div>
        </div>
      )}
    </form>
  );
};

export default SequenceForm;
