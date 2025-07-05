import React from 'react';
import { Plus, BookOpen, Users, Clock } from 'lucide-react';
import { supabase } from '../backend/config/supabase';
function Courses() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Cours en Ligne</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700">
          <Plus className="h-5 w-5" />
          <span>Nouveau Cours</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CourseCard
          title="Introduction à la Biologie Cellulaire"
          description="Découvrez les composants fondamentaux de la cellule et leur fonction"
          students={15}
          duration="2h30"
          image="https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
        />
        <CourseCard
          title="Les Écosystèmes Terrestres"
          description="Étude des différents écosystèmes et leur fonctionnement"
          students={12}
          duration="3h00"
          image="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
        />
        <CourseCard
          title="Géologie: Les Roches"
          description="Classification et identification des principaux types de roches"
          students={18}
          duration="2h00"
          image="https://images.unsplash.com/photo-1525857597365-5f6dbff2e36e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
        />
      </div>
    </div>
  );
}

function CourseCard({ title, description, students, duration, image }) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-gray-600">{description}</p>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>{students} élèves</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
        </div>
        
        <button className="mt-4 w-full bg-indigo-50 text-indigo-600 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
          Accéder au cours
        </button>
      </div>
    </div>
  );
}

export default Courses;