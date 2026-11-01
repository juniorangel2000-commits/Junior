import {it,expect,vi} from 'vitest';
import {EventEmitter} from 'node:events';
import type Phaser from 'phaser';
import {prepareSceneAssets} from '../src/scene-asset-preparation';
function fixture(){const load=Object.assign(new EventEmitter(),{start:vi.fn()});return {load,scene:{load} as unknown as Phaser.Scene};}
it('loads once for concurrent requests and prepares art only after successful completion',async()=>{
 const {load,scene}=fixture(),queue=vi.fn(),finish=vi.fn();
 const a=prepareSceneAssets(scene,queue,finish),b=prepareSceneAssets(scene,queue,finish);expect(a).toBe(b);expect(queue).toHaveBeenCalledOnce();expect(finish).not.toHaveBeenCalled();
 load.emit('complete');await a;expect(finish).toHaveBeenCalledOnce();expect(load.listenerCount('loaderror')).toBe(0);await prepareSceneAssets(scene,queue,finish);expect(queue).toHaveBeenCalledOnce();
});
it('never prepares partial art after a failed file and permits a clean retry',async()=>{
 const {load,scene}=fixture(),finish=vi.fn();const attempt=prepareSceneAssets(scene,()=>{},finish);const rejection=expect(attempt).rejects.toThrow('missing');
 load.emit('loaderror',{key:'missing'});load.emit('complete');await rejection;expect(finish).not.toHaveBeenCalled();expect(load.listenerCount('complete')).toBe(0);
 const retry=prepareSceneAssets(scene,()=>{},finish);load.emit('complete');await retry;expect(finish).toHaveBeenCalledOnce();
});
it('cleans up and retries if texture preparation fails',async()=>{
 const {load,scene}=fixture(),finish=vi.fn().mockImplementationOnce(()=>{throw Error('texture');});const attempt=prepareSceneAssets(scene,()=>{},finish),rejection=expect(attempt).rejects.toThrow('texture');load.emit('complete');await rejection;
 const retry=prepareSceneAssets(scene,()=>{},finish);load.emit('complete');await retry;expect(finish).toHaveBeenCalledTimes(2);
});
