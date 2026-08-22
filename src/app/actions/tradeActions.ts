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
      lot_size: Number(data.lot_size),
      open_price: Number(data.open_price),
      close_price: Number(data.close_price),
      open_time: new Date().toISOString(),
      close_time: new Date().toISOString(),
      pips: 0,
      profit_loss: Number(data.profit_loss),
      commission: Number(data.commission),
      swap: 0,
      strategy_tag: "",
      notes: "Manual Entry",
      screenshot_url: "",
      mistake_tags: [],
      emotion: data.emotion,
      setup_grade: data.setup_grade,
    };
    batch.set(newTradeRef, tradeData);

    // 2. Fetch the account to update its balance
    const accountRef = doc(db, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);
    if (!accountSnap.exists()) {
      throw new Error("Account not found");
    }
    
    const accountData = accountSnap.data() as AccountDoc;
    const netPnL = Number(data.profit_loss) - Number(data.commission);
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
    const oldNetPnL = (oldTradeData.profit_loss || 0) - (oldTradeData.commission || 0);

    // 2. Update trade document
    batch.update(tradeRef, {
      symbol: data.symbol.toUpperCase(),
      direction: data.direction,
      lot_size: Number(data.lot_size),
      open_price: Number(data.open_price),
      close_price: Number(data.close_price),
      profit_loss: Number(data.profit_loss),
      commission: Number(data.commission),
      emotion: data.emotion,
      setup_grade: data.setup_grade,
    });

    // 3. Fetch account and adjust balance
    const accountRef = doc(db, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);
    if (!accountSnap.exists()) {
      throw new Error("Account not found");
    }
    
    const accountData = accountSnap.data() as AccountDoc;
    const newNetPnL = Number(data.profit_loss) - Number(data.commission);
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
