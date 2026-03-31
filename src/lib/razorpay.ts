
// Plan amounts in paise (INR × 100)
export const PLANS = {
  monthly: {
    amount: 82900,       // ₹829/month
    currency: 'INR',
    label: 'Monthly',
    interval: 'monthly',
    intervalCount: 1,
  },
  yearly: {
    amount: 749900,      // ₹7,499/year (~25% off)
    currency: 'INR',
    label: 'Yearly',
    interval: 'yearly',
    intervalCount: 1,
  },
}

// Prize pool split constants
export const PRIZE_SPLIT = {
  FIVE_MATCH: 0.40,
  FOUR_MATCH: 0.35,
  THREE_MATCH: 0.25,
}

export const SUBSCRIPTION_SPLIT = {
  PRIZE_POOL: 0.70,
  CHARITY_BASE: 0.10,
}
