import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Clock 
} from 'lucide-react';

// Helper to get local date string in YYYY-MM-DD format (timezone independent)
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayStr = getLocalDateString();

export default function App() {
  // --- STATE MANAGEMENT ---
  const [timeLogs, setTimeLogs] = useState(() => {
    const cachedLogs = localStorage.getItem('hypertrack_excel_logs');
    if (cachedLogs !== null) {
      try {
        return JSON.parse(cachedLogs);
      } catch (e) {
        console.error("Failed to parse cached logs:", e);
        return [];
      }
    } else {
      // Default Mock Data in Excel Spreadsheet format
      return [
        {
          id: 'mock-1',
          date: todayStr,
          block: 'DSA',
          duration: 4800, // 1h 20m
          note: 'LeetCode Graph Algorithms (DFS/BFS traversals)'
        },
        {
          id: 'mock-2',
          date: todayStr,
          block: 'DEV',
          duration: 8700, // 2h 25m
          note: 'Auth system integration and API routing endpoints'
        },
        {
          id: 'mock-3',
          date: todayStr,
          block: 'AI',
          duration: 3600, // 1h 00m
          note: 'Prompt engineering test scripts & evaluation metrics'
        }
      ];
    }
  });

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchIntervalRef = useRef(null);

  // Form states for the top insertion row of the Excel sheet
  const [insertForm, setInsertForm] = useState({
    date: todayStr,
    block: 'DSA',
    hours: '',
    minutes: '',
    note: ''
  });

  // Reference to focus description of newly injected row
  const newlyCreatedRowIdRef = useRef(null);

  // Toggle sum visibility state
  const [showSummary, setShowSummary] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('hypertrack_excel_logs', JSON.stringify(timeLogs));
  }, [timeLogs]);

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

  // Inject stopwatch time directly into a new spreadsheet row
  const handleInject = (blockType) => {
    if (stopwatchTime === 0) return;
    setIsStopwatchRunning(false);

    const newId = Date.now().toString();
    const newLog = {
      id: newId,
      date: insertForm.date || todayStr,
      block: blockType,
      duration: stopwatchTime,
      note: '' // Empty so user can fill it in immediately
    };

    // Prepend new log
    setTimeLogs((prev) => [newLog, ...prev]);
    setStopwatchTime(0); // Reset stopwatch

    // Mark for focusing
    newlyCreatedRowIdRef.current = newId;
  };

  // Auto-focus description input of newly created row (if injected)
  useEffect(() => {
    if (newlyCreatedRowIdRef.current) {
      const element = document.getElementById(`note-input-${newlyCreatedRowIdRef.current}`);
      if (element) {
        element.focus();
      }
      newlyCreatedRowIdRef.current = null;
    }
  }, [timeLogs]);

  // --- EXCEL ACTIONS ---
  const handleAddRow = () => {
    const hrs = parseInt(insertForm.hours) || 0;
    const mins = parseInt(insertForm.minutes) || 0;
    const totalSecs = (hrs * 3600) + (mins * 60);

    if (totalSecs <= 0) return;

    const newLog = {
      id: Date.now().toString(),
      date: insertForm.date || todayStr,
      block: insertForm.block,
      duration: totalSecs,
      note: insertForm.note.trim()
    };

    setTimeLogs((prev) => [newLog, ...prev]);

    // Reset entry fields (keep date & block for rapid sequential entry)
    setInsertForm((prev) => ({
      ...prev,
      hours: '',
      minutes: '',
      note: ''
    }));
  };

  const handleUpdateNote = (id, newNote) => {
    setTimeLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, note: newNote } : log))
    );
  };

  const handleDeleteRow = (id) => {
    setTimeLogs((prev) => prev.filter((log) => log.id !== id));
  };

  // --- TIME DISPLAY FORMATTERS ---
  const formatStopwatchTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTableDuration = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- CALCULATING AGGREGATES (EXCEL SUMMARY ROW) ---
  const totalSecondsAll = timeLogs.reduce((acc, log) => acc + log.duration, 0);

  const getPillarTotalSeconds = (pillar) => {
    return timeLogs
      .filter((log) => log.block === pillar)
      .reduce((acc, log) => acc + log.duration, 0);
  };

  const formatHoursDecimal = (totalSeconds) => {
    const hrs = totalSeconds / 3600;
    return hrs > 0 ? `${hrs.toFixed(2)} hrs` : '0.00 hrs';
  };

  // Calculate hands rotation degrees for analog clock representation
  // 60 seconds = 360 degrees, so 1 second = 6 degrees
  const secondsRotation = stopwatchTime * 6;
  // 60 minutes = 360 degrees, so 1 minute = 6 degrees. 1 second = 0.1 degree
  const minutesRotation = (stopwatchTime / 60) * 6;

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans transition-colors duration-300">
      
      {/* HEADER SECTION (MINIMALIST) */}
      <header className="border-b border-zinc-200 py-6 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black uppercase">
              Time Ledger
            </h1>
            <span className="text-lg sm:text-xl font-bold text-zinc-400 uppercase">
              — Logged Time Sheets
            </span>
          </div>
          <div className="text-xs text-zinc-400 font-medium tracking-wider uppercase sm:text-right">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </header>

      {/* TWO-COLUMN GRID LAYOUT (ADHERING TO 8PT GRID & INWARD COLLAPSE) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (8 COLS): EXCEL SPREADSHEET TABLE */}
        <section className="lg:col-span-8 order-2 lg:order-1 flex flex-col space-y-4">
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="h-10 px-4 text-xs font-semibold rounded border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <span>{showSummary ? 'Hide Sum Totals' : 'Show Sum Totals'}</span>
            </button>
            <span className="text-xs text-zinc-400">
              *Double click description cell to edit notes directly.
            </span>
          </div>

          <div className="excel-table-container">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th scope="col" className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 w-[18%]">
                      Date
                    </th>
                    <th scope="col" className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 w-[12%]">
                      Block
                    </th>
                    <th scope="col" className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 w-[18%]">
                      Duration
                    </th>
                    <th scope="col" className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 w-[42%]">
                      Description / Notes
                    </th>
                    <th scope="col" className="p-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 w-[10%] text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  
                  {/* INLINE EXCEL DATA INSERTION ROW */}
                  <tr className="bg-zinc-50/50">
                    {/* Date Input */}
                    <td className="p-3 border-r border-zinc-100">
                      <input
                        type="date"
                        value={insertForm.date}
                        onChange={(e) => setInsertForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full text-xs bg-white border border-zinc-200 rounded px-3 py-2 h-12 focus:outline-none focus:border-black font-medium"
                      />
                    </td>
                    
                    {/* Block Select Dropdown */}
                    <td className="p-3 border-r border-zinc-100">
                      <select
                        value={insertForm.block}
                        onChange={(e) => setInsertForm(prev => ({ ...prev, block: e.target.value }))}
                        className="w-full text-xs bg-white border border-zinc-200 rounded px-3 py-2 h-12 focus:outline-none focus:border-black font-semibold"
                      >
                        <option value="DSA">DSA</option>
                        <option value="DEV">DEV</option>
                        <option value="AI">AI</option>
                      </select>
                    </td>

                    {/* Time Input (Hours / Minutes) */}
                    <td className="p-3 border-r border-zinc-100">
                      <div className="flex space-x-1">
                        <input
                          type="number"
                          placeholder="H"
                          min="0"
                          max="23"
                          value={insertForm.hours}
                          onChange={(e) => setInsertForm(prev => ({ ...prev, hours: e.target.value }))}
                          className="w-1/2 text-xs text-center bg-white border border-zinc-200 rounded py-2 h-12 focus:outline-none focus:border-black font-mono"
                        />
                        <input
                          type="number"
                          placeholder="M"
                          min="0"
                          max="59"
                          value={insertForm.minutes}
                          onChange={(e) => setInsertForm(prev => ({ ...prev, minutes: e.target.value }))}
                          className="w-1/2 text-xs text-center bg-white border border-zinc-200 rounded py-2 h-12 focus:outline-none focus:border-black font-mono"
                        />
                      </div>
                    </td>

                    {/* Description Text Input */}
                    <td className="p-3 border-r border-zinc-100">
                      <input
                        type="text"
                        placeholder="Log new sheet description..."
                        value={insertForm.note}
                        onChange={(e) => setInsertForm(prev => ({ ...prev, note: e.target.value }))}
                        className="w-full text-xs bg-white border border-zinc-200 rounded px-4 py-2 h-12 focus:outline-none focus:border-black"
                      />
                    </td>

                    {/* Add Action Button */}
                    <td className="p-3 text-center">
                      <button
                        onClick={handleAddRow}
                        disabled={!(parseInt(insertForm.hours) > 0 || parseInt(insertForm.minutes) > 0)}
                        className={`w-full h-12 flex items-center justify-center rounded border transition-all ${
                          (parseInt(insertForm.hours) > 0 || parseInt(insertForm.minutes) > 0)
                            ? 'bg-black border-black text-white hover:bg-zinc-800 cursor-pointer'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-300 cursor-not-allowed'
                        }`}
                        title="Add record"
                      >
                        <Plus size={16} />
                      </button>
                    </td>
                  </tr>

                  {/* SPREADSHEET LOG ENTRIES */}
                  {timeLogs.length > 0 ? (
                    timeLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/70 transition-colors">
                        {/* Date Cell */}
                        <td className="p-4 font-mono text-xs border-r border-zinc-100 text-zinc-500">
                          {log.date}
                        </td>
                        
                        {/* Block Badge Cell */}
                        <td className="p-4 border-r border-zinc-100">
                          <span className={`text-[10px] font-bold px-4 py-2.5 rounded border tracking-widest uppercase ${
                            log.block === 'DSA' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : log.block === 'DEV'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {log.block}
                          </span>
                        </td>

                        {/* Duration Cell */}
                        <td className="p-4 font-mono text-sm font-semibold border-r border-zinc-100 text-zinc-900">
                          {formatTableDuration(log.duration)}
                        </td>

                        {/* Editable Description Cell */}
                        <td className="p-3 border-r border-zinc-100">
                          <input
                            id={`note-input-${log.id}`}
                            type="text"
                            value={log.note}
                            onChange={(e) => handleUpdateNote(log.id, e.target.value)}
                            placeholder="Add cell note..."
                            className="excel-input text-xs px-3 py-2.5 focus:bg-white text-zinc-700 focus:text-zinc-900 leading-relaxed font-sans"
                          />
                        </td>

                        {/* Delete Cell */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteRow(log.id)}
                            className="w-9 h-9 mx-auto flex items-center justify-center rounded border border-zinc-100 bg-white text-zinc-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50/50 transition-all"
                            title="Delete Row"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    /* EMPTY PLACEHOLDER */
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-zinc-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Clock size={20} className="text-zinc-300" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            No Time Blocks Logged
                          </span>
                          <span className="text-[11px] text-zinc-400 max-w-[280px]">
                            Log manually above or run the stopwatch on the right.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* EXCEL SUMMARY (FORMULA) FOOTER ROW */}
                  {showSummary && (
                    <tr className="bg-zinc-50 font-medium text-zinc-900 border-t-2 border-zinc-200">
                      <td className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500 border-r border-zinc-100">
                        Total SUM
                      </td>
                      <td className="p-4 border-r border-zinc-100">
                        {/* empty cell for block column */}
                      </td>
                      <td className="p-4 font-mono text-sm font-bold border-r border-zinc-100 text-black">
                        {formatTableDuration(totalSecondsAll)}
                      </td>
                      <td className="p-4 text-xs text-zinc-500 leading-relaxed" colSpan="2">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <span>DSA: <strong className="text-black font-semibold">{formatHoursDecimal(getPillarTotalSeconds('DSA'))}</strong></span>
                          <span>DEV: <strong className="text-black font-semibold">{formatHoursDecimal(getPillarTotalSeconds('DEV'))}</strong></span>
                          <span>AI: <strong className="text-black font-semibold">{formatHoursDecimal(getPillarTotalSeconds('AI'))}</strong></span>
                        </div>
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN (4 COLS): CIRCULAR CLOCK STOPWATCH */}
        <section className="lg:col-span-4 order-1 lg:order-2 flex flex-col items-center p-6 border border-zinc-200 rounded-2xl bg-white shadow-sm h-fit space-y-6">
          
          <div className="w-full text-center">
            <span className="text-xs font-bold tracking-widest uppercase text-zinc-400 block mb-1">
              Visual Time Engine
            </span>
          </div>

          {/* Minimalist Clock Face with Tick marks */}
          <div className="clock-face shadow-sm flex items-center justify-center">
            <div className="clock-center-dot" />
            
            {/* Major Ticks (12, 6, 3, 9) */}
            <div className="absolute top-1 left-1/2 w-0.5 h-3 bg-zinc-900 -translate-x-1/2" />
            <div className="absolute bottom-1 left-1/2 w-0.5 h-3 bg-zinc-900 -translate-x-1/2" />
            <div className="absolute right-1 top-1/2 h-0.5 w-3 bg-zinc-900 -translate-y-1/2" />
            <div className="absolute left-1 top-1/2 h-0.5 w-3 bg-zinc-900 -translate-y-1/2" />

            {/* Minor Ticks (1, 2, 4, 5, 7, 8, 10, 11) */}
            <div className="absolute top-4 right-1/4 w-0.5 h-1.5 bg-zinc-300 rotate-[30deg] origin-center" />
            <div className="absolute top-12 right-6 w-0.5 h-1.5 bg-zinc-300 rotate-[60deg] origin-center" />
            <div className="absolute bottom-12 right-6 w-0.5 h-1.5 bg-zinc-300 rotate-[120deg] origin-center" />
            <div className="absolute bottom-4 right-1/4 w-0.5 h-1.5 bg-zinc-300 rotate-[150deg] origin-center" />
            <div className="absolute bottom-4 left-1/4 w-0.5 h-1.5 bg-zinc-300 rotate-[210deg] origin-center" />
            <div className="absolute bottom-12 left-6 w-0.5 h-1.5 bg-zinc-300 rotate-[240deg] origin-center" />
            <div className="absolute top-12 left-6 w-0.5 h-1.5 bg-zinc-300 rotate-[300deg] origin-center" />
            <div className="absolute top-4 left-1/4 w-0.5 h-1.5 bg-zinc-300 rotate-[330deg] origin-center" />

            {/* Clock Hands */}
            {/* Minutes Hand (zinc-400, shorter/thicker) */}
            <div 
              className="clock-hand h-11 w-1 bg-zinc-400"
              style={{ transform: `translateX(-50%) rotate(${minutesRotation}deg)` }}
            />
            {/* Seconds Hand (zinc-900, longer/thinner) */}
            <div 
              className="clock-hand h-16 w-0.5 bg-zinc-900"
              style={{ transform: `translateX(-50%) rotate(${secondsRotation}deg)` }}
            />
          </div>

          {/* Digital Timer Value (5xl font, 700 bold weight, monospaced digits) */}
          <div className="text-4xl font-bold font-mono tracking-wider text-black select-none">
            {formatStopwatchTime(stopwatchTime)}
          </div>

          {/* Stopwatch Control Action Buttons (h-11 tap targets) */}
          <div className="flex items-center space-x-3 w-full justify-center">
            
            {/* Reset Button */}
            <button
              onClick={handleStopwatchReset}
              className="w-11 h-11 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:text-black hover:border-zinc-400 transition-all flex items-center justify-center active:scale-95"
              title="Reset Timer"
            >
              <RotateCcw size={16} />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={handleStopwatchStartPause}
              className={`h-11 px-6 rounded-lg font-medium flex items-center space-x-2 border transition-all active:scale-[0.98] ${
                isStopwatchRunning
                  ? 'bg-zinc-100 border-zinc-300 text-black hover:bg-zinc-200'
                  : 'bg-black border-black text-white hover:bg-zinc-800'
              }`}
            >
              {isStopwatchRunning ? <Pause size={14} /> : <Play size={14} />}
              <span className="text-xs uppercase tracking-wider font-semibold">
                {isStopwatchRunning ? 'Pause Engine' : 'Start Engine'}
              </span>
            </button>

          </div>

          {/* Inject Buttons (h-11 tap targets) */}
          <div className="pt-6 border-t border-zinc-200 w-full">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block text-center mb-3">
              Inject time block directly
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={stopwatchTime === 0}
                onClick={() => handleInject('DSA')}
                className={`h-11 text-xs font-semibold rounded-lg border transition-all ${
                  stopwatchTime === 0
                    ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
                    : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 active:scale-95'
                }`}
              >
                DSA
              </button>
              <button
                disabled={stopwatchTime === 0}
                onClick={() => handleInject('DEV')}
                className={`h-11 text-xs font-semibold rounded-lg border transition-all ${
                  stopwatchTime === 0
                    ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
                    : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 active:scale-95'
                }`}
              >
                DEV
              </button>
              <button
                disabled={stopwatchTime === 0}
                onClick={() => handleInject('AI')}
                className={`h-11 text-xs font-semibold rounded-lg border transition-all ${
                  stopwatchTime === 0
                    ? 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
                    : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 active:scale-95'
                }`}
              >
                AI
              </button>
            </div>
          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-100 py-6 text-center text-[10px] text-zinc-400 uppercase tracking-widest font-semibold bg-zinc-50/50">
         Made by Atharv Chaskar for maximizing productivity
      </footer>

    </div>
  );
}
