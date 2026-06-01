import { useState, useEffect } from 'react';

const PRESETS = [
  { label: 'Every Minute', value: '* * * * *' },
  { label: 'Every 5 Mins', value: '*/5 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily at Midnight', value: '0 0 * * *' },
  { label: 'Weekly (Sun)', value: '0 0 * * 0' },
  { label: 'Monthly (1st)', value: '0 0 1 * *' },
];

const CronBuilder = ({ value, onChange, error }) => {
  // Simple validation logic for UI purposes
  const isValidCron = (cronStr) => {
    const parts = cronStr.trim().split(/\s+/);
    return parts.length === 5 || parts.length === 6;
  };

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
        className={`cron-expression ${error ? 'error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="* * * * *"
      />
      
      {isValidCron(value) ? (
        <div className="cron-preview text-success">
          Valid cron expression
        </div>
      ) : (
        <div className="cron-preview text-warning">
          Cron must have 5 or 6 space-separated fields
        </div>
      )}
    </div>
  );
};

export default CronBuilder;
