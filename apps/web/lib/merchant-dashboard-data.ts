import { db } from "@paystream/db";
import { jsonDb } from "./json-db";
import { dbConfig } from "./db-config";

export interface DashboardMetrics {
  activePlans: number;
  totalSubscribers: number;
  monthlyRevenueUsdc: number;
}

export interface DashboardEvent {
  id: string;
  eventType: string;
  provider: string;
  executionLayer?: string;
  occurredAt: string;
  walletAddress: string | null;
  amountUsdc: number | null;
  type: 'private' | 'public';
}

export interface DashboardSubscriptionSnapshot {
  subscriptionId: string;
  walletAddress: string;
  status: string;
  paymentCount: number;
  lastUpdatedAt: string;
}

export async function getMerchantDashboardMetrics(merchantId: string): Promise<DashboardMetrics> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  if (dbConfig.shouldTryPostgres()) {
    try {
      const [plansCount, subscribersCount, revenueResult] = await Promise.all([
        db.query("SELECT COUNT(*) as count FROM plans WHERE merchant_id = $1 AND is_active = true", [merchantId]),
        db.query("SELECT COUNT(DISTINCT user_id) as count FROM subscriptions WHERE merchant_id = $1 AND status = 'active'", [merchantId]),
        db.query(
          "SELECT SUM(amount_usdc) as total FROM payments WHERE merchant_id = $1 AND status IN ('success', 'completed') AND paid_at >= $2",
          [merchantId, firstDayOfMonth]
        )
      ]);

      return {
        activePlans: parseInt(plansCount.rows[0]?.count || "0"),
        totalSubscribers: parseInt(subscribersCount.rows[0]?.count || "0"),
        monthlyRevenueUsdc: parseFloat(revenueResult.rows[0]?.total || "0")
      };
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        dbConfig.markPostgresAsUnavailable();
      } else {
        console.error("[DashboardData] Error fetching metrics:", err);
      }
    }
  }

  // Fallback to local JSON DB
  const [plansRaw, subscriptionsRaw, paymentsRaw] = await Promise.all([
      jsonDb.listPlans(),
      jsonDb.listSubscriptions(),
      jsonDb.listPayments()
    ]);

    const plans = plansRaw || [];
    const subscriptions = subscriptionsRaw || [];
    const payments = paymentsRaw || [];

  const merchantPlans = plans.filter(p => p.merchantId === merchantId && p.active);
  const merchantSubs = subscriptions.filter(s => s.merchantId === merchantId && s.status === 'active');
  
  const merchantRevenue = payments
    .filter(p => 
      p && p.merchantId === merchantId && 
      (p.status === 'success' || p.status === 'completed') && 
      new Date(p.paidAt) >= new Date(firstDayOfMonth)
    )
    .reduce((sum, p) => sum + p.amountUsdc, 0);

  return {
    activePlans: merchantPlans.length,
    totalSubscribers: merchantSubs.length,
    monthlyRevenueUsdc: merchantRevenue
  };
}

export async function getMerchantRecentEvents(merchantId: string, limit = 6, filterType?: string): Promise<DashboardEvent[]> {
  if (dbConfig.shouldTryPostgres()) {
    try {
      let queryText = `
        SELECT 
          p.id, 
          'payment_success' as event_type, 
          p.provider, 
          p.execution_layer, 
          p.paid_at as occurred_at, 
          p.wallet_address, 
          p.amount_usdc,
          p.type
        FROM payments p
        WHERE p.merchant_id = $1 AND p.status IN ('success', 'completed')
      `;
      
      const queryParams: any[] = [merchantId];
      
      if (filterType === 'private' || filterType === 'public') {
        queryText += ` AND p.type = $2`;
        queryParams.push(filterType);
      }

      queryText += ` ORDER BY p.paid_at DESC LIMIT $${queryParams.length + 1}`;
      queryParams.push(limit);

      const result = await db.query(queryText, queryParams);

      return result.rows.map(row => ({
        id: row.id,
        eventType: row.event_type,
        provider: row.provider,
        executionLayer: row.execution_layer,
        occurredAt: row.occurred_at.toISOString(),
        walletAddress: row.wallet_address,
        amountUsdc: parseFloat(row.amount_usdc),
        type: row.type
      }));
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        dbConfig.markPostgresAsUnavailable();
      } else {
        console.error("[DashboardData] Error fetching events:", err);
      }
    }
  }

  // Fallback to local JSON DB
  const paymentsRaw = await jsonDb.listPayments();
    const payments = paymentsRaw || [];
    let filtered = payments.filter(p => p && p.merchantId === merchantId && (p.status === 'success' || p.status === 'completed'));
    
    if (filterType === 'private' || filterType === 'public') {
      filtered = filtered.filter(p => p.type === filterType);
    }

    return filtered
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        eventType: 'payment_success',
        provider: p.provider,
        executionLayer: p.executionLayer,
        occurredAt: p.paidAt,
        walletAddress: p.walletAddress || null,
        amountUsdc: p.amountUsdc,
        type: p.type
      }));
}

export async function getMerchantSubscriptionSnapshots(merchantId: string, limit = 6): Promise<DashboardSubscriptionSnapshot[]> {
  if (dbConfig.shouldTryPostgres()) {
    try {
      const result = await db.query(`
        SELECT 
          s.id as subscription_id, 
          u.wallet_address, 
          s.status, 
          s.updated_at,
          (SELECT COUNT(*) FROM payments p WHERE p.subscription_id = s.id AND p.status IN ('success', 'completed')) as payment_count
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        WHERE s.merchant_id = $1
        ORDER BY s.updated_at DESC
        LIMIT $2
      `, [merchantId, limit]);

      return result.rows.map(row => ({
        subscriptionId: row.subscription_id,
        walletAddress: row.wallet_address,
        status: row.status,
        paymentCount: parseInt(row.payment_count),
        lastUpdatedAt: row.updated_at.toISOString()
      }));
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        dbConfig.markPostgresAsUnavailable();
      } else {
        console.error("[DashboardData] Error fetching snapshots:", err);
      }
    }
  }

  // Fallback to local JSON DB
  const [subscriptionsRaw, usersRaw, paymentsRaw] = await Promise.all([
      jsonDb.listSubscriptions(),
      jsonDb.listUsers(),
      jsonDb.listPayments()
    ]);

    const subscriptions = subscriptionsRaw || [];
    const users = usersRaw || [];
    const payments = paymentsRaw || [];

    const merchantSubs = subscriptions
      .filter(s => s && s.merchantId === merchantId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);

    return merchantSubs.map(s => {
      const user = users.find(u => u.id === s.userId);
      const paymentCount = payments.filter(p => p.subscriptionId === s.id && (p.status === 'success' || p.status === 'completed')).length;
      
      return {
        subscriptionId: s.id,
        walletAddress: user?.walletAddress || "Unknown",
        status: s.status,
        paymentCount: paymentCount,
        lastUpdatedAt: s.updatedAt
      };
    });
}
