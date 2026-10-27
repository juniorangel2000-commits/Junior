import {describe,it,expect} from 'vitest';
import authored from '../src/data/augusto-layout.json';
import previous from './fixtures/augusto-original-v1.json';
import {createMerchantLayout,resolveMerchantLayout,validMerchantLayout,merchantRoomConnected,merchantRoomFits} from '../src/data/merchant-rooms';
import type {SmithLayout} from '../src/systems/smith-layout';
describe('the latest Augusto editor export',()=>{
 it('uses the 41 authored pieces exactly, keeping shop access and the owner clear',()=>{
  const data=createMerchantLayout('augusto');expect(data).toEqual(authored);expect(data.pieces).toHaveLength(41);expect(validMerchantLayout(data)).toBe(true);expect(merchantRoomConnected('augusto',data)).toBe(true);expect(merchantRoomFits('augusto',288,151,data)).toBe(true);
 });
 it('upgrades only the untouched previous default and keeps later edits',()=>{
  expect(resolveMerchantLayout('augusto',previous as SmithLayout)).toEqual(authored);
  const custom=structuredClone(previous) as SmithLayout;custom.pieces.find(p=>p.id==='barril_canto')!.x+=12;
  expect(resolveMerchantLayout('augusto',custom)).toEqual(custom);expect(resolveMerchantLayout('augusto',authored as SmithLayout)).toEqual(authored);
 });
 it('returns independent layouts without changing the other merchants',()=>{
  const a=createMerchantLayout('augusto');a.pieces[2].visible=false;expect(createMerchantLayout('augusto').pieces[2].visible).toBe(authored.pieces[2].visible);
  const rosa=createMerchantLayout('rosa');expect(resolveMerchantLayout('rosa',rosa)).toEqual(rosa);
 });
});
