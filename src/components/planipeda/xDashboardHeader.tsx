// src/components/planipeda/DashboardHeader.tsx
import { Button } from "@/components/ui/input";
import { PlusIcon } from "lucide-react"; // ou une autre librairie d'icônes

/**
 * En-tête du tableau de bord de planification pédagogique
 * Affiche le titre et un bouton d'action principal
 */
const DashboardHeader = () => {
  return (
    <section className="planning-module">
    <header className="dashboard-header">
      <h2 className="module-title">Tableau de bord - Planification pédagogique</h2>
      <div className="header-content">
        <Button variant="primary" className="header-button">
          <PlusIcon className="icon" />
          <span>Créer une nouvelle fiche</span>
        </Button>
      </div>
      
    </header>
    </section>
  );
};

export default DashboardHeader;