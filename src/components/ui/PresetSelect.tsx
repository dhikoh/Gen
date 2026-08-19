"use client";

import React, { useState, useEffect } from "react";

export interface PresetOption {
  value: string | number;
  label: string;
}

interface PresetSelectProps {
  label?: string;
  value: string | number;
  onChange: (val: any) => void;
  options: PresetOption[];
  placeholder?: string;
  customLabel?: string;
  type?: "text" | "number";
  step?: string;
  min?: number;
  max?: number;
  className?: string;
  helpText?: string;
  required?: boolean;
}

export const CUSTOM_PRESET_KEY = "__CUSTOM__";

export const PresetSelect: React.FC<PresetSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Masukkan nilai kustom...",
  customLabel = "✏️ Kustom / Isi Sendiri...",
  type = "text",
  step,
  min,
  max,
  className = "",
  helpText,
  required = false,
}) => {
  // Check if current value matches any preset option
  const isValueInOptions = options.some(
    (opt) => String(opt.value) === String(value)
  );

  const [selectedOption, setSelectedOption] = useState<string>(() => {
    if (!value && value !== 0) {
      return options[0]?.value ? String(options[0].value) : CUSTOM_PRESET_KEY;
    }
    return isValueInOptions ? String(value) : CUSTOM_PRESET_KEY;
  });

  const [customValue, setCustomValue] = useState<string>(() => {
    return isValueInOptions ? "" : String(value ?? "");
  });

  // Sync state when props value change externally
  useEffect(() => {
    const matched = options.some((opt) => String(opt.value) === String(value));
    if (matched) {
      setSelectedOption(String(value));
    } else if (value !== undefined && value !== null && value !== "") {
      setSelectedOption(CUSTOM_PRESET_KEY);
      setCustomValue(String(value));
    }
  }, [value, options]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setSelectedOption(selected);

    if (selected === CUSTOM_PRESET_KEY) {
      // Switch to custom, pass current customValue or empty
      const initialCustom = customValue || "";
      if (type === "number") {
        onChange(initialCustom ? parseFloat(initialCustom) : "");
      } else {
        onChange(initialCustom);
      }
    } else {
      // Selected a preset
      const matchedOpt = options.find(
        (opt) => String(opt.value) === selected
      );
      if (matchedOpt) {
        onChange(matchedOpt.value);
      } else {
        onChange(selected);
      }
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setCustomValue(rawVal);

    if (type === "number") {
      const parsed = parseFloat(rawVal);
      onChange(isNaN(parsed) ? "" : parsed);
    } else {
      onChange(rawVal);
    }
  };

  const isCustomMode = selectedOption === CUSTOM_PRESET_KEY;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-200">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <div className="space-y-2">
        <select
          value={selectedOption}
          onChange={handleSelectChange}
          className="w-full rounded-xl border border-slate-700/60 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          {options.map((opt, idx) => (
            <option key={`${opt.value}-${idx}`} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
          <option value={CUSTOM_PRESET_KEY}>{customLabel}</option>
        </select>

        {isCustomMode && (
          <div className="relative animate-fadeIn">
            <input
              type={type}
              step={step}
              min={min}
              max={max}
              value={customValue}
              onChange={handleCustomInputChange}
              placeholder={placeholder}
              className="w-full rounded-xl border border-indigo-500/50 bg-slate-950/90 px-3.5 py-2.5 text-sm text-indigo-100 placeholder-slate-500 shadow-inner transition-all focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              required={required}
            />
          </div>
        )}
      </div>

      {helpText && <p className="text-xs text-slate-400">{helpText}</p>}
    </div>
  );
};
