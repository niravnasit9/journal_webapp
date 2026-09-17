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
      let page = 0;
      let hasMore = true;
      while (hasMore) {
        const res = await fetch(`https://api.dhan.co/v2/trades/${fromDate}/${toDate}/${page}`, {
          headers: {
            'access-token': accessToken,
            'client-id': clientId,
            'Accept': 'application/json'
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
      // Fetch today's live intraday trades
      const res = await fetch('https://api.dhan.co/v2/trades', {
        headers: {
          'access-token': accessToken,
          'client-id': clientId,
          'Accept': 'application/json' // Crucial: Do NOT use Content-Type for GET or Dhan returns 400 DH-906
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

    // 3. Process Executions into Round-Trip Trades using FIFO
    // Group by tradingSymbol and date first
    const groups: Record<string, any[]> = {};
    for (const t of allTrades) {
      let timeStr = t.exchangeTime || t.createTime || t.tradeTime || "";
      if (timeStr === "NA") timeStr = t.exchangeTime || t.tradeTime || "";
      if (!timeStr) continue; 
      
      const tradeDate = timeStr.includes("T") ? timeStr.split("T")[0] : timeStr.split(" ")[0];
      const actualSymbol = t.tradingSymbol || t.customSymbol || t.tradingSymbol;
      const groupKey = `${actualSymbol}_${tradeDate}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(t);
    }

    const batch = writeBatch(db);
    let newTradesCount = 0;
    let totalPnLToAdd = 0;

    for (const groupKey in groups) {
      const executions = groups[groupKey];
      // Sort executions by time
      const getValidTime = (t: any) => (t.exchangeTime && t.exchangeTime !== "NA") ? t.exchangeTime : ((t.createTime && t.createTime !== "NA") ? t.createTime : t.tradeTime);
      executions.sort((a, b) => new Date(getValidTime(a).replace(" ", "T")).getTime() - new Date(getValidTime(b).replace(" ", "T")).getTime());

      let segment = "EQUITY";
      const exch = executions[0].exchangeSegment || "";
      if (exch.includes("COMM")) segment = "COMMODITY";
      else if (exch.includes("FNO")) segment = "FNO_OPTIONS"; 

      const actualSymbol = executions[0].tradingSymbol || executions[0].customSymbol || groupKey.split('_')[0];
      
      let lotSize = 1;
      if (segment === "COMMODITY") {
        if (actualSymbol.includes("CRUDEOILM")) lotSize = 10;
        else if (actualSymbol.includes("CRUDEOIL")) lotSize = 100;
        else if (actualSymbol.includes("NATURALGAS")) lotSize = 1250;
        else if (actualSymbol.includes("GOLDM")) lotSize = 10;
        else if (actualSymbol.includes("GOLDGUINEA") || actualSymbol.includes("GOLDPETAL")) lotSize = 1;
        else if (actualSymbol.includes("GOLD")) lotSize = 100;
        else if (actualSymbol.includes("SILVERM")) lotSize = 5;
        else if (actualSymbol.includes("SILVERMIC")) lotSize = 1;
        else if (actualSymbol.includes("SILVER")) lotSize = 30;
      }

      // Normalize quantities to UNITS
      const normalizedExecutions = executions.map(t => {
        const rawQty = t.tradedQuantity || t.quantity || 0;
        let finalQty = rawQty;
        if (segment === "COMMODITY") {
          if (rawQty < lotSize && rawQty > 0) finalQty = rawQty * lotSize;
          else if (rawQty % lotSize === 0) finalQty = rawQty;
          else finalQty = rawQty * lotSize;
        }
        return {
          ...t,
          unitQty: finalQty,
          price: t.tradedPrice || t.price || 0,
          time: getValidTime(t)
        };
      });

      // ----------------------------------------------------
      // ENGINE 1: Grouped Position Sizing
      // ----------------------------------------------------
      let buyUnits = 0, sellUnits = 0;
      let buyLots = 0, sellLots = 0;
      let buyValue = 0, sellValue = 0;
      let totalBrokerage = 0, totalStt = 0, totalTxn = 0, totalGst = 0, totalSebi = 0, totalStamp = 0;

      for (const t of normalizedExecutions) {
        const rawQty = t.tradedQuantity || t.quantity || 0;
        let lots = rawQty;
        if (segment === "COMMODITY") {
          if (rawQty >= lotSize && rawQty % lotSize === 0) {
            lots = rawQty / lotSize;
          }
        }
        if (t.transactionType === 'BUY') {
          buyUnits += t.unitQty;
          buyLots += lots;
          buyValue += t.unitQty * t.price;
        } else {
          sellUnits += t.unitQty;
          sellLots += lots;
          sellValue += t.unitQty * t.price;
        }

        let bCharges = t.brokerageCharges || 0;
        let sttCharges = t.stt || 0;
        let txnCharges = t.exchangeTransactionCharges || 0;
        let gstCharges = t.serviceTax || 0;
        let sebiCharges = t.sebiTax || 0;
        let stampCharges = t.stampDuty || 0;

        // Fallback for today's trades where Dhan API returns 0
        if (bCharges === 0 && sttCharges === 0 && gstCharges === 0) {
          const turnover = t.unitQty * t.price;
          // Brokerage is typically 20 per executed order leg
          bCharges = 20;
          
          if (segment === "COMMODITY" || segment === "FNO_OPTIONS") {
             if (t.transactionType === "SELL") {
                sttCharges = turnover * 0.00125; // 0.125% STT on sell premium
             }
             txnCharges = turnover * 0.0005; // ~0.05% Exchange Txn
             if (t.transactionType === "BUY") {
                stampCharges = turnover * 0.00003; // 0.003% Stamp duty on buy
             }
             sebiCharges = turnover * 0.000001; // SEBI charges
          } else {
             // Equity fallback
             bCharges = Math.min(turnover * 0.0003, 20);
          }
          gstCharges = (bCharges + txnCharges + sebiCharges) * 0.18;
        }

        totalBrokerage += bCharges;
        totalStt += sttCharges;
        totalTxn += txnCharges;
        totalGst += gstCharges;
        totalSebi += sebiCharges;
        totalStamp += stampCharges;
        
        // Save the actual charges back into the execution so the FIFO matcher can use them
        t.brokerageCharges = bCharges;
        t.stt = sttCharges;
        t.exchangeTransactionCharges = txnCharges;
        t.serviceTax = gstCharges;
        t.sebiTax = sebiCharges;
        t.stampDuty = stampCharges;
      }

      const matchedUnits = Math.min(buyUnits, sellUnits);
      const matchedLots = Math.min(buyLots, sellLots);
      const displayUnits = Math.max(buyUnits, sellUnits);
      const displayLots = Math.max(buyLots, sellLots);
      
      const avgBuy = buyUnits > 0 ? buyValue / buyUnits : 0;
      const avgSell = sellUnits > 0 ? sellValue / sellUnits : 0;
      
      const direction = normalizedExecutions[0].transactionType; 
      const positionPnl = direction === "BUY" ? (avgSell - avgBuy) * matchedUnits : (avgBuy - avgSell) * matchedUnits;
      const totalTaxesSum = totalBrokerage + totalStt + totalTxn + totalGst + totalSebi + totalStamp;
      
      const formatToISO = (tStr: string) => {
        if (!tStr) return new Date().toISOString();
        if (tStr.includes("T")) return new Date(tStr).toISOString();
        return new Date(tStr.replace(" ", "T")).toISOString();
      };

      const openTime = normalizedExecutions[0].time;
      const tradeDate = openTime.includes("T") ? openTime.split("T")[0] : openTime.split(" ")[0];
      const isoOpenTime = formatToISO(openTime);

      const positionsRef = collection(db, "trades");
      const posQuery = query(
        positionsRef, 
        where("account_id", "==", accountId || ""),
        where("symbol", "==", actualSymbol || ""),
        where("trade_date", "==", tradeDate || "")
      );
      
      const existingPos = await getDocs(posQuery);
      if (existingPos.empty) {
        const newPosRef = doc(positionsRef);
        const posPayload = {
          id: newPosRef.id,
          account_id: accountId,
          symbol: actualSymbol,
          direction: direction === "BUY" ? "BUY" : "SELL",
          domestic_segment: segment,
          option_type: normalizedExecutions[0].optionType,
          strike_price: normalizedExecutions[0].strikePrice,
          open_time: isoOpenTime, // TradeDoc requirement
          close_time: isoOpenTime, // TradeDoc requirement
          open_price: avgBuy > 0 ? avgBuy : avgSell,
          close_price: avgSell,
          lots: displayLots,
          units: displayUnits,
          trade_date: tradeDate,
          gross_pnl: matchedUnits > 0 ? positionPnl : 0,
          profit_loss: matchedUnits > 0 ? positionPnl : 0, // TradeDoc requirement
          net_pnl: matchedUnits > 0 ? positionPnl - totalTaxesSum : 0 - totalTaxesSum,
          total_taxes: totalTaxesSum,
          commission: totalTaxesSum, // TradeDoc requirement
          status: matchedUnits === 0 ? "OPEN" : "CLOSED",
          tax_breakdown: {
            brokerage: Number(totalBrokerage.toFixed(2)),
            stt: Number(totalStt.toFixed(2)),
            transactionCharges: Number(totalTxn.toFixed(2)),
            gst: Number(totalGst.toFixed(2)),
            sebi: Number(totalSebi.toFixed(2)),
            stampDuty: Number(totalStamp.toFixed(2))
          },
          notes: "Grouped Position",
          mistake_tags: [],
          screenshot_url: "",
        };
        const cleanPosPayload = Object.fromEntries(Object.entries(posPayload).filter(([_, v]) => v !== undefined));
        batch.set(newPosRef, cleanPosPayload);
        
        newTradesCount++;
        totalPnLToAdd += (matchedUnits > 0 ? positionPnl - totalTaxesSum : 0 - totalTaxesSum);
      }

      // ----------------------------------------------------
      // ENGINE 2: Raw Executions Ledger
      // ----------------------------------------------------
      // Aggregate identical split-executions into a single row using orderId or time proximity
      const aggregatedExecutions: any[] = [];
      for (const exec of normalizedExecutions) {
        const isoTime = formatToISO(exec.time || "");
        const orderId = exec.orderId || exec.exchangeOrderId || "";
        const timeKey = isoTime.substring(0, 16); // Group by minute if no orderId
        
        const existingAgg = aggregatedExecutions.find(a => {
          if (orderId && a.orderId && a.orderId === orderId) return true;
          if (!orderId && 
              a.symbol === exec.symbol &&
              a.transactionType === exec.transactionType &&
              a.time.substring(0, 16) === timeKey) {
            return true;
          }
          return false;
        });

        if (existingAgg) {
          // Weighted average price
          const totalValue = (existingAgg.price * existingAgg.unitQty) + (exec.price * exec.unitQty);
          existingAgg.unitQty += exec.unitQty;
          existingAgg.price = existingAgg.unitQty > 0 ? totalValue / existingAgg.unitQty : 0;
          
          existingAgg.brokerageCharges += (exec.brokerageCharges || 0);
          existingAgg.stt += (exec.stt || 0);
          existingAgg.exchangeTransactionCharges += (exec.exchangeTransactionCharges || 0);
          existingAgg.serviceTax += (exec.serviceTax || 0);
          existingAgg.sebiTax += (exec.sebiTax || 0);
          existingAgg.stampDuty += (exec.stampDuty || 0);
        } else {
          aggregatedExecutions.push({
            ...exec,
            orderId: orderId,
            time: isoTime,
            brokerageCharges: exec.brokerageCharges || 0,
            stt: exec.stt || 0,
            exchangeTransactionCharges: exec.exchangeTransactionCharges || 0,
            serviceTax: exec.serviceTax || 0,
            sebiTax: exec.sebiTax || 0,
            stampDuty: exec.stampDuty || 0,
          });
        }
      }

      const rawRef = collection(db, "raw_executions");
      for (const exec of aggregatedExecutions) {
        // Check if it already exists to prevent duplicates
        const q = query(
          rawRef,
          where("account_id", "==", accountId || ""),
          where("symbol", "==", exec.symbol || ""),
          where("time", "==", exec.time || ""),
          where("quantity", "==", exec.unitQty || 0),
          where("price", "==", exec.price || 0),
          where("direction", "==", exec.transactionType || "")
        );
        
        const existingRaw = await getDocs(q);
        if (!existingRaw.empty) {
          continue;
        }
        
        const newRawRef = doc(rawRef);
        const rawPayload = {
          id: newRawRef.id,
          account_id: accountId,
          symbol: exec.symbol,
          direction: exec.transactionType,
          domestic_segment: exec.segment,
          option_type: exec.optionType,
          strike_price: exec.strikePrice,
          price: exec.price,
          quantity: exec.unitQty,
          time: formatToISO(exec.time),
          brokerage: exec.brokerageCharges || 0,
          stt: exec.stt || 0,
          transaction_charges: exec.exchangeTransactionCharges || 0,
          gst: exec.serviceTax || 0,
          sebi: exec.sebiTax || 0,
          stamp_duty: exec.stampDuty || 0,
        };
        const cleanRawPayload = Object.fromEntries(Object.entries(rawPayload).filter(([_, v]) => v !== undefined));
        batch.set(newRawRef, cleanRawPayload);
      }

    } // End of grouping loop
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
