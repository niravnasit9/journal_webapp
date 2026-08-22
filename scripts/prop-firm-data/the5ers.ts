import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const the5ersData: PropFirmDoc = {
  id: "the5ers",
  name: "The5ers",
  slug: "the5ers",
  website_url: "https://the5ers.com",
  is_active: true,
  is_popular: true,
  display_order: 5,
  plans: [],
  rules: []
};

const sizes = [5000, 10000, 20000, 60000, 100000];

// High Stakes (2-Step)
sizes.forEach(size => {
  the5ersData.plans!.push({
    id: `5ers-highstakes-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "5ers-highstakes",
    program_name: "High Stakes",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Phase 1",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  the5ersData.plans!.push({
    id: `5ers-highstakes-${size}-p2`,
    name: `$${size.toLocaleString()}`,
    program_id: "5ers-highstakes",
    program_name: "High Stakes",
    account_size: size,
    phase_id: "phase-2",
    phase_name: "Phase 2",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  the5ersData.plans!.push({
    id: `5ers-highstakes-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "5ers-highstakes",
    program_name: "High Stakes",
    account_size: size,
    phase_id: "funded",
    phase_name: "Funded",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
});

// Rules
the5ersData.rules!.push({
  id: "5ers-profit-target-p1",
  title: "Profit Target Phase 1",
  description: "The profit target is 8% to pass Phase 1.",
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

the5ersData.rules!.push({
  id: "5ers-profit-target-p2",
  title: "Profit Target Phase 2",
  description: "The profit target is 5% to pass Phase 2.",
  applicable_phase_ids: ["phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

the5ersData.rules!.push({
  id: "5ers-daily-loss",
  title: "Daily Loss Limit",
  description: "The daily loss limit is 5%.",
  is_hidden: false,
  verification_status: "verified"
});

the5ersData.rules!.push({
  id: "5ers-max-loss",
  title: "Maximum Loss Limit",
  description: "The maximum loss is 10% static.",
  is_hidden: false,
  verification_status: "verified"
});

the5ersData.rules!.push({
  id: "5ers-min-days",
  title: "Minimum Trading Days",
  description: "Must trade for a minimum of 3 days.",
  applicable_phase_ids: ["phase-1", "phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

the5ersData.rules!.push({
  id: "5ers-news-trading",
  title: "News Trading",
  description: "News trading is permitted.",
  is_hidden: false,
  verification_status: "verified"
});

the5ersData.rules!.push({
  id: "5ers-weekend",
  title: "Weekend/Overnight Holding",
  description: "Holding trades overnight and over the weekend is fully allowed.",
  is_hidden: false,
  verification_status: "verified"
});

the5ersData.rules!.push({
  id: "5ers-ea",
  title: "EA Usage",
  description: "EAs are permitted.",
  is_hidden: false,
  verification_status: "verified"
});

the5ersData.rules!.push({
  id: "5ers-payouts",
  title: "Payout Schedule",
  description: "First payout available after 14 days. Up to 100% profit split with scaling.",
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});
