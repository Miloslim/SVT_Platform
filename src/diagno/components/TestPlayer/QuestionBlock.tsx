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
  question: Question;
  answer: string;
  onAnswer: (answer: string) => void;
};

const QuestionBlock: React.FC<Props> = ({ question, answer, onAnswer }) => {
  if (question.type === 'qcm' && question.options) {
    return (
      <div className="mb-4 p-4 border rounded">
        <p className="font-semibold">{question.question}</p>
        {question.options.map(option => (
          <label key={option} className="block">
            <input
              type="radio"
              name={`qcm-${question.id}`}
              value={option}
              checked={answer === option}
              onChange={() => onAnswer(option)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'texte') {
    return (
      <div className="mb-4 p-4 border rounded">
        <p className="font-semibold">{question.question}</p>
        <textarea
          value={answer}
          onChange={e => onAnswer(e.target.value)}
          className="w-full border p-2 mt-2"
          rows={4}
          placeholder="Votre réponse..."
        />
      </div>
    );
  }

  return null;
};

export { QuestionBlock };
