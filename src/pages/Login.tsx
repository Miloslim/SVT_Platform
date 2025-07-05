// ============================================================
// 📌 Fichier : Login.tsx
// 🎯 Objectif :
//   - Fournir une interface utilisateur pour la connexion.
//   - Gérer les erreurs, la validation et la navigation après connexion.
// ============================================================

import React from "react";
import { useNavigate } from "react-router-dom"; // Permet la navigation entre les pages
import { useForm } from "react-hook-form"; // Gère les formulaires avec validation
import toast from "react-hot-toast"; // Notifications utilisateur
import { useAuth } from "../context/AuthContext"; // Contexte d'authentification

// === Interface : Structure des données du formulaire ===
interface LoginForm {
  email: string; // Adresse email de l'utilisateur
  password: string; // Mot de passe de l'utilisateur
}

export default function Login() {
  // === Accès au contexte Auth ===
  const { signIn } = useAuth(); // Fonction pour gérer la connexion
  const navigate = useNavigate(); // Hook pour rediriger après connexion

  // === Configuration de react-hook-form ===
  const {
    register, // Enregistrement des champs de formulaire
    handleSubmit, // Fonction pour gérer la soumission du formulaire
    formState: { errors }, // Gestion des erreurs de validation
  } = useForm<LoginForm>();

  // ============================================================
  // 📌 Fonction : Soumission du formulaire
  // 🎯 Tente de connecter l'utilisateur avec email/mot de passe
  // ============================================================
  const onSubmit = async (data: LoginForm) => {
    try {
      await signIn(data.email, data.password); // Utilise la fonction signIn pour se connecter
      toast.success("Connexion réussie !"); // Affiche une notification de succès
      navigate("/"); // Redirige vers la page d'accueil
    } catch (error) {
      toast.error("Échec de la connexion. Vérifiez vos identifiants."); // Affiche une notification d'erreur
    }
  };

  // ============================================================
  // 📌 Rendu du composant
  // 🎯 Affiche le formulaire de connexion avec des validations.
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* === En-tête de la page === */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Connexion à votre compte
        </h2>
      </div>

      {/* === Conteneur du formulaire === */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* === Champ Email === */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Adresse e-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  {...register("email", { required: true })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">
                    L'adresse e-mail est requise.
                  </p>
                )}
              </div>
            </div>

            {/* === Champ Mot de passe === */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  {...register("password", { required: true })}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">
                    Le mot de passe est requis.
                  </p>
                )}
              </div>
            </div>

            {/* === Bouton de soumission === */}
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Se connecter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
