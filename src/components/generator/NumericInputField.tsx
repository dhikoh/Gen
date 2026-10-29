import React, { useState, useEffect } from "react";

export interface NumericInputFieldProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  className?: string;
  id?: string;
  ariaLabel?: string;
}

export const NumericInputField: React.FC<NumericInputFieldProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  className = "w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-700 border pg-border rounded-md outline-none dark:text-white text-center",
  id,
  ariaLabel,
}) => {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  const commitValue = (valStr: string) => {
    const parsed = parseInt(valStr, 10);
    if (!Number.isFinite(parsed)) {
      setRaw(String(value));
      return;
    }
    const clamped = Math.max(min, Math.min(max, parsed));
    setRaw(String(clamped));
    onChange(clamped);
  };

  const handleStep = (delta: number) => {
    const current = parseInt(raw, 10);
    const base = Number.isFinite(current) ? current : value;
    const clamped = Math.max(min, Math.min(max, base + delta));
    setRaw(String(clamped));
    onChange(clamped);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        tabIndex={-1}
        onClick={() => handleStep(-step)}
        className="w-6 h-6 shrink-0 flex items-center justify-center rounded border pg-border bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors select-none"
        aria-label="Kurangi nilai"
      >
        −
      </button>
      <input
        id={id}
        aria-label={ariaLabel}
        type="number"
        min={min}
        max={max}
        step={step}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={(e) => commitValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commitValue(e.currentTarget.value);
          }
        }}
        className={className}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => handleStep(step)}
        className="w-6 h-6 shrink-0 flex items-center justify-center rounded border pg-border bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors select-none"
        aria-label="Tambah nilai"
      >
        +
      </button>
      {unit && <span className="text-[11px] pg-text-muted shrink-0 ml-0.5">{unit}</span>}
    </div>
  );
};

export default NumericInputField;
