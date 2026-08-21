"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Generator");
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
        const halfDelta = delta / 2;
        const new1 = Math.max(0, value[other1] - halfDelta);
        const new2 = Math.max(0, 100 - newValue - new1);
        updated[other1] = Math.round(new1);
        updated[other2] = Math.round(new2);
      } else {
        let newOther1 = value[other1] - (delta * (value[other1] / currentOtherSum));
        let newOther2 = value[other2] - (delta * (value[other2] / currentOtherSum));

        newOther1 = Math.max(0, Math.min(100 - newValue, newOther1));
        newOther2 = Math.max(0, 100 - newValue - newOther1);

        updated[other1] = Math.round(newOther1);
        updated[other2] = Math.round(newOther2);
      }
    }

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

  const total = value.education + value.entertainment + value.marketing;
  const totalOk = total === 100;

  return (
    <div className="space-y-4 neu-pressed p-4 rounded-xl">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold" style={{ color: 'var(--pg-text)' }}>
          {t('composition')}
        </label>
        <span
          className="text-xs font-mono font-bold px-2 py-0.5 rounded"
          style={{
            background: totalOk ? 'rgba(0,184,148,0.15)' : 'rgba(225,112,85,0.15)',
            color: totalOk ? 'var(--pg-success)' : 'var(--pg-danger)',
          }}
        >
          Total: {total}%
        </span>
      </div>

      {/* Education */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium flex items-center gap-1.5" style={{ color: 'var(--pg-text-sub)' }}>
            🎓 {t('education')}
            <button
              type="button"
              onClick={() => toggleLock("education")}
              className="p-1 rounded transition-colors"
              style={{ color: locked.education ? 'var(--pg-warn)' : 'var(--pg-text-muted)' }}
              title={locked.education ? "Buka Gembok" : "Kunci Nilai Ini"}
            >
              {locked.education ? "🔒" : "🔓"}
            </button>
          </span>
          <span className="font-bold" style={{ color: 'var(--pg-text)' }}>{value.education}%</span>
        </div>
        <input
          type="range"
          min="0" max="100"
          disabled={locked.education}
          value={value.education}
          onChange={(e) => handleSliderChange("education", parseInt(e.target.value, 10))}
          className="w-full disabled:opacity-40 cursor-pointer"
          style={{ accentColor: 'var(--pg-brand)' }}
        />
      </div>

      {/* Entertainment */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium flex items-center gap-1.5" style={{ color: 'var(--pg-text-sub)' }}>
            🎭 {t('entertainment')}
            <button
              type="button"
              onClick={() => toggleLock("entertainment")}
              className="p-1 rounded transition-colors"
              style={{ color: locked.entertainment ? 'var(--pg-warn)' : 'var(--pg-text-muted)' }}
              title={locked.entertainment ? "Buka Gembok" : "Kunci Nilai Ini"}
            >
              {locked.entertainment ? "🔒" : "🔓"}
            </button>
          </span>
          <span className="font-bold" style={{ color: 'var(--pg-text)' }}>{value.entertainment}%</span>
        </div>
        <input
          type="range"
          min="0" max="100"
          disabled={locked.entertainment}
          value={value.entertainment}
          onChange={(e) => handleSliderChange("entertainment", parseInt(e.target.value, 10))}
          className="w-full disabled:opacity-40 cursor-pointer"
          style={{ accentColor: '#a855f7' }}
        />
      </div>

      {/* Marketing */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium flex items-center gap-1.5" style={{ color: 'var(--pg-text-sub)' }}>
            🚀 {t('marketing')}
            <button
              type="button"
              onClick={() => toggleLock("marketing")}
              className="p-1 rounded transition-colors"
              style={{ color: locked.marketing ? 'var(--pg-warn)' : 'var(--pg-text-muted)' }}
              title={locked.marketing ? "Buka Gembok" : "Kunci Nilai Ini"}
            >
              {locked.marketing ? "🔒" : "🔓"}
            </button>
          </span>
          <span className="font-bold" style={{ color: 'var(--pg-text)' }}>{value.marketing}%</span>
        </div>
        <input
          type="range"
          min="0" max="100"
          disabled={locked.marketing}
          value={value.marketing}
          onChange={(e) => handleSliderChange("marketing", parseInt(e.target.value, 10))}
          className="w-full disabled:opacity-40 cursor-pointer"
          style={{ accentColor: '#10b981' }}
        />
      </div>
    </div>
  );
}
