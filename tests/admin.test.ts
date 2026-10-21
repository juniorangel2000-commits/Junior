import { describe, expect, it } from 'vitest';
import { pbkdf2Sync } from 'node:crypto';
import { AdminAccess, grantAdminItem } from '../src/systems/admin';
import { Inventory, MAX_ITEM_COUNT } from '../src/systems/inventory';
import { ITEM_IDS } from '../src/data/items';

const testPassword = 'senha-apenas-para-teste';
const salt = '6a04b02e16248f20a1cd3fa6034f1439';
const credential = {
  salt,
  hash: pbkdf2Sync(testPassword, Buffer.from(salt, 'hex'), 1000, 32, 'sha256').toString('hex'),
  iterations: 1000,
};

describe('acesso local de administrador', () => {
  it('começa bloqueado e não oferece itens antes de autenticar', () => {
    const access = new AdminAccess(credential);
    const inventory = new Inventory();
    for (const item of ITEM_IDS) expect(grantAdminItem(access, inventory, item, 50).ok).toBe(false);
    expect(ITEM_IDS.every(item => inventory.data[item] === 0)).toBe(true);
    expect(access.isUnlocked).toBe(false);
  });

  it('autentica a senha correta, rejeita senha incorreta e encerra a sessão', async () => {
    const access = new AdminAccess(credential);
    expect(await access.unlock('incorreta')).toBe(false);
    expect(access.isUnlocked).toBe(false);
    expect(await access.unlock(testPassword)).toBe(true);
    expect(access.isUnlocked).toBe(true);
    access.lock();
    expect(access.isUnlocked).toBe(false);
    expect(grantAdminItem(access, new Inventory(), 'wood', 1).ok).toBe(false);
  });

  it('não compartilha a sessão com outra instância nem com uma nova partida', async () => {
    const access = new AdminAccess(credential);
    await access.unlock(testPassword);
    expect(new AdminAccess(credential).isUnlocked).toBe(false);
  });

  it('bloqueia novas tentativas por 30 segundos após cinco erros', async () => {
    let now = 100_000;
    const access = new AdminAccess(credential, () => now);
    for (let attempt = 0; attempt < 5; attempt++) expect(await access.unlock('erro')).toBe(false);
    expect(access.cooldownSeconds).toBe(30);
    expect(await access.unlock(testPassword)).toBe(false);
    now += 29_001;
    expect(access.cooldownSeconds).toBe(1);
    expect(await access.unlock(testPassword)).toBe(false);
    now += 1000;
    expect(await access.unlock(testPassword)).toBe(true);
    expect(access.cooldownSeconds).toBe(0);
  });

  it('fechar durante a verificação impede uma sessão tardia', async () => {
    const access = new AdminAccess(credential);
    const unlocking = access.unlock(testPassword);
    access.lock();
    expect(await unlocking).toBe(false);
    expect(access.isUnlocked).toBe(false);
  });

  it('não aceita duas autenticações concorrentes', async () => {
    const access = new AdminAccess(credential);
    const first = access.unlock(testPassword);
    expect(await access.unlock(testPassword)).toBe(false);
    expect(await first).toBe(true);
  });

  it('permite todos os itens reais e recusa IDs, quantidades e estouros inválidos', async () => {
    const access = new AdminAccess(credential);
    await access.unlock(testPassword);
    const inventory = new Inventory();
    for (const item of ITEM_IDS) expect(grantAdminItem(access, inventory, item, 10).ok).toBe(true);
    for (const item of ITEM_IDS) expect(inventory.data[item]).toBe(10);
    const snapshot = { ...inventory.data };
    for (const amount of [0, -1, .5, NaN, Infinity, '10', MAX_ITEM_COUNT + 1]) {
      expect(grantAdminItem(access, inventory, 'wood', amount).ok).toBe(false);
    }
    expect(grantAdminItem(access, inventory, '__proto__', 1).ok).toBe(false);
    expect(grantAdminItem(access, inventory, 'wood', MAX_ITEM_COUNT).ok).toBe(false);
    expect(inventory.data).toEqual(snapshot);
  });
});
