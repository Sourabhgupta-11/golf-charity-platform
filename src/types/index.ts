export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  handicap?: number
  role: 'subscriber' | 'admin'
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  subscription_plan?: 'monthly' | 'yearly'
  subscription_id?: string
  subscription_ends_at?: string
  stripe_customer_id?: string
  charity_id?: string
  charity_percentage: number
  created_at: string
  updated_at: string
  charity?: Charity
}

export interface GolfScore {
  id: string
  user_id: string
  score: number
  played_at: string
  notes?: string
  created_at: string
}

export interface Charity {
  id: string
  name: string
  slug: string
  description: string
  short_description?: string
  image_url?: string
  website_url?: string
  is_featured: boolean
  is_active: boolean
  total_raised: number
  upcoming_events: CharityEvent[]
  created_at: string
}

export interface CharityEvent {
  title: string
  date: string
  location: string
  description?: string
}

export interface Draw {
  id: string
  draw_month: string
  draw_type: 'random' | 'algorithmic'
  status: 'pending' | 'simulated' | 'published'
  winning_numbers: number[]
  prize_pool_total: number
  prize_pool_5match: number
  prize_pool_4match: number
  prize_pool_3match: number
  jackpot_carried_over: number
  published_at?: string
  created_at: string
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  numbers_entered: number[]
  match_count: number
  prize_tier?: '5-match' | '4-match' | '3-match'
  prize_amount: number
  created_at: string
}

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  prize_tier: '5-match' | '4-match' | '3-match'
  prize_amount: number
  proof_url?: string
  verification_status: 'pending' | 'approved' | 'rejected'
  payment_status: 'pending' | 'paid'
  admin_notes?: string
  verified_at?: string
  paid_at?: string
  created_at: string
  profile?: Profile
  draw?: Draw
}
