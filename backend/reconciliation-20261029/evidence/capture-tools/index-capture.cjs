'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=__dirname,hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function parse(text){return text.replace(/\r\n/g,'\n').split('\n---\n').filter(x=>x.trim()).map(x=>{const source=x.trim(),m=source.match(/^(\w+)\s+(?:"([^"]+)"|([^\s{]+))([^\n]*)/m);assert.ok(m);const type=m[1],name=m[2]||m[3],verb=m[4].match(/verb=(\w+)/)?.[1],group=source.match(/^\s*api_group\s*=\s*"([^"]+)"/m)?.[1];return {key:[type,name,...(verb?[verb,group]:[])].join(':'),type,name,verb,group,guid:source.match(/^\s*guid\s*=\s*"([^"]+)"/m)?.[1],sha256:hash(source),source};}).sort((a,b)=>a.key.localeCompare(b.key));}
const sets={};
for(const mode of ['published','draft']){
 const docs=parse(fs.readFileSync(path.join(root,mode+'-export.xs'),'utf8')),counts={};
 for(const d of docs){counts[d.type]=(counts[d.type]||0)+1;const rel=mode+'/'+d.type+'/'+(d.group?d.group+'/':'')+d.name.replace(/[^a-zA-Z0-9/_-]/g,'_')+(d.verb?'_'+d.verb:'')+'.xs';assert.ok(!rel.includes('..'));d.file=rel;fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true});fs.writeFileSync(path.join(root,rel),d.source+'\n',{flag:'wx'});}
 const inventory={count:docs.length,counts,inventory_sha256:hash(docs.map(d=>d.key+'\t'+d.sha256).join('\n')),documents:docs.map(({source,...d})=>d)};
 fs.writeFileSync(path.join(root,mode+'-inventory.json'),JSON.stringify(inventory,null,2)+'\n',{flag:'wx'});sets[mode]=docs;
 console.log(JSON.stringify({mode,...inventory,documents:inventory.documents.filter(d=>d.type!=='table')},null,2));
}
const a=new Map(sets.published.map(d=>[d.key,d]));const changes=sets.draft.filter(d=>!a.has(d.key)||a.get(d.key).sha256!==d.sha256).map(d=>({key:d.key,published_sha256:a.get(d.key)?.sha256||null,draft_sha256:d.sha256}));
fs.writeFileSync(path.join(root,'published-draft-diff.json'),JSON.stringify({changed:changes,missing_in_draft:sets.published.filter(d=>!sets.draft.some(x=>x.key===d.key)).map(d=>d.key)},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({changed:changes.map(d=>d.key)},null,2));
