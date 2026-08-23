export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly?: number;
  priceYearly?: number; // Total amount when billed yearly, or per month representation depending on UI needs. We will store the exact total yearly cost here, and calculate monthly equivalent in UI if needed.
  isPopular?: boolean;
  features: PlanFeature[];
  buttonText: string;
  buttonAction: string;
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  free: {
    id: "free",
    name: "Base",
    description: "Perfect for beginners testing the waters.",
    features: [
      { name: "Manual Trade Logging", included: true },
      { name: "Up to 3 Strategies", included: true },
      { name: "Basic Analytics Calendar", included: true },
      { name: "Automated Broker Sync", included: false },
      { name: "AI Edge Discovery", included: false },
      { name: "Video Uploads", included: false },
    ],
    buttonText: "Start Free",
    buttonAction: "/dashboard"
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "For disciplined traders scaling their edge.",
    priceMonthly: 15,
    priceYearly: 144, // Equivalent to 12/month
    features: [
      { name: "Manual Trade Logging", included: true },
      { name: "Unlimited Strategies", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Pre-Trade Strict Checklist", included: true },
      { name: "Automated Broker Sync", included: false },
      { name: "Video Uploads", included: false },
    ],
    buttonText: "Upgrade to Starter",
    buttonAction: "/checkout/starter"
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "The complete suite for professional traders.",
    priceMonthly: 39,
    priceYearly: 348, // Equivalent to 29/month
    isPopular: true,
    features: [
      { name: "Unlimited Strategies", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Pre-Trade Strict Checklist", included: true },
      { name: "Automated Broker Sync", included: true },
      { name: "Strategy Backtesting Engine", included: true },
      { name: "AI Edge Discovery", included: false },
    ],
    buttonText: "Upgrade to Pro",
    buttonAction: "/checkout/pro"
  },
  elite: {
    id: "elite",
    name: "Elite",
    description: "Maximum performance, AI insights, and unlimited media.",
    priceMonthly: 99,
    priceYearly: 948, // Equivalent to 79/month
    features: [
      { name: "Automated Broker Sync", included: true },
      { name: "Strategy Backtesting Engine", included: true },
      { name: "AI Edge Discovery", included: true },
      { name: "AI Trade Sentiment Analysis", included: true },
      { name: "Unlimited Video Uploads", included: true },
      { name: "1-on-1 Trading Psychologist", included: true },
    ],
    buttonText: "Go Elite",
    buttonAction: "/checkout/elite"
  }
};

export const getPricingPlanList = (): PricingPlan[] => {
  return [PRICING_PLANS.free, PRICING_PLANS.starter, PRICING_PLANS.pro, PRICING_PLANS.elite];
};

export type Tier = 'free' | 'starter' | 'pro' | 'elite';

export interface TierPermissions {
  maxStrategies: number;
  autoBrokerSync: boolean;
  preTradeChecklist: boolean;
  analyticsLevel: 'basic' | 'advanced';
  aiEdgeDiscovery: boolean;
  aiTradeSentiment: boolean;
  backtestingEngine: boolean;
  videoUploads: 'none' | 'standard' | 'unlimited';
  psychologistBooking: boolean;
  mfeMaeAnalytics: boolean;
  macroNewsOverlay: boolean;
  propFirmGuardian: boolean;
  aiTiltAnalysis: 'none' | 'basic' | 'full';
  playbookAbTesting: boolean;
  publicTrackRecord: boolean;
}

export const TIER_PERMISSIONS: Record<Tier, TierPermissions> = {
  free: {
    maxStrategies: 1,
    autoBrokerSync: false,
    preTradeChecklist: false,
    analyticsLevel: 'basic',
    aiEdgeDiscovery: false,
    aiTradeSentiment: false,
    backtestingEngine: false,
    videoUploads: 'none',
    psychologistBooking: false,
    mfeMaeAnalytics: false,
    macroNewsOverlay: false,
    propFirmGuardian: false,
    aiTiltAnalysis: 'none',
    playbookAbTesting: false,
    publicTrackRecord: false,
  },
  starter: {
    maxStrategies: 3,
    autoBrokerSync: true,
    preTradeChecklist: true,
    analyticsLevel: 'basic',
    aiEdgeDiscovery: false,
    aiTradeSentiment: false,
    backtestingEngine: false,
    videoUploads: 'none',
    psychologistBooking: false,
    mfeMaeAnalytics: false,
    macroNewsOverlay: true,
    propFirmGuardian: false,
    aiTiltAnalysis: 'none',
    playbookAbTesting: false,
    publicTrackRecord: false,
  },
  pro: {
    maxStrategies: Infinity,
    autoBrokerSync: true,
    preTradeChecklist: true,
    analyticsLevel: 'advanced',
    aiEdgeDiscovery: true,
    aiTradeSentiment: false,
    backtestingEngine: false,
    videoUploads: 'standard',
    psychologistBooking: false,
    mfeMaeAnalytics: true,
    macroNewsOverlay: true,
    propFirmGuardian: true,
    aiTiltAnalysis: 'basic',
    playbookAbTesting: true,
    publicTrackRecord: true,
  },
  elite: {
    maxStrategies: Infinity,
    autoBrokerSync: true,
    preTradeChecklist: true,
    analyticsLevel: 'advanced',
    aiEdgeDiscovery: true,
    aiTradeSentiment: true,
    backtestingEngine: true,
    videoUploads: 'unlimited',
    psychologistBooking: true,
    mfeMaeAnalytics: true,
    macroNewsOverlay: true,
    propFirmGuardian: true,
    aiTiltAnalysis: 'full',
    playbookAbTesting: true,
    publicTrackRecord: true,
  },
};
