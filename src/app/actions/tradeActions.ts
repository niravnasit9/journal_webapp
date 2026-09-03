"use server";

import { doc, collection, writeBatch, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { TradeDoc, AccountDoc } from "@/lib/firebase/schema";

export async function addManualTradeAction(accountId: string, data: {
  symbol: string;
  direction: "BUY" | "SELL";
  lot_size: number;
  open_price: number;
  close_price: number;
  profit_loss: number;
  commission: number;
  emotion?: "FOMO" | "Revenge" | "Confident" | "Bored" | "Tilted" | "Neutral";
  setup_grade?: "A+" | "A" | "B" | "C";
  open_time?: string;
  close_time?: string;
  stop_loss_price?: number;
  take_profit_price?: number;
  risk_reward_ratio?: number;
  entry_chart_url?: string;
  exit_chart_url?: string;
  execution_score?: "Perfect" | "Early Entry" | "Late Exit" | "FOMO" | "None";
  pips?: number;
  
  // Domestic fields
  domestic_segment?: string;
  option_type?: "CE" | "PE";
  strike_price?: number;
  quantity?: number;
  gross_pnl?: number;
  net_pnl?: number;
  total_taxes?: number;
  tax_breakdown?: any;
}) {
  try {
    const batch = writeBatch(db);
    
    // 1. Create the new trade document
    const newTradeRef = doc(collection(db, "trades"));
    const tradeData: TradeDoc = {
      id: newTradeRef.id,
      account_id: accountId,
      symbol: data.symbol.toUpperCase(),
      direction: data.direction,
      lot_size: Number(data.lot_size) || undefined,
      open_price: Number(data.open_price),
      close_price: Number(data.close_price),
      open_time: data.open_time || new Date().toISOString(),
      close_time: data.close_time || new Date().toISOString(),
      pips: data.pips ? Number(data.pips) : undefined,
      profit_loss: Number(data.profit_loss),
      commission: Number(data.commission),
      swap: 0,
      
      // Domestic fields
      domestic_segment: data.domestic_segment,
      option_type: data.option_type,
      strike_price: data.strike_price,
      quantity: data.quantity,
      gross_pnl: data.gross_pnl,
      net_pnl: data.net_pnl,
      total_taxes: data.total_taxes,
      tax_breakdown: data.tax_breakdown,
      strategy_id: "",
      notes: "Manual Entry",
      screenshot_url: "",
      mistake_tags: [],
      emotion: data.emotion,
      setup_grade: data.setup_grade,
      stop_loss_price: data.stop_loss_price,
      take_profit_price: data.take_profit_price,
      risk_reward_ratio: data.risk_reward_ratio,
      entry_chart_url: data.entry_chart_url,
      exit_chart_url: data.exit_chart_url,
      execution_score: data.execution_score,
    };
    
    const cleanTradeData = Object.fromEntries(
      Object.entries(tradeData).filter(([_, v]) => v !== undefined)
    ) as TradeDoc;

    batch.set(newTradeRef, cleanTradeData);

    // 2. Fetch the account to update its balance
    const accountRef = doc(db, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);
    if (!accountSnap.exists()) {
      throw new Error("Account not found");
    }
    
    const accountData = accountSnap.data() as AccountDoc;
    const netPnL = data.net_pnl !== undefined ? Number(data.net_pnl) : (Number(data.profit_loss) - Number(data.commission));
    const newBalance = (accountData.current_balance || 0) + netPnL;

    batch.update(accountRef, {
      current_balance: newBalance,
      current_equity: newBalance,
      last_synced_at: new Date().toISOString()
    });

    // 3. Commit
    await batch.commit();

    return { success: true, tradeId: newTradeRef.id };
  } catch (error: any) {
    console.error("Error adding manual trade:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteManualTradeAction(tradeId: string, accountId: string) {
  try {
    const tradeRef = doc(db, "trades", tradeId);
    const tradeSnap = await getDoc(tradeRef);
    if (!tradeSnap.exists()) {
      throw new Error("Trade not found");
    }
    const tradeData = tradeSnap.data() as TradeDoc;

    const accountRef = doc(db, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);
    if (!accountSnap.exists()) {
      throw new Error("Account not found");
    }
    const accountData = accountSnap.data() as AccountDoc;

    const batch = writeBatch(db);
    
    // Delete trade
    batch.delete(tradeRef);

    // Revert account balance
    const netPnL = (tradeData.profit_loss || 0) - (tradeData.commission || 0);
    const newBalance = (accountData.current_balance || 0) - netPnL;
    batch.update(accountRef, {
      current_balance: newBalance,
      current_equity: newBalance,
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting trade:", error);
    return { success: false, error: error.message };
  }
}

export async function editManualTradeAction(tradeId: string, accountId: string, data: {
  symbol: string;
  direction: "BUY" | "SELL";
  lot_size: number;
  open_price: number;
  close_price: number;
  profit_loss: number;
  commission: number;
  emotion?: "FOMO" | "Revenge" | "Confident" | "Bored" | "Tilted" | "Neutral";
  setup_grade?: "A+" | "A" | "B" | "C";
  open_time?: string;
  close_time?: string;
  stop_loss_price?: number;
  take_profit_price?: number;
  risk_reward_ratio?: number;
  entry_chart_url?: string;
  exit_chart_url?: string;
  execution_score?: "Perfect" | "Early Entry" | "Late Exit" | "FOMO" | "None";
  pips?: number;
  
  // Domestic fields
  domestic_segment?: string;
  option_type?: "CE" | "PE";
  strike_price?: number;
  quantity?: number;
  gross_pnl?: number;
  net_pnl?: number;
  total_taxes?: number;
  tax_breakdown?: any;
}) {
  try {
    const batch = writeBatch(db);
    
    // 1. Fetch existing trade to reverse its effect on account balance
    const tradeRef = doc(db, "trades", tradeId);
    const tradeSnap = await getDoc(tradeRef);
    if (!tradeSnap.exists()) {
      throw new Error("Trade not found");
    }
    const oldTradeData = tradeSnap.data() as TradeDoc;
    const oldNetPnL = oldTradeData.net_pnl !== undefined ? oldTradeData.net_pnl : (oldTradeData.profit_loss || 0) - (oldTradeData.commission || 0);

    const updatePayload = {
      symbol: data.symbol.toUpperCase(),
      direction: data.direction,
      lot_size: data.lot_size,
      open_price: data.open_price,
      close_price: data.close_price,
      profit_loss: data.profit_loss,
      commission: data.commission,
      emotion: data.emotion,
      setup_grade: data.setup_grade,
      pips: data.pips,
      domestic_segment: data.domestic_segment,
      option_type: data.option_type,
      strike_price: data.strike_price,
      quantity: data.quantity,
      gross_pnl: data.gross_pnl,
      net_pnl: data.net_pnl,
      total_taxes: data.total_taxes,
      tax_breakdown: data.tax_breakdown,
      stop_loss_price: data.stop_loss_price,
      take_profit_price: data.take_profit_price,
      risk_reward_ratio: data.risk_reward_ratio,
      entry_chart_url: data.entry_chart_url,
      exit_chart_url: data.exit_chart_url,
      execution_score: data.execution_score,
      ...(data.open_time && { open_time: data.open_time }),
      ...(data.close_time && { close_time: data.close_time }),
    };

    const cleanUpdateData = Object.fromEntries(
      Object.entries(updatePayload).filter(([_, v]) => v !== undefined)
    );

    batch.update(tradeRef, cleanUpdateData);

    // 3. Fetch account and adjust balance
    const accountRef = doc(db, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);
    if (!accountSnap.exists()) {
      throw new Error("Account not found");
    }
    
    const accountData = accountSnap.data() as AccountDoc;
    const newNetPnL = data.net_pnl !== undefined ? Number(data.net_pnl) : (Number(data.profit_loss) - Number(data.commission));
    // Reverse old, apply new
    const newBalance = (accountData.current_balance || 0) - oldNetPnL + newNetPnL;

    batch.update(accountRef, {
      current_balance: newBalance,
      current_equity: newBalance,
      last_synced_at: new Date().toISOString()
    });

    // 4. Commit
    await batch.commit();

    return { success: true };
  } catch (error: any) {
    console.error("Error editing manual trade:", error);
    return { success: false, error: error.message };
  }
}
