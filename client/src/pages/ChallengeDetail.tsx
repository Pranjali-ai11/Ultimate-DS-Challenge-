import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Zap,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Sparkles,
  BookOpen,
  X,
  Trophy,
  Layers,
  ChevronRight,
  Clock,
  Target
} from 'lucide-react';
import { Challenge, LevelQuizResult, LevelQuizReview } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { shuffleChallengeChoices } from '../services/challengeChoices.js';

export const ChallengeDetail: React.FC<{
  challengeId: string;
  navigate: (path: string) => void;
}> = ({ challengeId, navigate }) => {
  const { user, updateUserProgress, refreshUser } = useAuth();
  const userId = user?.id;
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [challengeLoadError, setChallengeLoadError] = useState<string | null>(null);

  // Level 1 Sequential Quiz State
  const [level1Challenges, setLevel1Challenges] = useState<Challenge[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<LevelQuizResult | null>(null);
  const [filterReview, setFilterReview] = useState<'all' | 'wrong' | 'right'>('all');

  // Revision Modal State
  const [reviseStructure, setReviseStructure] = useState<any | null>(null);
  const [loadingRevision, setLoadingRevision] = useState(false);

  // Level 2 Sequential Quiz State
  const [level2Challenges, setLevel2Challenges] = useState<Challenge[]>([]);
  const [level2Answers, setLevel2Answers] = useState<Record<string, string>>({});
  const [level2Submitted, setLevel2Submitted] = useState(false);
  const [submittingLevel2, setSubmittingLevel2] = useState(false);
  const [level2Result, setLevel2Result] = useState<LevelQuizResult | null>(null);
  const [filterLevel2Review, setFilterLevel2Review] = useState<'all' | 'wrong' | 'right'>('all');
  const [advancedChallenges, setAdvancedChallenges] = useState<Challenge[]>([]);
  const [advancedAnswers, setAdvancedAnswers] = useState<Record<string, string[]>>({});
  const [advancedSubmitted, setAdvancedSubmitted] = useState(false);
  const [submittingAdvanced, setSubmittingAdvanced] = useState(false);
  const [advancedResult, setAdvancedResult] = useState<LevelQuizResult | null>(null);
  const [filterAdvancedReview, setFilterAdvancedReview] = useState<'all' | 'wrong' | 'partial' | 'right'>('all');
  const [quizError, setQuizError] = useState<string | null>(null);
  const [confirmSubmitLevel, setConfirmSubmitLevel] = useState<number | null>(null);
  const submissionInFlight = useRef(false);
  const submissionCompleted = useRef(false);
  const submissionIdRef = useRef<string | null>(null);
  const getSubmissionId = (level: number) => {
    const storageKey = `udsc_submission_${userId}_${level}`;
    if (!submissionIdRef.current) {
      try { submissionIdRef.current = sessionStorage.getItem(storageKey) || window.crypto.randomUUID(); }
      catch { submissionIdRef.current = window.crypto.randomUUID(); }
    }
    try { sessionStorage.setItem(storageKey, submissionIdRef.current); } catch { /* The in-memory key still protects retries in this page session. */ }
    return submissionIdRef.current;
  };
  const clearSubmissionId = (level: number) => {
    try { sessionStorage.removeItem(`udsc_submission_${userId}_${level}`); } catch { /* Safe to continue; a completed submission has its saved result URL. */ }
  };

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    async function load() {
      try {
        setLoading(true);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setQuizSubmitted(false);
        setQuizResult(null);
        setLevel2Answers({});
        setLevel2Submitted(false);
        setLevel2Result(null);
        setAdvancedAnswers({});
        setAdvancedSubmitted(false);
        setAdvancedResult(null);
        setFilterReview('all');
        setFilterLevel2Review('all');
        setFilterAdvancedReview('all');
        setQuizError(null);
        setConfirmSubmitLevel(null);
        submissionInFlight.current = false;
        submissionCompleted.current = false;
        const data = await api.getChallengeById(challengeId);
        setChallenge(data.challenge);

        // If this is Level 1, load all 10 Level 1 challenges for the sequential quiz
        if (data.challenge.level === 1) {
          const l1Data = await api.getChallenges({ level: 1 });
          const list = (l1Data.challenges || [])
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(question => shuffleChallengeChoices(question));
          setLevel1Challenges(list);

          // If a specific question was clicked, start there, otherwise question 0
          const initialIdx = list.findIndex(c => c.id === challengeId);
          if (initialIdx !== -1) {
            setCurrentQuestionIndex(initialIdx);
          }
        } else if (data.challenge.level === 2) {
          const l2Data = await api.getChallenges({ level: 2 });
          const list = (l2Data.challenges || [])
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(question => shuffleChallengeChoices(question));
          setLevel2Challenges(list);
          const initialIdx = list.findIndex(c => c.id === challengeId);
          setCurrentQuestionIndex(initialIdx < 0 ? 0 : initialIdx);
        } else {
          const advancedData = await api.getChallenges({ level: data.challenge.level });
          const list = (advancedData.challenges || [])
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(question => shuffleChallengeChoices(question));
          setAdvancedChallenges(list);
          const initialIdx = list.findIndex(c => c.id === challengeId);
          setCurrentQuestionIndex(initialIdx < 0 ? 0 : initialIdx);
        }
      } catch {
        setChallengeLoadError('Challenge could not be loaded. Check your connection and retry.');
      } finally {
        setLoading(false);
      }
    }
    load();
  // A progress refresh replaces the user object but does not change the account.
  // Reloading the challenge on that refresh would clear the just-submitted quiz result.
  }, [challengeId, userId, navigate]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 font-mono text-sm animate-pulse">
        Initializing architectural quiz terminal...
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center gap-4 text-slate-300">
        <p role="alert">{challengeLoadError || 'Challenge not found.'}</p>
        <button
          onClick={() => navigate('/challenges')}
          className="px-4 py-2 bg-slate-800 rounded-lg text-xs font-mono"
        >
          Return to Missions
        </button>
      </div>
    );
  }

  const isLevel1 = challenge.level === 1;
  const isLevel2 = challenge.level === 2;
  const isAdvancedLevel = challenge.level === 3 || challenge.level === 4;

  // Active question for Level 1
  const currentL1Challenge = isLevel1 && level1Challenges.length > 0
    ? level1Challenges[currentQuestionIndex]
    : challenge;

  const currentSelectedOptionId = currentL1Challenge ? answers[currentL1Challenge.id] : undefined;

  const isAnswerValid = (question: Challenge, answer: unknown, level: number): boolean => {
    if (level === 1) return typeof answer === 'string' && Boolean(question.options?.some(option => option.id === answer));
    if (level === 2) return typeof answer === 'string' && question.availableStructures.includes(answer);
    return Array.isArray(answer) && answer.length > 0 && new Set(answer).size === answer.length &&
      answer.every(choice => typeof choice === 'string' && question.availableStructures.includes(choice));
  };
  const getQuizAnswerStatus = (questions: Challenge[], quizAnswers: Record<string, unknown>, level: number) => {
    const unansweredIndexes = questions.reduce<number[]>((indexes, question, index) => {
      if (!isAnswerValid(question, quizAnswers[question.id], level)) indexes.push(index);
      return indexes;
    }, []);
    return { answered: questions.length - unansweredIndexes.length, remaining: unansweredIndexes.length, unansweredIndexes };
  };
  const level1Status = getQuizAnswerStatus(level1Challenges, answers, 1);
  const level2Status = getQuizAnswerStatus(level2Challenges, level2Answers, 2);
  const advancedStatus = getQuizAnswerStatus(advancedChallenges, advancedAnswers, challenge.level);

  const requestQuizSubmission = (level: number) => {
    const questions = level === 1 ? level1Challenges : level === 2 ? level2Challenges : advancedChallenges;
    const answerState = level === 1 ? answers : level === 2 ? level2Answers : advancedAnswers;
    const status = getQuizAnswerStatus(questions, answerState, level);
    setQuizError(null);
    if (!questions.length || status.remaining > 0) {
      const firstUnansweredIndex = status.unansweredIndexes[0];
      if (firstUnansweredIndex !== undefined) setCurrentQuestionIndex(firstUnansweredIndex);
      setQuizError(`Please answer all questions before submitting. ${status.answered} answered, ${status.remaining} remaining.`);
      return;
    }
    setConfirmSubmitLevel(level);
  };

  // Handle Option Select for Level 1
  const handleSelectOption = (optionId: string) => {
    if (!quizSubmitted && currentL1Challenge) {
      setAnswers(prev => ({
        ...prev,
        [currentL1Challenge.id]: optionId
      }));
    }
  };

  // Submit Level 1 Quiz (after last question or user trigger)
  const handleSubmitLevel1Quiz = async () => {
    if (submissionInFlight.current || submissionCompleted.current) return;
    try {
      setQuizError(null);
      submissionInFlight.current = true;
      setSubmittingQuiz(true);
      const res = await api.submitLevelQuiz(1, answers, getSubmissionId(1));
      clearSubmissionId(1);
      submissionCompleted.current = true;
      setConfirmSubmitLevel(null);
      setQuizResult(res);
      setQuizSubmitted(true);
      if (res.progress) {
        updateUserProgress(res.progress);
      }
      void refreshUser();
    } catch (err) {
      if (err instanceof Error && 'submissionId' in err && typeof err.submissionId === 'string') { navigate(`/results/${encodeURIComponent(err.submissionId)}`); return; }
      console.error('Quiz submission error:', err);
      setQuizError('Unable to submit Level 1 quiz. Please try again.');
    } finally {
      submissionInFlight.current = false;
      setSubmittingQuiz(false);
    }
  };

  // Open Revision Modal for a specific Data Structure
  const handleOpenRevision = async (structureId: string) => {
    setLoadingRevision(true);
    try {
      const data = await api.getStructureDetail(structureId);
      setReviseStructure(data.structure);
    } catch (err) {
      console.error('Failed to load revision details:', err);
    } finally {
      setLoadingRevision(false);
    }
  };

  // Level 2 Submission Handler
  const handleLevel2Submit = async () => {
    if (submissionInFlight.current || submissionCompleted.current) return;
    try {
      setQuizError(null);
      submissionInFlight.current = true;
      setSubmittingLevel2(true);
      const response = await api.submitLevelQuiz(2, level2Answers, getSubmissionId(2));
      clearSubmissionId(2);
      submissionCompleted.current = true;
      setConfirmSubmitLevel(null);
      setLevel2Result(response);
      setLevel2Submitted(true);
      if (response.progress) {
        updateUserProgress(response.progress);
      }
      void refreshUser();
    } catch (err) {
      if (err instanceof Error && 'submissionId' in err && typeof err.submissionId === 'string') { navigate(`/results/${encodeURIComponent(err.submissionId)}`); return; }
      console.error('Level 2 quiz submission error:', err);
      setQuizError('Unable to submit Level 2 quiz. Please try again.');
    } finally {
      submissionInFlight.current = false;
      setSubmittingLevel2(false);
    }
  };

  const handleAdvancedSubmit = async () => {
    if (submissionInFlight.current || submissionCompleted.current) return;
    try {
      setQuizError(null);
      submissionInFlight.current = true;
      setSubmittingAdvanced(true);
      const response = await api.submitLevelQuiz(challenge.level, advancedAnswers, getSubmissionId(challenge.level));
      clearSubmissionId(challenge.level);
      submissionCompleted.current = true;
      setConfirmSubmitLevel(null);
      setAdvancedResult(response);
      setAdvancedSubmitted(true);
      updateUserProgress(response.progress);
      void refreshUser();
    } catch (err) {
      if (err instanceof Error && 'submissionId' in err && typeof err.submissionId === 'string') { navigate(`/results/${encodeURIComponent(err.submissionId)}`); return; }
      console.error(`Level ${challenge.level} quiz submission error:`, err);
      setQuizError(`Unable to submit quiz. Please try again.`);
    } finally {
      submissionInFlight.current = false;
      setSubmittingAdvanced(false);
    }
  };

  // Filter reviews for results screen
  const reviewsToDisplay = quizResult?.reviews?.filter((r: LevelQuizReview) => {
    if (filterReview === 'wrong') return !r.isCorrect;
    if (filterReview === 'right') return r.isCorrect;
    return true;
  }) || [];
  const level2ReviewsToDisplay = level2Result?.reviews?.filter((r: LevelQuizReview) => {
    if (filterLevel2Review === 'wrong') return !r.isCorrect;
    if (filterLevel2Review === 'right') return r.isCorrect;
    return true;
  }) || [];
  const advancedReviewsToDisplay = advancedResult?.reviews?.filter((review: LevelQuizReview) => {
    if (filterAdvancedReview === 'wrong') return review.status === 'incorrect';
    if (filterAdvancedReview === 'partial') return review.status === 'partial';
    if (filterAdvancedReview === 'right') return review.status === 'correct';
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <button
            onClick={() => navigate('/challenges')}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Mission Hub</span>
          </button>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">
              LEVEL 0{challenge.level}
            </span>
            <span className="text-slate-400">
              Category: <strong className="text-cyan-400">{isLevel1 ? currentL1Challenge.category : isAdvancedLevel ? (advancedChallenges[currentQuestionIndex]?.category || challenge.category) : challenge.category}</strong>
            </span>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* LEVEL 1: FULL SEQUENTIAL QUIZ FLOW                                    */}
        {/* ==================================================================== */}
        {isLevel1 && (
          <>
            {!quizSubmitted ? (
              <div className="space-y-6">
                {/* Header Banner & Question Jump Bubbles */}
                <div className="p-6 rounded-3xl bg-[#0f172a]/95 border border-cyan-500/30 shadow-2xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                    <div>
                      <span className="text-cyan-400 font-bold uppercase tracking-wider">
                        LEVEL 01 FOUNDATION QUIZ
                      </span>
                      <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                        Question {currentQuestionIndex + 1} of {level1Challenges.length}
                      </h1>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30">
                        <Zap className="w-3.5 h-3.5" />
                        {currentL1Challenge?.rewardXp !== undefined ? `+${currentL1Challenge.rewardXp} XP for first pass` : 'Reward details unavailable'}
                      </span>
                      <span className="text-slate-400 font-mono text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                        {level1Status.answered} / {level1Challenges.length} Answered · {level1Status.remaining} remaining
                      </span>
                    </div>
                  </div>

                  {/* Question Pills: Click to jump to any question directly */}
                  <div className="pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {level1Challenges.map((q, idx) => {
                        const isCurrent = idx === currentQuestionIndex;
                        const isAnswered = isAnswerValid(q, answers[q.id], 1);
                        return (
                          <button
                            key={q.id}
                            onClick={() => setCurrentQuestionIndex(idx)}
                            className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center ${
                              isCurrent
                                ? 'bg-cyan-400 text-black shadow-glow-cyan scale-110 ring-2 ring-cyan-300'
                                : isAnswered
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-900/60'
                                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                    {level1Status.remaining > 0 && (
                      <button onClick={() => setCurrentQuestionIndex(level1Status.unansweredIndexes[0])} className="mt-3 text-xs text-amber-300 underline">
                        Go to first unanswered question ({level1Status.remaining} remaining)
                      </button>
                    )}
                  </div>
                </div>

                {/* Question display stays focused on the challenge prompt. */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c1427] via-[#0f172a] to-[#070b14] border-2 border-cyan-500/40 shadow-glow-cyan space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                    <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>QUESTION {currentQuestionIndex + 1}: {currentL1Challenge.title}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-relaxed tracking-wide font-sans">
                    {currentL1Challenge.question || currentL1Challenge.missionBrief}
                  </h2>
                </div>

                {/* 4 Selectable Options Cards (NO answers/explanations shown before submission!) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(currentL1Challenge.options || []).map((opt, optIdx) => {
                    const isSelected = currentSelectedOptionId === opt.id;
                    const optionLetter = ['A', 'B', 'C', 'D'][optIdx] || `${optIdx + 1}`;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        aria-pressed={isSelected}
                        className={`p-5 sm:p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-400 shadow-glow-cyan scale-[1.01]'
                            : 'bg-[#0f172a] border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm transition-colors ${
                              isSelected
                                ? 'bg-cyan-400 text-black shadow-glow-cyan'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {optionLetter}
                          </span>
                          <span className="font-sans font-extrabold text-lg sm:text-xl text-white tracking-wide">
                            {opt.text}
                          </span>
                        </div>

                        <div
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-400 text-black'
                              : 'border-slate-600 bg-slate-900'
                          }`}
                        >
                          {isSelected && <span className="text-xs font-black">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {quizError && <div role="alert" className="p-4 rounded-xl border border-rose-500/50 bg-rose-950/30 text-rose-200 flex justify-between gap-3"><span>{quizError}</span><button onClick={() => requestQuizSubmission(1)} disabled={submittingQuiz} className="underline font-bold">Retry</button></div>}

                {/* Quiz Navigation Buttons (Previous, Next, Submit) */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    className={`w-full sm:w-auto px-6 py-3 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                      currentQuestionIndex === 0
                        ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous Question</span>
                  </button>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {currentQuestionIndex < (level1Challenges.length - 1) ? (
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl font-mono font-bold text-xs bg-slate-800 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-950 transition-colors flex items-center justify-center gap-2"
                      >
                        <span>Next Question</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : null}

                    <button
                      disabled={submittingQuiz}
                      onClick={() => requestQuizSubmission(1)}
                      className={`w-full sm:w-auto px-8 py-3 rounded-xl font-mono font-bold text-xs shadow-glow-cyan flex items-center justify-center gap-2 transition-all transform hover:scale-105 ${
                        level1Status.remaining === 0 && level1Challenges.length > 0
                          ? 'bg-emerald-400 hover:bg-emerald-300 text-black'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                      }`}
                    >
                      {submittingQuiz ? (
                        <span>Processing Score...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            REVIEW LEVEL 1 QUIZ ({level1Status.answered}/{level1Challenges.length})
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ==================================================================== */
              /* QUIZ RESULTS & DETAILED REVIEW WITH REVISE FEATURE                   */
              /* ==================================================================== */
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Score Summary Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0c1427] via-[#0f172a] to-cyan-950/30 border-2 border-cyan-500/50 shadow-2xl space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                        QUIZ RESULTS • LEVEL 01 COMPLETE
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                        {(quizResult?.percentage ?? 0) >= 70 ? 'OUTSTANDING PERFORMANCE! 🏆' : 'FOUNDATION QUIZ SUBMITTED'}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
                        Review your answers below. For any missed questions, study the data structure summary to strengthen your fundamentals.
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Big Score Box */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-cyan-950/80 border border-cyan-400 text-center shadow-glow-cyan min-w-[120px]">
                        <div className="text-3xl sm:text-4xl font-black text-white font-mono">
                          {quizResult?.percentage}%
                        </div>
                        <div className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider font-bold mt-0.5">
                          FINAL SCORE
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-center min-w-[120px]">
                        <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                          +{quizResult?.earnedXp}
                        </div>
                        <div className="text-[10px] font-mono text-amber-300 uppercase tracking-wider font-bold mt-0.5">
                          XP EARNED
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3 Metrics: Correct, Wrong, Level Unlock */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                    <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-lg font-black text-emerald-300">
                          {quizResult?.correctCount} / {quizResult?.totalQuestions}
                        </div>
                        <div className="text-slate-400 text-[11px]">Correct Answers</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                      <div>
                        <div className="text-lg font-black text-rose-300">
                          {quizResult?.incorrectCount} / {quizResult?.totalQuestions}
                        </div>
                        <div className="text-slate-400 text-[11px]">Wrong Questions</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-indigo-400 shrink-0" />
                      <div>
                        <div className="text-sm font-black text-indigo-300">
                          {quizResult?.newlyUnlockedLevel ? 'Level 02 Unlocked!' : 'Foundation Tested'}
                        </div>
                        <div className="text-slate-400 text-[11px]">Progress Status</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter Tabs for Review */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="text-lg font-black text-white font-mono uppercase tracking-wide">
                    Question-by-Question Review
                  </h3>

                  {quizResult?.submissionId && <button type="button" onClick={() => navigate(`/results/${encodeURIComponent(quizResult.submissionId!)}`)} className="rounded-xl border border-cyan-500/40 px-3 py-2 text-xs font-mono font-bold text-cyan-200 hover:bg-cyan-950/40">Open saved review</button>}

                  <div className="flex items-center gap-1.5 bg-[#0f172a] p-1 rounded-xl border border-slate-800 font-mono text-xs">
                    <button
                      onClick={() => setFilterReview('all')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        filterReview === 'all'
                          ? 'bg-cyan-500 text-black shadow-glow-cyan'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({quizResult?.reviews?.length || 0})
                    </button>
                    <button
                      onClick={() => setFilterReview('wrong')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        filterReview === 'wrong'
                          ? 'bg-rose-500 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Wrong ({quizResult?.incorrectCount || 0})
                    </button>
                    <button
                      onClick={() => setFilterReview('right')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        filterReview === 'right'
                          ? 'bg-emerald-500 text-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Right ({quizResult?.correctCount || 0})
                    </button>
                  </div>
                </div>

                {/* Review Cards List */}
                <div className="space-y-4">
                  {reviewsToDisplay.map((rev: any, idx: number) => {
                    return (
                      <div
                        key={rev.challengeId}
                        className={`p-6 rounded-2xl border-2 transition-all space-y-4 ${
                          rev.isCorrect
                            ? 'bg-[#0f172a]/90 border-emerald-500/40 shadow-lg'
                            : 'bg-[#13111c] border-rose-500/50 shadow-xl'
                        }`}
                      >
                        {/* Top: Status & Question title */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2">
                            {rev.isCorrect ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                CORRECT
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                                <XCircle className="w-3.5 h-3.5" />
                                INCORRECT
                              </span>
                            )}
                            <span className="text-xs font-mono text-slate-400 font-semibold">
                              {rev.title}
                            </span>
                          </div>

                          {/* Study / Revise Button for that structure! */}
                          <button
                            onClick={() => handleOpenRevision(rev.structureId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 font-mono text-xs font-bold transition-transform hover:scale-105"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Study / Revise {rev.structureName}</span>
                          </button>
                        </div>

                        {/* Question Text */}
                        <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                          {rev.question}
                        </p>

                        {/* User Answer vs Correct Answer */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                          <div
                            className={`p-3.5 rounded-xl border ${
                              rev.isCorrect
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              Your Selected Choice:
                            </span>
                            <span className="font-bold text-sm">{rev.selectedOptionText}</span>
                          </div>

                          {!rev.isCorrect && (
                            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                Correct Architecture:
                              </span>
                              <span className="font-bold text-sm">{rev.correctOptionText}</span>
                            </div>
                          )}
                        </div>

                        {/* Rationale & Explanation */}
                        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-300 space-y-1">
                          <span className="font-mono text-cyan-400 font-bold uppercase text-[11px] block">
                            Architectural Rationale:
                          </span>
                          <p className="leading-relaxed">
                            {rev.explanation || rev.correctExplanation}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setAnswers({});
                      submissionCompleted.current = false;
                      submissionIdRef.current = null;
                      clearSubmissionId(1);
                      setQuizSubmitted(false);
                      setQuizResult(null);
                      setCurrentQuestionIndex(0);
                      setFilterReview('all');
                      setQuizError(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors w-full sm:w-auto justify-center"
                  >
                    <RotateCcw className="w-4 h-4 text-cyan-400" />
                    <span>Retake Level 1 Quiz</span>
                  </button>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => navigate('/challenges')}
                      className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-mono font-bold transition-colors w-full sm:w-auto justify-center"
                    >
                      Mission Hub
                    </button>
                    <button
                      onClick={() => navigate('/challenges?level=2')}
                      className="px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold shadow-glow-cyan flex items-center justify-center gap-2 transition-transform hover:scale-105 w-full sm:w-auto"
                    >
                      <span>PROCEED TO LEVEL 02</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================================================================== */}
        {/* LEVEL 2: SEQUENTIAL QUIZ */}
        {isLevel2 && <div className="space-y-6">
          {!level2Submitted ? <>
            <div className="p-6 rounded-3xl bg-[#0f172a]/95 border border-indigo-500/30 space-y-5"><div className="flex justify-between text-xs font-mono"><div><span className="text-indigo-400 font-bold">LEVEL 02 TRADE-OFF QUIZ</span><h1 className="text-xl font-black text-white mt-1">Question {currentQuestionIndex + 1} of {level2Challenges.length}</h1></div><span className="text-slate-400">{level2Status.answered}/{level2Challenges.length} answered · {level2Status.remaining} remaining</span></div><div className="flex flex-wrap gap-2">{level2Challenges.map((q,i)=><button key={q.id} aria-label={`Go to question ${i + 1}${isAnswerValid(q, level2Answers[q.id], 2) ? ', answered' : ', unanswered'}`} onClick={()=>setCurrentQuestionIndex(i)} className={`w-9 h-9 rounded-xl font-mono text-xs font-bold ${i===currentQuestionIndex?'bg-indigo-400 text-black':isAnswerValid(q, level2Answers[q.id], 2)?'bg-indigo-950 text-indigo-300 border border-indigo-500/50':'bg-slate-900 text-slate-400 border border-slate-800'}`}>{i+1}</button>)}</div>{level2Status.remaining > 0 && <button onClick={() => setCurrentQuestionIndex(level2Status.unansweredIndexes[0])} className="text-xs text-amber-300 underline">Go to first unanswered question ({level2Status.remaining} remaining)</button>}</div>
            {level2Challenges[currentQuestionIndex] && (()=>{const q=level2Challenges[currentQuestionIndex];return <><div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c1427] via-[#0f172a] to-[#070b14] border-2 border-indigo-500/40 space-y-4"><div className="text-xs font-mono font-bold uppercase text-indigo-400"><HelpCircle className="inline w-4 h-4"/> MISSION {q.title.match(/Mission\s+(\d+)/i)?.[1] || q.id} • QUESTION {currentQuestionIndex+1} OF {level2Challenges.length}</div><h2 className="text-xl sm:text-2xl font-black text-white">{q.title}</h2><p className="text-base sm:text-lg text-slate-200 leading-relaxed">{q.question||q.missionBrief}</p></div><div className="grid sm:grid-cols-2 gap-4">{q.availableStructures.map((s,i)=>{const selected=level2Answers[q.id]===s;return <button key={s} onClick={()=>setLevel2Answers(prev=>({...prev,[q.id]:s}))} className={`p-5 rounded-2xl border-2 flex items-center gap-4 text-left ${selected?'bg-indigo-950/60 border-indigo-400':'bg-[#0f172a] border-slate-800 hover:border-indigo-500/40'}`}><span className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold ${selected?'bg-indigo-400 text-black':'bg-slate-800 text-slate-300'}`}>{['A','B','C','D','E','F','G','H','I'][i]}</span><span className="font-extrabold text-lg text-white">{s.replaceAll('-',' ').toUpperCase()}</span>{selected&&<CheckCircle2 className="ml-auto w-5 h-5 text-indigo-300"/>}</button>})}</div></>})()}
            {quizError&&<div role="alert" className="p-4 rounded-xl border border-rose-500/50 bg-rose-950/30 text-rose-200 flex justify-between"><span>{quizError}</span><button onClick={() => requestQuizSubmission(2)} disabled={submittingLevel2} className="underline font-bold">Retry</button></div>}
            <div className="flex justify-between gap-3"><button disabled={!currentQuestionIndex} onClick={()=>setCurrentQuestionIndex(i=>Math.max(0,i-1))} className="px-6 py-3 rounded-xl bg-slate-800 text-slate-200 disabled:opacity-40">← Previous Question</button><div className="flex gap-3">{currentQuestionIndex<level2Challenges.length-1&&<button onClick={()=>setCurrentQuestionIndex(i=>i+1)} className="px-6 py-3 rounded-xl bg-slate-800 text-indigo-300">Next Question →</button>}<button disabled={submittingLevel2||!level2Challenges.length} onClick={()=>requestQuizSubmission(2)} className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-mono font-bold disabled:opacity-50">{submittingLevel2?'Submitting…':`REVIEW QUIZ (${level2Status.answered}/${level2Challenges.length})`}</button></div></div>
          </> : level2Result&&<div className="space-y-8"><div className="p-6 sm:p-8 rounded-3xl bg-[#0f172a] border-2 border-indigo-500/50 space-y-6"><div className="flex justify-between items-center border-b border-slate-800 pb-5"><div><span className="text-xs font-mono text-indigo-400 font-bold">LEVEL 02 COMPLETE</span><h2 className="text-2xl font-black text-white mt-1">{level2Result.percentage>=70?'QUIZ PASSED':'QUIZ NEEDS IMPROVEMENT'}</h2><p className="text-sm text-slate-300">LEVEL 2 QUIZ SUBMITTED</p></div><div className="text-right"><div className="text-3xl font-black text-white">{level2Result.score}%</div><div className="text-amber-400">+{level2Result.earnedXp} XP</div></div></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">{[['Correct',`${level2Result.correctCount}/${level2Result.totalQuestions}`],['Incorrect',`${level2Result.incorrectCount}/${level2Result.totalQuestions}`],['Total Questions',level2Result.totalQuestions],['Percentage',`${level2Result.percentage}%`]].map(([label,value])=><div key={label} className="p-4 rounded-xl bg-slate-900 border border-slate-700"><div className="text-lg font-black text-white">{value}</div><div className="text-slate-400">{label}</div></div>)}</div></div>
            <div className="flex justify-between items-center flex-wrap gap-3"><h3 className="text-lg font-black text-white font-mono uppercase">Question-by-Question Review</h3><div className="flex flex-wrap items-center gap-2"><div className="flex gap-1 bg-[#0f172a] p-1 rounded-xl border border-slate-800 font-mono text-xs">{(['all','wrong','right'] as const).map(f=>{const n=f==='all'?level2Result.reviews.length:f==='wrong'?level2Result.incorrectCount:level2Result.correctCount;return <button key={f} onClick={()=>setFilterLevel2Review(f)} className={`px-3 py-1 rounded-lg font-bold ${filterLevel2Review===f?'bg-indigo-500 text-black':'text-slate-400'}`}>{f.toUpperCase()} ({n})</button>})}</div>{level2Result.submissionId&&<button type="button" onClick={()=>navigate(`/results/${encodeURIComponent(level2Result.submissionId!)}`)} className="rounded-xl border border-cyan-500/40 px-3 py-2 text-xs font-mono font-bold text-cyan-200">Open saved review</button>}</div></div>
            <div className="space-y-4">{level2ReviewsToDisplay.map(r=><div key={r.challengeId} className={`p-6 rounded-2xl border-2 space-y-4 ${r.isCorrect?'bg-[#0f172a] border-emerald-500/40':'bg-[#13111c] border-rose-500/50'}`}><div className="flex gap-2 border-b border-slate-800 pb-3"><span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${r.isCorrect?'bg-emerald-950 text-emerald-300':'bg-rose-950 text-rose-300'}`}>{r.isCorrect?'CORRECT':'INCORRECT'}</span><span className="text-xs font-mono text-slate-400">{r.title}</span></div><p className="font-bold text-white">{r.question}</p><div className="grid sm:grid-cols-2 gap-3 font-mono text-xs"><div className="p-3.5 rounded-xl border bg-slate-900 text-slate-200"><span className="block text-[10px] uppercase text-slate-400">Your selected choice:</span><strong className="text-sm">{r.selectedOptionText}</strong></div>{!r.isCorrect&&<div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300"><span className="block text-[10px] uppercase text-slate-400">Correct answer:</span><strong className="text-sm">{r.correctOptionText}</strong></div>}</div><div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300"><span className="font-mono text-indigo-400 font-bold uppercase text-[11px] block">Why:</span>{r.explanation}</div></div>)}</div>
            <div className="flex justify-between gap-3 pt-5 border-t border-slate-800"><button onClick={()=>{submissionCompleted.current=false;submissionIdRef.current=null;clearSubmissionId(2);setLevel2Answers({});setLevel2Result(null);setLevel2Submitted(false);setCurrentQuestionIndex(0);setFilterLevel2Review('all');setQuizError(null)}} className="px-6 py-3 rounded-xl bg-slate-800 text-slate-200 text-xs font-mono font-bold"><RotateCcw className="inline w-4 h-4 text-indigo-400"/> RETAKE LEVEL 2 QUIZ</button><div className="flex gap-3"><button onClick={()=>navigate('/challenges')} className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-bold">MISSION HUB</button>{level2Result.progress.unlockedLevel>=3&&<button onClick={()=>navigate('/challenges?level=3')} className="px-6 py-3 rounded-xl bg-indigo-500 text-white text-xs font-mono font-bold">PROCEED TO LEVEL 03 <ArrowRight className="inline w-4 h-4"/></button>}</div></div>
          </div>}
        </div>}

        {/* LEVELS 3 & 4: SERVER-SCORED MULTI-SELECT QUIZZES */}
        {isAdvancedLevel && <div className="space-y-6">
          {!advancedSubmitted ? <>
            <div className="p-6 rounded-3xl bg-[#0f172a]/95 border border-purple-500/30 space-y-5">
              <div className="flex justify-between text-xs font-mono"><div><span className="text-purple-300 font-bold">LEVEL 0{challenge.level}: {challenge.level === 3 ? 'HYBRID DESIGNER' : 'OPTIMIZATION ARCHITECT'}</span><h1 className="text-xl font-black text-white mt-1">Question {currentQuestionIndex + 1} of {advancedChallenges.length}</h1></div><span className="text-slate-400">{advancedStatus.answered}/{advancedChallenges.length} answered · {advancedStatus.remaining} remaining</span></div>
              <div className="flex flex-wrap gap-2">{advancedChallenges.map((item, index) => <button key={item.id} aria-label={`Go to question ${index + 1}${isAnswerValid(item, advancedAnswers[item.id], challenge.level) ? ', answered' : ', unanswered'}`} onClick={() => setCurrentQuestionIndex(index)} className={`w-9 h-9 rounded-xl font-mono text-xs font-bold ${index === currentQuestionIndex ? 'bg-purple-300 text-black ring-2 ring-purple-200' : isAnswerValid(item, advancedAnswers[item.id], challenge.level) ? 'bg-purple-950 text-purple-200 border border-purple-500/50' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>{index + 1}</button>)}</div>
              {advancedStatus.remaining > 0 && <button onClick={() => setCurrentQuestionIndex(advancedStatus.unansweredIndexes[0])} className="text-xs text-amber-300 underline">Go to first unanswered question ({advancedStatus.remaining} remaining)</button>}
            </div>
            {advancedChallenges[currentQuestionIndex] && (() => { const item = advancedChallenges[currentQuestionIndex]; const selected = advancedAnswers[item.id] || []; return <>
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c1427] via-[#0f172a] to-[#070b14] border-2 border-purple-500/40 space-y-4"><div className="text-xs font-mono font-bold uppercase text-purple-300"><HelpCircle className="inline w-4 h-4"/> MISSION {item.title.match(/Mission\s+(\d+)/i)?.[1] || item.id} • QUESTION {currentQuestionIndex + 1} OF {advancedChallenges.length}</div><h2 className="text-xl sm:text-2xl font-black text-white">{item.title}</h2><p className="text-base sm:text-lg text-slate-200 leading-relaxed">{item.question || item.missionBrief}</p><p className="text-sm font-bold text-white">Which data structures should be used?</p><p className="font-mono text-xs font-bold text-purple-300">SELECT ALL THAT APPLY</p><div className="space-y-2"><p className="text-[10px] uppercase font-mono font-bold text-slate-400">Mission requirements</p>{item.requirements.map(requirement => <div key={requirement.id} className="text-xs text-slate-300"><span className="text-purple-300">•</span> {requirement.label}: {requirement.description}</div>)}</div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{item.availableStructures.map((structure, index) => { const isSelected = selected.includes(structure); return <button key={structure} type="button" aria-pressed={isSelected} onClick={() => setAdvancedAnswers(previous => ({ ...previous, [item.id]: isSelected ? selected.filter(value => value !== structure) : [...selected, structure] }))} className={`p-4 rounded-2xl border-2 flex items-center gap-4 text-left transition-all ${isSelected ? 'bg-purple-950/60 border-purple-400 shadow-glow-indigo' : 'bg-[#0f172a] border-slate-800 hover:border-purple-500/40'}`}><span className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold ${isSelected ? 'bg-purple-300 text-black' : 'bg-slate-800 text-slate-300'}`}>{isSelected ? '✓' : String.fromCharCode(65 + index)}</span><span className="font-extrabold text-base sm:text-lg text-white">{structure.replaceAll('-', ' ').toUpperCase()}</span></button>; })}</div>
            </>; })()}
            {quizError && <div role="alert" className="p-4 rounded-xl border border-rose-500/50 bg-rose-950/30 text-rose-200 flex justify-between gap-3"><span>{quizError}</span><button onClick={() => requestQuizSubmission(challenge.level)} disabled={submittingAdvanced} className="underline font-bold">Retry</button></div>}
            <div className="flex justify-between gap-3"><button disabled={!currentQuestionIndex} onClick={() => setCurrentQuestionIndex(index => Math.max(0, index - 1))} className="px-5 py-3 rounded-xl bg-slate-800 text-slate-200 disabled:opacity-40">← Previous Question</button><div className="flex gap-3">{currentQuestionIndex < advancedChallenges.length - 1 && <button onClick={() => setCurrentQuestionIndex(index => index + 1)} className="px-5 py-3 rounded-xl bg-slate-800 text-purple-200">Next Question →</button>}<button disabled={submittingAdvanced || !advancedChallenges.length} onClick={() => requestQuizSubmission(challenge.level)} className="px-5 py-3 rounded-xl bg-purple-500 text-white font-mono font-bold disabled:opacity-50">{submittingAdvanced ? 'Submitting…' : `REVIEW QUIZ (${advancedStatus.answered}/${advancedChallenges.length})`}</button></div></div>
          </> : advancedResult && <div className="space-y-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0f172a] border-2 border-purple-500/50 space-y-6"><div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-800 pb-5"><div><span className="text-xs font-mono text-purple-300 font-bold">LEVEL 0{challenge.level} COMPLETE</span><h2 className="text-2xl font-black text-white mt-1">{challenge.level === 3 ? 'HYBRID DESIGNER QUIZ SUBMITTED' : 'OPTIMIZATION ARCHITECT CHALLENGE SUBMITTED'}</h2></div><div className="text-right"><div className="text-3xl font-black text-white">{advancedResult.percentage}%</div><div className="text-[10px] text-purple-300 font-mono">FINAL SCORE</div><div className="text-amber-400 font-mono">+{advancedResult.earnedXp} XP</div></div></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">{[['Correct', advancedResult.correctCount], ['Partial', advancedResult.partialCount], ['Incorrect', advancedResult.incorrectCount], ['Total Questions', advancedResult.totalQuestions]].map(([label, value]) => <div key={label} className="p-4 rounded-xl bg-slate-900 border border-slate-700"><div className="text-lg font-black text-white">{value} / {advancedResult.totalQuestions}</div><div className="text-slate-400">{label}</div></div>)}</div></div>
            <div className="flex justify-between items-center flex-wrap gap-3"><h3 className="text-lg font-black text-white font-mono uppercase">Question-by-Question Review</h3><div className="flex flex-wrap items-center gap-2"><div className="flex flex-wrap gap-1 bg-[#0f172a] p-1 rounded-xl border border-slate-800 font-mono text-xs">{(['all', 'wrong', 'partial', 'right'] as const).map(filter => { const count = filter === 'all' ? advancedResult.reviews.length : filter === 'wrong' ? advancedResult.incorrectCount : filter === 'partial' ? advancedResult.partialCount : advancedResult.correctCount; return <button key={filter} onClick={() => setFilterAdvancedReview(filter)} className={`px-3 py-1 rounded-lg font-bold ${filterAdvancedReview === filter ? 'bg-purple-400 text-black' : 'text-slate-400'}`}>{filter.toUpperCase()} ({count})</button>; })}</div>{advancedResult.submissionId&&<button type="button" onClick={()=>navigate(`/results/${encodeURIComponent(advancedResult.submissionId!)}`)} className="rounded-xl border border-cyan-500/40 px-3 py-2 text-xs font-mono font-bold text-cyan-200">Open saved review</button>}</div></div>
            <div className="space-y-4">{advancedReviewsToDisplay.map(review => <div key={review.challengeId} className={`p-6 rounded-2xl border-2 space-y-4 ${review.status === 'correct' ? 'bg-[#0f172a] border-emerald-500/40' : review.status === 'partial' ? 'bg-[#111525] border-amber-500/50' : 'bg-[#13111c] border-rose-500/50'}`}><div className="flex flex-wrap justify-between gap-2 border-b border-slate-800 pb-3"><div className="flex items-center gap-2"><span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${review.status === 'correct' ? 'bg-emerald-950 text-emerald-300' : review.status === 'partial' ? 'bg-amber-950 text-amber-300' : 'bg-rose-950 text-rose-300'}`}>{review.status?.toUpperCase()}</span><span className="text-xs font-mono text-slate-400">{review.title}</span></div><span className="font-mono text-white font-bold">SCORE: {review.score?.toFixed(2)}%</span></div><p className="text-sm text-slate-300">{review.scenario || review.question}</p><div className="grid sm:grid-cols-2 gap-4"><div><h4 className="text-[10px] font-mono text-slate-400 uppercase mb-2">Your selected structures</h4><div className="space-y-1">{(review.selectedStructures || []).map(structure => <p key={structure} className={review.invalidSelections?.includes(structure) ? 'text-rose-300 text-sm' : 'text-emerald-300 text-sm'}>{review.invalidSelections?.includes(structure) ? '✗' : '✓'} {structure.replaceAll('-', ' ').toUpperCase()}</p>)}{!review.selectedStructures?.length && <p className="text-slate-500 text-sm">No structures selected</p>}</div></div><div><h4 className="text-[10px] font-mono text-slate-400 uppercase mb-2">Correct structures</h4><div className="space-y-1">{(review.correctStructures || []).map(structure => <p key={structure} className="text-emerald-300 text-sm">✓ {structure.replaceAll('-', ' ').toUpperCase()}</p>)}</div></div></div>{Boolean(review.missingStructures?.length) && <p className="text-amber-300 text-xs"><strong>Missing:</strong> {review.missingStructures?.map(item => item.replaceAll('-', ' ').toUpperCase()).join(', ')}</p>}{Boolean(review.invalidSelections?.length) && <p className="text-rose-300 text-xs"><strong>Unneeded selections:</strong> {review.invalidSelections?.map(item => item.replaceAll('-', ' ').toUpperCase()).join(', ')}</p>}<div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300"><span className="font-mono text-purple-300 font-bold uppercase text-[11px] block">Why / optimization reasoning</span>{review.explanation}</div><details className="text-xs text-slate-400"><summary className="cursor-pointer font-mono">Requirements</summary><ul className="list-disc pl-5 pt-2 space-y-1">{review.requirements?.map(requirement => <li key={requirement.id}>{requirement.label}: {requirement.description}</li>)}</ul></details></div>)}</div>
            <div className="flex justify-between gap-3 pt-5 border-t border-slate-800"><button onClick={() => { submissionCompleted.current=false;submissionIdRef.current=null;clearSubmissionId(challenge.level);setAdvancedAnswers({}); setAdvancedResult(null); setAdvancedSubmitted(false); setCurrentQuestionIndex(0); setFilterAdvancedReview('all'); setQuizError(null); }} className="px-6 py-3 rounded-xl bg-slate-800 text-slate-200 text-xs font-mono font-bold"><RotateCcw className="inline w-4 h-4 text-purple-300"/> RETAKE LEVEL {challenge.level}</button><div className="flex gap-3"><button onClick={() => navigate('/challenges')} className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-bold">MISSION HUB</button>{challenge.level === 3 && advancedResult.progress.unlockedLevel >= 4 && <button onClick={() => navigate('/challenges?level=4')} className="px-6 py-3 rounded-xl bg-purple-500 text-white text-xs font-mono font-bold">PROCEED TO LEVEL 04 <ArrowRight className="inline w-4 h-4"/></button>}</div></div>
          </div>}
        </div>}

      </div>

      {confirmSubmitLevel !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="quiz-submit-title" className="w-full max-w-lg rounded-2xl border border-cyan-500/40 bg-[#0f172a] p-6 shadow-2xl space-y-4">
            <h2 id="quiz-submit-title" className="text-xl font-black text-white">Confirm final submission</h2>
            <p className="text-sm text-slate-300">You answered every question in Level {confirmSubmitLevel}. Submit now to calculate your result and save your progress?</p>
            <p className="text-xs text-slate-400">Once submitted, this attempt cannot be edited. You can review your answers before confirming.</p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <button type="button" onClick={() => setConfirmSubmitLevel(null)} disabled={submittingQuiz || submittingLevel2 || submittingAdvanced} className="px-5 py-3 rounded-xl bg-slate-800 text-slate-200 font-mono text-xs font-bold disabled:opacity-50">Back to quiz</button>
              <button type="button" onClick={confirmSubmitLevel === 1 ? handleSubmitLevel1Quiz : confirmSubmitLevel === 2 ? handleLevel2Submit : handleAdvancedSubmit} disabled={submittingQuiz || submittingLevel2 || submittingAdvanced} className="px-5 py-3 rounded-xl bg-emerald-400 text-slate-950 font-mono text-xs font-bold disabled:opacity-50">{submittingQuiz || submittingLevel2 || submittingAdvanced ? 'Submitting…' : 'Confirm and submit'}</button>
            </div>
          </section>
        </div>
      )}

      {/* ==================================================================== */}
      {/* REVISION MODAL / DRAWER                                              */}
      {/* ==================================================================== */}
      {reviseStructure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] border border-cyan-500/50 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative">
            <button
              onClick={() => setReviseStructure(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>QUICK REVISION CARD • {reviseStructure.category}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {reviseStructure.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {reviseStructure.shortDesc}
              </p>
            </div>

            {/* How It Works & Core Mechanism */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase block">
                Core Principle & Mechanism:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {reviseStructure.howItWorks || reviseStructure.description}
              </p>
            </div>

            {/* Time Complexity Grid */}
            {reviseStructure.timeComplexity && (
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-white block">
                  Time & Space Complexity Reference:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Search</span>
                    <span className="text-xs font-bold text-cyan-400">{reviseStructure.timeComplexity.search}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Insert</span>
                    <span className="text-xs font-bold text-emerald-400">{reviseStructure.timeComplexity.insert}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Delete</span>
                    <span className="text-xs font-bold text-amber-400">{reviseStructure.timeComplexity.delete}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">Space</span>
                    <span className="text-xs font-bold text-indigo-400">{reviseStructure.timeComplexity.space}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Real World Applications */}
            {reviseStructure.realWorldUse && (
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-300 space-y-1 font-sans">
                <span className="font-mono text-cyan-400 font-bold uppercase text-[11px] block">
                  Real-World Industry Applications:
                </span>
                <p className="leading-relaxed">{reviseStructure.realWorldUse}</p>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setReviseStructure(null)}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold shadow-glow-cyan transition-colors"
              >
                Close Revision Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
