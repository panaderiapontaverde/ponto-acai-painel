import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

/** Card base reutilizável, em Tailwind puro (sem dependência de shadcn). */
export function Card({ title, subtitle, children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-acai-100 bg-white p-5 shadow-sm ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-3">
          {title && (
            <h3 className="text-sm font-semibold uppercase tracking-wide text-acai-700">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  /** Deixa explícita a granularidade/período do dado, conforme regra do projeto. */
  periodLabel: string;
  hint?: string;
}

/** Card específico para exibir um KPI com granularidade/período sempre visível. */
export function KpiCard({ label, value, periodLabel, hint }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-acai-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-acai-800">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-acai-600">{periodLabel}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
