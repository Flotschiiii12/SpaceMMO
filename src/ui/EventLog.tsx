import React from 'react';

export interface LogMessage {
  id: string;
  time: string;
  text: string;
  color?: string;
}

interface EventLogProps {
  logs: LogMessage[];
}

export const EventLog: React.FC<EventLogProps> = ({ logs }) => {
  const visible = logs.slice(-5);

  return (
    <div className="w-72 bg-[#14171d]/85 border border-neutral-800 p-2 text-[11px] font-mono select-none pointer-events-none space-y-1 shadow-lg">
      <div className="text-[9px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800/80 pb-0.5 mb-1">
        TACTICAL COMMS LOG
      </div>
      {visible.length === 0 ? (
        <div className="text-neutral-600 italic text-[10px]">All telemetry nominal...</div>
      ) : (
        visible.map((entry) => (
          <div key={entry.id} className="leading-tight flex items-start space-x-1.5">
            <span className="text-neutral-600 text-[10px] shrink-0">{entry.time}</span>
            <span style={{ color: entry.color || '#eef0f4' }}>{entry.text}</span>
          </div>
        ))
      )}
    </div>
  );
};
