"use server";

import { doc, collection, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AccountDoc } from "@/lib/firebase/schema";

export async function createManualAccountAction(uid: string, data: {
  label: string;
  broker: string;
  account_type: string;
  market_type?: "GLOBAL" | "DOMESTIC";
  currency: "USD" | "INR";
  initial_balance: number;
  prop_firm?: string;
  prop_plan_name?: string;
  prop_plan_phase?: string;
  rule_version_id?: string;
  drawdown_type?: string;
  daily_drawdown_type?: string;
  daily_loss_limit_pct?: number;
  max_drawdown_pct?: number;
}) {
  try {
    const newAccountRef = doc(collection(db, "accounts"));
    
    const accountData: AccountDoc = {
      id: newAccountRef.id,
      owner_uid: uid,
      label: data.label,
      broker: data.broker,
      account_type: data.account_type,
      market_type: data.market_type || "GLOBAL",
      currency: data.currency,
      initial_balance: Number(data.initial_balance),
      current_balance: Number(data.initial_balance),
      current_equity: Number(data.initial_balance),
      created_at: new Date().toISOString(),
      prop_firm: data.prop_firm || undefined,
      prop_plan_name: data.prop_plan_name || undefined,
      prop_plan_phase: data.prop_plan_phase || undefined,
      rule_version_id: data.rule_version_id || undefined,
      drawdown_type: data.drawdown_type || undefined,
      daily_drawdown_type: data.daily_drawdown_type || undefined,
      daily_loss_limit_pct: data.daily_loss_limit_pct ? Number(data.daily_loss_limit_pct) : undefined,
      max_drawdown_pct: data.max_drawdown_pct ? Number(data.max_drawdown_pct) : undefined,
    };

    const cleanAccountData = Object.fromEntries(
      Object.entries(accountData).filter(([_, v]) => v !== undefined)
    ) as AccountDoc;

    await setDoc(newAccountRef, cleanAccountData);

    return { success: true, accountId: newAccountRef.id };
  } catch (error: any) {
    console.error("Error creating manual account:", error);
    return { success: false, error: error.message };
  }
}
