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
    }
    return [];
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
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col font-sans transition-colors duration-300 overflow-x-hidden">
      
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-6 sm:px-8 pt-8 sm:pt-10 pb-8 min-w-0">
        
        {/* PAGE HEADER — TIMELEDGER left, date pinned top-right */}
        <header className="mb-8 lg:mb-10 relative w-full">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.25em] text-slate-50 uppercase pr-36 sm:pr-48">
            TIMELEDGER
          </h1>
          <p className="absolute top-0 right-0 text-[10px] text-slate-400 font-semibold tracking-wider uppercase text-right leading-relaxed max-w-[10rem] sm:max-w-none">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-w-0">
        
        {/* LEFT COLUMN (8 COLS): EXCEL SPREADSHEET TABLE */}
        <section className="lg:col-span-8 order-1 lg:order-1 flex flex-col space-y-4 min-w-0">
          
          <div className="excel-table-container min-w-0">
            <div className="overflow-x-auto lg:overflow-x-visible">
              <table className="w-full table-fixed border-collapse text-left text-sm min-w-[750px] lg:min-w-0">
                <thead>
                  <tr className="bg-slate-800 border-b border-slate-700">
                    <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-400 w-[18%]">
                      Date
                    </th>
                    <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-400 w-[12%]">
                      Block
                    </th>
                    <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-400 w-[18%]">
                      Duration
                    </th>
                    <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-400 w-[42%]">
                      Description / Notes
                    </th>
                    <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-400 w-[10%] text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  
                  {/* INLINE EXCEL DATA INSERTION ROW */}
                  <tr className="bg-slate-800/60">
                    {/* Date Input */}
                    <td className="p-4 border-r border-slate-700">
                      <input
                        type="date"
                        value={insertForm.date}
                        onChange={(e) => setInsertForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full max-w-full min-w-0 text-sm bg-slate-900 border border-slate-700 rounded px-4 py-2.5 h-14 focus:outline-none focus:border-blue-500 text-slate-50 font-medium"
                      />
                    </td>
                    
                    {/* Block Select Dropdown */}
                    <td className="p-4 border-r border-slate-700">
                      <select
                        value={insertForm.block}
                        onChange={(e) => setInsertForm(prev => ({ ...prev, block: e.target.value }))}
                        className="w-full text-sm bg-slate-900 border border-slate-700 rounded px-4 py-2.5 h-14 focus:outline-none focus:border-blue-500 text-slate-50 font-semibold"
                      >
                        <option value="DSA">DSA</option>
                        <option value="DEV">DEV</option>
                        <option value="AI">AI</option>
                      </select>
                    </td>

                    {/* Time Input (Hours / Minutes) */}
                    <td className="p-4 border-r border-slate-700">
                      <div className="flex space-x-1">
                        <input
                          type="number"
                          placeholder="H"
                          min="0"
                          max="23"
                          value={insertForm.hours}
                          onChange={(e) => setInsertForm(prev => ({ ...prev, hours: e.target.value }))}
                          className="w-1/2 text-sm text-center bg-slate-900 border border-slate-700 rounded py-2.5 h-14 focus:outline-none focus:border-blue-500 text-slate-50 font-mono placeholder:text-slate-500"
                        />
                        <input
                          type="number"
                          placeholder="M"
                          min="0"
                          max="59"
                          value={insertForm.minutes}
                          onChange={(e) => setInsertForm(prev => ({ ...prev, minutes: e.target.value }))}
                          className="w-1/2 text-sm text-center bg-slate-900 border border-slate-700 rounded py-2.5 h-14 focus:outline-none focus:border-blue-500 text-slate-50 font-mono placeholder:text-slate-500"
                        />
                      </div>
                    </td>

                    {/* Description Text Input */}
                    <td className="p-4 border-r border-slate-700">
                      <input
                        type="text"
                        placeholder="Log new sheet description..."
                        value={insertForm.note}
                        onChange={(e) => setInsertForm(prev => ({ ...prev, note: e.target.value }))}
                        className="w-full text-sm bg-slate-900 border border-slate-700 rounded px-4 py-2.5 h-14 focus:outline-none focus:border-blue-500 text-slate-50 placeholder:text-slate-500"
                      />
                    </td>

                    {/* Add Action Button */}
                    <td className="p-4 text-center">
                      <button
                        onClick={handleAddRow}
                        disabled={!(parseInt(insertForm.hours) > 0 || parseInt(insertForm.minutes) > 0)}
                        className={`w-full h-14 flex items-center justify-center rounded border transition-all ${
                          (parseInt(insertForm.hours) > 0 || parseInt(insertForm.minutes) > 0)
                            ? 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                            : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
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
                      <tr key={log.id} className="hover:bg-slate-800/70 transition-colors">
                        {/* Date Cell */}
                        <td className="p-5 font-mono text-xs border-r border-slate-700 text-slate-400">
                          {log.date}
                        </td>
                        
                        {/* Block Badge Cell */}
                        <td className="p-5 border-r border-slate-700">
                          <span className="text-[10px] font-bold px-4 py-2.5 rounded border tracking-widest uppercase bg-slate-900 text-slate-50 border-slate-700">
                            {log.block}
                          </span>
                        </td>

                        {/* Duration Cell */}
                        <td className="p-5 font-mono text-sm font-semibold border-r border-slate-700 text-emerald-500">
                          {formatTableDuration(log.duration)}
                        </td>

                        {/* Editable Description Cell */}
                        <td className="p-4 border-r border-slate-700">
                          <input
                            id={`note-input-${log.id}`}
                            type="text"
                            value={log.note}
                            onChange={(e) => handleUpdateNote(log.id, e.target.value)}
                            placeholder="Add cell note..."
                            className="excel-input text-sm px-3 py-2 focus:bg-slate-900 text-slate-400 focus:text-slate-50 leading-relaxed font-sans"
                          />
                        </td>

                        {/* Delete Cell */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteRow(log.id)}
                            className="w-10 h-10 mx-auto flex items-center justify-center rounded border border-slate-700 bg-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 transition-all"
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
                      <td colSpan="5" className="p-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Clock size={20} className="text-slate-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            No Time Blocks Logged
                          </span>
                          <span className="text-[11px] text-slate-500 max-w-[280px]">
                            Log manually above or run the stopwatch on the right.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* EXCEL SUMMARY (FORMULA) FOOTER ROW */}
                  {showSummary && (
                    <tr className="bg-slate-800 font-medium text-slate-50 border-t-2 border-slate-700">
                      <td className="p-5 text-xs font-bold uppercase tracking-wider text-slate-400 border-r border-slate-700">
                        Total SUM
                      </td>
                      <td className="p-5 border-r border-slate-700">
                        {/* empty cell for block column */}
                      </td>
                      <td className="p-5 font-mono text-sm font-bold border-r border-slate-700 text-emerald-500">
                        {formatTableDuration(totalSecondsAll)}
                      </td>
                      <td className="p-5 text-xs text-slate-400 leading-relaxed" colSpan="2">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <span>DSA: <strong className="text-emerald-500 font-semibold">{formatHoursDecimal(getPillarTotalSeconds('DSA'))}</strong></span>
                          <span>DEV: <strong className="text-emerald-500 font-semibold">{formatHoursDecimal(getPillarTotalSeconds('DEV'))}</strong></span>
                          <span>AI: <strong className="text-emerald-500 font-semibold">{formatHoursDecimal(getPillarTotalSeconds('AI'))}</strong></span>
                        </div>
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="h-10 px-4 text-xs font-semibold rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-50 transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <span>{showSummary ? 'Hide Sum Totals' : 'Show Sum Totals'}</span>
            </button>
          </div>

        </section>

        {/* RIGHT COLUMN (4 COLS): CIRCULAR CLOCK STOPWATCH */}
        <section className="lg:col-span-4 order-2 lg:order-2 flex flex-col items-center p-6 border border-slate-700 rounded-2xl bg-slate-800 shadow-lg h-fit space-y-6">
          
          <div className="w-full text-center">
            <span className="text-xs font-bold tracking-widest uppercase text-slate-400 block mb-1">
              Visual Time Engine
            </span>
          </div>

          {/* Minimalist Clock Face with Tick marks */}
          <div className={`clock-face shadow-sm flex items-center justify-center ${isStopwatchRunning ? 'border-red-500' : ''}`}>
            <div className="clock-center-dot" />
            
            {/* Major Ticks (12, 6, 3, 9) */}
            <div className="absolute top-1 left-1/2 w-0.5 h-3 bg-slate-50 -translate-x-1/2" />
            <div className="absolute bottom-1 left-1/2 w-0.5 h-3 bg-slate-50 -translate-x-1/2" />
            <div className="absolute right-1 top-1/2 h-0.5 w-3 bg-slate-50 -translate-y-1/2" />
            <div className="absolute left-1 top-1/2 h-0.5 w-3 bg-slate-50 -translate-y-1/2" />

            {/* Minor Ticks (1, 2, 4, 5, 7, 8, 10, 11) */}
            <div className="absolute top-4 right-1/4 w-0.5 h-1.5 bg-slate-600 rotate-[30deg] origin-center" />
            <div className="absolute top-12 right-6 w-0.5 h-1.5 bg-slate-600 rotate-[60deg] origin-center" />
            <div className="absolute bottom-12 right-6 w-0.5 h-1.5 bg-slate-600 rotate-[120deg] origin-center" />
            <div className="absolute bottom-4 right-1/4 w-0.5 h-1.5 bg-slate-600 rotate-[150deg] origin-center" />
            <div className="absolute bottom-4 left-1/4 w-0.5 h-1.5 bg-slate-600 rotate-[210deg] origin-center" />
            <div className="absolute bottom-12 left-6 w-0.5 h-1.5 bg-slate-600 rotate-[240deg] origin-center" />
            <div className="absolute top-12 left-6 w-0.5 h-1.5 bg-slate-600 rotate-[300deg] origin-center" />
            <div className="absolute top-4 left-1/4 w-0.5 h-1.5 bg-slate-600 rotate-[330deg] origin-center" />

            {/* Clock Hands */}
            {/* Minutes Hand (slate-400, shorter/thicker) */}
            <div 
              className={`clock-hand h-11 w-1 ${isStopwatchRunning ? 'bg-red-500' : 'bg-slate-400'}`}
              style={{ transform: `translateX(-50%) rotate(${minutesRotation}deg)` }}
            />
            {/* Seconds Hand (primary, longer/thinner) */}
            <div 
              className={`clock-hand h-16 w-0.5 ${isStopwatchRunning ? 'bg-red-500' : 'bg-slate-50'}`}
              style={{ transform: `translateX(-50%) rotate(${secondsRotation}deg)` }}
            />
          </div>

          {/* Digital Timer Value */}
          <div className={`text-4xl font-bold font-mono tracking-wider select-none ${isStopwatchRunning ? 'text-red-500' : 'text-slate-50'}`}>
            {formatStopwatchTime(stopwatchTime)}
          </div>

          {/* Stopwatch Control Action Buttons (h-11 tap targets) */}
          <div className="flex items-center space-x-3 w-full justify-center">
            
            {/* Reset Button */}
            <button
              onClick={handleStopwatchReset}
              className="w-11 h-11 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-50 hover:border-slate-500 transition-all flex items-center justify-center active:scale-95"
              title="Reset Timer"
            >
              <RotateCcw size={16} />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={handleStopwatchStartPause}
              className={`h-11 px-6 rounded-lg font-medium flex items-center space-x-2 border transition-all active:scale-[0.98] ${
                isStopwatchRunning
                  ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isStopwatchRunning ? <Pause size={14} /> : <Play size={14} />}
              <span className="text-xs uppercase tracking-wider font-semibold">
                {isStopwatchRunning ? 'Pause Engine' : 'Start Engine'}
              </span>
            </button>

          </div>

          {/* Inject Buttons (h-11 tap targets) */}
          <div className="pt-6 border-t border-slate-700 w-full">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center mb-3">
              Inject time block directly
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={stopwatchTime === 0}
                onClick={() => handleInject('DSA')}
                className={`h-11 text-xs font-semibold rounded-lg border transition-all ${
                  stopwatchTime === 0
                    ? 'border-slate-700 bg-slate-900 text-slate-600 cursor-not-allowed'
                    : 'border-slate-700 bg-slate-900 text-slate-50 hover:bg-blue-500 hover:border-blue-500 hover:text-white active:scale-95'
                }`}
              >
                DSA
              </button>
              <button
                disabled={stopwatchTime === 0}
                onClick={() => handleInject('DEV')}
                className={`h-11 text-xs font-semibold rounded-lg border transition-all ${
                  stopwatchTime === 0
                    ? 'border-slate-700 bg-slate-900 text-slate-600 cursor-not-allowed'
                    : 'border-slate-700 bg-slate-900 text-slate-50 hover:bg-blue-500 hover:border-blue-500 hover:text-white active:scale-95'
                }`}
              >
                DEV
              </button>
              <button
                disabled={stopwatchTime === 0}
                onClick={() => handleInject('AI')}
                className={`h-11 text-xs font-semibold rounded-lg border transition-all ${
                  stopwatchTime === 0
                    ? 'border-slate-700 bg-slate-900 text-slate-600 cursor-not-allowed'
                    : 'border-slate-700 bg-slate-900 text-slate-50 hover:bg-blue-500 hover:border-blue-500 hover:text-white active:scale-95'
                }`}
              >
                AI
              </button>
            </div>
          </div>

        </section>

        </div>
      </main>

    </div>
  );
}
