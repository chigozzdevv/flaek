export default function Footer() {
  return (
    <footer id="support" className="border-t border-[var(--color-border)] scroll-mt-24 md:scroll-mt-28">
      <div className="container-outer py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
        <div>© {new Date().getFullYear()} Flaek</div>
        <nav className="flex items-center gap-5">
          <a href="/#overview" className="hover:text-white">Overview</a>
          <a href="/docs" className="hover:text-white">Docs</a>
          <a href="/#learn-more" className="hover:text-white">Support</a>
          <a href="#status" className="hover:text-white">Status</a>
        </nav>
      </div>
    </footer>
  )
}
