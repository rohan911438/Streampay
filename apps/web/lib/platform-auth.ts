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

export type PlatformHandler = (
  req: NextRequest,
  context: { merchant: any }
) => Promise<NextResponse>;

export function withPlatformAuth(handler: PlatformHandler) {
  return async (req: NextRequest) => {
    const { merchant, error, status } = await validatePlatformRequest(req);

    if (error || !merchant) {
      return platformError(error || "Unauthorized", status);
    }

    return handler(req, { merchant });
  };
}
