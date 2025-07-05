import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  VideoCameraIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  {
    name: "Tableau de Bord",
    href: "/",
    icon: ChartBarIcon,
  },
  {
    name: "Gestion de la Classe",
    href: "/class-management",
    icon: UserGroupIcon,
  },
  {
    name: "Planification Pédagogique",
    href: "/planipeda",
    icon: BookOpenIcon,
  },
  {
    name: "Cahier de Texte",
    href: "/calendar",
    icon: CalendarIcon,
  },
  {
    name: "Évaluations",
    href: "/evaluations",
    icon: ClipboardDocumentCheckIcon,
  },
  {
    name: "Tests Diagnostiques",
    href: "/diagno",
    icon: AcademicCapIcon,
  },
  {
    name: "Cours en Ligne",
    href: "/online-courses",
    icon: VideoCameraIcon,
  },
];

export default function MainLayout() {
  const navigate = useNavigate(); // Pour naviguer entre les routes
  const location = useLocation(); // Obtenir la route actuelle
  const [sidebarOpen, setSidebarOpen] = useState(false); // Gérer l'état du menu latéral

  // Placeholder pour "Déconnexion" (pas d'AuthContext ici)
  const handleSignOut = async () => {
    // Exemple pour rediriger vers la page de connexion
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barre latérale mobile */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-40 flex">
          {/* Overlay (arrière-plan flouté pour le menu mobile) */}
          <div
            className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setSidebarOpen(false)}
          />

          {/* Menu mobile */}
          <div
            className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition ease-in-out duration-300 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Bouton pour fermer le menu */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <span className="text-xl font-bold text-indigo-600">
                  SVT Platform
                </span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        location.pathname === item.href
                          ? "text-gray-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      } mr-4 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Barre latérale desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
            <span className="text-xl font-bold text-indigo-600">
              SVT Platform
            </span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      location.pathname === item.href
                        ? "text-gray-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    } mr-3 flex-shrink-0 h-6 w-6`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          {/* Bouton pour ouvrir la barre latérale sur mobile */}
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find((item) => item.href === location.pathname)?.name ||
                  "Tableau de Bord"}
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <button
                onClick={handleSignOut}
                className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="w-full mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
