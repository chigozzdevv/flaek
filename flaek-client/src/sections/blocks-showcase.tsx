import { motion } from 'framer-motion'
import {
  Plus, Minus, X, Divide, Percent, Power,
  ChevronRight, ChevronLeft, Equal, ChevronsUp, ChevronsDown,
  Ampersand, Network, GitBranch, Shuffle,
  BarChart3, TrendingUp, Minimize2, Maximize2, Activity,
  CreditCard, Heart, Vote, Target, Scale
} from 'lucide-react'
import SectionDivider from '../components/section-divider'

const BLOCKS = [
  { id: 'add', name: 'Add', icon: Plus, category: 'math', color: '#3B82F6' },
  { id: 'subtract', name: 'Subtract', icon: Minus, category: 'math', color: '#3B82F6' },
  { id: 'multiply', name: 'Multiply', icon: X, category: 'math', color: '#3B82F6' },
  { id: 'divide', name: 'Divide', icon: Divide, category: 'math', color: '#3B82F6' },
  { id: 'modulo', name: 'Modulo', icon: Percent, category: 'math', color: '#3B82F6' },
  { id: 'power', name: 'Power', icon: Power, category: 'math', color: '#3B82F6' },

  { id: 'greater_than', name: 'Greater', icon: ChevronRight, category: 'comparison', color: '#F97316' },
  { id: 'less_than', name: 'Less', icon: ChevronLeft, category: 'comparison', color: '#F97316' },
  { id: 'equal', name: 'Equal', icon: Equal, category: 'comparison', color: '#F97316' },
  { id: 'greater_equal', name: 'Greater≥', icon: ChevronsUp, category: 'comparison', color: '#F97316' },
  { id: 'less_equal', name: 'Less≤', icon: ChevronsDown, category: 'comparison', color: '#F97316' },

  { id: 'and', name: 'AND', icon: Ampersand, category: 'logical', color: '#06B6D4' },
  { id: 'or', name: 'OR', icon: Network, category: 'logical', color: '#06B6D4' },
  { id: 'not', name: 'NOT', icon: Shuffle, category: 'logical', color: '#06B6D4' },
  { id: 'xor', name: 'XOR', icon: GitBranch, category: 'logical', color: '#06B6D4' },

  { id: 'average', name: 'Average', icon: Activity, category: 'statistical', color: '#8B5CF6' },
  { id: 'sum', name: 'Sum', icon: TrendingUp, category: 'statistical', color: '#8B5CF6' },
  { id: 'min', name: 'Min', icon: Minimize2, category: 'statistical', color: '#8B5CF6' },
  { id: 'max', name: 'Max', icon: Maximize2, category: 'statistical', color: '#8B5CF6' },
  { id: 'median', name: 'Median', icon: BarChart3, category: 'statistical', color: '#8B5CF6' },

  { id: 'credit_score', name: 'Credit Score', icon: CreditCard, category: 'use_case', color: '#10B981' },
  { id: 'health_risk', name: 'Health Risk', icon: Heart, category: 'use_case', color: '#10B981' },
  { id: 'vote_tally', name: 'Vote Tally', icon: Vote, category: 'use_case', color: '#10B981' },
  { id: 'meets_threshold', name: 'Threshold', icon: Target, category: 'use_case', color: '#10B981' },
  { id: 'weighted_average', name: 'Weighted Avg', icon: Scale, category: 'use_case', color: '#10B981' },
]

export default function BlocksShowcase() {
  return (
    <section id="blocks" className="section-demo relative overflow-hidden scroll-mt-24 md:scroll-mt-28">
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0px);
            opacity: 1;
          }
          100% {
            transform: translateY(-20px);
            opacity: 0.3;
          }
        }
        .float-block {
          animation: float-up 3s ease-in-out infinite;
        }
        @media (max-width: 640px) {
          .float-block { animation: none; }
        }
      `}</style>

      <div className="container-outer pt-20 md:pt-32">
        <SectionDivider />
      </div>

      <div className="container-outer py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            25+ Circuit Blocks
          </h2>
          <p className="mt-3 text-base md:text-lg text-white/60 max-w-xl mx-auto">
            Pre-built Arcium MXE circuits for private compute
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4 max-w-5xl mx-auto">
          {BLOCKS.map((block, i) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: (i % 7) * 0.05 }}
              className="float-block"
              style={{
                animationDelay: `${(i % 7) * 0.3}s`,
              }}
            >
              <BlockCard block={block} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-white/50 italic">
            Custom circuit runtime coming soon
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function BlockCard({ block }: { block: typeof BLOCKS[0] }) {
  const Icon = block.icon

  return (
    <div className="group relative">
      <div
        className="relative rounded-xl border backdrop-blur-xl p-3 hover:scale-110 transition-all duration-300 aspect-square flex items-center justify-center"
        style={{
          backgroundColor: `${block.color}08`,
          borderColor: `${block.color}20`,
        }}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <Icon size={20} style={{ color: block.color }} className="relative z-10" />

        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
          <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
            {block.name}
          </div>
        </div>
      </div>
    </div>
  )
}
