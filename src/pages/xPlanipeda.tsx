// ==========================================================================
// 📁 Fichier : src/pages/Planipeda.tsx
// 🎯 Objectif : Interface principale du module "Planification Pédagogique"
// ==========================================================================

import React, { useState, useEffect } from "react";

// ============================
// 🎨 Icônes utilisées (Lucide React)
// ============================
import {
  BookOpen,       // Séquences
  CheckSquare,    // Activités pédagogiques
  FileText,       // Ressources pédagogiques
  Calendar,       // Calendrier
  BarChart,       // Suivi & évaluation
  Brain,          // Générateur IA
  Settings,       // Différenciation
  PieChart        // Statistiques
} from "lucide-react";

// ============================
// 🧩 Importation des sous-modules Planipeda
// ============================
import Sequences from "../components/planipeda/sequences/Sequences";
import SequenceList from "../components/planipeda/sequences/SequenceList";
import SequenceEditor from "../components/planipeda/sequences/SequenceEditor";

// Autres modules
import Activities from "../components/planipeda/Activities/Activities";
import Resources from "../components/planipeda/Resources/Resources";
import Evaluation from "../components/planipeda/Evaluation/Evaluation";
import AIPlanning from "../components/planipeda/AIPlanning/AIPlanning";
import StudentAnalytics from "../components/planipeda/StudentAnalytics/StudentAnalytics";
import Differentiation from "../components/planipeda/Differentiation/Differentiation";

// Composant de sélection du niveau et de l'option
import NiveauOptionSelector from "../components/planipeda/NiveauOptionSelector";

// ============================
// 📦 Données statiques pour les niveaux, options, unités, chapitres, séquences, activités et objectifs
// ============================
const niveaux = [
  { id: "1bac", nom: "1ère Bac" },
  { id: "2bac", nom: "2ème Bac" },
];

const options = [
  { id: "sciences", nom: "Sciences" },
  { id: "maths", nom: "Mathématiques" },
];

const unites = [
  { id: 1, niveau: "1bac", option: "sciences", titre: "Unité 1: La biologie" },
  { id: 2, niveau: "1bac", option: "maths", titre: "Unité 2: Les mathématiques appliquées" },
  { id: 3, niveau: "2bac", option: "sciences", titre: "Unité 3: La biotechnologie" },
  { id: 4, niveau: "2bac", option: "maths", titre: "Unité 4: Analyse mathématique" },
];

const chapitres = [
  { id: 1, uniteId: 1, titre: "Chapitre 1: Cellules et Organisation", description: "Structure cellulaire et fonction." },
  { id: 2, uniteId: 1, titre: "Chapitre 2: La respiration cellulaire", description: "Mécanismes de la respiration cellulaire." },
  { id: 3, uniteId: 2, titre: "Chapitre 3: Algèbre linéaire", description: "Concepts d'algèbre et matrices." },
  { id: 4, uniteId: 3, titre: "Chapitre 4: La biotechnologie", description: "Applications des biotechnologies." },
  { id: 5, uniteId: 4, titre: "Chapitre 5: Calcul différentiel", description: "Concepts avancés de calcul différentiel." },
];

const sequences = [
  { id: 1, chapitreId: 1, titre: "Séquence 1: Introduction à la biologie", description: "Premiers concepts de la biologie." },
  { id: 2, chapitreId: 2, titre: "Séquence 2: Photosynthèse", description: "Étude du processus de photosynthèse chez les plantes." },
  { id: 3, chapitreId: 3, titre: "Séquence 3: Algèbre et Matrices", description: "Étude des systèmes d'équations linéaires." },
  { id: 4, chapitreId: 4, titre: "Séquence 4: Biotechnologie avancée", description: "Applications avancées des biotechnologies." },
  { id: 5, chapitreId: 5, titre: "Séquence 5: Calcul différentiel appliqué", description: "Étude des équations différentielles." },
];

const activites = [
  { id: 1, sequenceId: 1, titre: "Activité 1: Observation au microscope", description: "Observer les cellules végétales au microscope." },
  { id: 2, sequenceId: 2, titre: "Activité 2: Mesure de la photosynthèse", description: "Mesurer l'impact de la lumière sur la photosynthèse." },
  { id: 3, sequenceId: 3, titre: "Activité 3: Résolution d'équations", description: "Résoudre des systèmes d'équations linéaires." },
  { id: 4, sequenceId: 4, titre: "Activité 4: Application de la biotechnologie", description: "Appliquer des techniques de biotechnologie à des échantillons." },
  { id: 5, sequenceId: 5, titre: "Activité 5: Étude des équations différentielles", description: "Appliquer les méthodes de calcul différentiel." },
];

const objectifs = [
  { id: 1, activiteId: 1, titre: "Objectif 1: Comprendre la structure cellulaire", description: "Identifier les structures d'une cellule." },
  { id: 2, activiteId: 2, titre: "Objectif 2: Appliquer les concepts de photosynthèse", description: "Expérimenter avec la photosynthèse." },
  { id: 3, activiteId: 3, titre: "Objectif 3: Résoudre des systèmes d'équations", description: "Comprendre la résolution d'un système d'équations." },
  { id: 4, activiteId: 4, titre: "Objectif 4: Maîtriser les techniques de biotechnologie", description: "Mettre en pratique les techniques de biotechnologie." },
  { id: 5, activiteId: 5, titre: "Objectif 5: Étudier les équations différentielles", description: "Appliquer les équations différentielles." },
];

// ============================
// 📦 Déclaration des modules Planipeda
// ============================
const modules = [
  {
    id: "sequences",
    title: "Gestion des Séquences",
    description: "Créez et visualisez les séquences pédagogiques.",
    icon: BookOpen,
  },
  {
    id: "activities",
    title: "Gestion des Activités",
    description: "Ajoutez et suivez les activités pédagogiques.",
    icon: CheckSquare,
  },
  {
    id: "resources",
    title: "Ressources Pédagogiques",
    description: "Accédez aux supports pédagogiques collaboratifs.",
    icon: FileText,
  },
  {
    id: "calendar",
    title: "Calendrier Pédagogique",
    description: "Planifiez vos séances de manière intuitive.",
    icon: Calendar,
  },
  {
    id: "evaluation",
    title: "Suivi et Évaluation",
    description: "Analysez les performances et les compétences des élèves.",
    icon: BarChart,
  },
  {
    id: "ai-planning",
    title: "Générateur IA - Progression Annuelle",
    description: "Créez automatiquement une progression pédagogique par périodes.",
    icon: Brain,
  },
  {
    id: "differentiation",
    title: "Différenciation Pédagogique",
    description: "Associez des tâches adaptées aux profils d’élèves.",
    icon: Settings,
  },
  {
    id: "analytics",
    title: "Statistiques & Cartographie",
    description: "Visualisez les compétences abordées et les séquences utilisées.",
    icon: PieChart,
  },
];

// ============================
// 🚀 Composant Principal : Planipeda
// ============================
const Planipeda: React.FC = () => {
  // États pour le suivi du module actif et des sélections
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [selectedNiveau, setSelectedNiveau] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [filteredSequences, setFilteredSequences] = useState(sequences);

  // Mise à jour des séquences filtrées en fonction du niveau et de l'option
  useEffect(() => {
    if (selectedNiveau && selectedOption) {
      const filtered = sequences.filter(
        (sequence) =>
          sequence.niveau === selectedNiveau && sequence.option === selectedOption
      );
      setFilteredSequences(filtered);
    }
  }, [selectedNiveau, selectedOption]);

  return (
    <div>
      <h1>Planification Pédagogique</h1>

      <div className="min-h-screen bg-gray-100 p-6 space-y-6">
        {/* Affichage de la sélection du niveau et de l'option pour le module "sequences" */}
        {activeModule === "sequences" && (
          <NiveauOptionSelector 
            onNiveauChange={setSelectedNiveau} 
            onOptionChange={setSelectedOption}
          />
        )}

        {/* En-tête dynamique */}
        <Header activeModule={activeModule} onBack={() => setActiveModule(null)} />

        {/* Affichage conditionnel des modules */}
        {!activeModule ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modules.map(({ id, title, description, icon }) => (
              <SubModule
                key={id}
                title={title}
                description={description}
                Icon={icon}
                onClick={() => setActiveModule(id)} // Sélection du module
              />
            ))}
          </div>
        ) : (
          <div>
            {activeModule === "sequences" && (
              <div>
                <SequenceList sequences={filteredSequences} />
                <SequenceEditor />
              </div>
            )}
            {activeModule === "activities" && <Activities />}
            {activeModule === "resources" && <Resources />}
            {activeModule === "evaluation" && <Evaluation />}
            {activeModule === "ai-planning" && <AIPlanning />}
            {activeModule === "analytics" && <StudentAnalytics />}
            {activeModule === "differentiation" && <Differentiation />}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================
// 🧱 Composant : Header
// ============================
const Header: React.FC<{
  activeModule: string | null;
  onBack: () => void;
}> = ({ activeModule, onBack }) => {
  const currentTitle = modules.find((mod) => mod.id === activeModule)?.title;

  return (
    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-900">
        {activeModule ? `Module : ${currentTitle || "Inconnu"}` : "Planification Pédagogique"}
      </h1>
      {activeModule && (
        <button
          onClick={onBack}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Retour
        </button>
      )}
    </div>
  );
};

// ============================


// ============================
// 🧱 Composant : SubModule (Carte clickable)
// ============================
const SubModule: React.FC<{
  title: string;
  description: string;
  Icon: React.FC;
  onClick: () => void;
}> = ({ title, description, Icon, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="block bg-white rounded-lg shadow p-6 hover:bg-indigo-100 transition cursor-pointer"
    >
      <div className="flex items-center space-x-4">
        <Icon className="h-8 w-8 text-indigo-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default Planipeda;
