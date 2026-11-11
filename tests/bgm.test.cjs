const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const app=path.resolve(__dirname,'..'),index=fs.readFileSync(path.join(app,'index.html'),'utf8');
let plays=0,created=0,sources=0,id,hidden=false,reject=false;
const listeners={};
class AudioStub{
 constructor(){created++;this.paused=true;this.error=null;this._src='';}
 get src(){return this._src;}set src(v){this._src=v;this.error=null;}
 play(){plays++;if(reject){this.paused=true;return Promise.reject(Error('autoplay'));}this.paused=false;return Promise.resolve();}
 pause(){this.paused=true;}
}
const gain={cancelScheduledValues(){},setTargetAtTime(){}};
const audioContext={currentTime:1,createMediaElementSource(){sources++;return{connect(){}};}};
const sandbox={URL,Audio:AudioStub,store:{settings:{music:false,musicVol:70}},document:{baseURI:'https://example.test/GoiTenVuiNhon/',get hidden(){return hidden;},addEventListener(e,fn){listeners[e]=fn;}},curGame:()=>id,AUD:{ctx:audioContext,music:{gain},get:()=>audioContext}};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(app,'games/bgm.js'),'utf8')+'\nglobalThis.tracks=BGM_TRACKS;',sandbox);
const keys=Object.keys(sandbox.tracks);id=keys[0];
assert.equal(keys.length,6);assert.equal(new Set(Object.values(sandbox.tracks).map(t=>t.isrc)).size,6);
for(const t of Object.values(sandbox.tracks)){
 assert.ok(fs.existsSync(path.join(app,t.src)),t.src);
 assert.equal(t.license,'CC BY 4.0');assert.ok(t.source.startsWith('https://incompetech.com/'));
}
const start=index.indexOf('const Music ='),end=index.indexOf('// browsers only allow audio',start);
vm.runInContext(index.slice(start,end)+'\nglobalThis.music=Music;',sandbox);
(async()=>{
 const music=sandbox.music;music.play('idle');assert.equal(created,0,'muted music must not fetch/create a player');
 sandbox.store.settings.music=true;music.play('idle');assert.equal(created,1);assert.equal(sources,1);assert.equal(plays,1);assert.equal(music.audio.loop,true);assert.equal(music.audio.preload,'none');
 const first=music.audio;music.play('tension');assert.equal(plays,1,'phase changes must not restart BGM');
 id=keys[1];music.play('idle');assert.equal(music.audio,first);assert.equal(sources,1);assert.ok(first.src.endsWith(sandbox.tracks[id].src));
 music.stop();assert.equal(first.paused,true);assert.equal(music.mode,null);
 hidden=true;music.play('race');assert.equal(first.paused,true);hidden=false;listeners.visibilitychange();assert.equal(first.paused,false);
 hidden=true;listeners.visibilitychange();assert.equal(first.paused,true);hidden=false;listeners.visibilitychange();assert.equal(first.paused,false);
 music.stop();reject=true;music.play('idle');await Promise.resolve();await Promise.resolve();assert.equal(first.paused,true);
 reject=false;music.play('idle');assert.equal(first.paused,false,'a new gesture can retry autoplay');
 first.error=Error('network');music.play('idle');assert.equal(first.error,null,'retry failed source');
 sandbox.store.settings.music=false;music.play('idle');assert.equal(first.paused,true);
 console.log('PASS BGM: unique tracks, local files, attribution, lazy load, one player, phase continuity, mute, visibility and playback retry');
})().catch(e=>{console.error(e);process.exitCode=1;});
