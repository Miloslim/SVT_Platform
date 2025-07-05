//
import React, { useState } from 'react';
import { QuestionBlock } from './QuestionBlock';
import { ResultFeedback } from './ResultFeedback';

const TestPlayer = () => {
  // Exemple simple : questions statiques
  const questions = [
    { id: 1, type: 'qcm', question: 'Quelle est la capitale de la France ?', options: ['Paris', 'Londres', 'Berlin'], correct: 'Paris' },
    { id: 2, type: 'texte', question: 'Expliquez le cycle de l’eau.' },
  ];

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswer = (id: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [id]: answer }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Passer le test</h2>

      {!submitted ? (
        <>
          {questions.map(q => (
            <QuestionBlock
              key={q.id}
              question={q}
              answer={answers[q.id] || ''}
              onAnswer={(ans) => handleAnswer(q.id, ans)}
            />
          ))}

          <button
            onClick={handleSubmit}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Soumettre les réponses
          </button>
        </>
      ) : (
        <ResultFeedback questions={questions} answers={answers} />
      )}
    </div>
  );
};

export { TestPlayer };
