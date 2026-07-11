import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Clock,
  Settings,
  X,
  Pencil
} from 'lucide-react';

// Helper to get local date string in YYYY-MM-DD format (timezone independent)
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayStr = getLocalDateString();

// Default blocks that ship with the app
const DEFAULT_BLOCKS = ['DSA', 'DEV', 'Study'];

// Badge color class lookup
const BADGE_CLASS_MAP = {
  'DSA': 'block-badge-dsa',
  'DEV': 'block-badge-dev',
  'Study': 'block-badge-study',
};

const getBadgeClass = (block) => {
  return BADGE_CLASS_MAP[block] || 'block-badge-default';
};

// Inject button color class lookup
const INJECT_CLASS_MAP = {
  'DSA': 'inject-btn-dsa',
  'DEV': 'inject-btn-dev',
  'Study': 'inject-btn-study',
};

const getInjectClass = (block) => {
  return INJECT_CLASS_MAP[block] || 'inject-btn-custom';
};

// ─── BLOCK EDITOR MODAL ───
function BlockEditorModal({ blocks, onSave, onClose }) {
  const [editBlocks, setEditBlocks] = useState([...blocks]);
  const [newBlock, setNewBlock] = useState('');
  const inputRef = useRef(null);

  const handleAdd = () => {
    const name = newBlock.trim();
    if (name && !editBlocks.includes(name)) {
      setEditBlocks(prev => [...prev, name]);
      setNewBlock('');
    }
  };

  const handleRemove = (block) => {
    setEditBlocks(prev => prev.filter(b => b !== block));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-snow tracking-wide">Manage Study Blocks</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-onyx text-mist hover:text-snow hover:bg-gunmetal transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-mist mb-5 leading-relaxed">
          Add custom blocks for your study topics. Each block becomes a trackable category.
        </p>

        {/* Existing blocks */}
        <div className="flex flex-wrap gap-2 mb-5">
          {editBlocks.map((block) => (
            <span
              key={block}
              className={`block-badge ${getBadgeClass(block)} flex items-center gap-2 pr-2`}
            >
              {block}
              <button
                onClick={() => handleRemove(block)}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>

        {/* Add new block input */}
        <div className="flex gap-2 mb-6">
          <input
            ref={inputRef}
            type="text"
            value={newBlock}
            onChange={(e) => setNewBlock(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Math, Physics, ML..."
            className="flex-1 text-sm bg-onyx border border-gunmetal rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-glow/50 text-snow placeholder:text-steel transition-all"
            maxLength={20}
          />
          <button
            onClick={handleAdd}
            disabled={!newBlock.trim() || editBlocks.includes(newBlock.trim())}
            className="px-5 py-3 rounded-lg text-sm font-semibold bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/20 hover:bg-cyan-glow/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Save */}
        <button
          onClick={() => { onSave(editBlocks); onClose(); }}
          disabled={editBlocks.length === 0}
          className="w-full py-3 rounded-lg font-semibold text-sm bg-cyan-glow text-obsidian hover:bg-cyan-glow/90 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Save Blocks
        </button>
      </div>
    </div>
  );
}


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

  // Custom blocks state
  const [blocks, setBlocks] = useState(() => {
    const cached = localStorage.getItem('hypertrack_custom_blocks');
    if (cached !== null) {
      try {
        const parsed = JSON.parse(cached);
        return parsed.length > 0 ? parsed : DEFAULT_BLOCKS;
      } catch (e) {
        return DEFAULT_BLOCKS;
      }
    }
    return DEFAULT_BLOCKS;
  });

  // Track whether user has ever customized blocks
  const [hasCustomizedBlocks, setHasCustomizedBlocks] = useState(() => {
    return localStorage.getItem('hypertrack_blocks_customized') === 'true';
  });

  // Modal state
  const [showBlockEditor, setShowBlockEditor] = useState(false);

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

  useEffect(() => {
    localStorage.setItem('hypertrack_custom_blocks', JSON.stringify(blocks));
  }, [blocks]);

  // --- BLOCKS MANAGEMENT ---
  const handleSaveBlocks = (newBlocks) => {
    setBlocks(newBlocks);
    setHasCustomizedBlocks(true);
    localStorage.setItem('hypertrack_blocks_customized', 'true');
    // If current form block is not in new blocks, switch to first block
    if (!newBlocks.includes(insertForm.block) && newBlocks.length > 0) {
      setInsertForm(prev => ({ ...prev, block: newBlocks[0] }));
    }
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

  // --- FORMAT DATE for table rows ---
  const formatDateDisplay = (dateStr) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      return { day, date: d, month };
    } catch {
      return { day: '', date: dateStr, month: '' };
    }
  };

  // --- CALCULATING AGGREGATES (EXCEL SUMMARY ROW) ---
  const totalSecondsAll = timeLogs.reduce((acc, log) => acc + log.duration, 0);

  const getPillarTotalSeconds = (pillar) => {
    return timeLogs
      .filter((log) => log.block === pillar)
      .reduce((acc, log) => acc + log.duration, 0);
  };

  const formatBlockLabel = (block) => block;

  const formatHoursDecimal = (totalSeconds) => {
    const hrs = totalSeconds / 3600;
    return hrs > 0 ? `${hrs.toFixed(2)} hrs` : '0.00 hrs';
  };

  // Calculate hands rotation degrees for analog clock representation
  const secondsRotation = stopwatchTime * 6;
  const minutesRotation = (stopwatchTime / 60) * 6;

  // Current date display
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateDisplay = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-void text-snow flex flex-col font-sans transition-colors duration-300 overflow-x-hidden">
      
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-6 sm:px-8 pt-8 sm:pt-10 pb-8 min-w-0">
        
        {/* PAGE HEADER */}
        <header className="mb-8 lg:mb-10 relative w-full">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[0.2em] text-snow uppercase mb-1">
                TIMELEDGER
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-glow pulse-dot"></div>
                <span className="text-xs text-mist font-medium tracking-wider uppercase">Tracking Active</span>
              </div>
            </div>

            {/* DATE — Made Prominent */}
            <div className="text-right">
              <p className="text-lg sm:text-xl font-bold text-snow tracking-wide">
                {dayName}
              </p>
              <p className="text-sm sm:text-base text-silver font-medium mt-0.5">
                {dateDisplay}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-w-0">
        
        {/* LEFT COLUMN (8 COLS): EXCEL SPREADSHEET TABLE */}
        <section className="lg:col-span-8 order-1 lg:order-1 flex flex-col space-y-4 min-w-0">
          
          <div className="excel-table-container min-w-0">
            <div className="overflow-x-auto lg:overflow-x-visible">
              <table className="w-full table-fixed border-collapse text-left text-sm min-w-[750px] lg:min-w-0">
                <thead>
                  <tr className="bg-onyx border-b border-gunmetal">
                    <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-mist w-[18%]">
                      Date
                    </th>
                    <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-mist w-[12%]">
                      Block
                    </th>
                    <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-mist w-[18%]">
                      Duration
                    </th>
                    <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-mist w-[42%]">
                      Description / Notes
                    </th>
                    <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-mist w-[10%] text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gunmetal/50">
                  
                  {/* INLINE EXCEL DATA INSERTION ROW */}
                  <tr className="bg-onyx/40">
                    {/* Date Input */}
                    <td className="p-4 border-r border-gunmetal/30">
                      <input
                        type="date"
                        value={insertForm.date}
                        onChange={(e) => setInsertForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full max-w-full min-w-0 text-sm bg-onyx border border-gunmetal rounded-lg px-4 py-2.5 h-14 focus:outline-none focus:border-cyan-glow/50 text-snow font-medium [color-scheme:dark]"
                      />
                    </td>
                    
                    {/* Block Select Dropdown */}
                    <td className="p-4 border-r border-gunmetal/30">
                      <select
                        value={insertForm.block}
                        onChange={(e) => setInsertForm(prev => ({ ...prev, block: e.target.value }))}
                        className="w-full text-sm bg-onyx border border-gunmetal rounded-lg px-4 py-2.5 h-14 focus:outline-none focus:border-cyan-glow/50 text-snow font-semibold [color-scheme:dark]"
                      >
                        {blocks.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </td>

                    {/* Time Input (Hours / Minutes) */}
                    <td className="p-4 border-r border-gunmetal/30">
                      <div className="flex space-x-1">
                        <input
                          type="number"
                          placeholder="H"
                          min="0"
                          max="23"
                          value={insertForm.hours}
                          onChange={(e) => setInsertForm(prev => ({ ...prev, hours: e.target.value }))}
                          className="w-1/2 text-sm text-center bg-onyx border border-gunmetal rounded-lg py-2.5 h-14 focus:outline-none focus:border-cyan-glow/50 text-snow font-mono placeholder:text-steel [color-scheme:dark]"
                        />
                        <input
                          type="number"
                          placeholder="M"
                          min="0"
                          max="59"
                          value={insertForm.minutes}
                          onChange={(e) => setInsertForm(prev => ({ ...prev, minutes: e.target.value }))}
                          className="w-1/2 text-sm text-center bg-onyx border border-gunmetal rounded-lg py-2.5 h-14 focus:outline-none focus:border-cyan-glow/50 text-snow font-mono placeholder:text-steel [color-scheme:dark]"
                        />
                      </div>
                    </td>

                    {/* Description Text Input */}
                    <td className="p-4 border-r border-gunmetal/30">
                      <input
                        type="text"
                        placeholder="Log new entry description..."
                        value={insertForm.note}
                        onChange={(e) => setInsertForm(prev => ({ ...prev, note: e.target.value }))}
                        className="w-full text-sm bg-onyx border border-gunmetal rounded-lg px-4 py-2.5 h-14 focus:outline-none focus:border-cyan-glow/50 text-snow placeholder:text-steel [color-scheme:dark]"
                      />
                    </td>

                    {/* Add Action Button */}
                    <td className="p-4 text-center">
                      <button
                        onClick={handleAddRow}
                        disabled={!(parseInt(insertForm.hours) > 0 || parseInt(insertForm.minutes) > 0)}
                        className={`w-full h-14 flex items-center justify-center rounded-lg border transition-all ${
                          (parseInt(insertForm.hours) > 0 || parseInt(insertForm.minutes) > 0)
                            ? 'bg-cyan-glow/10 border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/20 cursor-pointer'
                            : 'bg-onyx border-gunmetal text-steel cursor-not-allowed'
                        }`}
                        title="Add record"
                      >
                        <Plus size={16} />
                      </button>
                    </td>
                  </tr>

                  {/* SPREADSHEET LOG ENTRIES */}
                  {timeLogs.length > 0 ? (
                    timeLogs.map((log, index) => {
                      const { day, date, month } = formatDateDisplay(log.date);
                      return (
                        <tr key={log.id} className="table-row-animate hover:bg-onyx/60 transition-colors duration-200 group">
                          {/* Date Cell — made prominent */}
                          <td className="p-4 border-r border-gunmetal/30">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold uppercase tracking-wider text-mist">{day}</span>
                              <span className="text-lg font-bold text-snow leading-tight">{date}</span>
                              <span className="text-xs text-steel font-medium">{month}</span>
                            </div>
                          </td>
                          
                          {/* Block Badge Cell */}
                          <td className="p-4 border-r border-gunmetal/30">
                            <span className={`block-badge ${getBadgeClass(log.block)}`}>
                              {formatBlockLabel(log.block)}
                            </span>
                          </td>

                          {/* Duration Cell */}
                          <td className="p-4 font-mono text-sm font-semibold border-r border-gunmetal/30 text-snow">
                            {formatTableDuration(log.duration)}
                          </td>

                          {/* Editable Description Cell */}
                          <td className="p-4 border-r border-gunmetal/30">
                            <input
                              id={`note-input-${log.id}`}
                              type="text"
                              value={log.note}
                              onChange={(e) => handleUpdateNote(log.id, e.target.value)}
                              placeholder="Add cell note..."
                              className="excel-input text-sm px-3 py-2 focus:bg-onyx text-silver focus:text-snow leading-relaxed font-sans"
                            />
                          </td>

                          {/* Delete Cell */}
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleDeleteRow(log.id)}
                              className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg border border-gunmetal bg-onyx text-steel hover:text-rose-glow hover:border-rose-glow/30 hover:bg-rose-glow/10 transition-all opacity-0 group-hover:opacity-100"
                              title="Delete Row"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    /* EMPTY PLACEHOLDER */
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-steel">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-onyx border border-gunmetal flex items-center justify-center">
                            <Clock size={20} className="text-mist" />
                          </div>
                          <span className="text-sm font-semibold uppercase tracking-wider text-mist">
                            No Time Blocks Logged
                          </span>
                          <span className="text-xs text-steel max-w-[320px] leading-relaxed">
                            Log manually above or run the stopwatch on the right to start tracking.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* EXCEL SUMMARY (FORMULA) FOOTER ROW */}
                  {showSummary && (
                    <tr className="bg-onyx font-medium text-snow border-t-2 border-gunmetal">
                      <td className="p-5 text-xs font-bold uppercase tracking-wider text-cyan-glow border-r border-gunmetal/30">
                        Total SUM
                      </td>
                      <td className="p-5 border-r border-gunmetal/30">
                        {/* empty cell for block column */}
                      </td>
                      <td className="p-5 font-mono text-sm font-bold border-r border-gunmetal/30 text-cyan-glow glow-cyan">
                        {formatTableDuration(totalSecondsAll)}
                      </td>
                      <td className="p-5 text-xs text-silver leading-relaxed" colSpan="2">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {blocks.map(b => (
                            <span key={b}>
                              {b}: <strong className="text-snow font-semibold">{formatHoursDecimal(getPillarTotalSeconds(b))}</strong>
                            </span>
                          ))}
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
              className="h-10 px-5 text-xs font-semibold rounded-lg border border-gunmetal bg-onyx hover:bg-gunmetal text-silver hover:text-snow transition-all flex items-center space-x-2 active:scale-95"
            >
              <span>{showSummary ? 'Hide Sum Totals' : 'Show Sum Totals'}</span>
            </button>
          </div>

        </section>

        {/* RIGHT COLUMN (4 COLS): CIRCULAR CLOCK STOPWATCH */}
        <section className="lg:col-span-4 order-2 lg:order-2 flex flex-col items-center glass-card p-6 h-fit space-y-6">
          
          <div className="w-full text-center">
            <span className="text-xs font-bold tracking-widest uppercase text-mist block mb-1">
              Visual Time Engine
            </span>
          </div>

          {/* Minimalist Clock Face with Tick marks */}
          <div className={`clock-face shadow-sm flex items-center justify-center ${isStopwatchRunning ? 'running' : ''}`}>
            <div className="clock-center-dot" />
            
            {/* Major Ticks (12, 6, 3, 9) */}
            <div className="absolute top-2 left-1/2 w-0.5 h-3 bg-silver -translate-x-1/2 rounded" />
            <div className="absolute bottom-2 left-1/2 w-0.5 h-3 bg-silver -translate-x-1/2 rounded" />
            <div className="absolute right-2 top-1/2 h-0.5 w-3 bg-silver -translate-y-1/2 rounded" />
            <div className="absolute left-2 top-1/2 h-0.5 w-3 bg-silver -translate-y-1/2 rounded" />

            {/* Minor Ticks (1, 2, 4, 5, 7, 8, 10, 11) */}
            <div className="absolute top-4 right-1/4 w-0.5 h-1.5 bg-steel rotate-[30deg] origin-center rounded" />
            <div className="absolute top-12 right-6 w-0.5 h-1.5 bg-steel rotate-[60deg] origin-center rounded" />
            <div className="absolute bottom-12 right-6 w-0.5 h-1.5 bg-steel rotate-[120deg] origin-center rounded" />
            <div className="absolute bottom-4 right-1/4 w-0.5 h-1.5 bg-steel rotate-[150deg] origin-center rounded" />
            <div className="absolute bottom-4 left-1/4 w-0.5 h-1.5 bg-steel rotate-[210deg] origin-center rounded" />
            <div className="absolute bottom-12 left-6 w-0.5 h-1.5 bg-steel rotate-[240deg] origin-center rounded" />
            <div className="absolute top-12 left-6 w-0.5 h-1.5 bg-steel rotate-[300deg] origin-center rounded" />
            <div className="absolute top-4 left-1/4 w-0.5 h-1.5 bg-steel rotate-[330deg] origin-center rounded" />

            {/* Clock Hands */}
            <div 
              className={`clock-hand h-11 w-1 ${isStopwatchRunning ? 'bg-silver' : 'bg-steel'}`}
              style={{ transform: `translateX(-50%) rotate(${minutesRotation}deg)` }}
            />
            <div 
              className="clock-hand seconds-hand h-16 w-0.5"
              style={{ transform: `translateX(-50%) rotate(${secondsRotation}deg)` }}
            />
          </div>

          {/* Digital Timer Value */}
          <div className={`text-4xl font-bold font-mono tracking-wider select-none transition-colors duration-300 ${isStopwatchRunning ? 'text-cyan-glow glow-cyan' : 'text-snow'}`}>
            {formatStopwatchTime(stopwatchTime)}
          </div>

          {/* Stopwatch Control Action Buttons */}
          <div className="flex items-center space-x-3 w-full justify-center">
            
            {/* Reset Button */}
            <button
              onClick={handleStopwatchReset}
              className="w-11 h-11 rounded-lg border border-gunmetal bg-onyx text-mist hover:text-snow hover:border-steel transition-all flex items-center justify-center active:scale-95"
              title="Reset Timer"
            >
              <RotateCcw size={16} />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={handleStopwatchStartPause}
              className={`h-11 px-6 rounded-lg font-medium flex items-center space-x-2 border transition-all active:scale-[0.98] ${
                isStopwatchRunning
                  ? 'bg-rose-glow/10 border-rose-glow/30 text-rose-glow hover:bg-rose-glow/20'
                  : 'bg-cyan-glow/10 border-cyan-glow/30 text-cyan-glow hover:bg-cyan-glow/20'
              }`}
            >
              {isStopwatchRunning ? <Pause size={14} /> : <Play size={14} />}
              <span className="text-xs uppercase tracking-wider font-semibold">
                {isStopwatchRunning ? 'Pause Engine' : 'Start Engine'}
              </span>
            </button>

          </div>

          {/* Inject Buttons */}
          <div className="pt-6 border-t border-gunmetal w-full">
            <span className="text-[10px] font-bold uppercase tracking-wider text-steel block text-center mb-3">
              Inject time block directly
            </span>
            <div className={`grid gap-2 ${blocks.length <= 3 ? 'grid-cols-3' : blocks.length <= 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
              {blocks.map((block) => (
                <button
                  key={block}
                  disabled={stopwatchTime === 0}
                  onClick={() => handleInject(block)}
                  className={`inject-btn ${getInjectClass(block)}`}
                >
                  {block}
                </button>
              ))}
            </div>
          </div>

          {/* ADD / EDIT BLOCKS BUTTON */}
          <div className="w-full pt-2">
            <button
              onClick={() => setShowBlockEditor(true)}
              className="w-full py-3 rounded-lg text-xs font-semibold uppercase tracking-wider border border-gunmetal bg-onyx text-mist hover:text-snow hover:border-steel hover:bg-gunmetal transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {hasCustomizedBlocks ? (
                <>
                  <Pencil size={13} />
                  Edit Blocks
                </>
              ) : (
                <>
                  <Plus size={13} />
                  Add Blocks
                </>
              )}
            </button>
          </div>

        </section>

        </div>
      </main>

      {/* BLOCK EDITOR MODAL */}
      {showBlockEditor && (
        <BlockEditorModal
          blocks={blocks}
          onSave={handleSaveBlocks}
          onClose={() => setShowBlockEditor(false)}
        />
      )}

    </div>
  );
}
