import { motion } from 'framer-motion'
import SectionDivider from '../components/section-divider'

export default function HowItWorks() {
  return (
    <section className="section-demo">
      <div className="container-outer pt-20 md:pt-32">
        <SectionDivider />
      </div>
      <div className="container-outer py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
            How to use Flaek
          </h2>
          <p className="mt-4 text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            Build, deploy, and verify private compute pipelines in three simple steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <StepCard
            step={1}
            title="Define your dataset"
            description="Create a schema with fields, types, and validation rules. Ingest CSV/JSONL via drag-and-drop or API."
            link="Create dataset"
          >
            <div className="aspect-[4/3] rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-wider text-white/50 mb-4">Fields</div>
                <div className="space-y-3">
                  <FieldRow label="income" type="number" required />
                  <FieldRow label="debt_ratio" type="number" required />
                  <FieldRow label="payment_history" type="number" required />
                  <FieldRow label="credit_age" type="number" />
                </div>
              </div>
            </div>
          </StepCard>

          <StepCard
            step={2}
            title="Build your pipeline"
            description="Compose Arcium MXE circuits for private compute. Use pre-built blocks for credit scoring, health risk, or build custom logic with math, stats, and comparisons."
            note="Custom circuit runtime coming soon."
            link="Open builder"
          >
            <div className="aspect-[4/3] rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 flex flex-col justify-center">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <BlockCard name="Average" active size="md" category="stats" />
                  <ArrowRight />
                  <BlockCard name="Weighted Avg" active size="md" category="stats" />
                </div>
                <div className="flex justify-center">
                  <ArrowDown />
                </div>
                <div className="flex items-center justify-center">
                  <BlockCard name="Credit Score" active size="lg" category="usecase" />
                </div>
                <div className="flex justify-center">
                  <ArrowDown />
                </div>
                <div className="flex items-center justify-center gap-3">
                  <BlockCard name="Greater Than" active size="md" category="compare" />
                  <ArrowRight />
                  <BlockCard name="If/Else" size="md" category="logic" />
                </div>
              </div>
            </div>
          </StepCard>

          <StepCard
            step={3}
            title="Run & verify results"
            description="Execute jobs with your dataset and published pipeline. Receive HMAC-signed webhooks with on-chain attestation proofs."
            link="View examples"
          >
            <div className="aspect-[4/3] rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 flex flex-col justify-center">
              <div className="space-y-3">
                <ResultCard
                  label="POST /v1/jobs"
                  sublabel="operation: credit_score_pipeline"
                  status="processing"
                  color="blue"
                />
                <div className="flex justify-center">
                  <ArrowDown />
                </div>
                <ResultCard
                  label="Webhook: job.completed"
                  sublabel="result: { score: 720, approved: true }"
                  status="✓ verified"
                  color="green"
                />
                <div className="mt-3 text-center text-xs text-white/50">
                  x-flaek-signature + finalize_tx
                </div>
              </div>
            </div>
          </StepCard>
        </div>
      </div>
    </section>
  )
}

function StepCard({
  step,
  title,
  description,
  note,
  link,
  children,
}: {
  step: number
  title: string
  description: string
  note?: string
  link: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: step * 0.1 }}
      className="group relative h-full flex flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl p-8 hover:border-white/15 transition-all duration-300"
    >
      <div className="text-xs uppercase tracking-widest text-white/50 mb-3">
        Step {step}
      </div>
      <h3 className="text-2xl md:text-3xl font-semibold mb-3">{title}</h3>
      <p className="text-[15px] text-white/60 leading-relaxed mb-2">
        {description}
      </p>
      {note && (
        <p className="text-[13px] text-accent-500/90 italic mb-6">{note}</p>
      )}

      {children}

      <a
        href="#"
        className="mt-auto pt-6 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors group"
      >
        {link} <span className="group-hover:translate-x-1 transition-transform">→</span>
      </a>
    </motion.div>
  )
}

function FieldRow({
  label,
  type,
  required,
}: {
  label: string
  type: string
  required?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.03] border border-white/5">
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 rounded-full bg-brand-500" />
        <span className="text-sm text-white/85">{label}</span>
      </div>
      <div className="text-xs font-mono text-white/50 text-right">
        <span>{type}</span>
        {required && <span className="ml-1.5">• required</span>}
      </div>
    </div>
  )
}

function BlockCard({ name, active, size, category }: { name: string; active?: boolean; size?: string; category?: string }) {
  const sizeClasses = {
    sm: 'p-3 text-xs min-w-[90px]',
    md: 'p-4 text-sm min-w-[110px]',
    lg: 'p-5 text-base min-w-[140px]',
  }

  const categoryColors = {
    math: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    stats: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    compare: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    usecase: 'from-green-500/20 to-green-600/10 border-green-500/30',
    logic: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
  }

  const bgClass = active && category
    ? categoryColors[category as keyof typeof categoryColors] || 'from-brand-500/20 to-brand-600/10 border-brand-500/30'
    : active
    ? 'border-brand-500/30 bg-gradient-to-br from-brand-500/20 to-brand-600/10'
    : 'border-white/10 bg-white/[0.03]'

  return (
    <div
      className={`relative rounded-xl border text-center font-medium transition-all ${
        sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md
      } ${active ? `bg-gradient-to-br ${bgClass} text-white shadow-lg shadow-brand-500/10` : `${bgClass} text-white/60`}`}
    >
      {active && (
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-brand-500 border-2 border-[#0B0D17]" />
      )}
      {name}
    </div>
  )
}

function ResultCard({
  label,
  sublabel,
  status,
  color,
}: {
  label: string
  sublabel?: string
  status?: string
  color: 'blue' | 'purple' | 'green'
}) {
  const gradientColors = {
    blue: 'bg-gradient-to-br from-blue-500 to-transparent',
    purple: 'bg-gradient-to-br from-purple-500 to-transparent',
    green: 'bg-gradient-to-br from-green-500 to-transparent',
  }

  const dotColors = {
    blue: 'bg-blue-400',
    purple: 'bg-purple-400',
    green: 'bg-green-400',
  }

  return (
    <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-5 overflow-hidden">
      <div className={`absolute inset-0 opacity-10 ${gradientColors[color]}`} />
      <div className="relative">
        <div className="text-xs font-mono text-white/80 mb-1.5">{label}</div>
        {sublabel && <div className="text-xs font-mono text-white/50 mb-2">{sublabel}</div>}
        {status && (
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10">
            <span className={`h-1.5 w-1.5 rounded-full ${dotColors[color]}`} />
            <span className="text-xs text-white/70">{status}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ArrowRight() {
  return (
    <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )
}

function ArrowDown() {
  return (
    <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  )
}

// SectionDivider moved to components/section-divider
