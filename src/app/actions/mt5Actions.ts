"use server";

import { randomBytes, createCipheriv } from "crypto";

// Ensure this matches your MetaApi token in .env.local
const META_API_TOKEN = process.env.META_API_TOKEN || "test_token"; 

// A 32-byte key for AES-256-CBC. In production, this MUST come from .env.local
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef"; 
const IV_LENGTH = 16;

export async function encryptPassword(text: string) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export async function provisionMetaApiAccount(data: {
  login: string;
  password: string; // Investor password
  server: string;
  name: string;
}) {
  try {
    // Check if token exists, otherwise fail validation strictly as requested.
    if (!META_API_TOKEN || META_API_TOKEN === "test_token") {
      throw new Error("Invalid MetaApi Token. Please configure META_API_TOKEN in .env.local");
    }

    // 1. Strict Validation: Attempt to connect and validate the account via MetaApi SDK
    // Dynamic import to avoid edge runtime issues if applicable
    const MetaApi = require('metaapi.cloud-sdk').default;
    const metaapi = new MetaApi(META_API_TOKEN);

    // Creating the account in MetaApi acts as validation. If credentials/server are wrong, 
    // it will either fail here or fail to deploy.
    const account = await metaapi.metatraderAccountApi.createAccount({
      name: data.name,
      type: 'cloud',
      login: data.login,
      password: data.password,
      server: data.server,
      platform: 'mt5',
      magic: 1000
    });

    // Wait for account to be deployed to fully validate it connects
    await account.deploy();
    await account.waitConnected();

    // If it reaches here, the account is successfully validated and connected!
    console.log("MetaApi Account Validated and Provisioned:", account.id);
    
    // 2. Encrypt the password securely for our Firestore storage
    const encryptedPassword = await encryptPassword(data.password);
    
    return {
      success: true,
      metaapiAccountId: account.id,
      encryptedPassword,
    };
  } catch (error: any) {
    console.error("MetaApi validation error:", error);
    let errorMessage = error.message;
    if (error.details) {
      errorMessage += " | Details: " + JSON.stringify(error.details);
    } else if (error.body) {
      errorMessage += " | Body: " + JSON.stringify(error.body);
    }
    return {
      success: false,
      error: errorMessage || "Invalid account credentials or server. Please check and try again.",
    };
  }
}
