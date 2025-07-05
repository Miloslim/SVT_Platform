//
import React from 'react';

type Question = {
  id: number;
  type: 'qcm' | 'texte';
  question: string;
  options?: string[];
  correct?: string;
};

type Props = {
  questions: Question[];
  answers: { [key: number]: string };
};

const ResultFeedback: React.FC<Props> = ({ questions, answers }) => {
  // Calcul simple du score pour QCM uniquement
  const totalQCM = questions.filter(q => q.type === 'qcm').length;
  const correctAnswers = questions.filter(
    q => q.type === 'qcm' && answers[q.id] === q.correct
  ).length;

  return (
    <div className="p-6 border rounded bg-green-50">
      <h2 className="text-xl font-bold mb-4">Résultats</h2>
      <p>
        Score QCM : {correctAnswers} / {totalQCM}
      </p>

      <div className="mt-4">
        {questions.map(q => (
          <div key={q.id} className="mb-3">
            <p className="font-semibold">{q.question}</p>
            <p>
              Votre réponse : <strong>{answers[q.id] || 'Aucune réponse'}</strong>
            </p>
            {q.type === 'qcm' && (
              <p>
                Réponse correcte : <strong>{q.correct}</strong>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export { ResultFeedback };
