type Handler = (payload: any) => void;

class LocalSocketShim {
  private listeners = new Map<string, Set<Handler>>();

  emit(event: string, payload: any): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.forEach((handler) => handler(payload));
  }

  on(event: string, handler: Handler): void {
    const handlers = this.listeners.get(event) ?? new Set<Handler>();
    handlers.add(handler);
    this.listeners.set(event, handlers);
  }

  off(event: string, handler: Handler): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.delete(handler);
    if (handlers.size === 0) this.listeners.delete(event);
  }
}

export const socket = new LocalSocketShim();
