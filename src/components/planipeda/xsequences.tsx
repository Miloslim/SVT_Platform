// ============================================================
// 📌 Fichier : sequences.tsx
// 🎯 Objectif :
//   - Afficher les séquences sous forme de tableau bien structuré
//   - Permettre un affichage dynamique et filtrable
// ============================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../../backend/config/supabase';// Connexion à Supabase
import { Edit, Trash, RefreshCw } from 'lucide-react';

// ============================================================
// 📌 🔹 Composant principal : Table des Séquences
// ============================================================
function Sequences() {
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSequences();
  }, []);

  // 🔹 Charger les séquences depuis Supabase
  const fetchSequences = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('sequences').select('*');
    if (error) console.error('❌ Erreur chargement séquences:', error);
    else setSequences(data);
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <Header title="Liste des Séquences" onRefresh={fetchSequences} />

      {loading ? (
        <p className="text-gray-600 text-center">Chargement des séquences...</p>
      ) : (
        <Table sequences={sequences} />
      )}
    </div>
  );
}

// ============================================================
// 📌 🔹 Composant : Header du module
// ============================================================
function Header({ title, onRefresh }: { title: string; onRefresh: () => void }) {
  return (
    <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg shadow">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <button onClick={onRefresh} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700">
        <RefreshCw className="h-5 w-5 mr-2 inline" /> Rafraîchir
      </button>
    </div>
  );
}

// ============================================================
// 📌 🔹 Composant : Tableau des Séquences
// ============================================================
function Table({ sequences }: { sequences: any[] }) {
  return (
    <table className="w-full mt-4 border-collapse border border-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="border border-gray-300 p-2 text-left">Titre</th>
          <th className="border border-gray-300 p-2 text-left">Objectif Global</th>
          <th className="border border-gray-300 p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {sequences.map(seq => (
          <tr key={seq.id} className="border border-gray-300 hover:bg-gray-50">
            <td className="p-2">{seq.titre_sequence}</td>
            <td className="p-2">{seq.objectif_global}</td>
            <td className="p-2 flex space-x-2">
              <button className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600">
                <Edit className="h-5 w-5" />
              </button>
              <button className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700">
                <Trash className="h-5 w-5" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Sequences;
