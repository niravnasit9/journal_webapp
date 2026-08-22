import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    success: false, 
    message: "This API route has been deprecated. Please use the standalone Node.js seed script 'scripts/seed-prop-firms.ts' instead for seeding prop firms." 
  });
}
