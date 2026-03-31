const items = [
  'Golf · Give · Win',
  '₹2.52 lakh Monthly Prize Pool',
  'Support Your Chosen Charity',
  'Stableford Score Tracking',
  'Monthly Prize Draw',
  'Cancel Anytime',
  'Jackpot Rolls Over',
  'Secure Razorpay Payments',
]

export default function Marquee() {
  const doubled = [...items, ...items]
  return (
    <div className="border-y border-white/5 py-4 overflow-hidden bg-white/[0.02]">
      <div className="marquee-inner">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-4 whitespace-nowrap text-sm text-white/40 font-medium">
            {item}
            <span className="text-lime opacity-50">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
