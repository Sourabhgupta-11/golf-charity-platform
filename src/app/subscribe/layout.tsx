export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(200,255,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,255,0,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {children}
    </div>
  )
}
