import { NextRequest, NextResponse } from "next/server";
import { MerchantService } from "./merchant-service";

export async function validatePlatformRequest(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const apiKey = authHeader?.startsWith("Bearer ") 
    ? authHeader.substring(7) 
    : req.headers.get("x-api-key");

  if (!apiKey) {
    return { error: "API key is missing", status: 401 };
  }

  const merchant = await MerchantService.getByApiKey(apiKey);
  if (!merchant) {
    return { error: "Invalid API key", status: 403 };
  }

  return { merchant };
}

export function platformError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}
