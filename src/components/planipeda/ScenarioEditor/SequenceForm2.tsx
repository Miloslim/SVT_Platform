//version 2 affichage d'un bloc activité, et manque d'affichage de bloc evaluation
//SequenceForm2.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// Import des composants UI (assurez-vous que les chemins sont corrects et les composants existent)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

// Icônes (assurez-vous d'avoir installé lucide-react)
import { Plus, GripVertical, Edit, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

// DND Kit imports pour le glisser-déposer des éléments
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Modales d'ajout (chemins à vérifier selon votre structure de projet)
import ActivityChooserModal from './ActivityChooserModal';
import EvaluationChooserModal from './EvaluationChooserModal';

// --- Définitions de types et interfaces ---

interface Chapitre {
    id: number;
    titre_chapitre: string;
}

export interface SequenceItem {
    id: number;
    type: 'activity' | 'evaluation';
    titre: string;
    description?: string;
    objectifs?: string[];
    type_evaluation?: string;
    connaissances?: string[];
    capacitesEvaluees?: string[];
    order_in_sequence: number;
}

interface AddedActivityItem {
    id: number;
    titre_activite: string;
    description: string;
    objectifs: { id: number; description_objectif: string }[];
}

interface AddedEvaluationItem {
    id: number;
    titre_evaluation: string;
    type_evaluation?: string;
    connaissances: { id: number; titre_connaissance: string }[];
    capacites_habiletes: { id: number; titre_capacite_habilete: string }[];
}

const sequenceFormSchema = z.object({
    titre_sequence: z.string().min(1, "Le titre de la séquence est obligatoire."),
    description: z.string().optional(),
    statut: z.enum(['brouillon', 'publie', 'archive'], {
        errorMap: () => ({ message: "Le statut sélectionné est invalide." }),
    }),
    objectif_sequence: z.string().min(1, "L'objectif de la séquence est obligatoire."),
    mots_cles: z.string().optional(),
});

type SequenceFormData = z.infer<typeof sequenceFormSchema>;

interface InitialSequenceData extends SequenceFormData {
    id?: number;
    chapitre_id?: number;
}

interface SequenceFormProps {
    chapitres?: Chapitre[]; // Rendre optionnel si vous définissez une valeur par défaut
    initialSequenceData?: InitialSequenceData;
    initialSequenceItems?: SequenceItem[];
    onSequenceSubmit: (
        data: SequenceFormData,
        chapitreId: number,
        sequenceItems: SequenceItem[],
        isEdit: boolean
    ) => Promise<void>;
    onCancel: () => void;
    isSaving: boolean;
    isLoadingForm: boolean;
}

interface SortableItemProps {
    id: string;
    item: SequenceItem;
    index: number;
    onRemove: (type: 'activity' | 'evaluation', id: number) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    isFirst: boolean;
    isLast: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, item, index, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'table-row',
    };

    return (
        <tr ref={setNodeRef} style={style} className="bg-white border-b border-gray-200 hover:bg-gray-50">
            <td className="px-4 py-2 text-center align-middle whitespace-nowrap text-gray-700">
                <div className="flex items-center justify-center gap-2">
                    <button
                        type="button"
                        {...listeners}
                        {...attributes}
                        className="cursor-grab p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                        aria-label="Déplacer l'élément"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                    <span className="font-medium">{index + 1}</span>
                </div>
            </td>

            <td className="px-4 py-2 align-middle whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.type === 'activity' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                    {item.type === 'activity' ? 'Activité' : 'Évaluation'}
                </span>
            </td>

            <td className="px-4 py-2 align-middle text-gray-800 font-medium max-w-xs truncate" title={item.titre}>
                {item.titre}
            </td>

            <td className="px-4 py-2 align-middle whitespace-nowrap text-right">
                <div className="flex items-center justify-end space-x-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveUp(id)}
                        disabled={isFirst}
                        className="p-1 h-auto w-auto text-gray-500 hover:text-blue-600"
                        title="Déplacer vers le haut"
                    >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Déplacer {item.titre} vers le haut</span>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveDown(id)}
                        disabled={isLast}
                        className="p-1 h-auto w-auto text-gray-500 hover:text-blue-600"
                        title="Déplacer vers le bas"
                    >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Déplacer {item.titre} vers le bas</span>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        // onClick={() => onEdit(item.type, item.id)}
                        className="p-1 h-auto w-auto text-gray-500 hover:text-yellow-600 opacity-50 cursor-not-allowed"
                        title="Modifier (fonctionnalité à venir)"
                        disabled
                    >
                        <Edit className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Modifier {item.titre}</span>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(item.type, item.id)}
                        className="p-1 h-auto w-auto text-red-500 hover:text-red-700"
                        title="Supprimer"
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Supprimer {item.titre}</span>
                    </Button>
                </div>
            </td>
        </tr>
    );
};

const SequenceForm: React.FC<SequenceFormProps> = ({
    chapitres = [], // <-- LA CORRECTION ICI : VALEUR PAR DÉFAUT
    initialSequenceData,
    initialSequenceItems = [],
    onSequenceSubmit,
    onCancel,
    isSaving,
    isLoadingForm,
}) => {
    const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<SequenceFormData>({
        resolver: zodResolver(sequenceFormSchema),
        defaultValues: initialSequenceData || {
            titre_sequence: '',
            description: '',
            statut: 'brouillon',
            objectif_sequence: '',
            mots_cles: '',
        },
    });

    const [selectedChapitreId, setSelectedChapitreId] = useState<number | null>(
        initialSequenceData?.chapitre_id || null
    );

    const [currentSequenceItems, setCurrentSequenceItems] = useState<SequenceItem[]>(initialSequenceItems || []);

    const [showActivityChooser, setShowActivityChooser] = useState(false);
    const [showEvaluationChooser, setShowEvaluationChooser] = useState(false);

    useEffect(() => {
        if (initialSequenceData) {
            reset(initialSequenceData);
            setSelectedChapitreId(initialSequenceData.chapitre_id || null);
            setCurrentSequenceItems(initialSequenceItems || []);
        } else {
            reset({
                titre_sequence: '',
                description: '',
                statut: 'brouillon',
                objectif_sequence: '',
                mots_cles: '',
            });
            setSelectedChapitreId(null);
            setCurrentSequenceItems([]);
        }
    }, [initialSequenceData, initialSequenceItems, reset]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setCurrentSequenceItems((items) => {
                const oldIndex = items.findIndex(item => `${item.type}-${item.id}` === active.id);
                const newIndex = items.findIndex(item => `${item.type}-${item.id}` === over?.id);

                if (oldIndex === -1 || newIndex === -1) return items;

                const newItems = arrayMove(items, oldIndex, newIndex);
                const reorderedItems = newItems.map((item, index) => ({ ...item, order_in_sequence: index + 1 }));
                return reorderedItems;
            });
        }
    }, []);

    const handleMoveSequenceItem = useCallback((id: string, direction: 'up' | 'down') => {
        setCurrentSequenceItems(prevItems => {
            const index = prevItems.findIndex(item => `${item.type}-${item.id}` === id);
            if (index === -1) return prevItems;

            const newItems = [...prevItems];
            if (direction === 'up' && index > 0) {
                [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
            } else if (direction === 'down' && index < newItems.length - 1) {
                [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
            }
            const reorderedItems = newItems.map((item, idx) => ({ ...item, order_in_sequence: idx + 1 }));
            return reorderedItems;
        });
    }, []);

    const handleActivityAdded = useCallback((newActivity: AddedActivityItem) => {
        setCurrentSequenceItems(prevItems => {
            const newItem: SequenceItem = {
                id: newActivity.id,
                titre: newActivity.titre_activite,
                description: newActivity.description || "",
                objectifs: newActivity.objectifs.map(obj => obj.description_objectif),
                type: 'activity',
                order_in_sequence: prevItems.length + 1,
            };
            const updatedItems = [...prevItems, newItem];
            return updatedItems;
        });
        setShowActivityChooser(false);
        toast.success(`Activité "${newActivity.titre_activite}" ajoutée à la séquence.`);
    }, []);

    const handleEvaluationAdded = useCallback((newEvaluation: AddedEvaluationItem) => {
        setCurrentSequenceItems(prevItems => {
            const newItem: SequenceItem = {
                id: newEvaluation.id,
                titre: newEvaluation.titre_evaluation,
                type_evaluation: newEvaluation.type_evaluation || "",
                description: newEvaluation.titre_evaluation,
                connaissances: newEvaluation.connaissances.map(c => c.titre_connaissance),
                capacitesEvaluees: newEvaluation.capacites_habiletes.map(ch => ch.titre_capacite_habilete),
                type: 'evaluation',
                order_in_sequence: prevItems.length + 1,
            };
            const updatedItems = [...prevItems, newItem];
            return updatedItems;
        });
        setShowEvaluationChooser(false);
        toast.success(`Évaluation "${newEvaluation.titre_evaluation}" ajoutée à la séquence.`);
    }, []);

    const handleRemoveSequenceItem = useCallback((type: 'activity' | 'evaluation', id: number) => {
        setCurrentSequenceItems(prevItems => {
            const updatedItems = prevItems.filter(item => !(item.type === type && item.id === id));
            const reorderedItems = updatedItems.map((item, index) => ({ ...item, order_in_sequence: index + 1 }));
            return reorderedItems;
        });
        toast.info("Élément retiré de la séquence.");
    }, []);

    const handleAddActivityClick = () => {
        if (!selectedChapitreId) {
            toast.error("Veuillez sélectionner un chapitre avant d'ajouter une activité.");
            return;
        }
        setShowActivityChooser(true);
    };

    const handleAddEvaluationClick = () => {
        if (!selectedChapitreId) {
            toast.error("Veuillez sélectionner un chapitre avant d'ajouter une évaluation.");
            return;
        }
        setShowEvaluationChooser(true);
    };

    const isFormValid = useMemo(() => {
        const watchedData = watch();
        return sequenceFormSchema.safeParse(watchedData).success && selectedChapitreId !== null;
    }, [watch, selectedChapitreId]);

    const onSubmit = useCallback(async (data: SequenceFormData) => {
        if (!selectedChapitreId) {
            toast.error("Veuillez sélectionner un chapitre avant de soumettre.");
            return;
        }
        const isEditMode = initialSequenceData !== undefined && initialSequenceData.id !== undefined;
        await onSequenceSubmit(data, selectedChapitreId, currentSequenceItems, isEditMode);
    }, [selectedChapitreId, currentSequenceItems, initialSequenceData, onSequenceSubmit]);


    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white p-6 rounded-lg shadow-xl max-w-3xl mx-auto">
            {isLoadingForm && (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />
                    <p className="ml-2 text-gray-600">Chargement des données de la séquence...</p>
                </div>
            )}

            {/* Section 1: Informations générales */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Informations Générales</h3>

                <div className="mb-4">
                    <label htmlFor="titre_sequence" className="block text-sm font-medium text-gray-700 mb-1">
                        Titre de la Séquence <span className="text-red-500">*</span>
                    </label>
                    <Input
                        id="titre_sequence"
                        {...register('titre_sequence')}
                        placeholder="Ex: Séquence sur les Réseaux Sociaux"
                        className={errors.titre_sequence ? 'border-red-500' : ''}
                    />
                    {errors.titre_sequence && (
                        <p className="mt-1 text-sm text-red-500">{errors.titre_sequence.message}</p>
                    )}
                </div>

                <div className="mb-4">
                    <label htmlFor="objectif_sequence" className="block text-sm font-medium text-gray-700 mb-1">
                        Objectif de la Séquence <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                        id="objectif_sequence"
                        {...register('objectif_sequence')}
                        placeholder="Ex: Permettre aux élèves de comprendre l'impact des réseaux sociaux..."
                        rows={3}
                        className={errors.objectif_sequence ? 'border-red-500' : ''}
                    />
                    {errors.objectif_sequence && (
                        <p className="mt-1 text-sm text-red-500">{errors.objectif_sequence.message}</p>
                    )}
                </div>

                <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="Description détaillée de la séquence (optionnel)"
                        rows={4}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="mots_cles" className="block text-sm font-medium text-gray-700 mb-1">
                        Mots-clés (séparés par des virgules)
                    </label>
                    <Input
                        id="mots_cles"
                        {...register('mots_cles')}
                        placeholder="Ex: réseaux sociaux, citoyenneté numérique, information"
                    />
                </div>

                <div>
                    <label htmlFor="statut" className="block text-sm font-medium text-gray-700 mb-1">
                        Statut
                    </label>
                    <Select
                        onValueChange={(value: 'brouillon' | 'publie' | 'archive') => setValue('statut', value)}
                        value={watch('statut')}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="brouillon">Brouillon</SelectItem>
                            <SelectItem value="publie">Publié</SelectItem>
                            <SelectItem value="archive">Archivé</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.statut && (
                        <p className="mt-1 text-sm text-red-500">{errors.statut.message}</p>
                    )}
                </div>
            </div>

            {/* Section 2: Association au Chapitre */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm">
                <h3 className="text-lg font-bold text-yellow-800 mb-3">Association au Chapitre</h3>
                <div>
                    <label htmlFor="chapitre_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Chapitre Associé <span className="text-red-500">*</span>
                    </label>
                    <Select
                        onValueChange={(value) => setSelectedChapitreId(Number(value))}
                        value={selectedChapitreId?.toString() || ''}
                        disabled={chapitres.length === 0 || isLoadingForm}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={chapitres.length === 0 ? "Aucun chapitre disponible" : "Sélectionner un chapitre"} />
                        </SelectTrigger>
                        <SelectContent>
                            {chapitres.map((chapitre) => (
                                <SelectItem key={chapitre.id} value={chapitre.id.toString()}>
                                    {chapitre.titre_chapitre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {!selectedChapitreId && (
                        <p className="mt-1 text-sm text-red-500">Veuillez sélectionner un chapitre.</p>
                    )}
                </div>
            </div>

            {/* Section 3: Activités et Évaluations de la Séquence */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                <h3 className="text-lg font-bold text-blue-800 mb-3">Éléments de la Séquence (Activités & Évaluations)</h3>

                <div className="flex gap-4 mb-6">
                    <Button
                        type="button"
                        onClick={handleAddActivityClick}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isSaving || selectedChapitreId === null}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Ajouter une Activité
                    </Button>
                    <Button
                        type="button"
                        onClick={handleAddEvaluationClick}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                        disabled={isSaving || selectedChapitreId === null}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Ajouter une Évaluation
                    </Button>
                </div>

                {currentSequenceItems.length === 0 ? (
                    <p className="text-gray-600 text-sm text-center py-4">Aucun élément dans cette séquence. Ajoutez-en ci-dessus !</p>
                ) : (
                    <div className="overflow-x-auto rounded-md border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                                        Ordre
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                        Type
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Titre
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={currentSequenceItems.map(item => `${item.type}-${item.id}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentSequenceItems.map((item, index) => (
                                            <SortableItem
                                                key={`${item.type}-${item.id}`}
                                                id={`${item.type}-${item.id}`}
                                                item={item}
                                                index={index}
                                                onRemove={handleRemoveSequenceItem}
                                                onMoveUp={(id) => handleMoveSequenceItem(id, 'up')}
                                                onMoveDown={(id) => handleMoveSequenceItem(id, 'down')}
                                                isFirst={index === 0}
                                                isLast={index === currentSequenceItems.length - 1}
                                            />
                                        ))}
                                    </tbody>
                                </SortableContext>
                            </DndContext>
                        </table>
                    </div>
                )}
            </div>

            {/* Boutons de soumission et d'annulation */}
            <div className="flex justify-end gap-4 mt-8">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving || isLoadingForm}>
                    Annuler
                </Button>
                <Button type="submit" disabled={isSaving || isLoadingForm || !isFormValid}>
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sauvegarde...
                        </>
                    ) : (
                        "Sauvegarder la Séquence"
                    )}
                </Button>
            </div>

            {showActivityChooser && selectedChapitreId !== null && (
                <ActivityChooserModal
                    chapitreId={selectedChapitreId}
                    onActivityAdded={handleActivityAdded}
                    onClose={() => setShowActivityChooser(false)}
                />
            )}
            {showEvaluationChooser && selectedChapitreId !== null && (
                <EvaluationChooserModal
                    chapitreId={selectedChapitreId}
                    onEvaluationAdded={handleEvaluationAdded}
                    onClose={() => setShowEvaluationChooser(false)}
                />
            )}
        </form>
    );
};

export default SequenceForm;