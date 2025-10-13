import { useEffect, useState } from 'react'
import { Loader2, Box, Search, Plus, Lock, Brain, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiGetBlocks } from '@/lib/api'

type Block = {
  id: string
  name: string
  category: string
  description: string
  circuit: string
  inputs: Array<{ name: string; type: string; description: string; required: boolean }>
  outputs: Array<{ name: string; type: string; description: string }>
  icon?: string
  color?: string
  tags?: string[]
}

const categoryColors: Record<string, string> = {
  'Math': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Logic': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Crypto': 'bg-green-500/10 text-green-400 border-green-500/20',
  'ML': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Data': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
}

const categoryIcons: Record<string, any> = {
  'Math': Plus,
  'Logic': Zap,
  'Crypto': Lock,
  'ML': Brain,
  'Data': Box,
}

const ITEMS_PER_PAGE = 12

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadBlocks()
  }, [])

  async function loadBlocks() {
    try {
      const data = await apiGetBlocks()
      setBlocks(data.blocks)
    } catch (error) {
      console.error('Failed to load blocks:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...Array.from(new Set(blocks.map(b => b.category)))]
  
  const filteredBlocks = blocks.filter((block) => {
    const matchesSearch = block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || block.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Pagination
  const totalPages = Math.ceil(filteredBlocks.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedBlocks = filteredBlocks.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Blocks Library</h1>
          <p className="text-sm text-white/60 mt-1">Browse available computation blocks for your pipelines</p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search blocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-brand-500/50"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500/50"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredBlocks.length === 0 ? (
          <Card className="p-12 text-center">
            <Box className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <h3 className="text-lg font-semibold mb-2">No Blocks Found</h3>
            <p className="text-sm text-white/60">
              Try adjusting your search or filters
            </p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedBlocks.map((block) => {
                const IconComponent = categoryIcons[block.category] || Box
                return (
              <Card key={block.id} className="p-4 hover:bg-white/[0.03] transition">
                <div className="flex items-start gap-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: block.color || '#6a4ff8' }}
                  >
                    <IconComponent size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{block.name}</h3>
                    <Badge className={categoryColors[block.category] || 'bg-white/10 text-white/90'}>
                      {block.category}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-white/60 mb-3 line-clamp-2">
                  {block.description}
                </p>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-white/50">Inputs:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {block.inputs.map((input, idx) => (
                        <Badge key={idx} variant="info" className="text-[10px]">
                          {input.name}: {input.type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-white/50">Outputs:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {block.outputs.map((output, idx) => (
                        <Badge key={idx} variant="success" className="text-[10px]">
                          {output.name}: {output.type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {block.tags && block.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {block.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-white/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            )})}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-white/60">
                  Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredBlocks.length)} of {filteredBlocks.length} blocks
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-xs"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded text-xs font-medium transition ${
                          page === currentPage
                            ? 'bg-brand-500 text-white'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-xs"
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
