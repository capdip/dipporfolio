import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://localhost:5173/';
const width = parseInt(process.argv[3] || '390', 10);
const height = parseInt(process.argv[4] || '780', 10);
const chrome = spawn(CHROME, ['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9342','about:blank'], { stdio:'ignore' });
await sleep(2500);
const targets = await (await fetch('http://localhost:9342/json')).json();
const page = targets.find(t=>t.type==='page')||targets[0];
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id=0; const pending=new Map();
const send=(m,p={})=>new Promise((res,rej)=>{const i=++id;pending.set(i,{res,rej});ws.send(JSON.stringify({id:i,method:m,params:p}));});
ws.onmessage=(e)=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id).res(m.result);pending.delete(m.id);}};
await new Promise(r=>ws.onopen=r);
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});
await send('Page.navigate',{url}); await sleep(6000);
// capture screenshot
const shot = (await send('Page.captureScreenshot',{format:'png'}))?.data;
ws.close(); chrome.kill();
// analyze pixels
import { writeFileSync } from 'node:fs';
if(shot){
  writeFileSync('analyze.png', Buffer.from(shot,'base64'));
  const buf = Buffer.from(shot,'base64');
  console.log('PNG bytes:', buf.length);
  // crude: just report count of distinct via sample of a decoded approach using zlib inflate is complex.
}
process.exit(0);