import React, { useState, useEffect } from "react";

export interface NumericInputFieldProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  className?: string;
  wrapperClassName?: string;
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
  className = "",
  wrapperClassName = "w-full",
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
    <div
      className={`flex items-center rounded-lg border pg-border bg-slate-50 dark:bg-slate-700/60 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/50 transition-all ${wrapperClassName}`}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={() => handleStep(-step)}
        className="w-7 h-7 shrink-0 flex items-center justify-center bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 border-r pg-border select-none active:scale-95 transition-colors cursor-pointer"
        aria-label="Kurangi nilai"
      >
        −
      </button>
      <div className="relative flex-1 min-w-0 flex items-center justify-center px-1">
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
          className={`w-full h-7 bg-transparent text-center text-xs font-semibold text-slate-900 dark:text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
        />
        {unit && (
          <span className="text-[10px] text-slate-400 dark:text-slate-400 shrink-0 select-none pr-1 font-medium">
            {unit}
          </span>
        )}
      </div>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => handleStep(step)}
        className="w-7 h-7 shrink-0 flex items-center justify-center bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 border-l pg-border select-none active:scale-95 transition-colors cursor-pointer"
        aria-label="Tambah nilai"
      >
        +
      </button>
    </div>
  );
};

export default NumericInputField;
