import { randomUUID } from "crypto";

export type DodoWebhookEventType =
  | "payment.succeeded"
  | "subscription.active"
  | "subscription.renewed"
  | string;

export type DodoWebhookEventRecord = {
  id: string;
  eventType: DodoWebhookEventType;
  subscriptionId: string | null;
  customerEmail: string | null;
  paymentId: string | null;
  receivedAt: string;
  payload: Record<string, unknown>;
};

export type DodoSubscriptionSnapshot = {
  recordKey: string;
  subscriptionId: string;
  customerEmail: string | null;
  status: string;
  lastEventType: DodoWebhookEventType;
  lastUpdatedAt: string;
  paymentCount: number;
};

type DodoWebhookState = {
  latestEvents: DodoWebhookEventRecord[];
  subscriptions: Record<string, DodoSubscriptionSnapshot>;
};

type DodoWebhookEventInput = {
  eventType: DodoWebhookEventType;
  subscriptionId?: string | null;
  customerEmail?: string | null;
  paymentId?: string | null;
  payload: Record<string, unknown>;
};

const MAX_EVENT_HISTORY = 25;

function createDefaultState(): DodoWebhookState {
  return {
    latestEvents: [],
    subscriptions: {},
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __paystreamDodoWebhookState: DodoWebhookState | undefined;
}

const state = globalThis.__paystreamDodoWebhookState ?? createDefaultState();

globalThis.__paystreamDodoWebhookState = state;

function getSubscriptionKey(subscriptionId?: string | null, customerEmail?: string | null): string | null {
  if (subscriptionId && subscriptionId.length > 0) {
    return `subscription:${subscriptionId}`;
  }

  if (customerEmail && customerEmail.length > 0) {
    return `customer:${customerEmail.toLowerCase()}`;
  }

  return null;
}

function getNextStatus(eventType: DodoWebhookEventType): string {
  if (eventType === "subscription.active" || eventType === "subscription.renewed") {
    return "active";
  }

  if (eventType === "payment.succeeded") {
    return "paid";
  }

  return "updated";
}

export function recordDodoWebhookEvent(input: DodoWebhookEventInput): DodoWebhookEventRecord {
  const subscriptionKey = getSubscriptionKey(input.subscriptionId ?? null, input.customerEmail ?? null);
  const receivedAt = new Date().toISOString();
  const eventRecord: DodoWebhookEventRecord = {
    id: randomUUID(),
    eventType: input.eventType,
    subscriptionId: input.subscriptionId ?? null,
    customerEmail: input.customerEmail ?? null,
    paymentId: input.paymentId ?? null,
    receivedAt,
    payload: input.payload,
  };

  state.latestEvents = [eventRecord, ...state.latestEvents].slice(0, MAX_EVENT_HISTORY);

  if (subscriptionKey) {
    const previous = state.subscriptions[subscriptionKey];
    const previousPaymentCount = previous?.paymentCount ?? 0;

    state.subscriptions[subscriptionKey] = {
      recordKey: subscriptionKey,
      subscriptionId: input.subscriptionId ?? previous?.subscriptionId ?? null,
      customerEmail: input.customerEmail ?? previous?.customerEmail ?? null,
      status: getNextStatus(input.eventType),
      lastEventType: input.eventType,
      lastUpdatedAt: receivedAt,
      paymentCount: previousPaymentCount + (input.eventType === "payment.succeeded" ? 1 : 0),
    };
  }

  return eventRecord;
}

export function getDodoWebhookSnapshot() {
  return {
    latestEvents: state.latestEvents,
    subscriptions: Object.values(state.subscriptions).sort((left, right) => {
      return right.lastUpdatedAt.localeCompare(left.lastUpdatedAt);
    }),
  };
}
