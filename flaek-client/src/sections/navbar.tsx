import { useEffect, useRef, useState } from 'react'
import BrandLogo from '../components/brand-logo'
import ButtonLink from '../components/button'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [navH, setNavH] = useState(80)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const sentinel = document.getElementById('nav-sentinel')
    if (headerRef.current) {
      const ro = new ResizeObserver(() => setNavH(headerRef.current!.offsetHeight || 80))
      ro.observe(headerRef.current)
      return () => ro.disconnect()
    }
  }, [])

  useEffect(() => {
    const sentinel = document.getElementById('nav-sentinel')
    if (sentinel && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        ([entry]) => setScrolled(!entry.isIntersecting),
        { root: null, rootMargin: `-${navH}px 0px 0px 0px`, threshold: 0 }
      )
      obs.observe(sentinel)
      return () => obs.disconnect()
    } else {
      const onScroll = () => setScrolled(window.scrollY > 0)
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => window.removeEventListener('scroll', onScroll)
    }
  }, [navH])

  return (
    <header ref={headerRef}
      className={`sticky top-0 z-50 transition-colors ${
        scrolled ? 'bg-bg-base/60 backdrop-blur shadow-[inset_0_-1px_0_0_var(--color-border)]' : 'bg-transparent'
      }`}
    >
      <div className="container-outer h-16 flex items-center justify-between">
        <BrandLogo />
        <nav className="hidden md:flex items-center gap-7 text-sm text-white/80">
          <a href="#product" className="hover:text-white">Product</a>
          <a href="#pipelines" className="hover:text-white">Pipelines</a>
          <a href="#attestations" className="hover:text-white">Attestations</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="#docs" className="hover:text-white">Docs</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="#signin" className="hidden md:inline text-sm text-white/80 hover:text-white px-3 py-2">Sign in</a>
          <ButtonLink href="#get-started" variant="secondary" className="">Get started</ButtonLink>
        </div>
      </div>
    </header>
  )
}
