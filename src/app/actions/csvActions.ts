"use server";

import { db } from "@/lib/firebase/config";
import { collection, doc, writeBatch, getDoc, query, where, getDocs } from "firebase/firestore";
import { TradeDoc, AccountDoc } from "@/lib/firebase/schema";
import { calculateDomesticTaxes } from "@/utils/brokerageMath";

export async function syncCsvTradesAction(accountId: string, allTrades: any[]) {
  try {
    if (!allTrades || allTrades.length === 0) {
      return { success: true, count: 0, message: "No trades found." };
    }

    const accountRef = doc(db, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);
    if (!accountSnap.exists()) {
      throw new Error("Account not found");
    }

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
      const getValidTime = (t: any) => {
        const val = (t.exchangeTime && t.exchangeTime !== "NA") ? t.exchangeTime : ((t.createTime && t.createTime !== "NA") ? t.createTime : t.tradeTime);
        return (val || "");
      };
      executions.sort((a, b) => new Date(getValidTime(a).replace(" ", "T")).getTime() - new Date(getValidTime(b).replace(" ", "T")).getTime());

      let segment = "EQUITY";
      const exch = executions[0].exchangeSegment || "";
      if (exch.includes("COMM")) segment = "COMMODITY";
      else if (exch.includes("FNO") || exch === "BSE_FNO" || exch.includes("OPT")) segment = "FNO_OPTIONS"; 

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

      let buyUnits = 0, sellUnits = 0;
      let buyLots = 0, sellLots = 0;
      let buyValue = 0, sellValue = 0;
      let totalBrokerage = 0, totalStt = 0, totalTxn = 0, totalGst = 0, totalSebi = 0, totalStamp = 0;

      for (const t of normalizedExecutions) {
        const rawQty = t.tradedQuantity || t.quantity || 0;
        let lots = rawQty;
        if (segment === "COMMODITY") {
          if (rawQty >= lotSize && rawQty % lotSize === 0) lots = rawQty / lotSize;
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

        if ((bCharges + sttCharges + gstCharges) < 5) {
          const turnover = t.unitQty * t.price;
          bCharges = 20;
          if (segment === "COMMODITY" || segment === "FNO_OPTIONS") {
             if (t.transactionType === "SELL") sttCharges = turnover * 0.00125;
             txnCharges = turnover * 0.0005;
             if (t.transactionType === "BUY") stampCharges = turnover * 0.00003;
             sebiCharges = turnover * 0.000001;
          } else {
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
        
        t.brokerageCharges = bCharges;
        t.stt = sttCharges;
        t.exchangeTransactionCharges = txnCharges;
        t.serviceTax = gstCharges;
        t.sebiTax = sebiCharges;
        t.stampDuty = stampCharges;
      }

      let pnl = 0;
      let status: "OPEN" | "CLOSED" = "OPEN";
      if (buyUnits > 0 && sellUnits > 0) {
        const avgBuy = buyValue / buyUnits;
        const avgSell = sellValue / sellUnits;
        const matchedUnits = Math.min(buyUnits, sellUnits);
        pnl = (avgSell - avgBuy) * matchedUnits;
      }
      if (buyUnits === sellUnits && buyUnits > 0) status = "CLOSED";

      const totalTaxes = totalBrokerage + totalStt + totalTxn + totalGst + totalSebi + totalStamp;
      const netPnl = pnl - totalTaxes;

      let optType = "";
      let strPrice = "";
      if (segment === "FNO_OPTIONS" || segment === "COMMODITY") {
        const ceMatch = actualSymbol.match(/(?:CE|CALL)$/i) || actualSymbol.match(/(\d{3,5})CE/i);
        const peMatch = actualSymbol.match(/(?:PE|PUT)$/i) || actualSymbol.match(/(\d{3,5})PE/i);
        
        if (ceMatch) optType = "CE";
        else if (peMatch) optType = "PE";
        
        // Match numbers in the symbol string
        const numMatch = actualSymbol.match(/(\d{3,5})(?:CE|PE)?$/i);
        if (numMatch && numMatch[1]) {
          strPrice = numMatch[1];
        } else {
          const parts = actualSymbol.split(' ');
          for (let i = 0; i < parts.length; i++) {
            if (!isNaN(Number(parts[i])) && Number(parts[i]) > 0) {
              strPrice = parts[i];
            }
          }
        }
      }

      const tradeDate = groupKey.split('_')[1];
      const positionsRef = collection(db, "trades");
      
      const posQuery = query(
        positionsRef, 
        where("account_id", "==", accountId || ""),
        where("symbol", "==", actualSymbol || ""),
        where("trade_date", "==", tradeDate || "")
      );
      
      const existingPos = await getDocs(posQuery);
      if (existingPos.empty) {
        newTradesCount++;
        totalPnLToAdd += netPnl;
        const newPosRef = doc(positionsRef);
        const posPayload = {
          id: newPosRef.id,
          account_id: accountId,
          symbol: actualSymbol,
          direction: executions.length > 0 ? executions[0].transactionType : "BUY",
          option_type: optType,
          strike_price: strPrice,
          domestic_segment: segment,
          trade_date: tradeDate,
          status,
          buy_quantity: buyUnits,
          sell_quantity: sellUnits,
          buy_price: buyUnits > 0 ? buyValue / buyUnits : 0,
          sell_price: sellUnits > 0 ? sellValue / sellUnits : 0,
          open_price: buyUnits > 0 ? buyValue / buyUnits : 0,
          close_price: sellUnits > 0 ? sellValue / sellUnits : 0,
          units: Math.max(buyUnits, sellUnits),
          lots: Math.max(buyLots, sellLots),
          gross_pnl: pnl,
          net_pnl: netPnl,
          profit_loss: pnl,
          commission: totalTaxes,
          open_time: executions.length > 0 ? getValidTime(executions[0]).replace(" ", "T") : '',
          close_time: executions.length > 0 ? getValidTime(executions[executions.length - 1]).replace(" ", "T") : '',
          tax_breakdown: {
            brokerage: totalBrokerage,
            stt: totalStt,
            exchange_txn: totalTxn,
            gst: totalGst,
            sebi: totalSebi,
            stamp_duty: totalStamp
          },
          total_taxes: totalTaxes,
          created_at: new Date().toISOString()
        };
        const safePayload = Object.fromEntries(Object.entries(posPayload).filter(([_, v]) => v !== undefined));
        batch.set(newPosRef, safePayload);
      }

      const formatToISO = (tStr: string) => {
        if (tStr.includes("T")) return tStr;
        return tStr.replace(" ", "T");
      };

      const rawRef = collection(db, "raw_executions");
      for (const exec of normalizedExecutions) {
        const q = query(
          rawRef,
          where("account_id", "==", accountId || ""),
          where("symbol", "==", exec.symbol || exec.tradingSymbol || ""),
          where("time", "==", formatToISO(exec.time || "")),
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
          symbol: actualSymbol,
          option_type: optType,
          strike_price: strPrice,
          domestic_segment: segment,
          direction: exec.transactionType,
          quantity: exec.unitQty,
          price: exec.price,
          time: formatToISO(exec.time),
          brokerage: exec.brokerageCharges,
          stt: exec.stt,
          transaction_charges: exec.exchangeTransactionCharges,
          gst: exec.serviceTax,
          sebi: exec.sebiTax,
          stamp_duty: exec.stampDuty,
          created_at: new Date().toISOString()
        };
        const safeRawPayload = Object.fromEntries(Object.entries(rawPayload).filter(([_, v]) => v !== undefined));
        batch.set(newRawRef, safeRawPayload);
      }
    }

    if (newTradesCount > 0) {
      batch.update(accountRef, {
        updated_at: new Date().toISOString()
      });
      await batch.commit();
    }
    return { success: true, count: newTradesCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
