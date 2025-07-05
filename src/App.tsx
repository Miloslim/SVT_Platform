// 📁 Fichier : App.tsx
// 🎯 Objectif :
//    - Définir les routes principales de l'application
//    - Fournir le contexte global (authentification, requêtes réseau)
// ============================================================================

// === 📦 Importations des bibliothèques globales ===
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

// === 🔐 Contexte d'authentification ===
import { AuthProvider } from "./context/AuthContext";

// === 🌐 Importation des Layouts ===
import MainLayout from "./layouts/MainLayout";

// === 📄 Importation des Pages Principales de l'Application ===
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ClassManagement from "./pages/ClassManagement";
import Planipeda from "./pages/Planipeda";

// === 📘 Importations des Composants/Pages du Module Planipeda ===
// Fiches pédagogiques (existantes)
import CreateFichePage from "./components/planipeda/pages/CreateFichePage";
import EditFichePage from "./components/planipeda/pages/EditFichePage";
import PreviewFichePage from "./components/planipeda/pages/PreviewFichePage";

// Entités pédagogiques statiques (existantes)
import NiveauxPage from "./components/planipeda/pages/NiveauxPage";
import OptionsPage from "./components/planipeda/pages/OptionsPage";
import UnitesPage from "./components/planipeda/pages/UnitesPage";
import ChapitresPage from "./components/planipeda/pages/ChapitresPage";
import ObjectifsPage from "./components/planipeda/pages/ObjectifsPage";

// Entités pédagogiques dynamiques (Activités - existantes)
import ActivitesPage from "./components/planipeda/pages/ActivitesPage";
import CreateActivityEditorPage from "./components/planipeda/pages/CreateActivityEditorPage";
import EditActivityEditorPage from "./components/planipeda/pages/EditActivityEditorPage";

// Entités pédagogiques dynamiques (Séquences - existantes)
import SequencesPage from "./components/planipeda/pages/SequencesPage";
import CreateSequenceEditorPage from "./components/planipeda/pages/CreateSequenceEditorPage";
import EditSequenceEditor from "./components/planipeda/ScenarioEditor/EditSequenceEditor";

// Entités pédagogiques dynamiques (Évaluations - existantes)
import EvaluationsPage from "./components/planipeda/pages/EvaluationsPage";
import CreateEvaluationEditorPage from "./components/planipeda/pages/CreateEvaluationEditorPage";
import EditEvaluationEditorPage from "./components/planipeda/pages/EditEvaluationEditorPage";

// Composant pour la planification de chapitre (éditeur)
import PlanifierChapitreEditor from "./components/planipeda/chapitreplanifier/PlanifierChapitreEditor";
// NOUVEAU : Importation de la page de liste des fiches de planification
import FichesPlanificationPage from "./components/planipeda/pages/FichesPlanificationPage";

//Importation des composante du module Diagno
import Diagno from "@/pages/Diagno";
import ComposeTestPage from "@/diagno/pages/ComposeTestPage";
import PlayTestPage from '@/diagno/pages/PlayTestPage';
import ResultsPage from '@/diagno/pages/ResultsPage';

// === 🧠 Initialisation de React Query ===
const queryClient = new QueryClient();

// ============================================================================
// 🚀 Composant Principal de l'Application : App
// ============================================================================
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* 🔐 Page de connexion */}
            <Route path="/login" element={<Login />} />

            {/* 🌐 Application principale avec MainLayout pour les pages protégées */}
            <Route path="/" element={<MainLayout />}>
              {/* 🏠 Tableau de bord par défaut */}
              <Route index element={<Dashboard />} />

              {/* 🎓 Gestion des classes */}
              <Route path="class-management" element={<ClassManagement />} />

              {/* 📘 Module Planipeda - Point d'entrée général */}
              <Route path="planipeda" element={<Planipeda />} />

              {/* === Routes spécifiques au module Planipeda === */}

              {/* 📄 Fiches pédagogiques (existantes) */}
              <Route path="planipeda/fiche/create" element={<CreateFichePage />} />
              <Route path="planipeda/fiche/edit/:id" element={<EditFichePage />} />
              <Route path="planipeda/fiche/preview/:id" element={<PreviewFichePage />} />

              {/* NOUVEAU : Routes pour les Fiches de Planification de Chapitre */}
              {/* Page affichant la liste de toutes les fiches de planification */}
              <Route path="planipeda/planification-chapitre" element={<FichesPlanificationPage />} />
              {/* Route pour créer une nouvelle fiche de planification */}
              <Route path="planipeda/planification-chapitre/nouveau" element={<PlanifierChapitreEditor />} />
              {/* Route pour éditer une fiche de planification existante par son ID */}
              <Route path="planipeda/planification-chapitre/:id/edit" element={<PlanifierChapitreEditor />} />

              {/* 📚 Entités pédagogiques statiques (existantes) */}
              <Route path="planipeda/niveaux" element={<NiveauxPage />} />
              <Route path="planipeda/options" element={<OptionsPage />} />
              <Route path="planipeda/unites" element={<UnitesPage />} />
              <Route path="planipeda/chapitres" element={<ChapitresPage />} />
              <Route path="planipeda/objectifs" element={<ObjectifsPage />} />

              {/* 📝 Entités pédagogiques dynamiques (existantes) */}

              {/* Activités */}
              <Route path="planipeda/activites" element={<ActivitesPage />} />
              <Route path="planipeda/activites/nouveau/:sequenceId?" element={<CreateActivityEditorPage />} />
              <Route path="planipeda/activites/:id/edit" element={<EditActivityEditorPage />} />

              {/* Séquences */}
              <Route path="planipeda/sequences" element={<SequencesPage />} />
              <Route path="planipeda/sequences/nouveau" element={<CreateSequenceEditorPage />} />
              <Route path="planipeda/sequences/:id/edit" element={<EditSequenceEditor />} />

              {/* Évaluations */}
              <Route path="planipeda/evaluations" element={<EvaluationsPage />} />
              <Route path="planipeda/evaluations/nouveau/:sequenceId?" element={<CreateEvaluationEditorPage />} />
              <Route path="planipeda/evaluations/:id/edit" element={<EditEvaluationEditorPage />} />

              {/* Test Diagnostique */}
              <Route path="diagno" element={<Diagno />} />
              <Route path="/diagno/compose" element={<ComposeTestPage />} />
              <Route path="/diagno/play" element={<PlayTestPage />} />
              <Route path="/diagno/results" element={<ResultsPage />} />
            </Route>
          </Routes>
        </Router>

        {/* 🔔 Notifications utilisateur */}
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
