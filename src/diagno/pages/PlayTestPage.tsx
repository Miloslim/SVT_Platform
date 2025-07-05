//src/diagno/pages/PlayTestPage.tsx
import React from 'react';
import {TestPlayer} from '../components/TestPlayer/TestPlayer';

const PlayTestPage = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">🎓 Passer un test</h2>
      <TestPlayer />
    </div>
  );
};

export default PlayTestPage;
