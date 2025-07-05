import React from "react";
import { Link } from "react-router-dom";
import {
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  VideoCameraIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// === Définition des modules à afficher sur le tableau de bord ===
const modules = [
  {
    name: "Gestion de la Classe",
    description: "Gérer les élèves, leur présence et leur comportement",
    icon: UserGroupIcon,
    href: "/class-management",
    color: "bg-blue-500",
  },
  {
    name: "Planification Pédagogique",
    description: "Planifier et gérer les activités pédagogiques",
    icon: BookOpenIcon,
    href: "/planipeda",
    color: "bg-green-500",
  },
  {
    name: "Cahier de Texte",
    description: "Calendrier pédagogique et échéances",
    icon: CalendarIcon,
    href: "/calendar",
    color: "bg-purple-500",
  },
  {
    name: "Évaluations",
    description: "Gérer les évaluations et les remédiations",
    icon: ClipboardDocumentCheckIcon,
    href: "/evaluations",
    color: "bg-red-500",
  },
  {
    name: "Tests Diagnostiques",
    description: "Créer et gérer les tests diagnostiques",
    icon: AcademicCapIcon,
    href: "/diagno",
    color: "bg-yellow-500",
  },
  {
    name: "Cours en Ligne",
    description: "Préparer et suivre les cours en ligne",
    icon: VideoCameraIcon,
    href: "/online-courses",
    color: "bg-indigo-500",
  },
  {
    name: "Analyse des Performances",
    description: "Suivi et analyse des résultats des élèves",
    icon: ChartBarIcon,
    href: "/performance",
    color: "bg-pink-500",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* === En-tête du tableau de bord === */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Bienvenue dans la plateforme pédagogique
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez vos classes et suivez la progression de vos élèves efficacement.
        </p>
      </div>

      {/* === Liste des modules === */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.name}
            to={module.href}
            className="block bg-white shadow rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className={`inline-flex p-3 rounded-lg ${module.color}`}>
                <module.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">
                {module.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {module.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* === Section des activités récentes === */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900">Activités Récentes</h2>
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            Les activités récentes apparaîtront ici lorsque disponibles.
          </p>
        </div>
      </div>
    </div>
  );
}
