'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Heart, Trophy, BarChart2 } from 'lucide-react'

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Animated particle field
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = []
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      })
    }

    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 255, 0, ${p.opacity})`
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-lime/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-coral/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center pt-32 pb-24">
        {/* Eyebrow pill */}
        <div className="inline-flex items-center gap-2 glass border border-lime/20 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-lime animate-pulse" />
          <span className="text-lime text-xs font-medium tracking-wide uppercase">Now Open — Draw Closes 31 May</span>
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-7xl md:text-8xl font-black leading-none mb-6 tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Golf.{' '}
          <span className="text-gradient">Give.</span>
          <br />
          Win.
        </h1>

        {/* Subhead */}
        <p className="text-white/60 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          Subscribe, log your Stableford scores, and every month a portion of every subscription goes to the charity you choose — plus you&apos;re automatically entered into a prize draw.
        </p>

        {/* CTA Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <Link
            href="/subscribe"
            className="flex items-center gap-2 bg-lime text-ink font-bold text-base px-8 py-4 rounded-full hover:bg-lime/90 transition-all hover:shadow-2xl hover:shadow-lime/30 hover:-translate-y-0.5 group"
          >
            Start Your Journey
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/how-it-works"
            className="flex items-center gap-2 glass border border-white/10 text-white font-medium text-base px-8 py-4 rounded-full hover:border-white/20 transition-all"
          >
            See How It Works
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { icon: Heart, label: 'Charity Partners', value: '4+' },
            { icon: Trophy, label: 'Monthly Prize Pool', value: '₹2.52 lakh' },
            { icon: BarChart2, label: 'Scores Logged', value: '8,200+' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass rounded-2xl p-4 text-center">
              <Icon size={18} className="text-lime mx-auto mb-2" />
              <p className="text-white font-bold text-xl" style={{ fontFamily: 'var(--font-mono)' }}>{value}</p>
              <p className="text-white/40 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-white/50 text-xs uppercase tracking-widest">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent" />
      </div>
    </section>
  )
}
