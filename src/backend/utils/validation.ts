// Placeholder content
// ============================================================
// 📌 Fichier : validation.ts
// 🎯 Objectif :
//   - Fournir des fonctions utilitaires pour valider les données.
//   - Utilisé pour vérifier les entrées utilisateur et les réponses API.
// ============================================================

// ============================================================
// 🔹 Fonction : validateEmail
//   - Vérifie si une adresse email est valide.
//   - Paramètres :
//       - email (string) : Adresse email à valider.
//   - Retourne : true (valide) ou false (non valide).
// ============================================================
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ============================================================
// 🔹 Fonction : validateRequiredFields
//   - Vérifie si tous les champs obligatoires sont remplis.
//   - Paramètres :
//       - fields (object) : Objet contenant les champs à valider.
//   - Retourne :
//       - true si tous les champs sont remplis, sinon false.
// ============================================================
export const validateRequiredFields = (fields: { [key: string]: any }): boolean => {
  return Object.values(fields).every((value) => value !== null && value !== undefined && value !== '');
};

// ============================================================
// 🔹 Fonction : validatePhoneNumber
//   - Vérifie si un numéro de téléphone est valide.
//   - Paramètres :
//       - phoneNumber (string) : Numéro de téléphone à valider.
//   - Retourne : true (valide) ou false (non valide).
// ============================================================
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^[+]?[0-9\s-]{10,15}$/;
  return phoneRegex.test(phoneNumber);
};

// ============================================================
// 🔹 Fonction : validateDate
//   - Vérifie si une date est valide.
//   - Paramètres :
//       - date (string) : Chaîne de date au format ISO ou similaire.
//   - Retourne : true (valide) ou false (non valide).
// ============================================================
export const validateDate = (date: string): boolean => {
  const parsedDate = Date.parse(date);
  return !isNaN(parsedDate);
};

// ============================================================
// 🔹 Fonction : validateMinLength
//   - Vérifie si une chaîne atteint une longueur minimale.
//   - Paramètres :
//       - value (string) : Chaîne à valider.
//       - minLength (number) : Longueur minimale requise.
//   - Retourne : true (valide) ou false (non valide).
// ============================================================
export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

// ============================================================
// ℹ️ Notes :
//   - Ce fichier est conçu pour être extensible avec d'autres fonctions
//     spécifiques selon vos besoins.
//   - Importez ces fonctions où vous devez valider des données utilisateur ou API.
// ============================================================
