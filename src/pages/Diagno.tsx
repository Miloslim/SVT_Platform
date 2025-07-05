// Nom du fichier : Diagno.tsx
// Emplacement : D:\SVT_Platform\src\pages\Diagno.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Diagno: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">🧩 Module de Test Diagnostique</h1>
      <p className="text-gray-600">
        Ce module permet de <strong>préparer</strong>, <strong>affecter</strong>, <strong>passer</strong> et <strong>analyser</strong> les tests diagnostiques en SVT pour les classes de lycée.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Composer un test */}
        <Card className="hover:shadow-lg transition">
          <CardContent className="p-4 flex flex-col gap-2">
            <h2 className="text-xl font-semibold">🧪 Créer un test</h2>
            <p className="text-sm text-gray-500">
              Composer un test à partir d’objectifs, chapitres et compétences.
            </p>
            <Button onClick={() => navigate('/diagno/compose')} className="mt-auto">
              Lancer le constructeur
            </Button>
          </CardContent>
        </Card>

        {/* Affecter un test */}
        <Card className="hover:shadow-lg transition">
          <CardContent className="p-4 flex flex-col gap-2">
            <h2 className="text-xl font-semibold">👨‍🏫 Affecter un test</h2>
            <p className="text-sm text-gray-500">
              Distribuer un test à un ou plusieurs élèves ou classes.
            </p>
            <Button onClick={() => navigate('/diagno/assign')} className="mt-auto">
              Affecter maintenant
            </Button>
          </CardContent>
        </Card>

        {/* Passer un test */}
        <Card className="hover:shadow-lg transition">
          <CardContent className="p-4 flex flex-col gap-2">
            <h2 className="text-xl font-semibold">👨‍🎓 Passer un test</h2>
            <p className="text-sm text-gray-500">
              Interface élève pour répondre en ligne depuis tout appareil.
            </p>
            <Button onClick={() => navigate('/diagno/play')} className="mt-auto">
              Commencer un test
            </Button>
          </CardContent>
        </Card>

        {/* Analyser les résultats */}
        <Card className="hover:shadow-lg transition">
          <CardContent className="p-4 flex flex-col gap-2">
            <h2 className="text-xl font-semibold">📊 Analyser les résultats</h2>
            <p className="text-sm text-gray-500">
              Statistiques détaillées pour identifier les lacunes et adapter les remédiations.
            </p>
            <Button onClick={() => navigate('/diagno/results')} className="mt-auto">
              Voir les résultats
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Diagno;
