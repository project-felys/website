"use client";

/**
 * Inline expanding picker: collapsed it shows only the active option, opened it
 * expands into a horizontally scrollable strip. Expansion is parent-controlled
 * so only one picker is open at a time, and a collapsed picker keeps its own
 * width — otherwise the open strip shrinks its neighbour's label into a stub.
 *
 * Transitions live only in the open state, and the root transitions just its
 * gap: `transition-all` would interpolate `flex-shrink` (an animatable number)
 * from the collapsed `shrink-0`, leaving the strip unable to shrink while the
 * options grow — its box then pushed past the row and panned the page sideways.
 */
export function OptionPicker({
  label,
  options,
  value,
  open,
  onOpenChange,
  onChange,
}: {
  label: string;
  options: Record<string, string>;
  value: string;
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onChange: (value: string) => void;
}) {
  return (
    <div
      role="listbox"
      aria-label={label}
      className={`flex items-center ${
        open
          ? "min-w-0 gap-3 overflow-x-auto transition-[column-gap] duration-300 ease-out"
          : "shrink-0 gap-0 overflow-hidden"
      }`}
    >
      {Object.entries(options).map(([option, optionLabel]) => {
        const isActive = option === value;
        const isHidden = !open && !isActive;
        return (
          <button
            key={option}
            role="option"
            aria-selected={isActive}
            aria-hidden={isHidden}
            inert={isHidden}
            onClick={() => {
              if (open) {
                onChange(option);
                onOpenChange(false);
              } else {
                onOpenChange(true);
              }
            }}
            className={`shrink-0 overflow-hidden whitespace-nowrap text-sm hover:cursor-pointer hover:text-pink ${
              open ? "transition-all duration-300 ease-out" : ""
            } ${isActive ? "text-pink font-semibold" : "text-neutral-400"} ${
              isHidden ? "max-w-0 opacity-0" : "max-w-40 opacity-100"
            }`}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}
