// ============================================================================
// 📁 Fichier : src/components/planipeda/pages/EditSequenceEditorPage.tsx
// 🎯 Objectif :
//    - Page dédiée à l'édition d'une séquence pédagogique existante.
//    - Récupère l'ID de la séquence depuis l'URL.
//    - Charge les données de la séquence et les passe au formulaire d'édition.
//    - Gère la soumission du formulaire pour la mise à jour de la séquence.
// ============================================================================
// src/app/planipeda/sequences/[sequenceId]/edit/page.tsx
// (Ancien homologue : src/components/planipeda/pages/EditSequenceModal.tsx)

// Fonctionnalités:
// - Affiche une page dédiée pour l'édition d'une séquence pédagogique.
// - Récupère l'ID de la séquence directement depuis les paramètres de l'URL.
// - Intègre le composant EditSequenceEditor.
// - Gère la navigation après la sauvegarde réussie ou l'annulation.

import React from 'react';
import { notFound, useRouter } from 'next/navigation'; // Pour gérer les IDs invalides et la navigation
import dynamic from 'next/dynamic'; // Pour un import dynamique si EditSequenceEditor est lourd
import { toast } from 'sonner'; // Pour les notifications toast

// Import dynamique de EditSequenceEditor pour optimiser le chargement
// Utile si EditSequenceEditor est un composant volumineux ou a des dépendances côté client.
const EditSequenceEditor = dynamic(
  () => import('@/components/planipeda/ScenarioEditor/EditSequenceEditor'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-48">
        <p className="text-gray-600">Chargement de l'éditeur de séquence...</p>
      </div>
    ),
    ssr: false, // Important si l'éditeur contient des hooks ou des libs client-side (ex: éditeur de texte riche)
  }
);

interface EditSequencePageProps {
  params: {
    sequenceId: string; // L'ID de la séquence vient des paramètres d'URL (sera une chaîne)
  };
}

const EditSequenceEditorPage: React.FC<EditSequencePageProps> = ({ params }) => {
  const router = useRouter();
  const sequenceId = parseInt(params.sequenceId, 10); // Convertit l'ID de l'URL en nombre

  // Gère le cas où l'ID n'est pas un nombre valide.
  // notFound() de Next.js affichera la page 404 de ton application.
  if (isNaN(sequenceId)) {
    console.error("ID de séquence invalide reçu:", params.sequenceId);
    notFound();
  }

  // Callback appelé par EditSequenceEditor après une sauvegarde réussie
  const handleSaveSuccess = () => {
    toast.success("Séquence enregistrée avec succès !");
    // Redirige vers la page précédente (là d'où l'utilisateur est venu)
    // Ou tu peux choisir une redirection spécifique, ex: router.push(`/planipeda/sequences/${sequenceId}`);
    router.back();
  };

  // Callback appelé par EditSequenceEditor en cas d'annulation
  const handleCancel = () => {
    toast.info("Édition de la séquence annulée.");
    // Redirige vers la page précédente
    router.back();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl border border-gray-200">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 text-center">
          Modifier la Séquence Pédagogique
        </h1>
        <p className="text-lg text-gray-700 mb-8 text-center">
          Vous éditez la séquence avec l'ID : **{sequenceId}**.
        </p>

        {/* Le composant EditSequenceEditor est rendu ici avec les props nécessaires */}
        {/* On s'assure que sequenceId est bien un nombre valide */}
        {sequenceId && ( // Cette vérification est redondante après le notFound() mais ne fait pas de mal
          <EditSequenceEditor
            sequenceId={sequenceId}
            onSaveSuccess={handleSaveSuccess}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
};

export default EditSequenceEditorPage;