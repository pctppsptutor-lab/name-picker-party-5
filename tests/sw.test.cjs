const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
let online=true,requests=0,cacheAvailable=true,quota=false;const entries=new Map(),data=Uint8Array.from({length:10},(_,i)=>i);
const cache={async match(key){return entries.get(key)?.clone();},async put(key,value){if(quota)throw Error('quota');entries.set(key,value.clone());}};
const sandbox={Headers,Request,Response,URL,caches:{async open(){if(!cacheAvailable)throw Error('private');return cache;}},self:{location:{origin:'https://example.test'},addEventListener(){}},async fetch(request){requests++;assert.equal(request.headers.get('range'),null,'upstream request must fetch a complete file');if(!online)throw Error('offline');return new Response(data,{headers:{'Content-Type':'audio/mpeg'}});}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8')+'\nglobalThis.respond=bgmResponse;',sandbox);
const req=range=>new Request('https://example.test/assets/bgm/g1.mp3',{headers:range?{Range:range}:{}});
(async()=>{
 let r=await sandbox.respond(req('bytes=0-3'));assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),'bytes 0-3/10');assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[0,1,2,3]);assert.equal(requests,1);
 online=false;r=await sandbox.respond(req('bytes=5-'));assert.equal(r.status,206);assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[5,6,7,8,9]);assert.equal(requests,1,'offline range uses the cached whole file');
 r=await sandbox.respond(req('bytes=-3'));assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[7,8,9]);
 for(const range of ['bytes=99-','bytes=3-1','bytes=-0','bytes=0-1,3-4','bytes=-']){r=await sandbox.respond(req(range));assert.equal(r.status,416);assert.equal(r.headers.get('content-range'),'bytes */10');}
 r=await sandbox.respond(req());assert.equal(r.status,200);assert.equal((await r.arrayBuffer()).byteLength,10);
 online=true;entries.clear();quota=true;r=await sandbox.respond(req('bytes=0-3'));assert.equal(r.status,206,'cache quota must not break online audio');
 cacheAvailable=false;r=await sandbox.respond(req('bytes=0-3'));assert.equal(r.status,206,'unavailable Cache API must not break online audio');
 console.log('PASS SW: whole-track cache, offline ranges, suffix/open ranges, invalid ranges, quota and unavailable-cache fallback');
})().catch(e=>{console.error(e);process.exitCode=1;});
