import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Code, 
  FileText, 
  CheckSquare, 
  List, 
  Bold, 
  Italic, 
  X,
  PlusCircle
} from 'lucide-react';

// Helper to get local date string in YYYY-MM-DD format (timezone independent)
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to parse local YYYY-MM-DD string into local Date object (timezone independent)
const parseLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const todayStr = getLocalDateString();

export default function App() {
  // --- STATE WITH DIRECT LOCALSTORAGE INITIALIZATION ---
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved'); // 'Saved' | 'Saving...'

  const [timeLogs, setTimeLogs] = useState(() => {
    const cachedLogs = localStorage.getItem('hypertrack_time_logs');
    if (cachedLogs !== null) {
      try {
        return JSON.parse(cachedLogs);
      } catch (e) {
        console.error("Failed to parse cached logs:", e);
        return [];
      }
    } else {
      // Default Mock Data for today to make it look stunning instantly
      return [
        {
          id: 'mock-1',
          pillar: 'dsa',
          duration: 4800, // 1h 20m
          date: todayStr,
          note: 'Solved 3 LeetCode questions on Graphs (DFS & BFS traversal pattern)',
          createdAt: new Date().toISOString()
        },
        {
          id: 'mock-2',
          pillar: 'development',
          duration: 9900, // 2h 45m
          date: todayStr,
          note: 'Implemented full Tailwind configuration, configured Vite server, and designed dashboard UI',
          createdAt: new Date().toISOString()
        },
        {
          id: 'mock-3',
          pillar: 'study',
          duration: 4200, // 1h 10m
          date: todayStr,
          note: 'Read Chapter 4 of Designing Data-Intensive Applications regarding replication strategies',
          createdAt: new Date().toISOString()
        }
      ];
    }
  });

  const [notes, setNotes] = useState(() => {
    const cachedNotes = localStorage.getItem('hypertrack_notes');
    if (cachedNotes !== null) {
      return cachedNotes;
    }
    return `# HyperTrack Scratchpad 🚀\n\n- [ ] Review LeetCode graph pattern sheet\n- [ ] Commit React state changes to main branch\n- [x] Align CSS variables for dark mode theme\n\n*Quick notes for today:* Keep up the grinding pace!`;
  });

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchIntervalRef = useRef(null);

  // Modal for Inject Description
  const [injectModal, setInjectModal] = useState({
    isOpen: false,
    pillar: null, // 'dsa' | 'development' | 'study'
    duration: 0,
    note: ''
  });

  // Manual input state for each pillar
  const [manualEntry, setManualEntry] = useState({
    dsa: { hours: '', minutes: '', note: '' },
    development: { hours: '', minutes: '', note: '' },
    study: { hours: '', minutes: '', note: '' }
  });

  // Date strip scrolling reference state (start of the 7-day window)
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3); // center on today
    return d;
  });

  // Sync Logs to localStorage on changes
  useEffect(() => {
    localStorage.setItem('hypertrack_time_logs', JSON.stringify(timeLogs));
  }, [timeLogs]);

  // Center week strip when selected date changes
  const centerWeekOnDate = (dateStr) => {
    const d = parseLocalDate(dateStr);
    d.setDate(d.getDate() - 3);
    setWeekStart(d);
  };

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
    centerWeekOnDate(dateStr);
  };

  // --- STOPWATCH LOGIC ---
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    }
    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    };
  }, [isStopwatchRunning]);

  const handleStopwatchStartPause = () => {
    setIsStopwatchRunning(!isStopwatchRunning);
  };

  const handleStopwatchReset = () => {
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
  };

  const handleInjectClick = (pillar) => {
    if (stopwatchTime === 0) return;
    setIsStopwatchRunning(false); // Pause stopwatch
    setInjectModal({
      isOpen: true,
      pillar,
      duration: stopwatchTime,
      note: ''
    });
  };

  const confirmInject = () => {
    const newLog = {
      id: Date.now().toString(),
      pillar: injectModal.pillar,
      duration: injectModal.duration,
      date: selectedDate,
      note: injectModal.note.trim() || 'Stopwatch injected session',
      createdAt: new Date().toISOString()
    };
    
    setTimeLogs((prev) => [newLog, ...prev]);
    setStopwatchTime(0); // Reset timer
    setInjectModal({ isOpen: false, pillar: null, duration: 0, note: '' });
  };

  const cancelInject = () => {
    setInjectModal({ isOpen: false, pillar: null, duration: 0, note: '' });
  };

  // --- MANUAL LOG ENTRY LOGIC ---
  const handleManualAdd = (pillar) => {
    const entry = manualEntry[pillar];
    const hours = parseInt(entry.hours) || 0;
    const minutes = parseInt(entry.minutes) || 0;
    const totalSeconds = (hours * 3600) + (minutes * 60);

    if (totalSeconds <= 0) return;

    const newLog = {
      id: Date.now().toString(),
      pillar,
      duration: totalSeconds,
      date: selectedDate,
      note: entry.note.trim() || 'Manual session entry',
      createdAt: new Date().toISOString()
    };

    setTimeLogs((prev) => [newLog, ...prev]);
    
    // Clear fields
    setManualEntry((prev) => ({
      ...prev,
      [pillar]: { hours: '', minutes: '', note: '' }
    }));
  };

  const handleManualChange = (pillar, field, value) => {
    setManualEntry((prev) => ({
      ...prev,
      [pillar]: {
        ...prev[pillar],
        [field]: value
      }
    }));
  };

  const handleDeleteCard = (id) => {
    setTimeLogs((prev) => prev.filter(log => log.id !== id));
  };

  // --- DATE STRIP GENERATOR ---
  const getDaysInStrip = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const shiftWeek = (offsetDays) => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + offsetDays);
      return d;
    });
  };

  // Check if a day has any logs per pillar
  const hasLogsForDateAndPillar = (dateStr, pillar) => {
    return timeLogs.some(log => log.date === dateStr && log.pillar === pillar);
  };

  // --- FORMATTING HELPERS ---
  const formatTimeDigits = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCardDuration = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }
    if (mins > 0) {
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    }
    return `${secs}s`;
  };

  const getColumnTotalHours = (pillar) => {
    const filtered = timeLogs.filter(log => log.pillar === pillar && log.date === selectedDate);
    const totalSecs = filtered.reduce((acc, log) => acc + log.duration, 0);
    if (totalSecs === 0) return '0h';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // --- NOTES MARKDOWN WIDGET LOGIC ---
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    setSaveStatus('Saving...');
    localStorage.setItem('hypertrack_notes', val);
    
    // Simulate auto-save feedback delay
    setTimeout(() => {
      setSaveStatus('Saved');
    }, 400);
  };

  const insertMarkdown = (syntax) => {
    const textarea = document.getElementById('notes-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const selected = text.substring(start, end);

    let replacement = '';
    let newCursorPos = start;

    switch (syntax) {
      case 'checkbox':
        replacement = `${before}\n- [ ] ${selected}${after}`;
        newCursorPos = start + 7 + selected.length;
        break;
      case 'bullet':
        replacement = `${before}\n- ${selected}${after}`;
        newCursorPos = start + 3 + selected.length;
        break;
      case 'bold':
        replacement = `${before}**${selected || 'bold'}**${after}`;
        newCursorPos = start + 2 + (selected ? selected.length : 4) + 2;
        break;
      case 'italic':
        replacement = `${before}*${selected || 'italic'}*${after}`;
        newCursorPos = start + 1 + (selected ? selected.length : 6) + 1;
        break;
      default:
        return;
    }

    setNotes(replacement);
    localStorage.setItem('hypertrack_notes', replacement);
    setSaveStatus('Saving...');
    
    setTimeout(() => {
      setSaveStatus('Saved');
    }, 400);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // --- PILLAR SPECIFICS ---
  const pillars = [
    {
      id: 'dsa',
      title: 'DSA',
      icon: <BookOpen size={18} className="text-emerald-400" />,
      colorClass: 'emerald',
      accentColor: '#10b981',
      glowClass: 'glass-panel-glow-dsa',
      headerBg: 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300',
      pillColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'development',
      title: 'Development',
      icon: <Code size={18} className="text-indigo-400" />,
      colorClass: 'indigo',
      accentColor: '#6366f1',
      glowClass: 'glass-panel-glow-dev',
      headerBg: 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300',
      pillColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    },
    {
      id: 'study',
      title: 'Study',
      icon: <Clock size={18} className="text-amber-400" />,
      colorClass: 'amber',
      accentColor: '#f59e0b',
      glowClass: 'glass-panel-glow-study',
      headerBg: 'bg-amber-950/40 border-amber-500/20 text-amber-300',
      pillColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    }
  ];

  return (
    <div className="relative min-h-screen font-sans bg-zinc-950 text-zinc-100 flex flex-col transition-all duration-300">
      
      {/* BACKGROUND DECORATIVE GLOWS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/3 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* HEADER SECTION */}
      <header className="border-b border-white/5 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Branding */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setSelectedDate(todayStr)}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles size={18} className="text-white animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              HyperTrack
            </span>
          </div>

          {/* Minimalist Date Picker Strip */}
          <div className="flex items-center space-x-2">
            
            {/* Shift Week Left */}
            <button 
              onClick={() => shiftWeek(-7)} 
              className="p-1.5 rounded-lg border border-white/5 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all"
              title="Previous Week"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Horizontal Timeline Strip */}
            <div className="hidden sm:flex items-center space-x-1 border border-white/5 bg-zinc-950 p-1 rounded-xl">
              {getDaysInStrip().map((day, idx) => {
                const dateStr = getLocalDateString(day);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayStr;
                const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = day.getDate();

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all ${
                      isSelected 
                        ? 'bg-zinc-800 text-white shadow-lg ring-1 ring-white/10' 
                        : isToday
                          ? 'border border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-semibold tracking-wider opacity-60">
                      {dayName}
                    </span>
                    <span className="text-sm font-bold mt-0.5 relative">
                      {dayNum}
                      {/* Check if logs exist for this date and render little colored dots */}
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex space-x-0.5">
                        {hasLogsForDateAndPillar(dateStr, 'dsa') && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                        {hasLogsForDateAndPillar(dateStr, 'development') && <span className="w-1 h-1 rounded-full bg-indigo-500" />}
                        {hasLogsForDateAndPillar(dateStr, 'study') && <span className="w-1 h-1 rounded-full bg-amber-500" />}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Shift Week Right */}
            <button 
              onClick={() => shiftWeek(7)} 
              className="p-1.5 rounded-lg border border-white/5 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all"
              title="Next Week"
            >
              <ChevronRight size={16} />
            </button>

            {/* Custom Date Input Pick & Today */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => handleDateSelect(todayStr)} 
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-white/5 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
              >
                Today
              </button>
              
              {/* Native Calendar Trigger */}
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateSelect(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                />
                <button className="p-1.5 rounded-lg border border-white/5 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all">
                  <Calendar size={16} />
                </button>
              </div>
            </div>

          </div>

          {/* Slide out Notes Sidebar Toggle */}
          <button 
            onClick={() => setIsNotesOpen(!isNotesOpen)}
            className={`p-2 rounded-xl border transition-all duration-300 flex items-center space-x-1.5 ${
              isNotesOpen 
                ? 'bg-zinc-800 border-indigo-500/30 text-indigo-400' 
                : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <FileText size={16} />
            <span className="hidden sm:inline text-xs font-medium">Notes</span>
            <span className={`w-1.5 h-1.5 rounded-full ${notes ? 'bg-emerald-500' : 'bg-transparent'} transition-all`} />
          </button>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col space-y-8">
        
        {/* Date Title Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-2">
              <span>Time Ledger</span>
              <span className="text-zinc-500 font-normal text-lg sm:text-xl">
                — {parseLocalDate(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              Select any date on the calendar strip to track logs and structure your pillars.
            </p>
          </div>
          {selectedDate !== todayStr && (
            <button
              onClick={() => handleDateSelect(todayStr)}
              className="mt-2 sm:mt-0 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-500/20 flex items-center space-x-1.5 transition-all w-fit"
            >
              <span>Back to Today</span>
              <ArrowRightIcon size={12} />
            </button>
          )}
        </div>

        {/* HERO MODULE: THE UNIVERSAL STOPWATCH */}
        <section className="glass-panel rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent blur-xl pointer-events-none" />
          
          <div className="flex items-center space-x-2 text-zinc-500 uppercase tracking-widest text-xs font-bold mb-2">
            <Clock size={12} className="animate-spin" style={{ animationDuration: '6s' }} />
            <span>Universal Time Engine</span>
          </div>

          {/* Precise Digital Timer */}
          <div className="text-5xl sm:text-7xl font-bold font-mono tracking-wider text-white select-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {formatTimeDigits(stopwatchTime)}
          </div>

          {/* Stopwatch Controls */}
          <div className="flex items-center space-x-4 mt-6">
            <button
              onClick={handleStopwatchReset}
              className="p-2.5 rounded-xl border border-white/5 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all hover:scale-105 active:scale-95"
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={handleStopwatchStartPause}
              className={`px-8 py-3.5 rounded-xl font-semibold flex items-center space-x-2.5 shadow-lg transition-all hover:scale-[1.03] active:scale-[0.98] ${
                isStopwatchRunning
                  ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 shadow-red-500/5'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/20'
              }`}
            >
              {isStopwatchRunning ? <Pause size={18} /> : <Play size={18} />}
              <span>{isStopwatchRunning ? 'Pause Engine' : 'Start Engine'}</span>
            </button>
          </div>

          {/* Inject action bar */}
          <div className="mt-8 pt-6 border-t border-white/5 w-full max-w-xl text-center">
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block mb-4">
              Inject time block directly into pillar
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={stopwatchTime === 0}
                onClick={() => handleInjectClick('dsa')}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all ${
                  stopwatchTime === 0
                    ? 'border-white/5 bg-zinc-900/20 text-zinc-600 cursor-not-allowed'
                    : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 active:scale-95'
                }`}
              >
                + DSA
              </button>
              <button
                disabled={stopwatchTime === 0}
                onClick={() => handleInjectClick('development')}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all ${
                  stopwatchTime === 0
                    ? 'border-white/5 bg-zinc-900/20 text-zinc-600 cursor-not-allowed'
                    : 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10 active:scale-95'
                }`}
              >
                + Development
              </button>
              <button
                disabled={stopwatchTime === 0}
                onClick={() => handleInjectClick('study')}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl border transition-all ${
                  stopwatchTime === 0
                    ? 'border-white/5 bg-zinc-900/20 text-zinc-600 cursor-not-allowed'
                    : 'border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 active:scale-95'
                }`}
              >
                + Study
              </button>
            </div>
          </div>
        </section>

        {/* THREE PILLAR TRACKING COLUMNS */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {pillars.map((pillar) => {
            const logsForPillar = timeLogs.filter(log => log.pillar === pillar.id && log.date === selectedDate);
            const totalHours = getColumnTotalHours(pillar.id);
            const entryState = manualEntry[pillar.id];

            return (
              <div 
                key={pillar.id}
                className={`glass-panel rounded-2xl border border-white/8 p-5 flex flex-col flex-1 h-fit transition-all duration-300 hover:border-white/15 ${pillar.glowClass}`}
              >
                
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/5">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-lg ${pillar.pillColor}`}>
                      {pillar.icon}
                    </div>
                    <h2 className="text-lg font-bold tracking-tight text-white">
                      {pillar.title}
                    </h2>
                  </div>
                  <div className={`text-xs px-2.5 py-1 font-bold rounded-lg border flex items-center space-x-1.5 ${pillar.pillColor}`}>
                    <Clock size={10} />
                    <span>{totalHours}</span>
                  </div>
                </div>

                {/* Column Manual Add Form */}
                <div className="bg-zinc-950/50 border border-white/5 p-3.5 rounded-xl mb-5">
                  <div className="flex space-x-2 mb-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="Hr"
                        min="0"
                        max="24"
                        value={entryState.hours}
                        onChange={(e) => handleManualChange(pillar.id, 'hours', e.target.value)}
                        className="w-full bg-zinc-900 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all font-mono"
                      />
                    </div>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="Min"
                        min="0"
                        max="59"
                        value={entryState.minutes}
                        onChange={(e) => handleManualChange(pillar.id, 'minutes', e.target.value)}
                        className="w-full bg-zinc-900 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="What was completed?"
                      value={entryState.note}
                      onChange={(e) => handleManualChange(pillar.id, 'note', e.target.value)}
                      className="flex-1 bg-zinc-900 border border-white/8 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all"
                    />
                    <button
                      onClick={() => handleManualAdd(pillar.id)}
                      disabled={!(parseInt(entryState.hours) > 0 || parseInt(entryState.minutes) > 0)}
                      className={`p-1.5 rounded-lg border flex items-center justify-center transition-all ${
                        (parseInt(entryState.hours) > 0 || parseInt(entryState.minutes) > 0)
                          ? 'bg-zinc-800 border-white/10 hover:bg-zinc-700 text-white cursor-pointer active:scale-95'
                          : 'bg-zinc-900/20 border-white/5 text-zinc-600 cursor-not-allowed'
                      }`}
                      title="Log time manually"
                    >
                      <PlusCircle size={16} />
                    </button>
                  </div>
                </div>

                {/* List of Time Cards */}
                <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                  {logsForPillar.length > 0 ? (
                    logsForPillar.map((log) => (
                      <div
                        key={log.id}
                        className="bg-zinc-900/30 border border-white/5 hover:border-white/10 hover:bg-zinc-900/50 rounded-xl p-3.5 relative group transition-all duration-200 animate-slide-up"
                      >
                        <div className="flex items-start justify-between">
                          <span className={`text-xs px-2 py-0.5 font-bold rounded border ${pillar.pillColor}`}>
                            {formatCardDuration(log.duration)}
                          </span>
                          
                          {/* Trash button visible on hover/always on touch */}
                          <button
                            onClick={() => handleDeleteCard(log.id)}
                            className="p-1 rounded bg-zinc-950 border border-white/5 text-zinc-500 hover:text-red-400 hover:border-red-500/20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200"
                            title="Delete log"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <p className="text-zinc-300 text-xs mt-2 line-clamp-3 leading-relaxed">
                          {log.note}
                        </p>

                        <div className="flex items-center space-x-1 mt-2 text-[10px] text-zinc-500">
                          <Calendar size={10} />
                          <span>{log.date}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    // EMPTY STATE
                    <div className="border border-dashed border-white/5 bg-zinc-900/10 rounded-xl p-6 text-center flex flex-col items-center justify-center h-48 transition-all">
                      <div className="p-3 rounded-full bg-zinc-900 border border-white/5 mb-3">
                        <Clock size={20} className="text-zinc-600" />
                      </div>
                      <p className="text-zinc-400 text-xs font-semibold leading-relaxed max-w-[200px]">
                        No blocks logged for this pillar today. Time to lock in!
                      </p>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </section>
      </main>

      {/* NOTES SLIDE-OUT DRAWER */}
      <aside 
        className={`fixed top-0 right-0 h-screen w-full sm:w-[450px] glass-panel border-l border-white/10 shadow-2xl z-50 transition-transform duration-300 ease-in-out transform flex flex-col ${
          isNotesOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <FileText size={18} className="text-indigo-400" />
            <h2 className="text-md font-bold tracking-tight text-white">Scratchpad</h2>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded font-mono">
              {saveStatus}
            </span>
            <button 
              onClick={() => setIsNotesOpen(false)}
              className="p-1.5 rounded-lg border border-white/5 hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Format Toolbar */}
        <div className="px-4 py-2 border-b border-white/5 bg-zinc-900/20 flex items-center space-x-2">
          <button 
            onClick={() => insertMarkdown('checkbox')} 
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
            title="Insert Checkbox"
          >
            <CheckSquare size={14} />
          </button>
          <button 
            onClick={() => insertMarkdown('bullet')} 
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
            title="Insert Bullet List"
          >
            <List size={14} />
          </button>
          <button 
            onClick={() => insertMarkdown('bold')} 
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
            title="Insert Bold Text"
          >
            <Bold size={14} />
          </button>
          <button 
            onClick={() => insertMarkdown('italic')} 
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
            title="Insert Italic Text"
          >
            <Italic size={14} />
          </button>
        </div>

        {/* Drawer Textarea */}
        <div className="flex-1 p-4 bg-zinc-950/20">
          <textarea
            id="notes-textarea"
            value={notes}
            onChange={handleNotesChange}
            placeholder="Type your markdown checklist, study objectives, or brain-dump here. Your thoughts auto-save instantly."
            className="w-full h-full bg-transparent resize-none border-none outline-none focus:ring-0 text-zinc-300 font-mono text-sm leading-relaxed placeholder-zinc-600 overflow-y-auto"
          />
        </div>
      </aside>

      {/* MODAL: STOPWATCH INJECTION DESCRIPTION */}
      {injectModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl relative overflow-hidden animate-zoom-in">
            
            {/* Top Accent Strip */}
            <div 
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: pillars.find(p => p.id === injectModal.pillar)?.accentColor }}
            />

            <div className="flex items-center justify-between mb-4 mt-2">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Inject to {pillars.find(p => p.id === injectModal.pillar)?.title}</span>
              </h3>
              <button 
                onClick={cancelInject}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-zinc-900 border border-white/5 px-4 py-3 rounded-xl flex items-center justify-between mb-4">
                <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Accumulated Duration</span>
                <span className="text-white font-mono font-bold text-md bg-zinc-950 px-2.5 py-1 rounded border border-white/5">
                  {formatCardDuration(injectModal.duration)}
                </span>
              </div>

              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Session Description (Optional)
              </label>
              <textarea
                value={injectModal.note}
                onChange={(e) => setInjectModal(prev => ({ ...prev, note: e.target.value }))}
                placeholder="What did you work on during this sprint?"
                rows={3}
                className="w-full bg-zinc-900 border border-white/8 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all resize-none"
              />
            </div>

            <div className="flex items-center space-x-3 justify-end mt-6">
              <button
                onClick={cancelInject}
                className="px-4 py-2 border border-white/5 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmInject}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-lg transition-all"
                style={{ backgroundColor: pillars.find(p => p.id === injectModal.pillar)?.accentColor }}
              >
                Log Session
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-4 text-center mt-auto">
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">
          HyperTrack Time Engine v1.0.0 — Crafted for peak focus
        </span>
      </footer>

    </div>
  );
}

// Simple internal helper component for arrow icon
function ArrowRightIcon({ size = 16, className = "" }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
