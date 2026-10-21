import { ITEM_IDS } from '../data/items';
import type { ItemId } from '../types';
import type { ActionResult } from './farming';
import { Inventory, MAX_ITEM_COUNT } from './inventory';

/** Credencial desta versão: somente a derivação é distribuída. A sessão nunca entra no save. */
const LOCAL_CREDENTIAL: AdminCredential = {
  salt: 'dbc7550413cb9613b2815ab750f3ec8d091a54224e9edfb2',
  hash: '50a19d31fec77d9bf2f4d0df01e9767115a5f6d77f8b2a8c615a4e9e1538e3a4',
  iterations: 210_000,
};

export interface AdminCredential { salt: string; hash: string; iterations: number }
const hexBytes = (hex: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(hex.match(/../g) ?? [], part => Number.parseInt(part, 16));

/** Proteção local de interface; um cliente offline não oferece autenticação de servidor. */
export class AdminAccess {
  private unlocked = false;
  private failures = 0;
  private blockedUntil = 0;
  private pending = false;
  private revision = 0;

  constructor(private readonly credential: AdminCredential = LOCAL_CREDENTIAL,
    private readonly now: () => number = () => Date.now()) {}

  get isUnlocked(): boolean { return this.unlocked; }
  get cooldownSeconds(): number { return Math.max(0, Math.ceil((this.blockedUntil - this.now()) / 1000)); }

  async unlock(password: string): Promise<boolean> {
    if (this.pending || this.cooldownSeconds > 0 || typeof password !== 'string' || password.length > 256) return false;
    if (!globalThis.crypto?.subtle) return false;
    this.pending = true;
    const revision = this.revision;
    try {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
      const derived = new Uint8Array(await crypto.subtle.deriveBits({
        name: 'PBKDF2', salt: hexBytes(this.credential.salt), iterations: this.credential.iterations, hash: 'SHA-256',
      }, key, 256));
      if (revision !== this.revision) return false;
      const expected = hexBytes(this.credential.hash);
      let difference = derived.length ^ expected.length;
      for (let index = 0; index < derived.length; index++) difference |= derived[index] ^ (expected[index] ?? 0);
      this.unlocked = difference === 0;
      if (this.unlocked) { this.failures = 0; this.blockedUntil = 0; }
      else if (++this.failures >= 5) { this.blockedUntil = this.now() + 30_000; this.failures = 0; }
      return this.unlocked;
    } catch { return false; }
    finally { this.pending = false; }
  }

  lock(): void { this.unlocked = false; this.revision++; }
}

/** A autorização é conferida no comando, além de esconder os controles na interface. */
export function grantAdminItem(access: AdminAccess, inventory: Inventory, item: unknown, amount: unknown): ActionResult {
  if (!access.isUnlocked) return { ok: false, message: 'Acesso restrito ao administrador.' };
  if (typeof item !== 'string' || !ITEM_IDS.includes(item as ItemId)
    || typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < 1 || amount > MAX_ITEM_COUNT) {
    return { ok: false, message: 'Escolha um item e uma quantidade inteira válida.' };
  }
  return inventory.transact({}, { [item]: amount })
    ? { ok: true, message: `${amount} item(ns) adicionado(s) à mochila.` }
    : { ok: false, message: 'Quantidade excede o limite da mochila. Nenhum item foi adicionado.' };
}
