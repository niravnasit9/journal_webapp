import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

const PLAN_PRICES: Record<string, { monthly: number, yearly: number }> = {
  starter: { monthly: 15, yearly: 144 },
  pro: { monthly: 39, yearly: 348 },
  elite: { monthly: 99, yearly: 948 },
};

const CRYPTO_CONFIG: Record<string, { address: string, rate: number, network: string, decimals: number }> = {
  "USDT_TRC20": { address: "TGpphHNdQseJrZ44qNZhTAtNn2GGUskGbJ", rate: 1.0, network: "TRC20", decimals: 6 },
  "USDT_BEP20": { address: "0x0ef925358abc00e64d296fd61c142638e737fa5e", rate: 1.0, network: "BEP20", decimals: 18 },
  "USDT_ERC20": { address: "0x0ef925358abc00e64d296fd61c142638e737fa5e", rate: 1.0, network: "ERC20", decimals: 6 },
  "USDC_BEP20": { address: "0x0ef925358abc00e64d296fd61c142638e737fa5e", rate: 1.0, network: "BEP20", decimals: 18 },
  "USDC_ERC20": { address: "0x0ef925358abc00e64d296fd61c142638e737fa5e", rate: 1.0, network: "ERC20", decimals: 6 },
  "BTC": { address: "bc1qmajmjj820letfa6lxr0y8dp0g2ly54grkwkjmy", rate: 0.000016, network: "Bitcoin", decimals: 8 },
  "ETH": { address: "0x0ef925358abc00e64d296fd61c142638e737fa5e", rate: 0.00028, network: "ERC20", decimals: 18 },
  "BNB": { address: "0x0ef925358abc00e64d296fd61c142638e737fa5e", rate: 0.0017, network: "BEP20", decimals: 18 },
  "TRX": { address: "TGpphHNdQseJrZ44qNZhTAtNn2GGUskGbJ", rate: 6.25, network: "TRC20", decimals: 6 }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, txid, tier, cryptoId, billingCycle } = body;

    if (!uid || !txid || !tier || !cryptoId || !billingCycle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Clean the txid in case the user pasted a full explorer URL (e.g., https://bscscan.com/tx/0x...)
    let cleanTxid = txid.trim();
    if (cleanTxid.includes('/tx/')) {
      cleanTxid = cleanTxid.split('/tx/')[1].split('/')[0].split('?')[0];
    } else if (cleanTxid.includes('/transaction/')) {
      cleanTxid = cleanTxid.split('/transaction/')[1].split('/')[0].split('?')[0];
    }
    
    // Ensure it starts with 0x for BSC, or is just the raw string
    if (cryptoId.startsWith('bsc_') && !cleanTxid.startsWith('0x')) {
       // if it doesn't start with 0x and is supposed to be BSC, it might be invalid, but we'll let the RPC handle it
    }

    const plan = PLAN_PRICES[tier];
    const crypto = CRYPTO_CONFIG[cryptoId];

    if (!plan || !crypto) {
      return NextResponse.json({ error: "Invalid plan or cryptocurrency selected" }, { status: 400 });
    }

    const expectedUsd = billingCycle === "yearly" ? plan.yearly : plan.monthly;
    const expectedCrypto = expectedUsd * crypto.rate;

    // Security Check 1: Ensure this TxID hasn't been used before
    const txRef = doc(db, 'processed_txids', cleanTxid);
    const txSnap = await getDoc(txRef);
    
    if (txSnap.exists()) {
      return NextResponse.json({ error: "This Transaction Hash has already been used to claim a subscription." }, { status: 400 });
    }

    let txDetailsForAdmin: any = {};

    // Security Check 2: Verify the TxID on the Blockchain
    if (crypto.network === "TRC20") {
      const trcRes = await fetch(`https://apilist.tronscan.org/api/transaction-info?hash=${cleanTxid}`);
      
      if (!trcRes.ok) {
        return NextResponse.json({ error: "Transaction not found on TRON. Ensure you copied the exact TxID." }, { status: 400 });
      }

      const trcData = await trcRes.json();

      if (!trcData || Object.keys(trcData).length === 0 || !trcData.contractRet || trcData.contractRet !== 'SUCCESS') {
        return NextResponse.json({ error: "Transaction not found or failed on TRON. Ensure you copied the exact TxID." }, { status: 400 });
      }

      // Time check: Within last 1 hour (allowing a buffer for testing)
      const txTime = new Date(trcData.timestamp).getTime();
      const now = Date.now();
      if (now - txTime > 60 * 60 * 1000) {
        return NextResponse.json({ error: "Transaction is too old. Payments must be made within the 1-hour invoice window." }, { status: 400 });
      }

      const transfer = trcData.tokenTransferInfo;
      if (!transfer) {
        return NextResponse.json({ error: "No token transfer found in this transaction." }, { status: 400 });
      }

      if (transfer.to_address !== crypto.address) {
        return NextResponse.json({ error: `Funds were sent to the wrong address. Expected: ${crypto.address}` }, { status: 400 });
      }

      const amountInt = parseInt(transfer.amount_str);
      const amountInDecimals = amountInt / Math.pow(10, transfer.decimals);
      
      if (amountInDecimals < expectedCrypto * 0.99) { // 1% tolerance for fee weirdness
        return NextResponse.json({ error: `Amount sent (${amountInDecimals}) is less than required (${expectedCrypto}).` }, { status: 400 });
      }

      txDetailsForAdmin = {
        txid: txid,
        network: "TRC20",
        timestamp: new Date(trcData.timestamp).toISOString(),
        fromAddress: trcData.ownerAddress,
        toAddress: transfer.to_address,
        amount: amountInDecimals,
        tokenSymbol: transfer.symbol || "USDT",
        transactionFee: trcData.fee ? (parseInt(trcData.fee) / 1e6).toString() + " TRX" : "0",
        status: "SUCCESS"
      };
    } 
    else if (crypto.network === "BEP20") {
      const isNativeBNB = cryptoId === "bsc_bnb";
      const rpcUrl = "https://bsc-dataseed.binance.org/";

      // 1. Fetch Transaction Receipt (for status and logs)
      const receiptRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionReceipt", params: [cleanTxid], id: 1 })
      });
      
      if (!receiptRes.ok) {
         return NextResponse.json({ error: "Failed to connect to BSC Network. Please try again." }, { status: 400 });
      }
      
      const receiptData = await receiptRes.json();

      if (!receiptData.result) {
        return NextResponse.json({ error: `Transaction not found on BSC network. Please check the TxID or wait a minute for confirmation.` }, { status: 400 });
      }

      if (receiptData.result.status !== "0x1") {
        return NextResponse.json({ error: "The transaction failed on the blockchain (Out of Gas or Reverted). Your funds were not transferred." }, { status: 400 });
      }

      // 2. Fetch Transaction Details (for from, to, value, gasPrice)
      const txRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionByHash", params: [cleanTxid], id: 2 })
      });
      const txData = await txRes.json();
      const tx = txData.result;

      // 3. Fetch Block Details (for timestamp)
      const blockRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBlockByNumber", params: [receiptData.result.blockNumber, false], id: 3 })
      });
      const blockData = await blockRes.json();
      const txTime = parseInt(blockData.result.timestamp, 16) * 1000;

      // Time check: Within last 1 hour
      const now = Date.now();
      if (now - txTime > 60 * 60 * 1000) {
        return NextResponse.json({ error: "Transaction is too old. Payments must be made within the 1-hour invoice window." }, { status: 400 });
      }

      let amountInDecimals = 0;
      let fromAddress = tx.from;
      let toAddress = tx.to;

      if (isNativeBNB) {
        // Native BNB transfer
        if (toAddress.toLowerCase() !== crypto.address.toLowerCase()) {
          return NextResponse.json({ error: `Funds were sent to the wrong address. Expected: ${crypto.address}` }, { status: 400 });
        }
        const amountInt = parseInt(tx.value, 16);
        amountInDecimals = amountInt / Math.pow(10, 18);
      } else {
        // BEP20 Token transfer (USDT/USDC)
        const transferEventSig = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
        const log = receiptData.result.logs.find((l: any) => l.topics[0] === transferEventSig);
        if (!log) {
          return NextResponse.json({ error: "No token transfer found in this transaction." }, { status: 400 });
        }
        toAddress = "0x" + log.topics[2].slice(26);
        if (toAddress.toLowerCase() !== crypto.address.toLowerCase()) {
          return NextResponse.json({ error: `Funds were sent to the wrong address. Expected: ${crypto.address}` }, { status: 400 });
        }
        const amountInt = parseInt(log.data, 16);
        const decimals = cryptoId === "bsc_usdc" ? 18 : 18; // Both BSC-USD and BSC-USDC use 18 decimals on BSC
        amountInDecimals = amountInt / Math.pow(10, decimals);
      }

      if (amountInDecimals < expectedCrypto * 0.99) {
        return NextResponse.json({ error: `Amount sent (${amountInDecimals}) is less than required (${expectedCrypto}).` }, { status: 400 });
      }

      const gasUsed = parseInt(receiptData.result.gasUsed, 16);
      const gasPrice = parseInt(tx.gasPrice, 16);
      const feeBnb = (gasUsed * gasPrice / 1e18).toFixed(6);

      txDetailsForAdmin = {
        txid: cleanTxid,
        network: "BEP20",
        timestamp: new Date(txTime).toISOString(),
        fromAddress: fromAddress,
        toAddress: toAddress,
        amount: amountInDecimals,
        tokenSymbol: isNativeBNB ? "BNB" : (cryptoId === "bsc_usdc" ? "USDC" : "USDT"),
        transactionFee: `${feeBnb} BNB`,
        gasPrice: gasPrice.toString(),
        status: "SUCCESS"
      };
    } else {
      return NextResponse.json({ error: "Unsupported network for auto-verification." }, { status: 400 });
    }

    // All Checks Passed! Update the User's Subscription in Firestore
    const userRef = doc(db, "users", uid);
    
    // Fetch user details to save with the transaction (for Admin Panel visibility)
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    const userEmail = userData?.email || "Unknown Email";
    const userName = userData?.name || "Unknown User";

    await updateDoc(userRef, {
      subscription_tier: tier,
      subscription_status: "active",
      subscription_billing: billingCycle,
      last_payment_txid: cleanTxid,
      last_payment_date: new Date().toISOString()
    });

    // Mark the TxID as used so it cannot be claimed again, and save all data for Admin Panel
    await setDoc(txRef, {
      ...txDetailsForAdmin,
      uid: uid,
      userEmail: userEmail,
      userName: userName,
      tier: tier,
      cryptoId: cryptoId,
      expectedUsd: expectedUsd,
      amountUsd: expectedUsd,
      processedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: "Payment verified successfully!" });

  } catch (error: any) {
    console.error("Crypto Verification Error:", error);
    return NextResponse.json({ error: "Failed to verify transaction on the blockchain. Please ensure the hash is correct and the network is uncongested." }, { status: 500 });
  }
}
