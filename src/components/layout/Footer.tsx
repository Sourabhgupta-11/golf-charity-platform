import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-ink py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-lime flex items-center justify-center">
                <span className="text-ink font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>G</span>
              </div>
              <span className="text-white font-semibold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                Greenloop
              </span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              Golf meets giving. Every score you enter supports a cause you believe in — and puts you in the draw for monthly prizes.
            </p>
          </div>

          {/* Platform */}
          <div>
            <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Platform</p>
            <ul className="space-y-3">
              <li><Link href="/how-it-works" className="text-white/60 text-sm hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/charities" className="text-white/60 text-sm hover:text-white transition-colors">Charities</Link></li>
              <li><Link href="/subscribe" className="text-white/60 text-sm hover:text-white transition-colors">Subscribe</Link></li>
              <li><Link href="/dashboard" className="text-white/60 text-sm hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Legal</p>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="text-white/60 text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-white/60 text-sm hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="text-white/60 text-sm hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link href="/responsible-gaming" className="text-white/60 text-sm hover:text-white transition-colors">Responsible Gaming</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Greenloop. All rights reserved.
          </p>
          <p className="text-white/20 text-xs text-center md:text-right">
            Payments processed securely by Stripe. This platform operates in compliance with UK gambling regulations.
          </p>
        </div>
      </div>
    </footer>
  )
}
