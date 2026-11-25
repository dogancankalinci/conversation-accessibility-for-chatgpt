'use strict';
const byId = id => document.getElementById(id);
const t = (key, count) => count === undefined ? chrome.i18n.getMessage(key) : chrome.i18n.getMessage(key, String(count));
document.documentElement.lang = chrome.i18n.getUILanguage();
document.title = t('extensionName');
for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
let tabId;
async function update(type='status',value) {
  try {
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true}); tabId=tab?.id;
    const valid=tab?.url?.startsWith('https://chatgpt.com/');
    byId('apply').disabled=!valid; byId('pause').disabled=!valid;
    if (!valid && (type==='apply'||type==='pause')) return;
    const result=await chrome.runtime.sendMessage({type,tabId,value});
    if (!result || result.error) throw Error();
    byId('auto').checked=result.auto;
    const s=result.state;
    byId('status').textContent=!valid?t('notChat'):!result.auto?t('autoOff'):s?.phase==='patched'?t('patched',s.patched):s?.phase==='error'?t('error'):result.blocked?t('paused'):s?.phase==='unknown'?t('unknown'):s?.attached?t('searching',s.scanned||0):t('notConnected');
  } catch {byId('status').textContent=t('failed');}
}
byId('auto').addEventListener('change',()=>update('auto',byId('auto').checked));
byId('apply').addEventListener('click',()=>update('apply'));
byId('pause').addEventListener('click',()=>update('pause'));
byId('refresh').addEventListener('click',()=>update());
void update();
