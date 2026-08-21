"use client";

import React, { useState, useEffect } from "react";

export interface PresetOption {
  value: string | number;
  label: string;
}

interface PresetSelectProps {
  label?: string;
  value: string | number;
  onChange: (val: string | number) => void;
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
  const isValueInOptions = options.some(
    (opt: PresetOption) => String(opt.value) === String(value)
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
      const initialCustom = customValue || "";
      if (type === "number") {
        onChange(initialCustom ? parseFloat(initialCustom) : "");
      } else {
        onChange(initialCustom);
      }
    } else {
      const matchedOpt = options.find((opt) => String(opt.value) === selected);
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
        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--pg-text)' }}>
          {label} {required && <span style={{ color: 'var(--pg-danger)' }}>*</span>}
        </label>
      )}

      <div className="space-y-2">
        <select
          value={selectedOption}
          onChange={handleSelectChange}
          className="w-full px-4 py-2.5 text-sm font-medium outline-none transition-all neu-input"
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
              className="w-full px-4 py-2.5 text-sm font-medium outline-none transition-all neu-input"
              style={{ borderColor: 'var(--pg-brand)' }}
              required={required}
            />
          </div>
        )}
      </div>

      {helpText && <p className="text-xs" style={{ color: 'var(--pg-text-muted)' }}>{helpText}</p>}
    </div>
  );
};
