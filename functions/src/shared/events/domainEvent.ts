/**
 * Event contract (ENG-P1-002).
 *
 * `DomainEvent<T>`, exactly as TRD11 §11.8 defines it. `eventType` shall
 * follow the naming standard in `./eventNaming.ts` (TRD11 §11.9). Every
 * event schema is versioned; consumers declare which versions they
 * support (a future domain consumer's own responsibility, not this
 * shared contract's).
 */

export type EventActor = {
  actorType: "user" | "service" | "system";
  actorId: string;
  role?: string;
};

export type DomainEvent<T> = {
  eventId: string;
  eventType: string;
  eventVersion: number;
  sourceDomain: string;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  causationId?: string;
  actor: EventActor;
  occurredAt: string;
  payload: T;
};
