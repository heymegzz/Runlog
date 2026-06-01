import { useState, useEffect } from 'react';
import cronstrue from 'cronstrue';

const PRESETS = [
  { label: 'Every Minute', value: '* * * * *' },
  { label: 'Every 5 Mins', value: '*/5 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily at Midnight', value: '0 0 * * *' },
  { label: 'Weekly (Sun)', value: '0 0 * * 0' },
  { label: 'Monthly (1st)', value: '0 0 1 * *' },
];

const CronBuilder = ({ value, onChange, error }) => {
  const isValidCron = (cronStr) => {
    const parts = cronStr.trim().split(/\s+/);
    return parts.length === 5 || parts.length === 6;
  };

  let humanReadable = '';
  if (isValidCron(value)) {
    try {
      humanReadable = cronstrue.toString(value);
    } catch {
      humanReadable = 'Invalid expression';
    }
  } else {
    humanReadable = 'Cron must have 5 or 6 space-separated fields';
  }

  return (
    <div className="cron-builder">
      <div className="cron-presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            className={`cron-preset-btn ${value === preset.value ? 'selected' : ''}`}
            onClick={() => onChange(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      <input
        type="text"
        className={`cron-expression ${error || humanReadable === 'Invalid expression' ? 'error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="* * * * *"
      />
      
      <div className={`cron-preview ${humanReadable.startsWith('Invalid') || humanReadable.startsWith('Cron') ? 'text-warning' : 'text-success'}`}>
        {humanReadable}
      </div>
    </div>
  );
};

export default CronBuilder;
