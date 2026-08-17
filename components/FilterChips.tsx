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
      <p className="label">{label}</p>
      <div
        className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4"
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
              className={`shrink-0 rounded-sm border px-3 py-1.5 font-display text-sm uppercase tracking-wide transition ${
                selected
                  ? 'border-violet-900 bg-violet-900 text-white'
                  : 'border-violet-200 bg-white text-violet-600 hover:border-violet-400'
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
