export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-border)]">
      <div className="container-outer py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
        <div>© {new Date().getFullYear()} Flaek</div>
        <nav className="flex items-center gap-5">
          <a href="#product" className="hover:text-white">Product</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="#docs" className="hover:text-white">Docs</a>
          <a href="#status" className="hover:text-white">Status</a>
        </nav>
      </div>
    </footer>
  )
}
