'use client';

export type ChipOption<T extends string> = { value: T | null; label: string };

export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 px-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
        role="group"
        aria-label={label}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value ?? '__all__'}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                selected
                  ? 'bg-ink-800 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
