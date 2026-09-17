"use server";

import { db } from "@/lib/firebase/config";
import { collection, doc, writeBatch, getDoc, query, where, getDocs } from "firebase/firestore";
import { TradeDoc, AccountDoc } from "@/lib/firebase/schema";
import { calculateDomesticTaxes } from "@/utils/brokerageMath";

// Helper to calculate PnL based on Dhan trade format
export async function syncDhanApiAction(clientId: string, accessToken: string, accountId: string, fromDate?: string, toDate?: string) {
  try {
    let allTrades: any[] = [];
    
    // 1. Fetch from Dhan API
    if (fromDate && toDate) {
      // Fetch historical trades with pagination
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await fetch(`https://api.dhan.co/v2/trades/${fromDate}/${toDate}/${page}`, {
          headers: {
            'access-token': accessToken,
            'client-id': clientId,
            'Content-Type': 'application/json'
          }
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Dhan API Error: ${res.status} - ${errorText}`);
        }
        
        const data = await res.json();
        
        if (!Array.isArray(data) || data.length === 0) {
          hasMore = false;
        } else {
          allTrades = allTrades.concat(data);
          page++;
        }
      }
    } else {
      // Fetch today's trades
      const res = await fetch('https://api.dhan.co/v2/trades', {
        headers: {
          'access-token': accessToken,
          'client-id': clientId,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Dhan API Error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        allTrades = data;
      }
    }
    
    if (allTrades.length === 0) {
      return { success: true, count: 0, message: "No trades found." };
    }

    // 2. Fetch Account info
    const accountRef = doc(db, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);
    if (!accountSnap.exists()) {
      throw new Error("Account not found");
    }
    const accountData = accountSnap.data() as AccountDoc;

    // 3. Process Executions into Round-Trip Trades
    // Group by tradingSymbol and date (since intraday grouping is per day)
    const groups: Record<string, any[]> = {};
    for (const t of allTrades) {
      const tradeDate = t.createTime.split(" ")[0]; // YYYY-MM-DD
      const groupKey = `${t.tradingSymbol}_${tradeDate}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(t);
    }

    const batch = writeBatch(db);
    let newTradesCount = 0;
    let totalPnLToAdd = 0;

    for (const symbol in groups) {
      const executions = groups[symbol];
      
      let buyQty = 0, sellQty = 0;
      let buyValue = 0, sellValue = 0;
      let openTime = executions[0].createTime;
      let closeTime = executions[executions.length - 1].createTime;
      
      // Determine direction from first execution
      const direction = executions[0].transactionType; // "BUY" or "SELL"

      for (const t of executions) {
        if (t.transactionType === 'BUY') {
          buyQty += t.tradedQuantity;
          buyValue += t.tradedQuantity * t.tradedPrice;
        } else {
          sellQty += t.tradedQuantity;
          sellValue += t.tradedQuantity * t.tradedPrice;
        }
      }

      // Check if trade is fully closed (buyQty == sellQty)
      // For a simple journal, we only log closed or partially closed that match.
      // If it's unequal, we log the matched quantity.
      const matchedQty = Math.min(buyQty, sellQty);
      
      if (matchedQty === 0) {
        continue; // It's an open position, we don't journal it yet.
      }

      const avgBuy = buyValue / buyQty;
      const avgSell = sellValue / sellQty;

      const pnl = direction === "BUY" 
        ? (avgSell - avgBuy) * matchedQty
        : (avgBuy - avgSell) * matchedQty; // If short, profit is buy cheaper than sell

      // Determine segment (Dhan uses exchangeSegment like MCX_COMM, NSE_FNO, etc)
      let segment: "EQUITY" | "FNO_FUTURES" | "FNO_OPTIONS" | "COMMODITY" | "CURRENCY" = "EQUITY";
      const exch = executions[0].exchangeSegment;
      if (exch.includes("COMM")) segment = "COMMODITY";
      else if (exch.includes("FNO")) segment = "FNO_OPTIONS"; // simplification

      // Calculate Taxes
      const taxes = calculateDomesticTaxes(
        segment, 
        avgBuy, 
        avgSell, 
        matchedQty, 
        direction === "BUY" ? "BUY" : "SELL"
      );

      const netPnL = pnl - taxes.totalTaxes;

      // Check if we already imported this trade (use symbol + date as unique enough for daily sync)
      // A more robust approach uses specific order IDs, but for intraday grouping this works.
      const tradeDate = openTime.split(" ")[0]; // "YYYY-MM-DD"
      
      // Check for duplicates
      const tradesRef = collection(db, "trades");
      const q = query(
        tradesRef, 
        where("account_id", "==", accountId),
        where("symbol", "==", symbol),
        where("open_time", ">=", tradeDate + " 00:00:00"),
        where("open_time", "<=", tradeDate + " 23:59:59")
      );
      
      const existing = await getDocs(q);
      if (!existing.empty) {
        continue; // Already imported today
      }

      const newTradeRef = doc(tradesRef);
      const tradeDoc: TradeDoc = {
        id: newTradeRef.id,
        user_id: accountData.user_id,
        account_id: accountId,
        symbol: symbol,
        direction: direction === "BUY" ? "BUY" : "SELL",
        asset_class: "DOMESTIC",
        domestic_segment: segment,
        
        open_time: new Date(openTime.replace(" ", "T")).toISOString(),
        close_time: new Date(closeTime.replace(" ", "T")).toISOString(),
        
        entry_price: avgBuy,
        exit_price: avgSell,
        quantity: matchedQty,
        
        gross_pnl: pnl,
        profit_loss: pnl,
        total_taxes: taxes.totalTaxes,
        net_pnl: netPnL,
        tax_breakdown: taxes,
        
        status: "CLOSED",
        notes: "Imported from Dhan API",
        mistake_tags: [],
        screenshot_url: "",
      };

      batch.set(newTradeRef, tradeDoc);
      newTradesCount++;
      totalPnLToAdd += netPnL;
    }

    if (newTradesCount > 0) {
      // Update account balance
      batch.update(accountRef, {
        current_balance: (accountData.current_balance || 0) + totalPnLToAdd,
        current_equity: (accountData.current_equity || 0) + totalPnLToAdd,
      });

      await batch.commit();
    }

    return { success: true, count: newTradesCount };

  } catch (error: any) {
    console.error("Dhan API Sync Error:", error);
    return { success: false, error: error.message };
  }
}
