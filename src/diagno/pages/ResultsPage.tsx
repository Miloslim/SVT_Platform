//src/diagno/pages/ResultsPage.tsx
import React from 'react';
import {StudentResultsDashboard} from '../components/Analytics/StudentResultsDashboard';
import {ClassStatsCharts} from '../components/Analytics/ClassStatsCharts';

const ResultsPage = () => {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">📊 Résultats et analyses</h2>
      <StudentResultsDashboard />
      <ClassStatsCharts />
    </div>
  );
};

export default ResultsPage;
