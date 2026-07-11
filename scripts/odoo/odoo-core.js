/*
 * odoo-core.js — shared Odoo XML-RPC engine (no dependencies, Node 18+ fetch).
 * Used by both odoo.js (CLI) and mcp-server.js (MCP stdio server).
 */
const fs = require("fs");

// ---------- credential loading ----------
function parseDotenv(txt){
  const o={};
  for(const line of txt.split(/\r?\n/)){
    const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if(!m) continue;
    let v=m[2];
    if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1);
    o[m[1]]=v;
  }
  return o;
}
function loadCreds(){
  const c={
    url:process.env.ODOO_URL||"", db:process.env.ODOO_DB||"",
    username:process.env.ODOO_USERNAME||"", api_key:process.env.ODOO_API_KEY||""
  };
  let source="env";
  for(const f of [process.env.ODOO_ENV_FILE, "/root/openclaw/.env"].filter(Boolean)){
    if(c.url&&c.db&&c.username&&c.api_key) break;
    try{
      if(!fs.existsSync(f)) continue;
      const e=parseDotenv(fs.readFileSync(f,"utf8"));
      c.url=c.url||e.ODOO_URL||""; c.db=c.db||e.ODOO_DB||"";
      c.username=c.username||e.ODOO_USERNAME||""; c.api_key=c.api_key||e.ODOO_API_KEY||"";
      if(c.url&&c.db&&c.username&&c.api_key) source=f;
    }catch(e){}
  }
  for(const f of ["/root/.openclaw/workspace/odoo_env.json","/home/node/.openclaw/workspace/odoo_env.json"]){
    if(c.url&&c.db&&c.username&&c.api_key) break;
    try{
      if(!fs.existsSync(f)) continue;
      const j=JSON.parse(fs.readFileSync(f,"utf8"));
      c.url=c.url||j.url||""; c.db=c.db||j.db||"";
      c.username=c.username||j.username||j.login||""; c.api_key=c.api_key||j.api_key||j.apiKey||"";
      if(c.url&&c.db&&c.username&&c.api_key) source=f;
    }catch(e){}
  }
  c._source=source;
  return c;
}

// ---------- XML-RPC encode/decode ----------
function xe(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function toXml(v){
  if(v===null||v===undefined||v===false)return"<value><boolean>0</boolean></value>";
  if(v===true)return"<value><boolean>1</boolean></value>";
  if(typeof v==="number")return Number.isInteger(v)?`<value><int>${v}</int></value>`:`<value><double>${v}</double></value>`;
  if(typeof v==="string")return`<value><string>${xe(v)}</string></value>`;
  if(Array.isArray(v))return`<value><array><data>${v.map(toXml).join("")}</data></array></value>`;
  if(typeof v==="object")return`<value><struct>${Object.entries(v).map(([k,x])=>`<member><name>${xe(k)}</name>${toXml(x)}</member>`).join("")}</struct></value>`;
  return`<value><string>${xe(String(v))}</string></value>`;
}
function bReq(m,p){return`<?xml version="1.0"?><methodCall><methodName>${m}</methodName><params>${p.map(x=>`<param>${toXml(x)}</param>`).join("")}</params></methodCall>`;}
function pXml(xml){
  if(xml.includes("<fault>")){const m=(xml.match(/<name>faultString<\/name>\s*<value>([\s\S]*?)<\/value>/)||[])[1]||"fault";throw new Error("Odoo: "+m.replace(/<[^>]+>/g,"").trim());}
  const pos=xml.indexOf("<methodResponse>");if(pos<0)throw new Error("Bad XML-RPC");
  function ws(s,i){while(" \n\r\t".includes(s[i]))i++;return i;}
  function fin(s,i){i=ws(s,i);if(s.startsWith("</value>",i))i+=8;return i;}
  function rv(s,i){
    i=ws(s,i);if(s.startsWith("<value>",i))i+=7;i=ws(s,i);
    if(s.startsWith("<string>",i)){const e=s.indexOf("</string>",i+8);return[s.slice(i+8,e).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&"),fin(s,e+9)];}
    if(s.startsWith("<int>",i)||s.startsWith("<i4>",i)){const t=s.startsWith("<int>",i)?"int":"i4";const e=s.indexOf(`</${t}>`,i);return[parseInt(s.slice(i+t.length+2,e),10),fin(s,e+t.length+3)];}
    if(s.startsWith("<double>",i)){const e=s.indexOf("</double>",i+8);return[parseFloat(s.slice(i+8,e)),fin(s,e+9)];}
    if(s.startsWith("<boolean>",i)){const e=s.indexOf("</boolean>",i+9);return[s.slice(i+9,e).trim()==="1",fin(s,e+10)];}
    if(s.startsWith("<nil/>",i)||s.startsWith("<nil />",i)){return[null,fin(s,s.indexOf(">",i)+1)];}
    if(s.startsWith("<array>",i)){i=s.indexOf("<data>",i)+6;const a=[];while(true){i=ws(s,i);if(s.startsWith("</data>",i)){i+=7;break;}const[v,ni]=rv(s,i);a.push(v);i=ni;}return[a,fin(s,s.indexOf("</array>",i)+8)];}
    if(s.startsWith("<struct>",i)){i+=8;const o={};while(true){i=ws(s,i);if(s.startsWith("</struct>",i)){i+=9;break;}i=s.indexOf("<name>",i)+6;const ne=s.indexOf("</name>",i);const k=s.slice(i,ne);i=ne+7;const[v,ni]=rv(s,i);o[k]=v;i=ni;i=s.indexOf("</member>",i)+9;}return[o,fin(s,i)];}
    const e=s.indexOf("</value>",i);return[s.slice(i,e),e+8];
  }
  const ps=xml.indexOf("<param>",pos);if(ps<0)return null;
  return rv(xml,ps+7)[0];
}

// ---------- client ----------
function createClient(){
  const C=loadCreds();
  let uid=null;
  async function xrpc(ep,m,p){
    if(!C.url) throw new Error("No ODOO_URL — creds not found (src="+C._source+")");
    const r=await fetch(`${C.url}/xmlrpc/2/${ep}`,{method:"POST",headers:{"Content-Type":"text/xml"},body:bReq(m,p)});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    return pXml(await r.text());
  }
  async function auth(){
    if(uid)return uid;
    if(!C.db||!C.username||!C.api_key) throw new Error("Missing creds (db/username/api_key). src="+C._source);
    const u=await xrpc("common","authenticate",[C.db,C.username,C.api_key,{}]);
    if(!u) throw new Error(`Login rejected by Odoo (db=${C.db}, user=${C.username}). Key invalid/revoked — regenerate it.`);
    uid=u;return uid;
  }
  async function ex(model,method,args=[],kwargs={}){
    return xrpc("object","execute_kw",[C.db,await auth(),C.api_key,model,method,args,kwargs]);
  }
  return {C,xrpc,auth,ex};
}

module.exports={loadCreds,createClient};
