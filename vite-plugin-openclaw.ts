// EstateFlow Control - OpenClaw Chrome CDP Automation Vite Plugin
import type { Plugin, ViteDevServer } from 'vite';
import { exec, spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

function readJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: any, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(data));
}

// Evaluate JavaScript via Chrome DevTools Protocol WebSocket
async function evaluateViaCdp(wsUrl: string, expression: string, timeoutMs = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(wsUrl);
      const timer = setTimeout(() => {
        try { ws.close(); } catch (_) {}
        reject(new Error('CDP evaluation timed out after ' + timeoutMs + 'ms'));
      }, timeoutMs);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          id: Date.now(),
          method: 'Runtime.evaluate',
          params: {
            expression,
            returnByValue: true,
            awaitPromise: true
          }
        }));
      };

      ws.onmessage = (event: any) => {
        clearTimeout(timer);
        try {
          const resp = JSON.parse(event.data);
          ws.close();
          if (resp.error) {
            reject(new Error(resp.error.message || 'CDP Error'));
          } else {
            resolve(resp.result?.result?.value);
          }
        } catch (e) {
          reject(e);
        }
      };

      ws.onerror = (err) => {
        clearTimeout(timer);
        reject(err);
      };
    } catch (e) {
      reject(e);
    }
  });
}

export function openclawAutomationPlugin(): Plugin {
  return {
    name: 'vite-plugin-openclaw-automation',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // 1. GET /api/openclaw/tabs
        if (url.startsWith('/api/openclaw/tabs') && req.method === 'GET') {
          const urlObj = new URL(url, 'http://localhost:1420');
          const targetPort = parseInt(urlObj.searchParams.get('port') || '9222', 10);
          const portsToScan = [targetPort, 9222, 9223, 9224, 9225].filter((v, i, a) => a.indexOf(v) === i);

          const allTabs: any[] = [];
          for (const p of portsToScan) {
            try {
              const resp = await fetch(`http://127.0.0.1:${p}/json/list`, { signal: AbortSignal.timeout(1000) });
              if (resp.ok) {
                const tabs = await resp.json();
                for (const t of tabs) {
                  if (t.type === 'page') {
                    allTabs.push({
                      id: t.id,
                      title: t.title || 'Untitled Tab',
                      url: t.url,
                      port: p,
                      webSocketDebuggerUrl: t.webSocketDebuggerUrl,
                      faviconUrl: t.faviconUrl
                    });
                  }
                }
              }
            } catch (_) {
              // Port not running or unreachable
            }
          }

          return sendJson(res, 200, { success: true, tabs: allTabs });
        }

        // 2. POST /api/openclaw/activate
        if (url === '/api/openclaw/activate' && req.method === 'POST') {
          const body = await readJsonBody(req);
          const targetId = body.targetId || body.tabId;
          const port = body.port || 9222;
          if (!targetId) {
            return sendJson(res, 400, { success: false, error: 'targetId is required' });
          }

          try {
            const resp = await fetch(`http://127.0.0.1:${port}/json/activate/${targetId}`);
            // Also bring Chrome app to front on macOS
            if (process.platform === 'darwin') {
              exec("osascript -e 'tell application \"Google Chrome\" to activate'");
            }
            return sendJson(res, 200, { success: resp.ok, message: 'Tab activated' });
          } catch (e: any) {
            return sendJson(res, 500, { success: false, error: e?.message });
          }
        }

        // 3. POST /api/openclaw/launch
        if (url === '/api/openclaw/launch' && req.method === 'POST') {
          const { profileDir, port = 9222, targetUrl = 'https://chatgpt.com' } = await readJsonBody(req);
          const home = os.homedir();
          const dataDir = path.join(home, 'Library', 'Application Support', 'EstateFlow', 'Browsers', profileDir || 'Default');
          fs.mkdirSync(dataDir, { recursive: true });

          if (process.platform === 'darwin') {
            const args = [
              '-na',
              'Google Chrome',
              '--args',
              `--user-data-dir=${dataDir}`,
              `--remote-debugging-port=${port}`,
              targetUrl
            ];
            spawn('/usr/bin/open', args);
            return sendJson(res, 200, { success: true, message: `Launched Chrome with profile at ${dataDir} (port ${port})` });
          } else {
            return sendJson(res, 200, { success: false, message: 'Native Chrome launch only supported on macOS' });
          }
        }

        // 4. POST /api/openclaw/eval
        if (url === '/api/openclaw/eval' && req.method === 'POST') {
          const { targetId, port = 9222, expression } = await readJsonBody(req);
          try {
            // Find tab wsUrl
            const listResp = await fetch(`http://127.0.0.1:${port}/json/list`);
            const tabs = await listResp.json();
            const tab = tabs.find((t: any) => t.id === targetId);
            if (!tab || !tab.webSocketDebuggerUrl) {
              return sendJson(res, 404, { success: false, error: `Tab with targetId ${targetId} not found` });
            }

            const val = await evaluateViaCdp(tab.webSocketDebuggerUrl, expression);
            return sendJson(res, 200, { success: true, value: val });
          } catch (e: any) {
            return sendJson(res, 500, { success: false, error: e?.message });
          }
        }

        // 5. POST /api/openclaw/chatgpt/prompt
        if (url === '/api/openclaw/chatgpt/prompt' && req.method === 'POST') {
          const { targetId, port = 9222, promptText } = await readJsonBody(req);
          try {
            const listResp = await fetch(`http://127.0.0.1:${port}/json/list`);
            const tabs = await listResp.json();
            const tab = tabs.find((t: any) => t.id === targetId);
            if (!tab || !tab.webSocketDebuggerUrl) {
              return sendJson(res, 404, { success: false, error: `Tab with targetId ${targetId} not found` });
            }

            // Bring to front
            await fetch(`http://127.0.0.1:${port}/json/activate/${targetId}`).catch(() => {});

            // Script to insert prompt and click submit
            const injectionScript = `
              (() => {
                const promptBox = document.querySelector('#prompt-textarea') || document.querySelector('[contenteditable="true"]');
                if (!promptBox) return { success: false, error: 'ChatGPT prompt textarea not found' };
                
                // Set text
                if (promptBox.tagName === 'TEXTAREA') {
                  promptBox.value = ${JSON.stringify(promptText)};
                  promptBox.dispatchEvent(new Event('input', { bubbles: true }));
                  promptBox.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                  promptBox.innerText = ${JSON.stringify(promptText)};
                  promptBox.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // Click send button after short delay
                setTimeout(() => {
                  const sendBtn = document.querySelector('button[data-testid="send-button"]') || 
                                  document.querySelector('button[aria-label="Send prompt"]') ||
                                  document.querySelector('form button[type="submit"]') ||
                                  document.querySelector('button.mb-1');
                  if (sendBtn) {
                    sendBtn.click();
                  }
                }, 300);

                return { success: true, message: 'Prompt dispatched into ChatGPT' };
              })()
            `;

            const resVal = await evaluateViaCdp(tab.webSocketDebuggerUrl, injectionScript);
            return sendJson(res, 200, { success: true, result: resVal });
          } catch (e: any) {
            return sendJson(res, 500, { success: false, error: e?.message });
          }
        }

        // 6. POST /api/openclaw/chatgpt/status
        if (url === '/api/openclaw/chatgpt/status' && req.method === 'POST') {
          const { targetId, port = 9222 } = await readJsonBody(req);
          try {
            const listResp = await fetch(`http://127.0.0.1:${port}/json/list`);
            const tabs = await listResp.json();
            const tab = tabs.find((t: any) => t.id === targetId);
            if (!tab || !tab.webSocketDebuggerUrl) {
              return sendJson(res, 404, { success: false, error: `Tab with targetId ${targetId} not found` });
            }

            const statusScript = `
              (() => {
                const stopBtn = document.querySelector('button[data-testid="stop-button"], button[aria-label="Stop generating"]');
                const isGenerating = !!stopBtn;

                const assistantMsgs = document.querySelectorAll('div[data-message-author-role="assistant"]');
                const lastMsg = assistantMsgs.length ? assistantMsgs[assistantMsgs.length - 1] : null;
                const lastResponseText = lastMsg ? lastMsg.innerText.trim() : '';

                const generatedImages = document.querySelectorAll('img[alt*="Generated by"], img[src*="backend-api/files"], a[download]');
                const hasImageResult = generatedImages.length > 0;
                let lastImageUrl = '';
                if (hasImageResult) {
                  const lastImg = generatedImages[generatedImages.length - 1];
                  lastImageUrl = lastImg.tagName === 'A' ? lastImg.getAttribute('href') : lastImg.getAttribute('src') || '';
                }

                return {
                  isGenerating,
                  hasResponse: !!lastResponseText,
                  lastResponseText: lastResponseText.slice(0, 1000),
                  hasImageResult,
                  imageUrl: lastImageUrl,
                  pageTitle: document.title,
                  currentUrl: window.location.href
                };
              })()
            `;

            const statusVal = await evaluateViaCdp(tab.webSocketDebuggerUrl, statusScript);
            return sendJson(res, 200, { success: true, status: statusVal });
          } catch (e: any) {
            return sendJson(res, 500, { success: false, error: e?.message });
          }
        }

        next();
      });
    }
  };
}
