import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  auditChannel,
  disconnectSubscriber,
  subscribe,
  subscribeToAudit,
  userChannel,
} from "./pubsub.js";

// ─── Mocks ─────────────────────────────────────────────────────────────────

// Silence pino in tests
vi.mock("./logger.js", () => ({
  createLogger: () => ({
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  }),
}));

type Listener = (...args: unknown[]) => void;

interface MockSubscriber {
  subscribe: ReturnType<typeof vi.fn>;
  unsubscribe: ReturnType<typeof vi.fn>;
  quit: ReturnType<typeof vi.fn>;
  on: (event: string, fn: Listener) => MockSubscriber;
  off: (event: string, fn: Listener) => MockSubscriber;
  emit: (event: string, ...args: unknown[]) => boolean;
  listenerCount: (event: string) => number;
  emitMessage: (channel: string, payload: unknown) => void;
}

// Shared state between the ioredis mock factory and the test bodies.
// vi.hoisted runs before vi.mock, so the registry is available inside the
// mock's constructor (which runs lazily on `new Redis(...)`).
const mocks = vi.hoisted(() => ({
  subscribers: [] as MockSubscriber[],
}));

vi.mock("ioredis", () => {
  // Minimal EventEmitter-shaped class. Avoids extending node:events from
  // inside the mock factory (which forces a require/any tangle) and only
  // implements the surface the code under test actually uses.
  class MockSubscriberImpl implements MockSubscriber {
    private listeners = new Map<string, Listener[]>();
    subscribe = vi.fn(() => Promise.resolve(1));
    unsubscribe = vi.fn(() => Promise.resolve(1));
    quit = vi.fn(() => Promise.resolve("OK"));

    constructor() {
      mocks.subscribers.push(this);
    }

    on(event: string, fn: Listener): this {
      const arr = this.listeners.get(event) ?? [];
      arr.push(fn);
      this.listeners.set(event, arr);
      return this;
    }

    off(event: string, fn: Listener): this {
      const arr = this.listeners.get(event);
      if (arr)
        this.listeners.set(
          event,
          arr.filter((f) => f !== fn),
        );
      return this;
    }

    emit(event: string, ...args: unknown[]): boolean {
      const arr = this.listeners.get(event);
      if (!arr || arr.length === 0) return false;
      for (const fn of [...arr]) fn(...args);
      return true;
    }

    listenerCount(event: string): number {
      return this.listeners.get(event)?.length ?? 0;
    }

    emitMessage(channel: string, payload: unknown): void {
      this.emit("message", channel, JSON.stringify(payload));
    }
  }

  return { Redis: MockSubscriberImpl };
});

function latestSubscriber(): MockSubscriber {
  const sub = mocks.subscribers.at(-1);
  if (!sub) throw new Error("No subscriber created yet");
  return sub;
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("pubsub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subscribers.length = 0;
    vi.stubEnv("REDIS_URL", "redis://localhost:6379");
    vi.stubEnv("REDIS_TLS", "false");
  });

  afterEach(async () => {
    await disconnectSubscriber();
    vi.unstubAllEnvs();
  });

  describe("channel naming", () => {
    it("auditChannel formats as audex:audit:<id>", () => {
      expect(auditChannel("abc123")).toBe("audex:audit:abc123");
    });

    it("userChannel formats as audex:user:<id>", () => {
      expect(userChannel("user-42")).toBe("audex:user:user-42");
    });
  });

  describe("subscribe", () => {
    it("returns a no-op unsubscribe when REDIS_URL is unset", async () => {
      vi.stubEnv("REDIS_URL", "");
      const handler = vi.fn();
      const unsubscribe = await subscribe("audex:test", handler);
      expect(mocks.subscribers).toHaveLength(0);
      await expect(unsubscribe()).resolves.toBeUndefined();
    });

    it("issues sub.subscribe on the 0 to 1 transition", async () => {
      const handler = vi.fn();
      await subscribe("audex:test", handler);
      const sub = latestSubscriber();
      expect(sub.subscribe).toHaveBeenCalledTimes(1);
      expect(sub.subscribe).toHaveBeenCalledWith("audex:test");
    });

    it("does not re-issue sub.subscribe for additional handlers on same channel", async () => {
      await subscribe("audex:test", vi.fn());
      await subscribe("audex:test", vi.fn());
      await subscribe("audex:test", vi.fn());
      const sub = latestSubscriber();
      expect(sub.subscribe).toHaveBeenCalledTimes(1);
    });

    it("issues separate sub.subscribe for distinct channels", async () => {
      await subscribe("audex:a", vi.fn());
      await subscribe("audex:b", vi.fn());
      const sub = latestSubscriber();
      expect(sub.subscribe).toHaveBeenCalledTimes(2);
      expect(sub.subscribe).toHaveBeenNthCalledWith(1, "audex:a");
      expect(sub.subscribe).toHaveBeenNthCalledWith(2, "audex:b");
    });

    it("registers exactly one shared 'message' listener regardless of subscriber count", async () => {
      await subscribe("audex:a", vi.fn());
      await subscribe("audex:a", vi.fn());
      await subscribe("audex:b", vi.fn());
      // The shared dispatcher is installed inside getSubscriber on first
      // creation — exactly one message listener total.
      expect(latestSubscriber().listenerCount("message")).toBe(1);
    });
  });

  describe("dispatch", () => {
    it("delivers messages to all handlers on the matching channel", async () => {
      const h1 = vi.fn();
      const h2 = vi.fn();
      await subscribe("audex:test", h1);
      await subscribe("audex:test", h2);

      const payload = { event: "hello", data: { x: 1 } };
      latestSubscriber().emitMessage("audex:test", payload);

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h1).toHaveBeenCalledWith(payload);
      expect(h2).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledWith(payload);
    });

    it("does not deliver messages to handlers on other channels", async () => {
      const onA = vi.fn();
      const onB = vi.fn();
      await subscribe("audex:a", onA);
      await subscribe("audex:b", onB);

      latestSubscriber().emitMessage("audex:a", { event: "for-a" });

      expect(onA).toHaveBeenCalledTimes(1);
      expect(onB).not.toHaveBeenCalled();
    });

    it("ignores malformed JSON without throwing", async () => {
      const handler = vi.fn();
      await subscribe("audex:test", handler);

      // Emit raw garbage (bypass emitMessage which JSON-stringifies)
      expect(() => {
        latestSubscriber().emit("message", "audex:test", "{ not json");
      }).not.toThrow();
      expect(handler).not.toHaveBeenCalled();
    });

    it("isolates a throwing handler from siblings", async () => {
      const bad = vi.fn(() => {
        throw new Error("boom");
      });
      const good = vi.fn();
      await subscribe("audex:test", bad);
      await subscribe("audex:test", good);

      expect(() => {
        latestSubscriber().emitMessage("audex:test", { event: "ping" });
      }).not.toThrow();
      expect(bad).toHaveBeenCalledTimes(1);
      expect(good).toHaveBeenCalledTimes(1);
    });
  });

  describe("unsubscribe (ref counting)", () => {
    it("issues sub.unsubscribe only on the 1 to 0 transition", async () => {
      const off1 = await subscribe("audex:test", vi.fn());
      const off2 = await subscribe("audex:test", vi.fn());
      const sub = latestSubscriber();

      await off1();
      expect(sub.unsubscribe).not.toHaveBeenCalled();

      await off2();
      expect(sub.unsubscribe).toHaveBeenCalledTimes(1);
      expect(sub.unsubscribe).toHaveBeenCalledWith("audex:test");
    });

    it("does not break sibling handlers when one unsubscribes mid-traffic", async () => {
      const surviving = vi.fn();
      const leaving = vi.fn();
      const offLeaving = await subscribe("audex:test", leaving);
      await subscribe("audex:test", surviving);
      const sub = latestSubscriber();

      await offLeaving();

      sub.emitMessage("audex:test", { event: "after-leaving" });
      expect(leaving).not.toHaveBeenCalled();
      expect(surviving).toHaveBeenCalledTimes(1);
      expect(sub.unsubscribe).not.toHaveBeenCalled();
    });

    it("a second unsubscribe call is a no-op", async () => {
      const off = await subscribe("audex:test", vi.fn());
      await off();
      await expect(off()).resolves.toBeUndefined();
      const sub = latestSubscriber();
      expect(sub.unsubscribe).toHaveBeenCalledTimes(1);
    });

    it("unsubscribing all handlers on one channel does not affect another", async () => {
      const offA = await subscribe("audex:a", vi.fn());
      const onB = vi.fn();
      await subscribe("audex:b", onB);

      await offA();
      const sub = latestSubscriber();
      expect(sub.unsubscribe).toHaveBeenCalledWith("audex:a");

      sub.emitMessage("audex:b", { event: "still-here" });
      expect(onB).toHaveBeenCalledTimes(1);
    });
  });

  describe("disconnectSubscriber", () => {
    it("quits the underlying connection and resets the subscriber", async () => {
      await subscribe("audex:test", vi.fn());
      const first = latestSubscriber();

      await disconnectSubscriber();
      expect(first.quit).toHaveBeenCalledTimes(1);

      // Next subscribe should create a brand new connection.
      await subscribe("audex:test", vi.fn());
      expect(mocks.subscribers.length).toBe(2);
      expect(latestSubscriber()).not.toBe(first);
    });

    it("clears the channel handler registry", async () => {
      const handler = vi.fn();
      await subscribe("audex:test", handler);
      const first = latestSubscriber();

      await disconnectSubscriber();

      // Re-subscribe to the same channel and make sure the new subscriber
      // issues subscribe again (i.e. handler set was cleared, otherwise
      // ref-count would still be 1 and we'd skip the subscribe call).
      await subscribe("audex:test", vi.fn());
      const second = latestSubscriber();
      expect(second).not.toBe(first);
      expect(second.subscribe).toHaveBeenCalledTimes(1);
      expect(second.subscribe).toHaveBeenCalledWith("audex:test");
    });
  });

  describe("subscribeToAudit", () => {
    it("subscribes to the canonical audit channel", async () => {
      await subscribeToAudit("audit-123", vi.fn());
      const sub = latestSubscriber();
      expect(sub.subscribe).toHaveBeenCalledWith("audex:audit:audit-123");
    });
  });
});
