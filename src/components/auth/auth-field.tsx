type AuthFieldProps = {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
  hint?: string;
};

export function AuthField({
  label,
  name,
  type = "text",
  value,
  onChange,
  autoComplete,
  placeholder,
  required,
  minLength,
  maxLength,
  disabled,
  hint,
}: AuthFieldProps) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        disabled={disabled}
        className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-inner transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {hint ? (
        <span className="mt-1.5 block text-xs text-zinc-500">{hint}</span>
      ) : null}
    </label>
  );
}
