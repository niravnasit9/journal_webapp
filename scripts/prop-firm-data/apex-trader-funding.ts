import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const apexTraderFundingData: PropFirmDoc = {
  id: "apex-trader-funding",
  name: "Apex Trader Funding",
  slug: "apex-trader-funding",
  website_url: "https://apextraderfunding.com",
  is_active: true,
  is_popular: true,
  display_order: 17,
  plans: [],
  rules: []
};

const sizes = [25000, 50000, 75000, 100000, 150000, 250000, 300000];

// Evaluation
sizes.forEach(size => {
  apexTraderFundingData.plans!.push({
    id: `apex-eval-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "apex-eval",
    program_name: "Evaluation",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Evaluation",
    daily_loss_limit_pct: 0, // Not applicable for Apex
    max_drawdown_pct: 5, // Trailing
    drawdown_type: "trailing",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  apexTraderFundingData.plans!.push({
    id: `apex-eval-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "apex-eval",
    program_name: "Funded",
    account_size: size,
    phase_id: "funded",
    phase_name: "PA Account",
    daily_loss_limit_pct: 0,
    max_drawdown_pct: 5,
    drawdown_type: "trailing",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
});

// Rules
apexTraderFundingData.rules!.push({
  id: "apex-profit-target",
  title: "Profit Target",
  description: "6% profit target.",
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

apexTraderFundingData.rules!.push({
  id: "apex-trailing-drawdown",
  title: "Intraday Trailing Drawdown",
  description: "Trailing drawdown calculated intraday, follows highest open profit.",
  is_hidden: false,
  verification_status: "verified"
});

apexTraderFundingData.rules!.push({
  id: "apex-min-days",
  title: "Minimum Trading Days",
  description: "Must trade for a minimum of 7 days to pass.",
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

apexTraderFundingData.rules!.push({
  id: "apex-consistency",
  title: "Consistency Rule",
  description: "30% consistency rule for payouts.",
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});

apexTraderFundingData.rules!.push({
  id: "apex-news",
  title: "News Trading",
  description: "Allowed.",
  is_hidden: false,
  verification_status: "verified"
});
