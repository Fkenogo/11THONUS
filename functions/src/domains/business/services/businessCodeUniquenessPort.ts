/**
 * `businessCode` uniqueness port (`ENG-P2-002B`, Phase G/H).
 *
 * Mirrors `functions/src/domains/loyaltyNumber/services/loyaltyNumberUniquenessPort.ts`
 * exactly: the interface only. The real, transactional, Firestore-backed
 * implementation (a `businessCodeReservations/{businessCode}` doc-existence
 * check via `transaction.get()`, mirroring `loyaltyNumbers/{value}`) lives in
 * `../repositories/businessRepository.ts`, never here.
 */

export interface BusinessCodeUniquenessPort {
  isAlreadyReserved(candidate: string): Promise<boolean>;
}
