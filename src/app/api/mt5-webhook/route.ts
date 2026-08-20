import { NextRequest, NextResponse } from "next/server";
import { doc, collection, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { TradeDoc } from "@/lib/firebase/schema";

// This is the secret key your EA must send to authenticate.
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "TRADIN_JOURNAL_SECRET_123";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const authHeader = req.headers.get("X-API-KEY");
    if (authHeader !== WEBHOOK_SECRET) {
      return NextResponse.json({ success: false, error: "Unauthorized. Invalid X-API-KEY." }, { status: 401 });
    }

    // 2. Parse Payload
    const body = await req.json();
    const { account_id, balance, equity, trades } = body;

    if (!account_id) {
      return NextResponse.json({ success: false, error: "Missing account_id" }, { status: 400 });
    }

    const batch = writeBatch(db);
    let syncedCount = 0;

    // 3. Process Trades
    if (trades && Array.isArray(trades)) {
      for (const trade of trades) {
        // We use the MT5 ticket number as the document ID to prevent duplicates!
        const tradeRef = doc(db, "trades", `mt5_${trade.ticket}`);
        
        const newTrade: TradeDoc = {
          id: `mt5_${trade.ticket}`,
          account_id: account_id,
          symbol: trade.symbol,
          direction: trade.type === 0 ? "BUY" : "SELL", // MT5: 0=Buy, 1=Sell
          lot_size: trade.volume,
          open_price: trade.price_open,
          close_price: trade.price_close,
          open_time: trade.time_open,
          close_time: trade.time_close,
          pips: 0, // Calculate manually if needed
          profit_loss: trade.profit,
          commission: trade.commission || 0,
          swap: trade.swap || 0,
          strategy_tag: "",
          notes: "Synced via EA",
          screenshot_url: "",
          mistake_tags: []
        };

        batch.set(tradeRef, newTrade, { merge: true }); // Merge true prevents overwriting manual notes if ticket re-syncs
        syncedCount++;
      }
    }

    // 4. Update Account Balance
    const accountRef = doc(db, "accounts", account_id);
    batch.set(accountRef, {
      current_balance: balance || 0,
      current_equity: equity || 0,
      last_synced_at: new Date().toISOString()
    }, { merge: true });

    // 5. Commit Batch
    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synced ${syncedCount} trades`,
      balance
    });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
