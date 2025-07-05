// ============================================================
// Titre : EvaluationContentEditor
// Chemin : src/components/planipeda/ScenarioEditor/EvaluationContent/EvaluationContentEditor.tsx
// Fonctionnalités :
//   - Composant dédié à la gestion du contenu principal d'une évaluation.
//   - Permet la création, l'édition, la réorganisation et la suppression de différents types de blocs de contenu (paragraphe, image, question, etc.).
//   - Utilise l'éditeur TinyMCE pour le contenu riche en texte.
//   - Gère les champs de médias (URL, texte alternatif, position) pour les blocs pertinents.
//   - Assure une initialisation correcte des champs vides (en traitant '<p>&nbsp;</p>' comme vide).
//   - Corrige le problème de fermeture des éditeurs TinyMCE lors de la saisie grâce à la gestion du debounce.
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { v4 as uuidv4 } from 'uuid';
import { ContentBlockData } from "@/types/evaluation";
// Définition de l'interface pour les données de chaque bloc de contenu


// Composant réutilisable pour les champs de saisie de média
interface MediaInputProps {
    label: string;
    url: string;
    altText: string;
    position: ContentBlockData['media_position'];
    onUrlChange: (url: string) => void;
    onAltTextChange: (alt: string) => void;
    onPositionChange: (pos: ContentBlockData['media_position']) => void;
}

const MediaInput: React.FC<MediaInputProps> = ({
    label,
    url,
    altText,
    position,
    onUrlChange,
    onAltTextChange,
    onPositionChange,
}) => (
    <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2 text-sm"
            placeholder="Collez l'URL de l'image/schéma ici..."
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
        />
        <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2 text-sm"
            placeholder="Légende / Texte alternatif du média"
            value={altText}
            onChange={(e) => onAltTextChange(e.target.value)}
        />
        <select
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
            value={position || 'none'}
            onChange={(e) => onPositionChange(e.target.value as ContentBlockData['media_position'])}
        >
            <option value="none">Position du média : Par défaut</option>
            <option value="left">Aligner à gauche (texte autour)</option>
            <option value="right">Aligner à droite (texte autour)</option>
            <option value="center">Centrer (bloc)</option>
            <option value="full-width">Pleine largeur</option>
        </select>
    </div>
);

// Propriétés attendues par le composant EvaluationContentEditor
interface EvaluationContentEditorProps {
    initialIntroduction: string;
    initialContentBlocks: ContentBlockData[] | undefined; // Peut être undefined au montage initial
    initialConsignes: string;
    onUpdateContent: (updatedContent: {
        introduction_activite?: string;
        contenu_blocs?: ContentBlockData[];
        consignes_specifiques?: string;
    }) => void;
}

const EvaluationContentEditor: React.FC<EvaluationContentEditorProps> = ({
    initialIntroduction,
    initialContentBlocks,
    initialConsignes,
    onUpdateContent,
}) => {
    // --- Initialisation de l'état (s'exécute une seule fois au montage) ---
    // Ces états internes sont désormais les sources de vérité pour le contenu des éditeurs.
    // Les props `initial...` ne sont utilisées que pour l'initialisation.
    const [contentBlocks, setContentBlocks] = useState<ContentBlockData[]>(() => {
        const safeInitialContentBlocks = initialContentBlocks || [];
        // Normaliser les valeurs initiales pour les props de l'éditeur TinyMCE.
        const normalizedInitialIntroduction = initialIntroduction === '<p>&nbsp;</p>' ? '' : initialIntroduction || '';

        const introBlockExists = safeInitialContentBlocks.some(block => block.type === 'introduction');
        let initialBlocksArray: ContentBlockData[] = [];

        if (!introBlockExists) {
            initialBlocksArray = [{
                id: 'intro-block', // ID fixe pour le bloc d'introduction pour une meilleure stabilité
                type: 'introduction',
                text_content_html: normalizedInitialIntroduction,
                order: 0,
            }, ...safeInitialContentBlocks.map((block, i) => ({ ...block, id: block.id || uuidv4(), order: i + 1 }))];
        } else {
            // Si le bloc d'introduction existe déjà, assurez-vous qu'il a l'ID fixe et le contenu initialisé.
            initialBlocksArray = safeInitialContentBlocks.map(block =>
                block.type === 'introduction'
                    ? { ...block, order: 0, id: 'intro-block', text_content_html: normalizedInitialIntroduction }
                    : { ...block, id: block.id || uuidv4() }
            ).sort((a, b) => a.order - b.order);
        }
        return initialBlocksArray;
    });

    const [consignes, setConsignes] = useState<string>(initialConsignes === '<p>&nbsp;</p>' ? '' : initialConsignes || '');
    const [showAddBlockMenu, setShowAddBlockMenu] = useState<boolean>(false);
    // Le premier bloc (l'introduction) est déplié par défaut.
    const [expandedBlockId, setExpandedBlockId] = useState<string | null>(contentBlocks[0]?.id || null);

    // --- Références pour les instances TinyMCE (pour la manipulation directe du contenu si nécessaire) ---
    const consignesEditorRef = useRef<any>(null);
    const blockEditorRefs = useRef<{ [key: string]: any }>({});

    // --- Mécanisme de Debounce pour la mise à jour du composant parent ---
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Cette fonction de rappel déclenche la mise à jour des props du parent
    // après un court délai d'inactivité de saisie.
    const triggerUpdateWithDebounce = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            // Utiliser les dernières valeurs de l'état local pour la mise à jour du parent.
            const currentConsignes = consignes;
            const currentContentBlocks = contentBlocks;

            const cleanedConsignes = currentConsignes === '<p>&nbsp;</p>' ? '' : currentConsignes;

            const introBlock = currentContentBlocks.find(block => block.type === 'introduction');
            const cleanedIntroduction = introBlock?.text_content_html === '<p>&nbsp;</p>' ? '' : introBlock?.text_content_html || '';

            // Filtrer le bloc d'introduction avant de passer les blocs de contenu au parent,
            // et s'assurer que l'ordre des blocs non-introduction est séquentiel.
            const mainContentBlocks = currentContentBlocks
                .filter(block => block.type !== 'introduction')
                .sort((a, b) => a.order - b.order)
                .map((block, index) => ({ ...block, order: index }));

            onUpdateContent({
                introduction_activite: cleanedIntroduction,
                contenu_blocs: mainContentBlocks,
                consignes_specifiques: cleanedConsignes,
            });
            console.log("DEBUG: État du parent mis à jour après debounce.");
        }, 500); // Délai de debounce de 500ms
    }, [contentBlocks, consignes, onUpdateContent]); // Dépend des valeurs d'état qui seront passées au parent

    // --- Gestionnaires de changement d'état ---

    // Gère les changements de contenu des consignes globales
    const handleConsignesChange = useCallback((content: string) => {
        // Met à jour l'état local immédiatement
        setConsignes(content === '<p>&nbsp;</p>' ? '' : content);
        // Déclenche la mise à jour débounced du parent
        triggerUpdateWithDebounce();
    }, [triggerUpdateWithDebounce]);

    // Gère les changements de contenu d'un bloc spécifique (y compris l'introduction)
    const handleBlockChange = useCallback((id: string, updatedFields: Partial<ContentBlockData>) => {
        // Met à jour l'état local immédiatement
        setContentBlocks(prevBlocks => {
            const newBlocks = prevBlocks.map(block => {
                if (block.id === id) {
                    const updatedBlock = { ...block, ...updatedFields };
                    // Normalise le contenu HTML pour les champs textuels si TinyMCE renvoie un paragraphe vide.
                    if (updatedBlock.text_content_html === '<p>&nbsp;</p>') {
                        updatedBlock.text_content_html = '';
                    }
                    if (updatedBlock.questions_html === '<p>&nbsp;</p>') {
                        updatedBlock.questions_html = '';
                    }
                    return updatedBlock;
                }
                return block;
            });
            return newBlocks; // Retourne le nouvel état des blocs
        });
        // Déclenche la mise à jour débounced du parent
        triggerUpdateWithDebounce();
    }, [triggerUpdateWithDebounce]);

    // Ajoute un nouveau bloc de contenu
    const addBlock = useCallback((type: ContentBlockData['type']) => {
        const newBlock: ContentBlockData = {
            id: uuidv4(), // Génère un ID unique pour chaque nouveau bloc
            type: type,
            order: contentBlocks.length, // Définit l'ordre initial (sera réordonné par triggerUpdate)
            // Initialise les champs spécifiques au type de bloc à des chaînes vides
            text_content_html: (type === 'paragraph' || type === 'question' || type === 'paragraph_with_media' || type === 'introduction') ? '' : undefined,
            media_url: (type === 'image' || type === 'table' || type === 'paragraph_with_media') ? '' : undefined,
            media_alt_text: (type === 'image' || type === 'table' || type === 'paragraph_with_media') ? '' : undefined,
            media_position: (type === 'image' || type === 'table' || type === 'paragraph_with_media') ? 'none' : undefined,
            questions_html: (type === 'paragraph_with_media') ? '' : undefined,
        };
        setContentBlocks(prevBlocks => {
            // Ajoute le nouveau bloc et réordonne tous les blocs pour maintenir la séquence.
            const updatedBlocks = [...prevBlocks, newBlock].map((block, idx) => ({ ...block, order: idx }));
            return updatedBlocks;
        });
        triggerUpdateWithDebounce(); // Déclenche la mise à jour débounced
        setShowAddBlockMenu(false); // Cache le menu d'ajout de bloc
        setExpandedBlockId(newBlock.id); // Déplie le nouveau bloc ajouté pour permettre la saisie immédiate
    }, [contentBlocks, triggerUpdateWithDebounce]); // Dépend de contentBlocks pour le calcul de l'ordre, et triggerUpdateWithDebounce

    // Supprime un bloc de contenu
    const removeBlock = useCallback((idToRemove: string) => {
        const indexToRemove = contentBlocks.findIndex(block => block.id === idToRemove);
        // Empêche la suppression du bloc d'introduction
        if (indexToRemove === -1 || contentBlocks[indexToRemove].type === 'introduction') {
            console.warn("Impossible de supprimer ce bloc (introuvable ou c'est le bloc d'introduction).");
            return;
        }

        setContentBlocks(prevBlocks => {
            const newBlocks = prevBlocks.filter(block => block.id !== idToRemove);
            const reorderedBlocks = newBlocks.map((block, idx) => ({ ...block, order: idx }));
            return reorderedBlocks;
        });
        triggerUpdateWithDebounce(); // Déclenche la mise à jour débounced
        setExpandedBlockId(null); // Replie le bloc supprimé
    }, [contentBlocks, triggerUpdateWithDebounce]);

    // Déplace un bloc de contenu (vers le haut ou vers le bas)
    const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
        // Empêche de déplacer le bloc d'introduction vers le haut ou tout autre bloc au-dessus de lui.
        if (index === 0 && direction === 'up') {
            return;
        }
        if (index === 1 && direction === 'up' && contentBlocks[0].type === 'introduction') {
            return;
        }

        setContentBlocks(prevBlocks => {
            const newBlocks = [...prevBlocks];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;

            if (targetIndex >= 0 && targetIndex < newBlocks.length) {
                const [movedBlock] = newBlocks.splice(index, 1);
                newBlocks.splice(targetIndex, 0, movedBlock);
                const reorderedBlocks = newBlocks.map((block, idx) => ({ ...block, order: idx }));
                return reorderedBlocks;
            }
            return prevBlocks;
        });
        triggerUpdateWithDebounce(); // Déclenche la mise à jour débounced
        // setExpandedBlockId n'est pas nécessaire ici, car l'éditeur reste ouvert si le bloc est juste déplacé.
    }, [contentBlocks, triggerUpdateWithDebounce]);

    // Labels pour chaque type de bloc
    const blockTypeLabels: { [key in ContentBlockData['type']]: string } = {
        introduction: "Introduction (Situation d'évaluation)",
        paragraph: "Paragraphe de Texte",
        image: "Image / Schéma",
        table: "Tableau (Image ou Texte)",
        question: "Question Simple",
        paragraph_with_media: "Paragraphe + Média + Questions",
    };

    // Icônes simples pour chaque type de bloc
    const blockTypeIcons: { [key in ContentBlockData['type']]: string } = {
        introduction: "📖",
        paragraph: "📄",
        image: "🖼️",
        table: "📊",
        question: "❓",
        paragraph_with_media: "📝🖼️❓",
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-yellow-50 rounded-lg shadow-xl mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Contenu de l'Activité d'Évaluation
            </h3>

            {/* Section: Blocs de Contenu Dynamiques (Corps de l'activité, incluant l'introduction) */}
            <section className="mb-8 p-6 bg-white rounded-lg shadow-xl border border-gray-200">
                <h4 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                    Éléments de l'activité
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                    Construisez l'activité en ajoutant et organisant différents types de blocs de contenu. Le **premier bloc est l'introduction** et ne peut pas être déplacé ou supprimé.
                </p>

                <div className="space-y-4">
                    {contentBlocks.sort((a, b) => a.order - b.order).map((block, index) => (
                        <div key={block.id} className="border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
                            {/* En-tête de la carte du bloc */}
                            <div className="flex items-center justify-between p-4 bg-gray-100 border-b border-gray-200">
                                <h5 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                    {blockTypeIcons[block.type]}
                                    {block.type === 'introduction' ? 'Introduction (obligatoire)' : `Bloc ${index + 1} : ${blockTypeLabels[block.type]}`}
                                    {block.type === 'introduction' && <span className="text-red-600 text-sm">(Obligatoire)</span>}
                                </h5>

                                {/* Boutons d'action sur la carte */}
                                <div className="flex space-x-1">
                                    {/* Désactiver les boutons de déplacement pour l'introduction */}
                                    {block.type !== 'introduction' && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => moveBlock(index, 'up')}
                                                className="p-1 text-gray-500 hover:text-blue-600 transition duration-150 ease-in-out"
                                                title="Déplacer vers le haut"
                                                // Empêche de déplacer au-dessus de l'intro
                                                disabled={index === 0 || (index === 1 && contentBlocks[0].type === 'introduction')}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveBlock(index, 'down')}
                                                className="p-1 text-gray-500 hover:text-blue-600 transition duration-150 ease-in-out"
                                                title="Déplacer vers le bas"
                                                // Empêche de déplacer au-delà du dernier
                                                disabled={index === contentBlocks.length - 1}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </>
                                    )}

                                    {/* Désactiver le bouton de suppression pour l'introduction */}
                                    {block.type !== 'introduction' && (
                                        <button
                                            type="button"
                                            onClick={() => removeBlock(block.id)}
                                            className="p-1 text-red-500 hover:bg-red-100 rounded-full transition duration-150 ease-in-out"
                                            title="Supprimer ce bloc"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H8z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setExpandedBlockId(expandedBlockId === block.id ? null : block.id)}
                                        className="p-1 text-blue-600 hover:bg-blue-100 rounded-full transition duration-150 ease-in-out"
                                        title={expandedBlockId === block.id ? "Réduire ce bloc" : "Modifier ce bloc"}
                                    >
                                        {expandedBlockId === block.id ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Contenu détaillé du bloc (affiché si déplié) */}
                            {expandedBlockId === block.id && (
                                <div className="p-4 bg-gray-50 border-t border-gray-200">
                                    {/* Tous les blocs ayant un contenu textuel (incluant 'introduction') */}
                                    {(block.type === 'introduction' || block.type === 'paragraph' || block.type === 'question' || block.type === 'paragraph_with_media') && (
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {block.type === 'introduction' ? 'Texte de l\'introduction' :
                                                block.type === 'question' ? 'Texte de la question' : 'Texte du paragraphe / Données'}
                                            </label>
                                            <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-400">
                                                <Editor
                                                    apiKey="b959nzjl6vuv8x0qapxkk7ky2259t66o43vg7lvuyjmia2a9"
                                                    onInit={(evt, editor) => blockEditorRefs.current[block.id] = editor}
                                                    value={block.text_content_html || ''}
                                                    onEditorChange={(content) => handleBlockChange(block.id, { text_content_html: content })}
                                                    init={{
                                                        height: block.type === 'introduction' ? 200 : 150,
                                                        menubar: false,
                                                        plugins: [
                                                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                                                            'anchor', 'searchreplace', 'visualblocks', 'code',
                                                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                                        ],
                                                        toolbar: 'undo redo | blocks | ' +
                                                            'bold italic forecolor | alignleft aligncenter ' +
                                                            'alignright alignjustify | bullist numlist outdent indent | ' +
                                                            'link image table | removeformat | help',
                                                        image_advtab: true,
                                                        image_title: true,
                                                        automatic_uploads: false,
                                                        file_picker_types: 'image',
                                                        content_style: 'body { font-family: Inter, Arial, sans-serif; font-size: 14px; } ' +
                                                            'table { border-collapse: collapse; width: 100%; } ' +
                                                            'table, th, td { border: 1px solid #ddd; } ' +
                                                            'th, td { padding: 8px; text-align: left; } ' +
                                                            'img { max-width: 100%; height: auto; display: block; margin-left: auto; margin-right: auto; }'
                                                    }}
                                                />
                                            </div>
                                            {block.type === 'introduction' && <p className="text-sm text-gray-600 mt-1">Décrivez le contexte de l'évaluation ou introduisez le sujet général. Ce texte apparaît au début de l'activité.</p>}
                                            {block.type === 'question' && <p className="text-sm text-gray-600 mt-1">Saisissez ici la question posée à l'élève.</p>}
                                            {block.type === 'paragraph_with_media' && <p className="text-sm text-gray-600 mt-1">Décrivez les données ou le contexte associé au média ci-dessous.</p>}
                                            {block.type === 'paragraph' && <p className="text-sm text-gray-600 mt-1">Ajoutez ici des informations, des faits, ou des explications nécessaires à l'activité.</p>}
                                        </div>
                                    )}

                                    {/* Blocs avec média (image, tableau, paragraphe_avec_média) */}
                                    {(block.type === 'image' || block.type === 'table' || block.type === 'paragraph_with_media') && (
                                        <MediaInput
                                            label={block.type === 'image' ? 'Image/Schéma (URL)' : block.type === 'table' ? 'Tableau (Image URL)' : 'Média Associé (URL)'}
                                            url={block.media_url || ''}
                                            altText={block.media_alt_text || ''}
                                            position={block.media_position || 'none'}
                                            onUrlChange={(url) => handleBlockChange(block.id, { media_url: url })}
                                            onAltTextChange={(alt) => handleBlockChange(block.id, { media_alt_text: alt })}
                                            onPositionChange={(pos) => handleBlockChange(block.id, { media_position: pos })}
                                        />
                                    )}

                                    {/* Questions intégrées (pour paragraphe_avec_média) */}
                                    {block.type === 'paragraph_with_media' && (
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Questions liées au média ci-dessus
                                            </label>
                                            <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-400">
                                                <Editor
                                                    apiKey="b959nzjl6vuv8x0qapxkk7ky2259t66o43vg7lvuyjmia2a9"
                                                    onInit={(evt, editor) => blockEditorRefs.current[`${block.id}-questions`] = editor}
                                                    value={block.questions_html || ''}
                                                    onEditorChange={(content) => handleBlockChange(block.id, { questions_html: content })}
                                                    init={{
                                                        height: 150,
                                                        menubar: false,
                                                        plugins: [
                                                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                                                            'anchor', 'searchreplace', 'visualblocks', 'code',
                                                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                                        ],
                                                        toolbar: 'undo redo | blocks | ' +
                                                            'bold italic forecolor | alignleft aligncenter ' +
                                                            'alignright alignjustify | bullist numlist outdent indent | ' +
                                                            'link image table | removeformat | help',
                                                        image_advtab: true,
                                                        image_title: true,
                                                        automatic_uploads: false,
                                                        file_picker_types: 'image',
                                                        content_style: 'body { font-family: Inter, Arial, sans-serif; font-size: 14px; } ' +
                                                            'table { border-collapse: collapse; width: 100%; } ' +
                                                            'table, th, td { border: 1px solid #ddd; } ' +
                                                            'th, td { padding: 8px; text-align: left; } ' +
                                                            'img { max-width: 100%; height: auto; display: block; margin-left: auto; margin-right: auto; }'
                                                    }}
                                                />
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">Saisissez les questions qui se réfèrent spécifiquement au média ou au paragraphe ci-dessus.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Bouton pour ajouter un nouveau bloc */}
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => setShowAddBlockMenu(!showAddBlockMenu)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Ajouter un élément à l'activité
                    </button>

                    {showAddBlockMenu && (
                        <div className="mt-4 p-4 bg-gray-100 rounded-md shadow-inner grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(blockTypeLabels).filter(([type]) => type !== 'introduction').map(([type, label]) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => addBlock(type as ContentBlockData['type'])}
                                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 ease-in-out"
                                >
                                    {blockTypeIcons[type as ContentBlockData['type']]} <span className="ml-2">{label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Section: Consignes Spécifiques Globales */}
            <section className="p-6 bg-white rounded-lg shadow-xl border border-gray-200">
                <h4 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                    Consignes Générales de l'Évaluation
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                    Ajoutez ici les consignes globales pour l'élève (temps imparti, matériel autorisé, attentes générales, etc.).
                </p>
                <div className="border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-400">
                    <Editor
                        apiKey="b959nzjl6vuv8x0qapxkk7ky2259t66o43vg7lvuyjmia2a9"
                        onInit={(evt, editor) => consignesEditorRef.current = editor}
                        value={consignes || ''}
                        onEditorChange={(content) => handleConsignesChange(content)}
                        init={{
                            height: 250,
                            menubar: false,
                            plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                                'anchor', 'searchreplace', 'visualblocks', 'code',
                                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                            ],
                            toolbar: 'undo redo | blocks | ' +
                                'bold italic forecolor | alignleft aligncenter ' +
                                'alignright alignjustify | bullist numlist outdent indent | ' +
                                'link image table | removeformat | help',
                            image_advtab: true,
                            image_title: true,
                            automatic_uploads: false,
                            file_picker_types: 'image',
                            content_style: 'body { font-family: Inter, Arial, sans-serif; font-size: 14px; } ' +
                                'table { border-collapse: collapse; width: 100%; } ' +
                                'table, th, td { border: 1px solid #ddd; } ' +
                                'th, td { padding: 8px; text-align: left; } ' +
                                'img { max-width: 100%; height: auto; display: block; margin-left: auto; margin-right: auto; }'
                        }}
                    />
                </div>
            </section>
        </div>
    );
};

export default EvaluationContentEditor;
