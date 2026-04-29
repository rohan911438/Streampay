import { db } from "@paystream/db";

export interface Merchant {
  id: string;
  name: string;
  api_key: string;
  wallet_address?: string;
  webhook_url?: string;
  created_at: Date;
  updated_at: Date;
}

export const MerchantService = {
  async getByApiKey(apiKey: string): Promise<Merchant | null> {
    const result = await db.query<Merchant>(
      "SELECT * FROM merchants WHERE api_key = $1",
      [apiKey]
    );
    return result.rows[0] ?? null;
  },

  async getById(id: string): Promise<Merchant | null> {
    const result = await db.query<Merchant>(
      "SELECT * FROM merchants WHERE id = $1",
      [id]
    );
    return result.rows[0] ?? null;
  },

  async getDemoMerchant(): Promise<Merchant | null> {
    return this.getById("00000000-0000-0000-0000-000000000000");
  },

  async createMerchant(name: string, walletAddress?: string): Promise<Merchant | null> {
    const apiKey = `sp_live_${Math.random().toString(36).substring(2, 15)}`;
    return db.insert<Merchant>("merchants", {
      name,
      api_key: apiKey,
      wallet_address: walletAddress,
    });
  }
};
