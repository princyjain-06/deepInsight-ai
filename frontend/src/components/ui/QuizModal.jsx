import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, CheckCircle2, XCircle, Award, RotateCcw } from 'lucide-react';

export default function QuizModal({ isOpen, questions = [], onClose }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState({}); // { [questionIndex]: optionString }
  const [revealed, setRevealed] = useState({}); // { [questionIndex]: true }
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const q = questions[current];

  const handleSelect = (opt) => {
    if (revealed[current]) return;
    setSelected(prev => ({ ...prev, [current]: opt }));
  };

  const handleReveal = () => {
    if (!selected[current]) return;
    setRevealed(prev => ({ ...prev, [current]: true }));
  };

  const handleNext = () => {
    if (current < total - 1) {
      setCurrent(c => c + 1);
    } else {
      setFinished(true);
    }
  };

  const handlePrev = () => {
    if (current > 0) setCurrent(c => c - 1);
  };

  const score = questions.reduce((acc, _, i) => {
    return selected[i] === questions[i]?.answer ? acc + 1 : acc;
  }, 0);

  const handleReset = () => {
    setCurrent(0);
    setSelected({});
    setRevealed({});
    setFinished(false);
  };

  const getOptionStyle = (opt) => {
    const isSelected = selected[current] === opt;
    const isAnswered = !!revealed[current];
    const isCorrect = opt === q?.answer;

    if (!isAnswered) {
      return isSelected
        ? 'border-purple-500/60 bg-purple-500/10 text-white'
        : 'border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/5 hover:border-white/20';
    }
    if (isCorrect) return 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300';
    if (isSelected && !isCorrect) return 'border-red-500/60 bg-red-500/10 text-red-300';
    return 'border-white/5 bg-black/20 text-neutral-500';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 28 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="relative w-full max-w-xl bg-[#111113] border border-white/10 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.8)] overflow-hidden z-10 flex flex-col"
            style={{ maxHeight: '90vh' }}
          >
            {/* Purple top accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-600/70 via-purple-400/50 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Award size={16} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">AI Generated Quiz</h2>
                  {!finished && (
                    <p className="text-[11px] text-neutral-500 mt-0.5">Question {current + 1} of {total}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {!finished ? (
                <div className="p-6">
                  {/* Progress bar */}
                  <div className="h-1 bg-white/5 rounded-full mb-6 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                      initial={false}
                      animate={{ width: `${((current + 1) / total) * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>

                  {/* Question */}
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="text-white font-medium text-[15px] leading-relaxed mb-6">
                      {q?.question}
                    </p>

                    {/* Options */}
                    <div className="flex flex-col gap-2.5 mb-6">
                      {q?.options?.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelect(opt)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200 ${getOptionStyle(opt)}`}
                        >
                          <span className="font-medium text-neutral-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                          {opt}
                        </button>
                      ))}
                    </div>

                    {/* Explanation */}
                    <AnimatePresence>
                      {revealed[current] && q?.explanation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-5"
                        >
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                            {selected[current] === q.answer
                              ? <CheckCircle2 size={13} className="text-emerald-400" />
                              : <XCircle size={13} className="text-red-400" />}
                            Explanation
                          </div>
                          <p className="text-sm text-neutral-300 leading-relaxed">{q.explanation}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handlePrev}
                      disabled={current === 0}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-neutral-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={15} /> Prev
                    </button>

                    <div className="flex items-center gap-2">
                      {!revealed[current] && (
                        <button
                          onClick={handleReveal}
                          disabled={!selected[current]}
                          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-neutral-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Check Answer
                        </button>
                      )}
                      <button
                        onClick={handleNext}
                        disabled={!revealed[current]}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-neutral-100 text-black text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {current === total - 1 ? 'Finish' : 'Next'} <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Results screen */
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-20 h-20 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5"
                  >
                    <Award size={36} className="text-purple-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-1">Quiz Complete!</h3>
                  <p className="text-neutral-400 text-sm mb-6">Here's how you did:</p>

                  <div className="inline-flex items-baseline gap-2 bg-white/[0.03] border border-white/10 rounded-2xl px-8 py-5 mb-6">
                    <span className="text-5xl font-bold text-white">{score}</span>
                    <span className="text-xl text-neutral-400">/ {total}</span>
                  </div>

                  <div className="text-sm text-neutral-400 mb-8">
                    {score === total && '🎉 Perfect score! Outstanding!'}
                    {score >= total * 0.8 && score < total && '🌟 Excellent work!'}
                    {score >= total * 0.6 && score < total * 0.8 && '👍 Good job! Keep it up!'}
                    {score < total * 0.6 && '📚 Keep studying — you\'ll get there!'}
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-neutral-300 hover:text-white transition-all"
                    >
                      <RotateCcw size={14} /> Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black text-sm font-semibold transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
