type SelectProps = {
  label?: string
  error?: string
  helper?: string
  options: Array<{ value: string; label: string }>
} & React.SelectHTMLAttributes<HTMLSelectElement>

export function Select({ label, error, helper, options, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <select
        className={`w-full rounded-lg border bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition cursor-pointer ${
          error
            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-white/10 focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {helper && !error && <p className="text-xs text-white/50">{helper}</p>}
    </div>
  )
}
