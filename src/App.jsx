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
  Check,
  PenLine,
  GripVertical,
  AlertCircle
} from 'lucide-react';

// Helper to get local date string in YYYY-MM-DD format (timezone independent)
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayStr = getLocalDateString();

// ─── FIRST-VISIT MODAL ───────────────────────────────────────────────────────
function BlockSetupModal({ onComplete }) {
  const [blocks, setBlocks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const addBlock = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (!trimmed) return;
    if (trimmed.length > 20) { setError('Block name must be 20 characters or less.'); return; }
    if (blocks.includes(trimmed)) { setError('You already added that block.'); return; }
    setBlocks(prev => [...prev, trimmed]);
    setInputValue('');
    setError('');
  };

  const removeBlock = (block) => setBlocks(prev => prev.filter(b => b !== block));

  const handleKeyDown = (e) => { if (e.key === 'Enter') addBlock(); };

  const handleComplete = () => {
    if (blocks.length === 0) { setError('Add at least one block to continue.'); return; }
    onComplete(blocks);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(60,65,65,0.45)', backdropFilter: 'blur(8px)' }}
    >
      <div className="bg-white border border-pewter rounded-2xl shadow-[0_16px_64px_rgba(105,114,114,0.22)] w-full max-w-[460px] flex flex-col animate-modal-in overflow-hidden">

        {/* Gradient top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-pewter via-slate to-gray" />

        <div className="p-8 flex flex-col gap-7">

          {/* Step badge + heading */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ivory border border-pewter text-[10px] font-bold tracking-[0.18em] uppercase text-slate">
                <PenLine size={10} />
                First-time setup
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray tracking-tight leading-tight">
              What do you want<br />to track?
            </h2>
            <p className="text-[12px] text-slate leading-relaxed">
              Name your study blocks — things like <em>DSA</em>, <em>Dev</em>, <em>Reading</em>, <em>Math</em>. Each block becomes a trackable category. You can always edit them later.
            </p>
          </div>

          {/* Input */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate">Block name</label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="e.g. DSA, Dev, Maths, Reading..."
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                maxLength={20}
                className="flex-1 text-sm bg-ivory border border-pewter rounded-xl px-4 py-3 focus:outline-none focus:border-gray text-gray placeholder:text-slate font-medium transition-colors"
              />
              <button
                onClick={addBlock}
                className="px-4 h-12 flex items-center gap-1.5 rounded-xl border border-gray bg-gray text-ivory text-xs font-bold tracking-wider hover:bg-sage-hover active:scale-95 transition-all shrink-0"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
            {error ? (
              <div className="flex items-center gap-1.5 text-[11px] text-terracotta-hover">
                <AlertCircle size={12} />
                <span>{error}</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate/60">Press <kbd className="px-1.5 py-0.5 bg-ivory border border-pewter rounded text-[10px] font-mono">Enter</kbd> or click Add</p>
            )}
          </div>

          {/* Block list — numbered, card style */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate">Your blocks</span>
              {blocks.length > 0 && (
                <span className="text-[10px] font-bold text-gray bg-ivory border border-pewter rounded-full px-2.5 py-0.5">
                  {blocks.length} block{blocks.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {blocks.length === 0 ? (
              <div className="border border-dashed border-pewter rounded-xl py-6 flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-ivory border border-pewter flex items-center justify-center">
                  <Plus size={14} className="text-slate" />
                </div>
                <p className="text-[11px] text-slate/60 text-center">Your blocks will appear here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
                {blocks.map((block, i) => (
                  <div
                    key={block}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-pewter bg-ivory group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-white border border-pewter text-[10px] font-bold text-slate flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm font-bold tracking-widest uppercase text-gray">{block}</span>
                    </div>
                    <button
                      onClick={() => removeBlock(block)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg border border-transparent text-slate hover:text-gray hover:border-pewter hover:bg-white transition-all"
                      title={`Remove ${block}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={handleComplete}
            disabled={blocks.length === 0}
            className={`w-full h-12 rounded-xl text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              blocks.length > 0
                ? 'bg-gray text-ivory hover:bg-sage-hover shadow-sm'
                : 'bg-ivory border border-pewter text-slate cursor-not-allowed'
            }`}
          >
            <Check size={16} />
            {blocks.length === 0 ? 'Add a block to continue' : `Start Tracking with ${blocks.length} block${blocks.length !== 1 ? 's' : ''}`}
          </button>

        </div>
      </div>
    </div>
  );
}

// ─── EDIT BLOCKS PANEL ───────────────────────────────────────────────────────
function EditBlocksPanel({ blocks, onSave, onClose, onReset }) {
  const [localBlocks, setLocalBlocks] = useState([...blocks]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const addBlock = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (!trimmed) return;
    if (trimmed.length > 20) { setError('Max 20 characters.'); return; }
    if (localBlocks.includes(trimmed)) { setError('Block already exists.'); return; }
    setLocalBlocks(prev => [...prev, trimmed]);
    setInputValue('');
    setError('');
  };

  const removeBlock = (block) => {
    setLocalBlocks(prev => prev.filter(b => b !== block));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addBlock();
  };

  const handleSave = () => {
    if (localBlocks.length === 0) { setError('You need at least one block.'); return; }
    onSave(localBlocks);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(105,114,114,0.12)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div className="fixed top-0 right-0 h-full w-80 z-50 bg-white border-l border-pewter shadow-[−8px_0_40px_rgba(105,114,114,0.12)] flex flex-col animate-panel-in">

        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-pewter">
          <div className="flex items-center gap-2">
            <Settings size={15} className="text-slate" />
            <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray">Edit Blocks</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-pewter text-slate hover:text-gray hover:border-gray/40 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          <p className="text-[11px] text-slate leading-relaxed">
            Add or remove blocks. Changes apply to the <strong>dropdown</strong> and <strong>inject buttons</strong>. Existing log entries keep their original block label.
          </p>

          {/* Input */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="New block name..."
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                maxLength={20}
                className="flex-1 text-sm bg-ivory border border-pewter rounded-lg px-3 py-2 focus:outline-none focus:border-gray text-gray placeholder:text-slate font-medium"
              />
              <button
                onClick={addBlock}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-pewter bg-gray text-ivory hover:bg-sage-hover transition-all active:scale-95 shrink-0"
              >
                <Plus size={14} />
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-[11px] text-terracotta-hover">
                <AlertCircle size={11} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Block List */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate">Your Blocks</span>
            {localBlocks.length === 0 ? (
              <p className="text-[11px] text-slate/60 italic py-3">No blocks. Add one above.</p>
            ) : (
              localBlocks.map(block => (
                <div
                  key={block}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-pewter bg-ivory group"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical size={12} className="text-slate/40" />
                    <span className="text-[11px] font-bold tracking-widest uppercase text-gray">{block}</span>
                  </div>
                  <button
                    onClick={() => removeBlock(block)}
                    className="w-6 h-6 flex items-center justify-center rounded border border-pewter bg-white text-slate hover:text-gray hover:border-gray/40 transition-all"
                    title={`Remove ${block}`}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Panel Footer */}
        <div className="px-6 py-4 border-t border-pewter flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-pewter text-slate text-xs font-semibold hover:border-gray/40 hover:text-gray transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-10 rounded-lg bg-gray text-ivory text-xs font-semibold hover:bg-sage-hover active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <Check size={13} />
              Save
            </button>
          </div>
          {/* Re-run setup */}
          <button
            onClick={onReset}
            className="w-full h-8 rounded-lg border border-dashed border-pewter text-slate text-[10px] font-semibold hover:border-gray/40 hover:text-gray transition-all tracking-wider uppercase"
          >
            ↺ Re-run first-time setup
          </button>
        </div>

      </div>
    </>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {

  // ── Custom Blocks ──
  const [customBlocks, setCustomBlocks] = useState(() => {
    try {
      const saved = localStorage.getItem('hypertrack_custom_blocks');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null; // null = first visit
  });

  const [showEditPanel, setShowEditPanel] = useState(false);

  // Persist blocks
  useEffect(() => {
    if (customBlocks !== null) {
      localStorage.setItem('hypertrack_custom_blocks', JSON.stringify(customBlocks));
    }
  }, [customBlocks]);

  const handleBlockSetupComplete = (blocks) => {
    setCustomBlocks(blocks);
  };

  const handleSaveBlocks = (blocks) => {
    setCustomBlocks(blocks);
    setShowEditPanel(false);
  };

  // Reset to first-visit setup
  const handleResetSetup = () => {
    setShowEditPanel(false);
    setCustomBlocks(null);
    localStorage.removeItem('hypertrack_custom_blocks');
  };

  // ── Time Logs ──
  const [timeLogs, setTimeLogs] = useState(() => {
    try {
      const cached = localStorage.getItem('hypertrack_excel_logs');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem('hypertrack_excel_logs', JSON.stringify(timeLogs));
  }, [timeLogs]);

  // ── Stopwatch ──
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchIntervalRef = useRef(null);

  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(stopwatchIntervalRef.current);
    }
    return () => clearInterval(stopwatchIntervalRef.current);
  }, [isStopwatchRunning]);

  // ── Insert Form ──
  const [insertForm, setInsertForm] = useState({
    date: todayStr,
    block: '',
    hours: '',
    minutes: '',
    note: ''
  });

  // Keep insert form block in sync when blocks change
  useEffect(() => {
    if (customBlocks && customBlocks.length > 0) {
      setInsertForm(prev => ({
        ...prev,
        block: customBlocks.includes(prev.block) ? prev.block : customBlocks[0]
      }));
    }
  }, [customBlocks]);

  const newlyCreatedRowIdRef = useRef(null);
  const [showSummary, setShowSummary] = useState(false);

  // ── Stopwatch Handlers ──
  const handleStopwatchStartPause = () => setIsStopwatchRunning(prev => !prev);
  const handleStopwatchReset = () => {
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
  };

  const handleInject = (blockType) => {
    if (stopwatchTime === 0) return;
    setIsStopwatchRunning(false);
    const newId = Date.now().toString();
    const newLog = { id: newId, date: insertForm.date || todayStr, block: blockType, duration: stopwatchTime, note: '' };
    setTimeLogs(prev => [newLog, ...prev]);
    setStopwatchTime(0);
    newlyCreatedRowIdRef.current = newId;
  };

  useEffect(() => {
    if (newlyCreatedRowIdRef.current) {
      const el = document.getElementById(`note-input-${newlyCreatedRowIdRef.current}`);
      if (el) el.focus();
      newlyCreatedRowIdRef.current = null;
    }
  }, [timeLogs]);

  // ── Excel Actions ──
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
    setTimeLogs(prev => [newLog, ...prev]);
    setInsertForm(prev => ({ ...prev, hours: '', minutes: '', note: '' }));
  };

  const handleUpdateNote = (id, newNote) => {
    setTimeLogs(prev => prev.map(log => log.id === id ? { ...log, note: newNote } : log));
  };

  const handleDeleteRow = (id) => {
    setTimeLogs(prev => prev.filter(log => log.id !== id));
  };

  // ── Formatters ──
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

  const formatHoursDecimal = (totalSeconds) => {
    const hrs = totalSeconds / 3600;
    return hrs > 0 ? `${hrs.toFixed(2)} hrs` : '0.00 hrs';
  };

  // ── Aggregates ──
  const totalSecondsAll = timeLogs.reduce((acc, log) => acc + log.duration, 0);

  const getBlockTotal = (block) =>
    timeLogs.filter(log => log.block === block).reduce((acc, log) => acc + log.duration, 0);

  // ── Clock ──
  const secondsRotation = stopwatchTime * 6;
  const minutesRotation = (stopwatchTime / 60) * 6;

  // ── Blocks list (safe fallback) ──
  const blocks = customBlocks && customBlocks.length > 0 ? customBlocks : [];

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── FIRST VISIT MODAL ── */}
      {customBlocks === null && (
        <BlockSetupModal onComplete={handleBlockSetupComplete} />
      )}

      {/* ── EDIT BLOCKS PANEL ── */}
      {showEditPanel && customBlocks !== null && (
        <EditBlocksPanel
          blocks={customBlocks}
          onSave={handleSaveBlocks}
          onClose={() => setShowEditPanel(false)}
          onReset={handleResetSetup}
        />
      )}

      <div className="min-h-screen bg-ivory text-gray flex flex-col font-sans transition-colors duration-300 overflow-x-hidden">

        <main className="flex-1 max-w-[1500px] w-full mx-auto px-6 sm:px-8 pt-8 sm:pt-10 pb-8 min-w-0">

          {/* PAGE HEADER */}
          <header className="mb-8 lg:mb-10 relative w-full flex items-start justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-[0.25em] text-gray uppercase">
              TIMELEDGER
            </h1>

            <div className="flex flex-col items-end gap-2">
              <p className="text-[10px] text-slate font-semibold tracking-wider uppercase text-right leading-relaxed">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>

              {/* Edit Blocks Button */}
              {customBlocks !== null && (
                <button
                  onClick={() => setShowEditPanel(true)}
                  className="flex items-center gap-1.5 h-7 px-3 text-[10px] font-semibold rounded border border-pewter bg-card-bg hover:bg-card-hover text-slate hover:text-gray transition-all tracking-wider uppercase"
                  title="Edit your study blocks"
                >
                  <Settings size={11} />
                  <span>Edit Blocks</span>
                </button>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-w-0">

            {/* LEFT COLUMN: SPREADSHEET */}
            <section className="lg:col-span-8 order-1 lg:order-1 flex flex-col space-y-4 min-w-0">

              <div className="excel-table-container min-w-0">
                <div className="overflow-x-auto lg:overflow-x-visible">
                  <table className="w-full table-fixed border-collapse text-left text-sm min-w-[750px] lg:min-w-0">
                    <thead>
                      <tr className="bg-card-bg border-b border-pewter">
                        <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-slate w-[18%]">Date</th>
                        <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-slate w-[12%]">Block</th>
                        <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-slate w-[18%]">Duration</th>
                        <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-slate w-[42%]">Description / Notes</th>
                        <th scope="col" className="p-5 text-xs font-semibold uppercase tracking-wider text-slate w-[10%] text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pewter">

                      {/* INSERT ROW */}
                      <tr className="bg-card-bg/60">
                        <td className="p-4 border-r border-pewter">
                          <input
                            type="date"
                            value={insertForm.date}
                            onChange={e => setInsertForm(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full max-w-full min-w-0 text-sm text-left bg-white border border-pewter rounded pl-3 pr-1 py-2.5 h-14 focus:outline-none focus:border-gray text-gray font-medium"
                          />
                        </td>

                        <td className="p-4 border-r border-pewter">
                          {blocks.length > 0 ? (
                            <select
                              value={insertForm.block}
                              onChange={e => setInsertForm(prev => ({ ...prev, block: e.target.value }))}
                              className="w-full text-sm bg-white border border-pewter rounded px-4 py-2.5 h-14 focus:outline-none focus:border-gray text-gray font-semibold"
                            >
                              {blocks.map(b => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="w-full h-14 flex items-center justify-center text-[11px] text-slate italic">
                              No blocks
                            </div>
                          )}
                        </td>

                        <td className="p-4 border-r border-pewter">
                          <div className="flex space-x-1">
                            <input
                              type="number" placeholder="H" min="0" max="23"
                              value={insertForm.hours}
                              onChange={e => setInsertForm(prev => ({ ...prev, hours: e.target.value }))}
                              className="w-1/2 text-sm text-center bg-white border border-pewter rounded py-2.5 h-14 focus:outline-none focus:border-gray text-gray font-mono placeholder:text-slate"
                            />
                            <input
                              type="number" placeholder="M" min="0" max="59"
                              value={insertForm.minutes}
                              onChange={e => setInsertForm(prev => ({ ...prev, minutes: e.target.value }))}
                              className="w-1/2 text-sm text-center bg-white border border-pewter rounded py-2.5 h-14 focus:outline-none focus:border-gray text-gray font-mono placeholder:text-slate"
                            />
                          </div>
                        </td>

                        <td className="p-4 border-r border-pewter">
                          <input
                            type="text" placeholder="Log new sheet description..."
                            value={insertForm.note}
                            onChange={e => setInsertForm(prev => ({ ...prev, note: e.target.value }))}
                            className="w-full text-sm bg-white border border-pewter rounded px-4 py-2.5 h-14 focus:outline-none focus:border-gray text-gray placeholder:text-slate"
                          />
                        </td>

                        <td className="p-4 text-center">
                          <button
                            onClick={handleAddRow}
                            disabled={!(parseInt(insertForm.hours) > 0 || parseInt(insertForm.minutes) > 0) || blocks.length === 0}
                            className={`w-full h-14 flex items-center justify-center rounded border transition-all ${
                              (parseInt(insertForm.hours) > 0 || parseInt(insertForm.minutes) > 0) && blocks.length > 0
                                ? 'bg-gray border-gray text-ivory hover:bg-sage-hover cursor-pointer'
                                : 'bg-card-bg border-pewter text-slate cursor-not-allowed'
                            }`}
                            title="Add record"
                          >
                            <Plus size={16} />
                          </button>
                        </td>
                      </tr>

                      {/* LOG ENTRIES */}
                      {timeLogs.length > 0 ? (
                        timeLogs.map(log => (
                          <tr key={log.id} className="hover:bg-card-bg/70 transition-colors">
                            <td className="p-5 font-mono text-xs border-r border-pewter text-slate">{log.date}</td>
                            <td className="p-5 border-r border-pewter">
                              <span className="text-[10px] font-bold px-4 py-2.5 rounded border tracking-widest uppercase bg-ivory text-gray border-pewter">
                                {log.block}
                              </span>
                            </td>
                            <td className="p-5 font-mono text-sm font-semibold border-r border-pewter text-gray">
                              {formatTableDuration(log.duration)}
                            </td>
                            <td className="p-4 border-r border-pewter">
                              <input
                                id={`note-input-${log.id}`}
                                type="text"
                                value={log.note}
                                onChange={e => handleUpdateNote(log.id, e.target.value)}
                                placeholder="Add cell note..."
                                className="excel-input text-sm px-3 py-2 focus:bg-white text-slate focus:text-gray leading-relaxed font-sans"
                              />
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleDeleteRow(log.id)}
                                className="w-10 h-10 mx-auto flex items-center justify-center rounded border border-pewter bg-card-bg text-slate hover:text-gray hover:border-gray/40 hover:bg-pewter/30 transition-all"
                                title="Delete Row"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate">
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Clock size={20} className="text-slate" />
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate">No Time Blocks Logged</span>
                              <span className="text-[11px] text-slate max-w-[280px]">Log manually above or run the stopwatch on the right.</span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* SUMMARY FOOTER ROW — dynamic per block */}
                      {showSummary && (
                        <tr className="bg-card-bg font-medium text-gray border-t-2 border-pewter">
                          <td className="p-5 text-xs font-bold uppercase tracking-wider text-slate border-r border-pewter">Total SUM</td>
                          <td className="p-5 border-r border-pewter" />
                          <td className="p-5 font-mono text-sm font-bold border-r border-pewter text-gray">
                            {formatTableDuration(totalSecondsAll)}
                          </td>
                          <td className="p-5 text-xs text-slate leading-relaxed" colSpan="2">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              {blocks.map(b => (
                                <span key={b}>
                                  {b}: <strong className="text-gray font-semibold">{formatHoursDecimal(getBlockTotal(b))}</strong>
                                </span>
                              ))}
                              {/* Also show any legacy blocks in logs that aren't in current list */}
                              {[...new Set(timeLogs.map(l => l.block))]
                                .filter(b => !blocks.includes(b))
                                .map(b => (
                                  <span key={b} className="opacity-60">
                                    {b}: <strong className="font-semibold">{formatHoursDecimal(getBlockTotal(b))}</strong>
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
                  className="h-10 px-4 text-xs font-semibold rounded border border-pewter bg-card-bg hover:bg-card-hover text-gray transition-all flex items-center space-x-1.5 active:scale-95"
                >
                  <span>{showSummary ? 'Hide Sum Totals' : 'Show Sum Totals'}</span>
                </button>
              </div>

            </section>

            {/* RIGHT COLUMN: STOPWATCH */}
            <section className="lg:col-span-4 order-2 lg:order-2 flex flex-col items-center p-6 border border-pewter rounded-2xl bg-card-bg shadow-[0_2px_20px_rgba(105,114,114,0.1)] h-fit space-y-6">

              <div className="w-full text-center">
                <span className="text-xs font-bold tracking-widest uppercase text-slate block mb-1">Visual Time Engine</span>
              </div>

              {/* Clock Face */}
              <div className={`clock-face shadow-sm flex items-center justify-center ${isStopwatchRunning ? 'border-slate' : ''}`}>
                <div className="clock-center-dot" />
                <div className="absolute top-1 left-1/2 w-0.5 h-3 bg-gray -translate-x-1/2" />
                <div className="absolute bottom-1 left-1/2 w-0.5 h-3 bg-gray -translate-x-1/2" />
                <div className="absolute right-1 top-1/2 h-0.5 w-3 bg-gray -translate-y-1/2" />
                <div className="absolute left-1 top-1/2 h-0.5 w-3 bg-gray -translate-y-1/2" />
                <div className="absolute top-4 right-1/4 w-0.5 h-1.5 bg-slate rotate-[30deg] origin-center" />
                <div className="absolute top-12 right-6 w-0.5 h-1.5 bg-slate rotate-[60deg] origin-center" />
                <div className="absolute bottom-12 right-6 w-0.5 h-1.5 bg-slate rotate-[120deg] origin-center" />
                <div className="absolute bottom-4 right-1/4 w-0.5 h-1.5 bg-slate rotate-[150deg] origin-center" />
                <div className="absolute bottom-4 left-1/4 w-0.5 h-1.5 bg-slate rotate-[210deg] origin-center" />
                <div className="absolute bottom-12 left-6 w-0.5 h-1.5 bg-slate rotate-[240deg] origin-center" />
                <div className="absolute top-12 left-6 w-0.5 h-1.5 bg-slate rotate-[300deg] origin-center" />
                <div className="absolute top-4 left-1/4 w-0.5 h-1.5 bg-slate rotate-[330deg] origin-center" />
                <div
                  className={`clock-hand h-11 w-1 ${isStopwatchRunning ? 'bg-slate' : 'bg-pewter'}`}
                  style={{ transform: `translateX(-50%) rotate(${minutesRotation}deg)` }}
                />
                <div
                  className="clock-hand h-16 w-0.5 bg-gray"
                  style={{ transform: `translateX(-50%) rotate(${secondsRotation}deg)` }}
                />
              </div>

              {/* Digital Timer */}
              <div className={`text-4xl font-bold font-mono tracking-wider select-none ${isStopwatchRunning ? 'text-slate' : 'text-gray'}`}>
                {formatStopwatchTime(stopwatchTime)}
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-3 w-full justify-center">
                <button
                  onClick={handleStopwatchReset}
                  className="w-11 h-11 rounded-lg border border-pewter bg-ivory text-slate hover:text-gray hover:border-slate transition-all flex items-center justify-center active:scale-95"
                  title="Reset Timer"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={handleStopwatchStartPause}
                  className={`h-11 px-6 rounded-lg font-medium flex items-center space-x-2 border transition-all active:scale-[0.98] ${
                    isStopwatchRunning
                      ? 'bg-slate border-slate text-ivory hover:bg-terracotta-hover'
                      : 'bg-gray border-gray text-ivory hover:bg-sage-hover'
                  }`}
                >
                  {isStopwatchRunning ? <Pause size={14} /> : <Play size={14} />}
                  <span className="text-xs uppercase tracking-wider font-semibold">
                    {isStopwatchRunning ? 'Pause Engine' : 'Start Engine'}
                  </span>
                </button>
              </div>

              {/* INJECT BUTTONS — fully dynamic */}
              <div className="pt-6 border-t border-pewter w-full">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate block text-center mb-3">
                  Inject time block directly
                </span>

                {blocks.length === 0 ? (
                  <p className="text-[11px] text-slate/60 italic text-center py-2">
                    No blocks configured — use "Edit Blocks" above.
                  </p>
                ) : (
                  <div className={`grid gap-2 ${blocks.length <= 2 ? 'grid-cols-2' : blocks.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {blocks.map(block => (
                      <button
                        key={block}
                        disabled={stopwatchTime === 0}
                        onClick={() => handleInject(block)}
                        className={`h-11 text-xs font-semibold rounded-lg border transition-all truncate px-2 ${
                          stopwatchTime === 0
                            ? 'border-pewter bg-ivory text-slate/60 cursor-not-allowed'
                            : 'border-pewter bg-ivory text-gray hover:bg-gray hover:border-gray hover:text-ivory active:scale-95'
                        }`}
                        title={block}
                      >
                        {block}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </section>

          </div>
        </main>

      </div>
    </>
  );
}
