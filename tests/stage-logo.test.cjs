const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf("const stageLogo = document.getElementById('stageLogo');"),html.indexOf('function frame(now) {'));
const calls=[],logo={complete:false,naturalWidth:1054,naturalHeight:1379};
let expanded=false;
const stageView={classList:{contains:()=>expanded}};
const ctx={save(){},restore(){},setTransform(){},beginPath(){},roundRect(...a){calls.push(['card',...a]);},fill(){},drawImage(...a){calls.push(['image',...a]);}};
const c={document:{getElementById:()=>logo,fullscreenElement:null},stageView,ctx,SCALE:1.2};
vm.createContext(c);vm.runInContext(source,c);
c.drawStageLogo();assert.equal(calls.length,0);
logo.complete=true;c.drawStageLogo();assert.equal(calls[0][2],16);
const image=calls[1];assert.equal(image[5],100);assert.ok(Math.abs(image[4]/image[5]-1054/1379)<1e-12);
for(const native of [false,true]){calls.length=0;expanded=!native;c.document.fullscreenElement=native?stageView:null;c.drawStageLogo();assert.equal(calls[0][2],76);}
assert.ok(!html.includes('<img class="logo"'));
console.log('PASS stage logo: waits for image, preserves aspect ratio, clears full-screen exit, header unchanged');
