const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const cut=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
const context=o=>{vm.createContext(o);return o;};
const run=(o,code)=>vm.runInContext(code,o);
const clone=o=>JSON.parse(JSON.stringify(o));
(async()=>{
 const c=context({guessGender:()=> 'm',store:{settings:{rest:true},called:{}}});
 run(c,cut('function parseLine(','function randInt('));
 const cls={id:'a',mode:'names',text:'Emma\nEmma\nEmma (2)\nEmma\nconstructor\n__proto__',gender:{}};
 const roster=clone(c.roster(cls));assert.equal(new Set(roster.map(s=>s.name)).size,6);assert.equal(roster[2].name,'Emma (2)');
 c.store.called.a=[roster[1].name];assert.equal(c.eligible(cls).length,5);assert.equal(c.roster({...cls,mode:'numbers',count:50}).length,50);
 let time=1000;
 const clock=context({performance:{now:()=>time},clamp:(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),TWIST_END:1.35,GameSound:{tick(){}},countdown(r){if(r.now>=r.T)r.phase='done';}});
 run(clock,cut('function roundRemaining(','function countdown('));
 for(const T of [7,10])for(const plain of [true,false]){
  const r=clock.race={T,TW:T-3.2,t0:1000,now:0,plain,phase:'run',game:{tick(){}},slowUntil:Infinity,slowF:.2};
  for(let frame=0;frame<=T*10;frame++){time=1000+frame*100;clock.tickRace(.05);}
  assert.equal(r.phase,'done');assert.equal(r.now,T);assert.equal(clock.roundRemaining(r),0);
 }
 const handlers={};let editor=true,drawer=false,closedEditor=0,closedDrawer=0;
 const keyboard=context({document:{addEventListener:(e,fn)=>handlers[e]=fn},stageView:{classList:{contains:()=>false}},importDialog:{open:false},drawerModal:{classList:{contains:()=>!drawer}},page:{classList:{contains:()=>!editor}},closeClasses:()=>closedEditor++,closeDrawer:()=>closedDrawer++});
 run(keyboard,cut("document.addEventListener('keydown', e => {",'/* ================= Boot'));
 const key=(code,keyName,tag='TEXTAREA',extra={})=>{let prevented=false;handlers.keydown({code,key:keyName,target:{tagName:tag},preventDefault(){prevented=true;},...extra});return prevented;};
 assert.equal(key('KeyB','b'),false);assert.equal(key('Period','.'),false);assert.equal(closedEditor,0);
 editor=false;drawer=true;assert.equal(key('KeyG','g','INPUT'),false);assert.equal(key('KeyB','b','INPUT'),false);assert.equal(closedDrawer,0);
 key('Escape','Escape','INPUT');assert.equal(closedDrawer,1);drawer=false;editor=true;key('Escape','Escape');assert.equal(closedEditor,1);
 assert.equal(key('KeyB','b','BODY',{isComposing:true}),false);assert.equal(closedEditor,1);
 let fail=false,attempts=0;
 class ImageStub{set src(s){this._src=s;attempts++;queueMicrotask(()=>fail?this.onerror():this.onload());}get src(){return this._src;}}
 const images=context({IMGSETS:{},Image:ImageStub,queueMicrotask,setTimeout:(fn,ms)=>{if(ms<900)queueMicrotask(fn);},updateUI(){},buildBackground(){},duckAssets:{},curGame:()=> 'test',race:null});
 run(images,'const imageLoads=new Map();\n'+cut('function loadImages(','function winnerAsset'));
 run(images,cut('function prepareGame(','function activateGame('));
 fail=true;assert.deepEqual(clone(await images.loadImages('test','/',['c0_idle'])),['c0_idle']);assert.equal(attempts,2);
 const g={id:'test',base:'/',assets:['c0_idle','c0_walk']};images.prepareGame(g);await g.loading;assert.equal(g.ready,false);assert.equal(g.loading,null);
 fail=false;images.prepareGame(g);await g.loading;assert.equal(g.ready,true);
 fail=true;await images.loadGameDetails(g);assert.equal(g.detailsLoading,null);
 fail=false;await images.loadGameDetails(g);assert.ok(images.IMGSETS.test.c0_walk);
 const original=[{id:'a',name:'A'}],newer={classes:[...clone(original),{id:'b',name:'B'}],activeId:'b',called:{b:['Bob']},settings:{}};
 let saves=0;const error={textContent:'',children:[],appendChild(x){this.children.push(x);}};
 const edit=context({draft:[{id:'a',name:'edited A'}],draftBase:JSON.stringify(original),store:{classes:clone(original),called:{},settings:{}},loadStore:()=>clone(newer),importedCalled:{},editId:'a',AUD:{applyVol(){}},updateUI(){},curLang:()=> 'en',document:{getElementById:()=>error,createElement:()=>({})},openClasses(){},SFX:{pop(){}},save(){saves++;return true;},page:{classList:{add(){}}},race:null});
 run(edit,cut('function closeClasses()',"document.getElementById('classBtn').onclick"));edit.closeClasses();assert.equal(saves,0);assert.equal(edit.draft[0].name,'edited A');assert.equal(edit.store.called.b[0],'Bob');assert.equal(error.children.length,1);
 newer.classes=clone(original);newer.called={a:['Alice']};error.focus=()=>{};edit.closeClasses();assert.equal(saves,1);assert.equal(edit.store.classes[0].name,'edited A');assert.deepEqual(clone(edit.store.called.a),['Alice']);assert.equal(edit.draft,null);
 console.log('PASS core: unique roster IDs, wall-clock 7/10s at 10 FPS, editable shortcuts/IME, image failure recovery, stale draft preservation and fresh history');
})().catch(e=>{console.error(e);process.exitCode=1;});
