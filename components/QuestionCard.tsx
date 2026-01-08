
import React, { useState } from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  onAnswer: (correct: boolean) => void;
  playerName: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onAnswer, playerName }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleOptionClick = (option: string) => {
    if (showFeedback) return;
    setSelected(option);
    setShowFeedback(true);
    setTimeout(() => {
      onAnswer(option === question.correctAnswer);
    }, 2500);
  };

  const isCorrect = selected === question.correctAnswer;

  return (
    <div className="glass-card p-8 rounded-3xl shadow-2xl border-4 border-white max-w-2xl w-full mx-auto animate-in fade-in zoom-in duration-300">
      <div className="mb-6 flex justify-between items-center">
        <span className="px-4 py-1 bg-red-100 text-red-600 rounded-full text-sm font-bold uppercase tracking-wider">
          {question.topic}
        </span>
        <span className="text-gray-500 font-semibold">{playerName}'s Turn</span>
      </div>

      {question.readingPassage && (
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded italic text-gray-700">
          {question.readingPassage}
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800 mb-8 leading-tight">
        {question.text}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options?.map((option, idx) => {
          const isSelected = selected === option;
          let bgColor = 'bg-white hover:bg-gray-50';
          if (showFeedback) {
            if (option === question.correctAnswer) bgColor = 'bg-green-500 text-white border-green-600';
            else if (isSelected) bgColor = 'bg-red-500 text-white border-red-600';
            else bgColor = 'bg-gray-100 text-gray-400 opacity-50';
          }

          return (
            <button
              key={idx}
              disabled={showFeedback}
              onClick={() => handleOptionClick(option)}
              className={`p-4 rounded-xl border-2 text-left font-semibold transition-all transform active:scale-95 ${bgColor} ${isSelected ? 'ring-4 ring-red-200' : ''}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <div className={`mt-8 p-4 rounded-xl animate-bounce text-center font-bold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isCorrect ? '🇨🇦 Correct! You found a Maple Leaf!' : 'Oops! Let\'s try another one next time.'}
          <p className="mt-2 text-sm font-medium">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
