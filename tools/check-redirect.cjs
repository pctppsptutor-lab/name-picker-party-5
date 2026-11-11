const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const code=/<script>([\s\S]*?)<\/script>/.exec(html)[1];let redirected;
const expectedVol=Number(/Default Vol: (\d)/.exec(html)[1]),first='g'+((expectedVol-1)*6+1);
for(const search of ['', '?game=g30&cls=class%20A', '?game=invalid&cls=a', '?game=https%3A%2F%2Fevil.test']){
 const location={protocol:'https:',origin:'https://example.test',search,hash:'#keep',replace(u){redirected=new URL(u);}};
 vm.runInNewContext(code,{URL,URLSearchParams,location,navigator:{serviceWorker:{register:()=>Promise.resolve()}},document:{getElementById:()=>({href:''})}});
 assert.equal(redirected.origin,location.origin);assert.equal(redirected.pathname,'/goi-ten-vui-nhon/GoiTenVuiNhon/');assert.equal(redirected.hash,'#keep');
 assert.equal(redirected.searchParams.get('game'),search.startsWith('?game=g30')?'g30':first);
 if(search.includes('class%20A'))assert.equal(redirected.searchParams.get('cls'),'class A');
}
const events={},navigations=[];const scope='https://example.test/name-picker-party-'+expectedVol+'/';
const worker={URL,Response,self:{registration:{scope},location:{origin:'https://example.test'},async skipWaiting(){},clients:{async claim(){},async matchAll(){return[{url:scope+'?game=g30&cls=c',async navigate(u){navigations.push(u);}}, {url:'https://example.test/unrelated/',navigate(){throw Error('unrelated client moved');}}];}},addEventListener(n,f){events[n]=f;}}};
vm.createContext(worker);vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),worker);
(async()=>{let done;events.activate({waitUntil(p){done=p;}});await done;assert.equal(navigations.length,0,'an open class editor must not be discarded');let response;events.fetch({request:{mode:'navigate'},respondWith(r){response=r;}});assert.equal(response.status,200);assert.ok((await response.text()).includes('location.replace(target.href)'));console.log('PASS legacy redirect: game/class/hash, safe destination, invalid input fallback, scoped worker and no forced reload');})().catch(e=>{console.error(e);process.exitCode=1;});
