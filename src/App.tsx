/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Heart, 
  Trophy, 
  Play, 
  RotateCcw, 
  Rabbit, 
  Bird, 
  Squirrel, 
  Turtle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

type GameState = 'START' | 'PLAYING' | 'FINISHED';

interface Question {
  num1: number;
  num2: number;
  operator: '+' | '-';
  answer: number;
  options: number[];
}

const ANIMALS = [
  { icon: Rabbit, color: 'text-pink-400', name: 'Coelhinho', sound: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73484.mp3' },
  { icon: Bird, color: 'text-blue-400', name: 'Passarinho', sound: 'https://cdn.pixabay.com/audio/2021/08/04/audio_bb630d7a4f.mp3' },
  { icon: Squirrel, color: 'text-orange-400', name: 'Esquilo', sound: 'https://cdn.pixabay.com/audio/2022/03/15/audio_7838cf1633.mp3' },
  { icon: Turtle, color: 'text-emerald-400', name: 'Tartaruga', sound: 'https://cdn.pixabay.com/audio/2022/03/10/audio_5e29380e2d.mp3' },
];

const WRONG_SOUND = 'https://cdn.pixabay.com/audio/2022/03/24/audio_78390a260d.mp3';
const CORRECT_SOUND = 'https://cdn.pixabay.com/audio/2021/08/04/audio_12b79504e1.mp3';

const playSound = (url: string) => {
  const audio = new Audio(url);
  audio.play().catch(e => console.log('Audio play blocked:', e));
};

const playTone = (freq: number, type: OscillatorType, duration: number) => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [currentAnimal, setCurrentAnimal] = useState(ANIMALS[0]);
  const [showAd, setShowAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);

  const generateQuestion = useCallback(() => {
    const isAddition = Math.random() > 0.5;
    let n1, n2, ans;

    if (isAddition) {
      n1 = Math.floor(Math.random() * 10) + 1;
      n2 = Math.floor(Math.random() * 10) + 1;
      ans = n1 + n2;
    } else {
      n1 = Math.floor(Math.random() * 10) + 5;
      n2 = Math.floor(Math.random() * n1) + 1;
      ans = n1 - n2;
    }

    const options = new Set([ans]);
    while (options.size < 4) {
      const offset = Math.floor(Math.random() * 5) - 2;
      const wrongAns = ans + offset;
      if (wrongAns >= 0 && wrongAns !== ans) {
        options.add(wrongAns);
      } else {
        options.add(Math.floor(Math.random() * 20));
      }
    }

    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    setCurrentQuestion({
      num1: n1,
      num2: n2,
      operator: isAddition ? '+' : '-',
      answer: ans,
      options: Array.from(options).sort((a, b) => a - b),
    });
    setCurrentAnimal(animal);
    // Play animal sound when question appears
    playSound(animal.sound);
  }, []);

  const startGame = () => {
    setScore(0);
    setQuestionCount(0);
    setGameState('PLAYING');
    generateQuestion();
  };

  const handleAnswer = (selected: number) => {
    if (feedback || showAd) return;

    if (selected === currentQuestion?.answer) {
      setFeedback('CORRECT');
      setScore(s => s + 1);
      setTotalCorrect(t => {
        const next = t + 1;
        if (next % 20 === 0 && next > 0) {
          setTimeout(() => setShowAd(true), 1500);
        }
        return next;
      });
      playSound(CORRECT_SOUND);
      setTimeout(() => playSound(currentAnimal.sound), 300); // Animal celebrates after success chime
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF4500']
      });
    } else {
      setFeedback('WRONG');
      playSound(WRONG_SOUND);
    }

    setTimeout(() => {
      setFeedback(null);
      if (questionCount < 9) {
        setQuestionCount(c => c + 1);
        generateQuestion();
      } else {
        setGameState('FINISHED');
      }
    }, 1500);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showAd && adCountdown > 0) {
      timer = setInterval(() => {
        setAdCountdown(c => c - 1);
      }, 1000);
    } else if (adCountdown === 0) {
      // Ad can be closed
    }
    return () => clearInterval(timer);
  }, [showAd, adCountdown]);

  const closeAd = () => {
    if (adCountdown === 0) {
      setShowAd(false);
      setAdCountdown(5);
    }
  };

  return (
    <div className="h-[95dvh] w-full flex flex-col items-center justify-center p-2 sm:p-4 font-sans relative overflow-hidden bg-gradient-to-b from-sky-300 to-sky-100">
      {/* Vivid Scenario Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Clouds */}
        <motion.div 
          animate={{ x: [-100, 1000] }} 
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 left-0 opacity-60"
        >
          <div className="w-24 h-10 bg-white rounded-full blur-sm" />
        </motion.div>
        <motion.div 
          animate={{ x: [1100, -200] }} 
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute top-32 right-0 opacity-40"
        >
          <div className="w-32 h-12 bg-white rounded-full blur-sm" />
        </motion.div>

        {/* Trees */}
        <div className="absolute bottom-0 left-0 flex items-end gap-4 opacity-40">
          <div className="w-16 h-32 bg-emerald-800 rounded-t-full" />
          <div className="w-20 h-48 bg-emerald-700 rounded-t-full" />
          <div className="w-12 h-24 bg-emerald-900 rounded-t-full" />
        </div>
        <div className="absolute bottom-0 right-0 flex items-end gap-4 opacity-40">
          <div className="w-14 h-28 bg-emerald-900 rounded-t-full" />
          <div className="w-24 h-56 bg-emerald-700 rounded-t-full" />
          <div className="w-18 h-36 bg-emerald-800 rounded-t-full" />
        </div>

        {/* Grass */}
        <div className="absolute bottom-0 w-full h-12 bg-emerald-500/30 flex items-end justify-around">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-1 h-8 bg-emerald-600/40 rounded-full transform rotate-12" />
          ))}
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {showAd && (
          <motion.div 
            key="ad"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 text-white"
          >
            <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-center">
              <p className="text-sm uppercase tracking-widest opacity-60 mb-2">Anúncio</p>
              <h3 className="text-2xl font-bold mb-4">Apoie o Jogo!</h3>
              <div className="aspect-video bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-6 flex items-center justify-center">
                <p className="text-lg font-medium">Espaço para Publicidade</p>
              </div>
              <button 
                onClick={closeAd}
                disabled={adCountdown > 0}
                className={`w-full py-4 rounded-2xl font-bold text-xl transition-all ${
                  adCountdown > 0 
                  ? "bg-white/20 text-white/40 cursor-not-allowed" 
                  : "bg-white text-black hover:bg-emerald-400"
                }`}
              >
                {adCountdown > 0 ? `Fechar em ${adCountdown}s` : "Fechar Anúncio"}
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'START' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="game-card text-center max-w-md w-full"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-100 p-4 sm:p-6 rounded-full border-4 border-yellow-400">
                <Star className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 fill-yellow-500" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-emerald-700 mb-2">
              Matemática dos animais
            </h1>
            <p className="text-emerald-600 mb-6 text-base sm:text-lg">
              Ajude os animais resolvendo as continhas!
            </p>
            <button onClick={startGame} className="btn-primary flex items-center gap-2 mx-auto py-3 px-6 text-xl sm:text-2xl">
              <Play fill="currentColor" size={20} /> JOGAR
            </button>
          </motion.div>
        )}

        {gameState === 'PLAYING' && currentQuestion && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl flex flex-col h-full max-h-[90dvh]"
          >
            {/* Header Info */}
            <div className="flex justify-between items-center mb-2 sm:mb-4 px-2">
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border-2 border-emerald-100">
                <Star className="text-yellow-500 fill-yellow-500" size={20} />
                <span className="text-lg font-bold text-emerald-700">{score}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border-2 border-emerald-100">
                <span className="text-sm sm:text-base font-medium text-emerald-600">Questão {questionCount + 1}/10</span>
              </div>
            </div>

            {/* Main Game Area */}
            <div className="game-card relative overflow-hidden flex-1 justify-center">
              {/* Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 backdrop-blur-sm"
                  >
                    {feedback === 'CORRECT' ? (
                      <div className="text-center">
                        <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-emerald-600">Muito bem!</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <XCircle className="w-24 h-24 text-red-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-red-600">Quase lá!</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 overflow-hidden">
                {/* Animal Character */}
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex flex-row md:flex-col items-center gap-2 md:gap-0"
                >
                  <div className={`p-3 sm:p-4 md:p-8 rounded-full bg-emerald-50 md:mb-4`}>
                    <currentAnimal.icon className={`w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 ${currentAnimal.color}`} />
                  </div>
                  <p className="text-emerald-700 font-bold text-sm sm:text-base md:text-xl">O {currentAnimal.name} pergunta:</p>
                </motion.div>

                {/* Question */}
                <div className="flex-1 text-center w-full flex flex-col justify-center">
                  <div className="flex items-center justify-center gap-2 md:gap-4 text-4xl sm:text-5xl md:text-7xl font-display font-bold text-emerald-800 mb-4 md:mb-12">
                    <span>{currentQuestion.num1}</span>
                    <span className="text-orange-500">{currentQuestion.operator}</span>
                    <span>{currentQuestion.num2}</span>
                    <span className="text-emerald-400">=</span>
                    <span className="w-12 h-12 md:w-20 md:h-20 border-b-4 md:border-b-8 border-emerald-200 text-emerald-300">?</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    {currentQuestion.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(opt)}
                        className="answer-btn py-3 md:py-6 text-2xl md:text-4xl"
                        disabled={!!feedback}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'FINISHED' && (
          <motion.div 
            key="finished"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="game-card text-center max-w-md w-full"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-100 p-4 sm:p-6 rounded-full border-4 border-yellow-400 relative">
                <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 fill-yellow-500" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-emerald-700 mb-1">
              Parabéns!
            </h2>
            <p className="text-emerald-600 mb-4 text-base sm:text-lg">
              Você ajudou muitos animais!
            </p>
            
            <div className="bg-emerald-50 rounded-2xl p-4 mb-6">
              <p className="text-emerald-700 font-medium mb-1 uppercase text-xs tracking-wider">Sua Pontuação</p>
              <p className="text-4xl sm:text-5xl font-display font-bold text-emerald-800">{score * 10}</p>
            </div>

            <button onClick={startGame} className="btn-primary flex items-center gap-2 mx-auto py-3 px-6 text-xl">
              <RotateCcw size={20} /> JOGAR DE NOVO
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full flex justify-around pointer-events-none opacity-30">
        <Squirrel className="text-orange-300 w-12 h-12" />
        <Rabbit className="text-pink-300 w-16 h-16" />
        <Bird className="text-blue-300 w-12 h-12" />
        <Turtle className="text-emerald-300 w-14 h-14" />
      </div>
    </div>
  );
}
