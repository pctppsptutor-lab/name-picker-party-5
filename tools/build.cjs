const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),app=fs.existsSync(path.join(root,'GoiTenVuiNhon'))?path.join(root,'GoiTenVuiNhon'):root;
const read=p=>fs.readFileSync(path.join(app,p));
const outputs=new Map(),check=process.argv.includes('--check');
const shared=['bgm','sfx','i18n','fx','decor','bases','scenes'];
const minify=source=>esbuild.transformSync(source,{minifySyntax:true,minifyWhitespace:true,minifyIdentifiers:false,target:'es2020',charset:'utf8',legalComments:'inline'}).code;
outputs.set('games/dist/runtime.js',minify(shared.map(n=>read('games/'+n+'.js').toString()).join('\n;\n')));
for(const name of fs.readdirSync(path.join(app,'games'))){const id=/^(g\d+)-.*\.js$/.exec(name)?.[1];if(id)outputs.set('games/dist/'+id+'.js',minify(read('games/'+name).toString()));}
const text=data=>data.toString().replace(/\r\n/g,'\n');
const digest=entries=>{const h=crypto.createHash('sha256');for(const [name,data] of entries){h.update(name);h.update('\0');h.update(/\.(html|js|css|json|txt|svg)$/.test(name)?text(data):data);h.update('\0');}return h.digest('hex').slice(0,20);};
require('node:assert/strict').equal(digest([['sample.js','a\r\nb']]),digest([['sample.js','a\nb']]));
const assets=fs.readdirSync(path.join(app,'assets'),{recursive:true}).filter(n=>fs.statSync(path.join(app,'assets',n)).isFile()).sort().map(n=>['assets/'+n.replaceAll('\\','/'),read('assets/'+n)]);
let sw=read('sw.js').toString();
const vol=/name-picker-vol(\d+)-/.exec(sw)[1];
const media='name-picker-vol'+vol+'-assets-'+digest(assets);
const normalized=sw.replace(/const (CACHE_NAME|ASSET_CACHE_NAME) = '[^']+';/g,"const $1 = '';" );
const shell='name-picker-vol'+vol+'-shell-'+digest([['index.html',read('index.html')],...outputs,['sw.js',normalized]]);
sw=sw.replace(/const CACHE_NAME = '[^']+';/,"const CACHE_NAME = '"+shell+"';").replace(/const ASSET_CACHE_NAME = '[^']+';/,"const ASSET_CACHE_NAME = '"+media+"';");
outputs.set('sw.js',sw);
for(const [file,data] of outputs){const dest=path.join(app,file);if(check){if(!fs.existsSync(dest)||text(fs.readFileSync(dest))!==text(data))throw Error('Run npm run build: '+file);}else{fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data);}}
console.log((check?'Verified':'Built')+' '+outputs.size+' files; media cache '+media);
