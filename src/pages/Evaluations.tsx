import React from 'react';
import { Plus, Filter } from 'lucide-react';
import { supabase } from '../backend/config/supabase';
function Evaluations() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Évaluations</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700">
          <Plus className="h-5 w-5" />
          <span>Nouvelle Évaluation</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex space-x-4">
            <select className="border rounded-lg px-3 py-2">
              <option>Tous les types</option>
              <option>Contrôle</option>
              <option>Quiz</option>
              <option>Examen</option>
            </select>
            <select className="border rounded-lg px-3 py-2">
              <option>Toutes les classes</option>
              <option>6ème</option>
              <option>5ème</option>
              <option>4ème</option>
            </select>
          </div>
          <button className="flex items-center space-x-2 text-gray-600">
            <Filter className="h-5 w-5" />
            <span>Filtres</span>
          </button>
        </div>

        <div className="p-4">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Titre</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Classe</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <EvaluationRow
                title="Test sur la cellule"
                type="Contrôle"
                date="2024-03-01"
                classe="5ème"
                status="À venir"
              />
              <EvaluationRow
                title="Quiz écosystèmes"
                type="Quiz"
                date="2024-02-28"
                classe="6ème"
                status="Terminé"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EvaluationRow({ title, type, date, classe, status }) {
  const statusColor = status === 'Terminé' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-3 px-4">{title}</td>
      <td className="py-3 px-4">{type}</td>
      <td className="py-3 px-4">{date}</td>
      <td className="py-3 px-4">{classe}</td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
          {status}
        </span>
      </td>
      <td className="py-3 px-4">
        <button className="text-indigo-600 hover:text-indigo-800">
          Voir les détails
        </button>
      </td>
    </tr>
  );
}

export default Evaluations;