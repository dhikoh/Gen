"use client";

import { useState } from "react";

interface CompositionValues {
  education: number;
  entertainment: number;
  marketing: number;
}

interface Props {
  value: CompositionValues;
  onChange: (val: CompositionValues) => void;
}

export default function CompositionSliderGroup({ value, onChange }: Props) {
  const [locked, setLocked] = useState<{
    education: boolean;
    entertainment: boolean;
    marketing: boolean;
  }>({
    education: false,
    entertainment: false,
    marketing: false,
  });

  const toggleLock = (key: keyof CompositionValues) => {
    setLocked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSliderChange = (changedKey: keyof CompositionValues, newValue: number) => {
    if (locked[changedKey]) return;

    const currentVal = value[changedKey];
    const delta = newValue - currentVal;

    const keys: (keyof CompositionValues)[] = ["education", "entertainment", "marketing"];
    const otherKeys = keys.filter((k) => k !== changedKey);
    const unlockedOthers = otherKeys.filter((k) => !locked[k]);

    // If all others locked or none unlocked to absorb delta
    if (unlockedOthers.length === 0) return;

    let updated = { ...value, [changedKey]: newValue };

    if (unlockedOthers.length === 1) {
      const soleOther = unlockedOthers[0];
      const lockedSum = keys
        .filter((k) => k !== changedKey && k !== soleOther)
        .reduce((sum, k) => sum + value[k], 0);

      let newOtherVal = 100 - newValue - lockedSum;
      if (newOtherVal < 0) {
        newOtherVal = 0;
        updated[changedKey] = 100 - lockedSum;
      }
      updated[soleOther] = newOtherVal;
    } else if (unlockedOthers.length === 2) {
      const [other1, other2] = unlockedOthers;
      const currentOtherSum = value[other1] + value[other2];

      if (currentOtherSum === 0) {
        // Distribute delta equally
        const halfDelta = delta / 2;
        let new1 = Math.max(0, value[other1] - halfDelta);
        let new2 = Math.max(0, 100 - newValue - new1);
        updated[other1] = Math.round(new1);
        updated[other2] = Math.round(new2);
      } else {
        // Proportional distribution
        let newOther1 = value[other1] - (delta * (value[other1] / currentOtherSum));
        let newOther2 = value[other2] - (delta * (value[other2] / currentOtherSum));

        newOther1 = Math.max(0, Math.min(100 - newValue, newOther1));
        newOther2 = Math.max(0, 100 - newValue - newOther1);

        updated[other1] = Math.round(newOther1);
        updated[other2] = Math.round(newOther2);
      }
    }

    // Ensure total sum strictly equals 100
    const total = updated.education + updated.entertainment + updated.marketing;
    if (total !== 100) {
      const diff = 100 - total;
      if (unlockedOthers.length > 0) {
        const targetOther = unlockedOthers[0];
        updated[targetOther] = Math.max(0, updated[targetOther] + diff);
      }
    }

    onChange(updated);
  };

  return (
    <div className="space-y-4 bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-zinc-900 dark:text-white">
          Komposisi Konten (Total 100%)
        </label>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
          Total: {value.education + value.entertainment + value.marketing}%
        </span>
      </div>

      {/* Slider Edukasi */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            🎓 Edukasi & Insights
            <button
              type="button"
              onClick={() => toggleLock("education")}
              className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors ${
                locked.education ? "text-amber-500" : "text-zinc-400"
              }`}
              title={locked.education ? "Buka Gembok" : "Kunci Nilai Ini"}
            >
              {locked.education ? "🔒" : "🔓"}
            </button>
          </span>
          <span className="font-bold text-zinc-900 dark:text-white">{value.education}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          disabled={locked.education}
          value={value.education}
          onChange={(e) => handleSliderChange("education", parseInt(e.target.value, 10))}
          className="w-full accent-blue-600 disabled:opacity-40 cursor-pointer"
        />
      </div>

      {/* Slider Hiburan */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            🎭 Hiburan & Storytelling
            <button
              type="button"
              onClick={() => toggleLock("entertainment")}
              className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors ${
                locked.entertainment ? "text-amber-500" : "text-zinc-400"
              }`}
              title={locked.entertainment ? "Buka Gembok" : "Kunci Nilai Ini"}
            >
              {locked.entertainment ? "🔒" : "🔓"}
            </button>
          </span>
          <span className="font-bold text-zinc-900 dark:text-white">{value.entertainment}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          disabled={locked.entertainment}
          value={value.entertainment}
          onChange={(e) => handleSliderChange("entertainment", parseInt(e.target.value, 10))}
          className="w-full accent-purple-600 disabled:opacity-40 cursor-pointer"
        />
      </div>

      {/* Slider Marketing */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            🚀 Marketing & Hard Sell
            <button
              type="button"
              onClick={() => toggleLock("marketing")}
              className={`p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors ${
                locked.marketing ? "text-amber-500" : "text-zinc-400"
              }`}
              title={locked.marketing ? "Buka Gembok" : "Kunci Nilai Ini"}
            >
              {locked.marketing ? "🔒" : "🔓"}
            </button>
          </span>
          <span className="font-bold text-zinc-900 dark:text-white">{value.marketing}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          disabled={locked.marketing}
          value={value.marketing}
          onChange={(e) => handleSliderChange("marketing", parseInt(e.target.value, 10))}
          className="w-full accent-emerald-600 disabled:opacity-40 cursor-pointer"
        />
      </div>
    </div>
  );
}
