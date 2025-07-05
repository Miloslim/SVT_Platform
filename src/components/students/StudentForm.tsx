// ============================================================
// Fichier : StudentForm.tsx
// Objectif : Formulaire pour ajouter un élève et gérer les classes disponibles.
// ============================================================

// Importations nécessaires
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Redirection après soumission
import { supabase } from '../../backend/config/supabase'; // Import supabase

// ============================================================
// Composant principal : StudentForm
// ============================================================
function StudentForm({ onStudentAdded }) {
  // État pour gérer les données du formulaire
  const [formData, setFormData] = useState({
    student_code: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    student_class: '', // ID de la classe sélectionnée
  });

  // État pour stocker les classes disponibles
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(''); // Nom de la classe sélectionnée
  const [loading, setLoading] = useState(false); // Indicateur de chargement
  const navigate = useNavigate(); // Hook pour la redirection après soumission

  // ============================================================
  // SECTION 1 : Récupération des classes depuis Supabase
  // ============================================================
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data, error } = await supabase.from('classes').select('id, class_name'); // Récupère les classes
        if (error) throw error;
        setClasses(data || []); // Stocker les données dans l'état
        console.log('Classes récupérées :', data); // Vérification des données dans la console
      } catch (err) {
        console.error('Erreur lors de la récupération des classes :', err.message);
      }
    };

    fetchClasses(); // Charger les classes au montage du composant
  }, []);

  // ============================================================
  // SECTION 2 : Gestion des changements dans les champs du formulaire
  // ============================================================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value, // Mise à jour des champs du formulaire
    }));
  };

  // ============================================================
  // SECTION 3 : Gestion de la soumission du formulaire
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Empêche le rechargement de la page
    setLoading(true); // Activer le chargement

    try {
      console.log('[LOG] Soumission du formulaire...', { formData, selectedClass });

      // Étape 1 : Obtenir l'ID de la classe sélectionnée
      const classId = classes.find((cls) => cls.class_name === selectedClass)?.id;
      if (!classId) {
        alert('Veuillez sélectionner une classe valide.');
        setLoading(false);
        return; // Arrête la soumission si la classe est invalide
      }

      // Étape 2 : Préparer les données pour insertion
      const studentData = { ...formData, student_class: classId };
      console.log('[LOG] Données préparées :', studentData);

      // Étape 3 : Insérer les données dans la table "students"
      const { data, error } = await supabase.from('students').insert([studentData]).select();
      if (error) {
        alert(`Une erreur est survenue : ${error.message}`);
      } else {
        alert('Élève ajouté avec succès !');
        onStudentAdded?.(); // Option : appeler une fonction de rappel après ajout
        navigate('/class-management'); // Redirection vers la gestion de classe
      }
    } catch (err) {
      console.error('[LOG] Erreur inattendue :', err.message);
      alert('Une erreur inattendue est survenue.');
    } finally {
      setLoading(false); // Désactiver le chargement
    }
  };

// ============================================================
// SECTION 4 : Interface utilisateur du formulaire
// Objectif : Permettre à l'utilisateur d'ajouter un nouvel élève
// ============================================================
return (
  <form onSubmit={handleSubmit} className="space-y-4">
    {/* Champ : Code Élève */}
    <div>
      <label htmlFor="student_code" className="block text-sm font-medium text-gray-700">
        Code Élève :
      </label>
      <input
        type="text"
        id="student_code"
        name="student_code"
        value={formData.student_code}
        onChange={handleChange}
        required
        className="border rounded px-3 py-2 w-full"
        placeholder="Entrez le code élève"
      />
    </div>

    {/* Champ : Prénom */}
    <div>
      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
        Prénom :
      </label>
      <input
        type="text"
        id="first_name"
        name="first_name"
        value={formData.first_name}
        onChange={handleChange}
        required
        className="border rounded px-3 py-2 w-full"
        placeholder="Entrez le prénom"
      />
    </div>

    {/* Champ : Nom */}
    <div>
      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
        Nom :
      </label>
      <input
        type="text"
        id="last_name"
        name="last_name"
        value={formData.last_name}
        onChange={handleChange}
        required
        className="border rounded px-3 py-2 w-full"
        placeholder="Entrez le nom"
      />
    </div>

    {/* Champ : Date de Naissance */}
    <div>
      <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
        Date de Naissance :
      </label>
      <input
        type="date"
        id="birth_date"
        name="birth_date"
        value={formData.birth_date}
        onChange={handleChange}
        required
        className="border rounded px-3 py-2 w-full"
      />
    </div>

    {/* Sélection : Classe */}
    <div>
      <label htmlFor="student_class" className="block text-sm font-medium text-gray-700">
        Classe :
      </label>
      <select
        id="student_class"
        name="student_class"
        value={selectedClass || ''}
        onChange={(e) => setSelectedClass(e.target.value)}
        className="border rounded px-2 py-1 w-full"
        required
      >
        <option value="">Sélectionnez une classe</option>
        {classes.map((cls) => (
          <option key={cls.id} value={cls.class_name}>
            {cls.class_name}
          </option>
        ))}
      </select>
    </div>

    {/* Bouton de Soumission */}
    <button
      type="submit"
      disabled={loading}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
    >
      {loading ? 'Ajout en cours...' : 'Ajouter'}
    </button>
  </form>
);

}

// Exportation du composant
export default StudentForm;
