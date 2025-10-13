import { useEffect, useRef, useState } from 'react'
import BrandLogo from '@/components/brand-logo'
import { Menu, X } from 'lucide-react'
import { isAuthenticated } from '@/lib/auth'
import { navigate } from '@/lib/router'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [navH, setNavH] = useState(80)
  const [open, setOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const isLoggedIn = isAuthenticated()

  const handleSignInClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isLoggedIn) {
      navigate('/dashboard')
    } else {
      navigate('/signin')
    }
  }

  const handleGetStartedClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isLoggedIn) {
      navigate('/dashboard')
    } else {
      navigate('/get-started')
    }
  }

  useEffect(() => {
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

  const close = () => setOpen(false)

  return (
    <header ref={headerRef}
      className={`sticky top-0 z-50 transition-colors ${
        scrolled ? 'bg-bg-base/60 backdrop-blur shadow-[inset_0_-1px_0_0_var(--color-border)]' : 'bg-transparent'
      }`}
    >
      <div className="container-outer h-16 flex items-center justify-between">
        <BrandLogo />
        <nav className="hidden md:flex items-center gap-7 text-sm text-white/80">
          <a href="/#overview" className="hover:text-white">Overview</a>
          <a href="/#how-it-works" className="hover:text-white">How it works</a>
          <a href="/#blocks" className="hover:text-white">Blocks</a>
          <a href="/#compliance" className="hover:text-white">Compliance</a>
          <a href="/#learn-more" className="hover:text-white">Support</a>
          <a href="/docs" className="hover:text-white">Docs</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/signin" onClick={handleSignInClick} className="hidden md:inline text-sm text-white/80 hover:text-white px-3 py-2">
            Sign in
          </a>
          <div className="hidden md:inline-flex">
            <button 
              onClick={handleGetStartedClick}
              className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm md:text-base font-medium transition border border-white/10 hover:border-white/20"
            >
              Get started
            </button>
          </div>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="md:hidden inline-flex items-center justify-center rounded-md px-3 py-2 text-white/80 hover:text-white"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden absolute left-0 right-0 top-16 z-50 bg-bg-base/98 backdrop-blur border-t border-white/10">
          <div className="container-outer py-4 flex flex-col gap-1 text-sm">
            <a href="/#overview" onClick={close} className="px-1 py-2 text-white/80 hover:text-white">Overview</a>
            <a href="/#how-it-works" onClick={close} className="px-1 py-2 text-white/80 hover:text-white">How it works</a>
            <a href="/#blocks" onClick={close} className="px-1 py-2 text-white/80 hover:text-white">Blocks</a>
            <a href="/#compliance" onClick={close} className="px-1 py-2 text-white/80 hover:text-white">Compliance</a>
            <a href="/#learn-more" onClick={close} className="px-1 py-2 text-white/80 hover:text-white">Support</a>
            <a href="/docs" onClick={close} className="px-1 py-2 text-white/80 hover:text-white">Docs</a>
            <div className="h-px my-2 bg-white/10" />
            <a href="/signin" onClick={(e) => { handleSignInClick(e); close(); }} className="px-1 py-2 text-white/80 hover:text-white">
              Sign in
            </a>
            <button 
              onClick={(e) => { handleGetStartedClick(e); close(); }}
              className="mt-2 w-full inline-flex items-center justify-center rounded-full px-5 py-3 text-sm md:text-base font-medium transition bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:brightness-110"
            >
              Get started
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
