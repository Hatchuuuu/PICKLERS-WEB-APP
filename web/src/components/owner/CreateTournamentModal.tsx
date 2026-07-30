"use client";

import { useState, useRef, useEffect } from 'react';
import { useTournamentStore } from '@/store/useTournamentStore';
import { useRouter } from 'next/navigation';

import { X, Search, Calendar, ChevronRight, ChevronLeft, User, Users, Check, ChevronDown, Trophy } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { PlayerAvatar } from '@/components/tournament/PlayerAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperTitle,
  StepperTrigger,
} from '@/components/ui/stepper';



interface Team {
    name: string;
    p1: string;
    p2: string;
}

const steps = [{ title: 'Details' }, { title: 'Roster' }, { title: 'Pairing' }];

function PremiumDatePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(() => value ? parseISO(value) : new Date());

    const selectedDate = value ? parseISO(value) : null;

    const daysInMonth = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth))
    });

    return (
        <div className="relative">
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl pl-11 pr-4 py-4 text-left text-[15px] font-semibold focus:outline-none focus-visible:ring-2 focus:ring-[#0BCE83]/50 transition-all flex items-center justify-between shadow-inner"
            >
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <span className={value ? "text-white" : "text-muted-foreground"}>
                    {value ? format(parseISO(value), 'MMMM d, yyyy') : 'mm/dd/yyyy'}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        
                        <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="absolute top-[calc(100%+8px)] left-0 right-0 bg-surface-overlay/90 backdrop-blur-xl border border-border/50 rounded-[24px] shadow-2xl z-50 p-4"
                        >
                            <div className="flex justify-between items-center mb-4 px-2">
                                <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-surface-interactive rounded-full transition-colors text-foreground"><ChevronLeft className="w-5 h-5" /></button>
                                <span className="text-[15px] font-bold text-white tracking-wide">{format(currentMonth, 'MMMM yyyy')}</span>
                                <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-surface-interactive rounded-full transition-colors text-foreground"><ChevronRight className="w-5 h-5" /></button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                    <div key={day} className="text-center text-[11px] font-black tracking-wider text-muted-foreground uppercase">{day}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {daysInMonth.map((day, i) => {
                                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                                    const isCurrentMonth = isSameMonth(day, currentMonth);
                                    const isToday = isSameDay(day, new Date());

                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                onChange(format(day, 'yyyy-MM-dd'));
                                                setIsOpen(false);
                                            }}
                                            className={cn(
                                                "aspect-square rounded-full flex items-center justify-center text-[15px] transition-all relative z-10",
                                                !isCurrentMonth ? "text-muted-foreground" : "text-slate-300 hover:text-white",
                                                isSelected && "text-[#0A1121] font-bold",
                                                isToday && !isSelected && "text-[#0BCE83] font-bold"
                                            )}
                                        >
                                            {isSelected && (
                                                <motion.div 
                                                    layoutId="selectedDay"
                                                    className="absolute inset-0 bg-[#0BCE83] rounded-full -z-10 shadow-[0_0_12px_rgba(11,206,131,0.4)]"
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            )}
                                            <span className="relative z-20">{format(day, 'd')}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function PremiumSelect({ value, onChange, options, labelMap }: { value: string | number, onChange: (val: string | number) => void, options: (string | number)[], labelMap?: Record<string | number, string> }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl px-4 py-3.5 text-left text-[15px] font-semibold focus:outline-none focus-visible:ring-2 focus:ring-[#0BCE83]/50 transition-all shadow-inner flex items-center justify-between"
            >
                <span className="text-white">{labelMap ? labelMap[value] : value}</span>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div 
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="absolute top-[calc(100%+8px)] left-0 right-0 bg-surface-overlay/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 p-2 flex flex-col gap-1"
                        >
                            {options.map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "px-4 py-3 rounded-xl text-left text-[15px] transition-all font-medium",
                                        value === opt 
                                            ? "bg-[#0BCE83]/10 text-[#0BCE83] font-bold shadow-sm border border-[#0BCE83]/20" 
                                            : "text-slate-300 hover:bg-white/10 hover:text-white border border-transparent"
                                    )}
                                >
                                    {labelMap ? labelMap[opt] : opt}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export function CreateTournamentModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const addTournament = useTournamentStore(state => state.addTournament);
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const FORMAT_LABELS: Record<string, string> = {
      single: "Single Elimination",
      double: "Double Elimination",
      round_robin: "Round Robin"
  };

  const [activeStep, setActiveStep] = useState(1);

  // Basic Info
  const [name, setName] = useState('');
  const [format, setFormat] = useState('single');
  const [date, setDate] = useState('');
  
  // Rules
  const [playType, setPlayType] = useState<'singles'|'doubles'>('doubles');
  const [capacity, setCapacity] = useState<number>(8);
  
  // Roster
  const [enrolledPlayers, setEnrolledPlayers] = useState<string[]>([]);
  const [poolSearchText, setPoolSearchText] = useState('');
  const [poolFocused, setPoolFocused] = useState(false);
  const poolTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pairing Logic
  const [pairingMode, setPairingMode] = useState<'auto' | 'manual'>('auto');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedToPair, setSelectedToPair] = useState<string | null>(null);

  useEffect(() => {
      return () => {
          if (poolTimeoutRef.current) clearTimeout(poolTimeoutRef.current);
      };
  }, []);

  // When capacity/playType changes, reset roster to avoid overflow
  useEffect(() => {
      const required = playType === 'doubles' ? capacity * 2 : capacity;
      if (enrolledPlayers.length > required) {
          setEnrolledPlayers(prev => prev.slice(0, required));
      }
      setTeams([]); 
  }, [capacity, playType]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setActiveStep(1);
      setName('');
      setDate('');
      setEnrolledPlayers([]);
      setTeams([]);
      setSelectedToPair(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const requiredPlayers = playType === 'doubles' ? capacity * 2 : capacity;
  const isRosterFull = enrolledPlayers.length === requiredPlayers;

  const handleAutoMix = () => {
      const shuffled = [...enrolledPlayers].sort(() => Math.random() - 0.5);
      const newTeams: Team[] = [];
      if (playType === 'doubles') {
          for (let i = 0; i < capacity; i++) {
              newTeams.push({
                  name: `Team ${i + 1}`,
                  p1: shuffled[i * 2] || '',
                  p2: shuffled[i * 2 + 1] || ''
              });
          }
      } else {
          for (let i = 0; i < capacity; i++) {
              newTeams.push({
                  name: shuffled[i] || `Player ${i + 1}`,
                  p1: shuffled[i] || '',
                  p2: ''
              });
          }
      }
      setTeams(newTeams);
  };

  const handleManualPairTap = (player: string) => {
      if (!selectedToPair) {
          setSelectedToPair(player);
      } else {
          if (selectedToPair === player) {
              setSelectedToPair(null);
              return;
          }
          setTeams(prev => [
              ...prev,
              { name: `Team ${prev.length + 1}`, p1: selectedToPair, p2: player }
          ]);
          setSelectedToPair(null);
      }
  };

  const handleUnpair = (teamIndex: number) => {
      setTeams(prev => prev.filter((_, i) => i !== teamIndex));
  };

  const unassignedPlayers = enrolledPlayers.filter(p => !teams.some(t => t.p1 === p || t.p2 === p));

  const isStep1Complete = !!name && !!date;
  const isStep2Complete = isRosterFull;
  const isStep3Complete = playType === 'singles' || (playType === 'doubles' && teams.length === capacity);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isStep1Complete || !isStep2Complete || !isStep3Complete) return;

    if (user?.isDemo || user?.role === "demo") {
      showToast("This is a demo — sign up to create tournaments for real!", "error");
      return;
    }

    const id = Date.now().toString();
    
    let finalTeams = teams;
    if (playType === 'singles') {
        finalTeams = enrolledPlayers.map(p => ({
            name: p,
            p1: p,
            p2: ''
        }));
    }

    const customTeamNames = finalTeams.map(t => t.name);

    addTournament(id, name, format, capacity, { 
        customTeamNames,
        teamsData: finalTeams,
        date,
        prize: '',
        playType,
        scoringFormat: 'BEST_OF_3_TO_11'
    });
    
    onClose();
    router.push(`/app/owner/tournaments/${id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0f1a]/80 backdrop-blur-md p-4 sm:p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-surface-base rounded-2xl shadow-2xl border border-border w-full max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="px-6 py-5 flex justify-between items-center bg-surface-base z-20 shrink-0 border-b border-border">
            <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                Create Tournament
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-interactive transition-colors text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide flex flex-col">
          <Stepper value={activeStep} onValueChange={setActiveStep} className="space-y-8 flex flex-col h-full">
            <StepperNav className="gap-3.5 shrink-0">
                {steps.map((step, index) => {
                  const stepNum = index + 1;
                  const isCompleted = 
                    (stepNum === 1 && isStep1Complete) || 
                    (stepNum === 2 && isStep2Complete) ||
                    (stepNum === 3 && isStep3Complete);
                    
                  return (
                    <StepperItem key={index} step={stepNum} completed={activeStep > stepNum || isCompleted} className="relative flex-1 items-start">
                      <StepperTrigger className="flex flex-col items-start justify-center gap-3.5 grow pointer-events-none">
                          <StepperIndicator className="bg-border rounded-full h-1.5 w-full data-[state=active]:bg-[#0BCE83] data-[state=completed]:bg-[#0BCE83] transition-colors overflow-hidden relative">
                              <div className="absolute inset-0" />
                          </StepperIndicator>
                          <div className="flex flex-col items-start gap-1">
                              <StepperTitle className="text-start text-xs font-bold uppercase tracking-wider text-muted-foreground group-data-[state=active]/step:text-white group-data-[state=completed]/step:text-[#0BCE83] transition-colors">
                                  {step.title}
                              </StepperTitle>
                          </div>
                      </StepperTrigger>
                    </StepperItem>
                  );
                })}
            </StepperNav>

            <StepperPanel className="flex-1">
                {/* STEP 1: Basic Details */}
                <StepperContent value={1} className="flex flex-col gap-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Tournament Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Summer Smash 2026"
                            className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl px-4 py-4 text-white text-[15px] font-semibold focus:outline-none focus-visible:ring-2 focus:ring-[#0BCE83]/50 transition-all placeholder:text-muted-foreground shadow-inner"
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Date</label>
                        <PremiumDatePicker value={date} onChange={setDate} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Play Type</label>
                        <div className="flex gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                            {['doubles', 'singles'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setPlayType(type as 'singles'|'doubles');
                                        setPairingMode('auto');
                                    }}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200 relative z-10",
                                        playType === type 
                                            ? "bg-white dark:bg-[#1E293B] text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/5" 
                                            : "text-muted-foreground hover:text-foreground border border-transparent"
                                    )}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {type === 'singles' ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                        {type}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </StepperContent>

                {/* STEP 2: Format & Roster */}
                <StepperContent value={2} className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Format</label>
                            <PremiumSelect 
                                value={format} 
                                onChange={(val) => setFormat(val as string)} 
                                options={['single', 'double', 'round_robin']} 
                                labelMap={FORMAT_LABELS} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                {playType === 'doubles' ? 'How Many Teams' : 'How Many Players'}
                            </label>
                            <input 
                                type="number" 
                                min="2"
                                placeholder="e.g. 12"
                                className="w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl px-4 py-3.5 text-white text-[15px] font-semibold focus:outline-none focus-visible:ring-2 focus:ring-[#0BCE83]/50 transition-all placeholder:text-muted-foreground shadow-inner"
                                value={capacity || ''} 
                                onChange={e => setCapacity(parseInt(e.target.value) || 0)} 
                            />
                        </div>
                    </div>

                    <div className="h-px bg-border my-1" />

                    <div>
                        <div className="flex justify-between items-end mb-3">
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Tournament Roster
                            </label>
                            <span className={cn(
                                "text-xs font-black tracking-wider px-2.5 py-1 rounded-full",
                                isRosterFull ? "bg-[#0BCE83]/20 text-[#0BCE83]" : "bg-surface-interactive text-muted-foreground"
                            )}>
                                {enrolledPlayers.length} / {requiredPlayers}
                            </span>
                        </div>
                        
                        <div className="relative mb-4">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input 
                                type="text" 
                                disabled={isRosterFull}
                                placeholder={isRosterFull ? "Roster is full!" : "Search Picklers Account..."}
                                className={cn(
                                    "w-full bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl pl-11 pr-4 py-3.5 text-white text-sm font-semibold focus:outline-none focus-visible:ring-2 focus:ring-[#0BCE83]/50 transition-all placeholder:text-muted-foreground shadow-inner",
                                    isRosterFull && "opacity-50 cursor-not-allowed"
                                )}
                                value={poolSearchText}
                                onFocus={() => setPoolFocused(true)}
                                onBlur={() => {
                                    poolTimeoutRef.current = setTimeout(() => setPoolFocused(false), 200);
                                }}
                                onChange={e => setPoolSearchText(e.target.value)}
                            />
                            
                            <AnimatePresence>
                                {poolFocused && !isRosterFull && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute top-[calc(100%+8px)] left-0 right-0 bg-surface-overlay border border-border rounded-2xl shadow-2xl z-[100] max-h-48 overflow-y-auto py-2"
                                    >
                                        {poolSearchText.trim().length > 0 && !enrolledPlayers.includes(poolSearchText.trim()) ? (
                                            <button 
                                                type="button"
                                                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold text-[#0BCE83] hover:bg-white/[0.05] transition-colors"
                                                onClick={() => { 
                                                    setEnrolledPlayers(prev => [...prev, poolSearchText.trim()]); 
                                                    setPoolSearchText('');
                                                    setPoolFocused(false); 
                                                }}
                                            >
                                                <div className="w-7 h-7 rounded-full bg-[#0BCE83]/20 flex items-center justify-center border border-[#0BCE83]/50">
                                                    +
                                                </div>
                                                Add player "{poolSearchText.trim()}"
                                            </button>
                                        ) : (
                                            <div className="px-5 py-4 text-sm text-muted-foreground text-center italic">
                                                {poolSearchText.trim().length === 0 ? "Type a name to add a player" : "Player already added"}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {enrolledPlayers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                <AnimatePresence>
                                    {enrolledPlayers.map(p => (
                                        <motion.div 
                                            layout
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            key={p} 
                                            className="flex items-center gap-2 bg-surface-interactive border border-border/50 pl-1 pr-1.5 py-1 rounded-full text-xs font-bold text-muted-foreground shadow-sm"
                                        >
                                            <PlayerAvatar teamName={p} teamType="SINGLES" size="sm" />
                                            <span>{p}</span>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setEnrolledPlayers(prev => prev.filter(x => x !== p));
                                                    setTeams([]);
                                                }}
                                                className="hover:bg-slate-700 rounded-full p-1 transition-colors text-muted-foreground hover:text-white"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </StepperContent>

                {/* STEP 3: Pairing Module */}
                <StepperContent value={3} className="flex flex-col gap-6">
                    {playType === 'singles' ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-[#0BCE83]/10 rounded-full flex items-center justify-center mb-4">
                                <Trophy className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Ready to Go!</h3>
                            <p className="text-sm text-muted-foreground">Your {capacity}-player singles tournament is fully configured and ready to be generated.</p>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                Team Pairing Mode
                            </label>
                            <div className="flex gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl mb-6">
                                {['auto', 'manual'].map((mode) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => {
                                            setPairingMode(mode as 'auto' | 'manual');
                                            setTeams([]);
                                            setSelectedToPair(null);
                                        }}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200 relative z-10",
                                            pairingMode === mode 
                                                ? "bg-white dark:bg-[#1E293B] text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/5" 
                                                : "text-muted-foreground hover:text-foreground border border-transparent"
                                        )}
                                    >
                                        {mode === 'auto' ? 'Auto-Mix' : 'Desired Teammates'}
                                    </button>
                                ))}
                            </div>

                            {pairingMode === 'auto' ? (
                                <div className="flex flex-col items-center justify-center p-8 bg-white/[0.02] rounded-3xl border border-white/[0.05] shadow-inner">
                                    <button
                                        type="button"
                                        onClick={handleAutoMix}
                                        className="px-6 py-3.5 bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold rounded-xl transition-all flex items-center gap-2 active:scale-95 shadow-lg"
                                    >
                                        🎲 Mix Teams Randomly
                                    </button>
                                    {teams.length === capacity && (
                                        <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-[#0BCE83] font-semibold mt-4">
                                            {capacity} Teams generated successfully!
                                        </motion.p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-xs font-medium text-muted-foreground bg-white/[0.02] p-3 rounded-lg border border-white/[0.05] text-center shadow-inner">
                                        Tap two players from the unassigned pool below to form a team.
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        <AnimatePresence>
                                            {unassignedPlayers.map(p => (
                                                <motion.button
                                                    layout
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0.8, opacity: 0 }}
                                                    key={p}
                                                    type="button"
                                                    onClick={() => handleManualPairTap(p)}
                                                    className={cn(
                                                        "flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full text-sm font-bold transition-all active:scale-95 shadow-sm",
                                                        selectedToPair === p 
                                                            ? "bg-[#0BCE83] text-[#0A1121] shadow-[0_4px_12px_rgba(11,206,131,0.3)] border border-[#0BCE83]/50"
                                                            : "bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] border border-white/[0.08]"
                                                    )}
                                                >
                                                    <PlayerAvatar teamName={p} teamType="SINGLES" size="sm" />
                                                    {p}
                                                </motion.button>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}

                            {teams.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <AnimatePresence>
                                        {teams.map((t, idx) => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                key={idx}
                                                className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.05] shadow-inner flex flex-col gap-2 relative group"
                                            >
                                                {pairingMode === 'manual' && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleUnpair(idx)}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <span className="text-[10px] font-black tracking-tight text-muted-foreground">{t.name}</span>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                                                        <PlayerAvatar teamName={t.p1} teamType="SINGLES" size="sm" />
                                                        <span className="truncate">{t.p1}</span>
                                                    </div>
                                                    {t.p2 && (
                                                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                                                            <PlayerAvatar teamName={t.p2} teamType="SINGLES" size="sm" />
                                                            <span className="truncate">{t.p2}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    )}
                </StepperContent>
            </StepperPanel>
          </Stepper>
        </div>

        {/* Bottom Action Bar */}
        <div className="px-6 py-4 bg-surface-base border-t border-border z-20 shrink-0 flex gap-3">
            {activeStep > 1 && (
                <button 
                    type="button"
                    onClick={() => setActiveStep(prev => prev - 1)}
                    className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] text-white font-bold transition-colors active:scale-95 shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            )}
            
            {activeStep < 3 ? (
                <button 
                    type="button"
                    onClick={() => setActiveStep(prev => prev + 1)}
                    disabled={activeStep === 1 ? !isStep1Complete : !isStep2Complete}
                    className={cn(
                        "flex-1 py-4 rounded-2xl font-black text-[15px] transition-all flex items-center justify-center gap-2",
                        (activeStep === 1 ? isStep1Complete : isStep2Complete)
                            ? "bg-[#0BCE83] text-[#0A1121] shadow-[0_10px_30px_rgba(11,206,131,0.25)] hover:shadow-[0_10px_40px_rgba(11,206,131,0.4)] hover:scale-[1.02] active:scale-[0.98]" 
                            : "bg-white/[0.03] text-slate-500 cursor-not-allowed border border-white/[0.05]"
                    )}
                >
                    Next Step <ChevronRight className="w-5 h-5" />
                </button>
            ) : (
                <button 
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isStep3Complete}
                    className={cn(
                        "flex-1 py-4 rounded-2xl font-black text-[15px] transition-all flex items-center justify-center gap-2 shadow-xl",
                        isStep3Complete
                            ? "bg-[#0BCE83] text-[#0A1121] shadow-[0_10px_30px_rgba(11,206,131,0.25)] hover:shadow-[0_10px_40px_rgba(11,206,131,0.4)] hover:scale-[1.02] active:scale-[0.98]" 
                            : "bg-white/[0.03] text-slate-500 cursor-not-allowed border border-white/[0.05]"
                    )}
                >
                    Create Tournament <Check className="w-5 h-5" />
                </button>
            )}
        </div>
      </motion.div>
    </div>
  );
}
