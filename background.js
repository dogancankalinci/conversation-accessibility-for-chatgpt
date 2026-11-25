'use strict';
importScripts('patch.js');
const states = new Map();
const busy = new Set();
const blocked = new Set();
let auto = true;
const ready = (async () => {
  const settings = await chrome.storage.local.get({ auto: true }); auto = settings.auto;
  const saved = await chrome.storage.session.get({ states: {}, blocked: [] });
  for (const [id, value] of Object.entries(saved.states)) states.set(Number(id), value);
  for (const id of saved.blocked) blocked.add(id);
})();
let saveQueue = Promise.resolve();
function save() {
  saveQueue = saveQueue.catch(()=>{}).then(() => chrome.storage.session.set({ states: Object.fromEntries(states), blocked: [...blocked] }));
  return saveQueue;
}
function isChat(url) { try { return new URL(url).origin === 'https://chatgpt.com'; } catch { return false; } }
function asset(url) { try { const u = new URL(url); return u.origin === 'https://chatgpt.com' && u.pathname.startsWith('/cdn/assets/') && /\.(?:m?js)$/i.test(u.pathname); } catch { return false; } }
function cmd(tabId, method, params = {}) { return chrome.debugger.sendCommand({ tabId }, method, params); }
async function badge(tabId, label, title) {
  try { await chrome.action.setBadgeText({tabId, text:label}); await chrome.action.setTitle({tabId, title}); } catch {}
}
async function setState(tabId, changes) {
  const s = {...states.get(tabId), ...changes}; states.set(tabId,s);
  await save();
  const status = s.phase === 'patched' ? ['ON','Yama uygulandı (NVDA ile doğrulayın)'] : s.phase === 'error' ? ['!','Bağlantı/yama hatası'] : s.phase === 'paused' ? ['OFF','Bu sekmede duraklatıldı'] : s.phase === 'unknown' ? ['?','Uyumlu kod bulunamadı'] : ['…','Uyumlu JavaScript aranıyor'];
  await badge(tabId,...status);
}
async function detach(tabId, pause = false) {
  if (pause) blocked.add(tabId);
  states.delete(tabId); await save();
  try { await cmd(tabId, 'Network.setCacheDisabled', {cacheDisabled:false}); } catch {}
  try { await chrome.debugger.detach({tabId}); } catch {}
  if (pause) await badge(tabId,'OFF','Bu sekmede duraklatıldı'); else await badge(tabId,'','ChatGPT NVDA – Tüm Mesajlar');
}
async function attach(tabId, reload = false, manual = false) {
  await ready;
  if (busy.has(tabId) || (!manual && (!auto || blocked.has(tabId)))) return;
  if (states.get(tabId)?.attached) {
    if (manual && reload) await chrome.tabs.reload(tabId).catch(()=>{});
    return;
  }
  busy.add(tabId);
  let attached = false;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!isChat(tab.pendingUrl || tab.url)) return;
    if (manual) blocked.delete(tabId);
    await chrome.debugger.attach({tabId},'1.3'); attached = true;
    await setState(tabId,{attached:true,phase:'searching',scanned:0,patched:0,unknown:0});
    await cmd(tabId,'Fetch.enable',{patterns:[{urlPattern:'https://chatgpt.com/cdn/assets/*',resourceType:'Script',requestStage:'Response'}]});
    // Force origin responses, including already-cached chunks. While attached,
    // caching is disabled on this tab only; detach restores ordinary behavior.
    await cmd(tabId,'Network.setCacheDisabled',{cacheDisabled:true});
    if (reload) {
      const current = await chrome.tabs.get(tabId);
      if (!isChat(current.pendingUrl || current.url) || blocked.has(tabId)) await detach(tabId);
      else if (manual || current.status === 'complete') await chrome.tabs.reload(tabId);
      else { const state=states.get(tabId); if(state){state.reloadPending=true; await save();} }
    }
  } catch {
    if (attached) {try {await chrome.debugger.detach({tabId});}catch{}}
    blocked.add(tabId);
    await setState(tabId,{attached:false,phase:'error'});
  } finally { busy.delete(tabId); }
}
function decodeBody(body, base64Encoded) {
  if (!base64Encoded) return body;
  return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(body), c=>c.charCodeAt(0)));
}
function encodeBody(source) {
  const bytes = new TextEncoder().encode(source);
  let binary = '';
  for (let i=0;i<bytes.length;i+=16384) binary += String.fromCharCode(...bytes.subarray(i,i+16384));
  return btoa(binary);
}
const staleHeaders = new Set(['content-encoding','content-length','transfer-encoding','etag','last-modified','content-md5','digest','content-digest','repr-digest','cache-control','expires','age']);
async function handlePaused(tabId,p) {
  const requestId = p.requestId;
  let fulfilled = false;
  try {
    if (p.responseStatusCode !== 200 || p.resourceType !== 'Script' || !asset(p.request?.url)) return;
    const headers = p.responseHeaders || [];
    const type = headers.find(h=>h.name.toLowerCase()==='content-type')?.value || '';
    if (!/javascript|ecmascript/i.test(type)) return;
    const data = await cmd(tabId,'Fetch.getResponseBody',{requestId});
    const result = NvdaPatch.patchSource(decodeBody(data.body,data.base64Encoded));
    const s = states.get(tabId);
    if (s) { s.scanned++; if (result.reason==='unknown-shape') s.unknown++; }
    if (!result.changed || !s || blocked.has(tabId) || !auto) return;
    const responseHeaders = headers.filter(h=>!staleHeaders.has(h.name.toLowerCase()));
    responseHeaders.push({name:'Cache-Control',value:'no-store'});
    await cmd(tabId,'Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders,body:encodeBody(result.source)});
    fulfilled = true;
    if (states.has(tabId)) { const current=states.get(tabId); await setState(tabId,{patched:current.patched+1,phase:'patched'}); }
  } catch {
    // Unknown/failed response: pass original through, do not break the page.
  } finally {
    if (!fulfilled) {
      try { await cmd(tabId,'Fetch.continueRequest',{requestId}); }
      catch { try { await cmd(tabId,'Fetch.continueResponse',{requestId}); } catch {} }
    }
  }
}
chrome.debugger.onEvent.addListener((source,method,p) => {
  if (method==='Fetch.requestPaused' && source.tabId != null) void ready.then(()=>handlePaused(source.tabId,p));
});
chrome.debugger.onDetach.addListener((source,reason) => {
  if (source.tabId==null) return;
  void ready.then(async()=>{
    const id=source.tabId;
    if (states.has(id)) { states.delete(id); blocked.add(id); await save(); await badge(id,'OFF','Hata ayıklama bağlantısı kapatıldı'); }
  });
});
chrome.tabs.onUpdated.addListener((id,change,tab)=>{
  if (!change.url && change.status!=='loading' && change.status!=='complete') return;
  void ready.then(async()=>{
    if (!isChat(tab.pendingUrl || tab.url)) { if(states.get(id)?.attached) await detach(id); return; }
    if (change.status==='complete' && states.get(id)?.attached) {
      const s=states.get(id); if(s.reloadPending){s.reloadPending=false; await save(); if(!s.patched){await chrome.tabs.reload(id).catch(()=>{});return;}} if (s.unknown && !s.patched) await setState(id,{phase:'unknown'}); else await save();
    }
    if (change.url || change.status==='loading' || change.status==='complete') await attach(id,true);
  });
});
chrome.tabs.onRemoved.addListener(id=>{void ready.then(()=>{states.delete(id);blocked.delete(id);return save();});});
async function scan(reload) {
  await ready;
  if (!auto) return;
  const tabs = await chrome.tabs.query({url:'https://chatgpt.com/*'});
  for (const tab of tabs) if (tab.id!=null) await attach(tab.id,reload);
}
chrome.runtime.onInstalled.addListener(()=>{void scan(false);});
chrome.runtime.onStartup.addListener(()=>{void scan(true);});
chrome.runtime.onMessage.addListener((m,sender,respond)=>{
  if (sender.id!==chrome.runtime.id || sender.tab) return;
  (async()=>{
    await ready;
    const id=m.tabId;
    if(m.type==='auto') {
      auto=Boolean(m.value); await chrome.storage.local.set({auto});
      if (!auto) { for (const id of [...states.keys()]) await detach(id); }
      else await scan(false);
    } else if (m.type==='apply') {
      if (!auto) { auto=true; await chrome.storage.local.set({auto}); }
      blocked.delete(id); await save(); await attach(id,true,true);
    } else if (m.type==='pause') {
      await detach(id,true); if(isChat((await chrome.tabs.get(id)).url)) await chrome.tabs.reload(id);
    } else if (m.type!=='status') return {error:true};
    return { auto, state:states.get(id)||null, blocked:blocked.has(id) };
  })().then(respond,()=>respond({error:true}));
  return true;
});
