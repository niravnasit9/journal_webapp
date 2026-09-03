export type DomesticSegment = "EQUITY_INTRADAY" | "EQUITY_DELIVERY" | "FNO_OPTIONS" | "FNO_FUTURES";

export interface TaxCalculationResult {
  grossPnl: number;
  netPnl: number;
  totalTaxes: number;
  breakdown: {
    brokerage: number;
    stt: number;
    transactionCharges: number;
    gst: number;
    sebi: number;
    stampDuty: number;
  };
}

export function calculateDomesticTaxes(
  segment: DomesticSegment,
  buyPrice: number,
  sellPrice: number,
  quantity: number
): TaxCalculationResult {
  const buyTurnover = buyPrice * quantity;
  const sellTurnover = sellPrice * quantity;
  const totalTurnover = buyTurnover + sellTurnover;
  
  const grossPnl = sellTurnover - buyTurnover;
  
  let brokerage = 0;
  let stt = 0;
  let transactionCharges = 0;
  let stampDuty = 0;
  
  // SEBI charges (0.0001% flat on total turnover across all segments)
  const sebi = totalTurnover * 0.000001; 

  switch (segment) {
    case "EQUITY_INTRADAY":
      // Brokerage: Min of 0.03% or Rs 20 per side
      brokerage = Math.min(buyTurnover * 0.0003, 20) + Math.min(sellTurnover * 0.0003, 20);
      // STT: 0.025% on Sell side only
      stt = sellTurnover * 0.00025;
      // Trans. charge: 0.00325%
      transactionCharges = totalTurnover * 0.0000325;
      // Stamp duty: 0.003% on Buy side
      stampDuty = buyTurnover * 0.00003;
      break;

    case "EQUITY_DELIVERY":
      // Brokerage: Zero (Discount brokers like Zerodha)
      brokerage = 0;
      // STT: 0.1% on Both sides
      stt = Math.round(totalTurnover * 0.001);
      // Trans. charge: 0.00325%
      transactionCharges = totalTurnover * 0.0000325;
      // Stamp duty: 0.015% on Buy side
      stampDuty = buyTurnover * 0.00015;
      break;

    case "FNO_OPTIONS":
      // Brokerage: Flat 20 per executed order (buy & sell = 40)
      brokerage = 40; 
      // STT: 0.125% on Sell premium
      stt = Math.round(sellTurnover * 0.00125);
      // Trans. charge: ~0.05% on Premium turnover
      transactionCharges = totalTurnover * 0.0005;
      // Stamp duty: 0.003% on Buy side
      stampDuty = buyTurnover * 0.00003;
      break;

    case "FNO_FUTURES":
      // Brokerage: Min of 0.03% or Rs 20 per side
      brokerage = Math.min(buyTurnover * 0.0003, 20) + Math.min(sellTurnover * 0.0003, 20);
      // STT: 0.0125% on Sell side
      stt = Math.round(sellTurnover * 0.000125);
      // Trans. charge: 0.0019%
      transactionCharges = totalTurnover * 0.000019;
      // Stamp duty: 0.002% on Buy side
      stampDuty = buyTurnover * 0.00002;
      break;
  }

  // GST: 18% on (Brokerage + Transaction Charges + SEBI)
  const gst = (brokerage + transactionCharges + sebi) * 0.18;

  const totalTaxes = brokerage + stt + transactionCharges + gst + sebi + stampDuty;
  const netPnl = grossPnl - totalTaxes;

  return {
    grossPnl,
    netPnl,
    totalTaxes,
    breakdown: {
      brokerage: Number(brokerage.toFixed(2)),
      stt: Number(stt.toFixed(2)),
      transactionCharges: Number(transactionCharges.toFixed(2)),
      gst: Number(gst.toFixed(2)),
      sebi: Number(sebi.toFixed(2)),
      stampDuty: Number(stampDuty.toFixed(2))
    }
  };
}
