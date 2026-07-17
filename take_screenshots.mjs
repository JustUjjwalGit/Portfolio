import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, 'assets');

// Ensure assets directory exists
fs.mkdirSync(ASSETS_DIR, { recursive: true });

async function waitForServer(url, timeoutMs = 30000, checkIntervalMs = 500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          resolve(res.statusCode);
        });
        req.on('error', reject);
        req.setTimeout(2000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      console.log(`  Server ready at ${url}`);
      return true;
    } catch {
      await new Promise(r => setTimeout(r, checkIntervalMs));
    }
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

function runCommand(cmd, args, cwd, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== Starting ${label} ===`);
    console.log(`  $ cd ${path.basename(cwd)} && ${cmd} ${args.join(' ')}`);

    const proc = spawn(cmd, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env },
    });

    let output = '';
    proc.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
    });
    proc.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
    });

    // Resolve after 2 seconds (giving the server time to start)
    // The caller will wait for the server health check additionally
    setTimeout(() => resolve(proc), 2000);

    proc.on('error', reject);
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function screenshotPage(page, url, outputPath, opts = {}) {
  const { waitForSelector, waitMs = 2000, viewport = { width: 1280, height: 800 }, fullPage = false, clickSelector } = opts;

  await page.setViewportSize(viewport);
  console.log(`  Navigating to ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) {
    console.log(`  Warning: navigation timeout, will try anyway: ${e.message}`);
    await page.goto(url, { timeout: 10000 }).catch(() => {});
  }

  if (waitForSelector) {
    try {
      await page.waitForSelector(waitForSelector, { timeout: 8000 });
      console.log(`  Found selector: ${waitForSelector}`);
    } catch (e) {
      console.log(`  Warning: waitForSelector(${waitForSelector}) failed: ${e.message}`);
    }
  }

  if (clickSelector) {
    try {
      await page.click(clickSelector);
      console.log(`  Clicked: ${clickSelector}`);
      await sleep(500);
    } catch (e) {
      console.log(`  Warning: click(${clickSelector}) failed: ${e.message}`);
    }
  }

  await sleep(waitMs);

  if (fullPage) {
    await page.screenshot({ path: outputPath, fullPage: true });
  } else {
    await page.screenshot({ path: outputPath });
  }
  console.log(`  Screenshot saved: ${outputPath}`);
}

async function killProcess(proc) {
  if (proc && !proc.killed) {
    try {
      proc.kill('SIGTERM');
      // On Linux, also kill the process group
      if (proc.pid) {
        try {
          process.kill(-proc.pid, 'SIGTERM');
        } catch {}
      }
    } catch {}
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  const runningProcesses = [];

  try {
    // ─── 1. Weathermap (static site) ──────────────────────────────────────
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log(' 1. Weathermap');
    console.log('═══════════════════════════════════════════════════════════');

    const weatherProc = spawn('python3', ['-m', 'http.server', '3001'], {
      cwd: '/home/ujjwal/Documents/Code/Weathermap',
      stdio: 'ignore',
      shell: true,
    });
    runningProcesses.push(weatherProc);

    await waitForServer('http://localhost:3001');
    const page1 = await context.newPage();
    // Use the existing preview — it works as a static site fallback title page
    await screenshotPage(page1, 'http://localhost:3001',
      path.join(ASSETS_DIR, 'weathermap-preview.png'),
      { waitMs: 3000, waitForSelector: '.header' });
    await page1.close();

    // ─── 2. PlanetNews (Vite/React) ──────────────────────────────────────
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log(' 2. PlanetNews');
    console.log('═══════════════════════════════════════════════════════════');

    const planetProc = spawn('npx', ['vite', '--port', '3002', '--host'], {
      cwd: '/home/ujjwal/Documents/Code/PlanetNews',
      stdio: 'ignore',
      shell: true,
      env: { ...process.env },
    });
    runningProcesses.push(planetProc);

    await waitForServer('http://localhost:3002');
    await sleep(3000); // Let Vite compile
    const page2 = await context.newPage();
    await screenshotPage(page2, 'http://localhost:3002',
      path.join(ASSETS_DIR, 'planetnews-preview.png'),
      { waitMs: 4000, waitForSelector: 'body' });
    await page2.close();

    // ─── 3. CubeRanked (Vite/React) ─────────────────────────────────────
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log(' 3. CubeRanked');
    console.log('═══════════════════════════════════════════════════════════');

    const cubeProc = spawn('npx', ['vite', '--port', '3003', '--host'], {
      cwd: '/home/ujjwal/Documents/Code/CubeRanked/frontend',
      stdio: 'ignore',
      shell: true,
      env: { ...process.env },
    });
    runningProcesses.push(cubeProc);

    await waitForServer('http://localhost:3003', 60000);
    await sleep(5000); // Let Vite compile the React app
    const page3 = await context.newPage();
    await screenshotPage(page3, 'http://localhost:3003',
      path.join(ASSETS_DIR, 'cuberanked-preview.png'),
      { waitMs: 5000, waitForSelector: '.client-shell', viewport: { width: 1280, height: 800 } });

    // Take a second screenshot — maybe open the PlayModal
    // Check if we can see a "Play" button or similar
    try {
      const playBtn = await page3.waitForSelector('button:has-text("Play"), [class*="play"]', { timeout: 3000 });
      if (playBtn) {
        await playBtn.click();
        await sleep(1000);
      }
    } catch {}
    await page3.close();

    // ─── 4. MCSR Ranked (Next.js) ───────────────────────────────────────
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log(' 4. MCSR Ranked Website');
    console.log('═══════════════════════════════════════════════════════════');

    const mcsrProc = spawn('npx', ['next', 'dev', '-p', '3004'], {
      cwd: '/home/ujjwal/Documents/Code/mcsr-ranked-website',
      stdio: 'ignore',
      shell: true,
      env: { ...process.env },
    });
    runningProcesses.push(mcsrProc);

    await waitForServer('http://localhost:3004', 120000);
    await sleep(8000); // Let Next.js compile
    const page4 = await context.newPage();
    await screenshotPage(page4, 'http://localhost:3004',
      path.join(ASSETS_DIR, 'mcsr-preview.png'),
      { waitMs: 5000, waitForSelector: 'body', viewport: { width: 1280, height: 800 } });
    await page4.close();

    // ─── 5. Kashdog (Expo / React Native – not a web project) ───────────
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log(' 5. Kashdog');
    console.log('═══════════════════════════════════════════════════════════');
    // Kashdog is an Expo/React Native mobile app. It can't serve a webpage directly for screenshots.
    // Create a placeholder message
    const placeholderContent = `
    <!DOCTYPE html>
    <html>
    <head><title>Kashdog - Mobile App</title>
    <style>
      body { font-family: system-ui; display: flex; align-items: center; justify-content: center;
             height: 100vh; margin: 0; background: #0a0a0f; color: #e4e4e7; }
      .card { text-align: center; padding: 40px; border-radius: 16px; background: #18181b;
              border: 1px solid #27272a; max-width: 500px; }
      h1 { color: #f4f4f5; margin-bottom: 8px; }
      p { color: #a1a1aa; line-height: 1.5; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 999px;
               background: #1e1b4b; color: #818cf8; font-size: 13px; font-weight: 600; margin-top: 16px; }
    </style>
    </head><body>
    <div class="card">
      <h1>Kashdog</h1>
      <p>React Native / Expo mobile app<br>for crypto wallet & authentication</p>
      <p style="margin-top:12px;font-size:13px;">This is a mobile application and cannot be<br>displayed in a browser.</p>
      <div class="badge">Expo · React Native · TypeScript</div>
    </div>
    </body></html>`;

    const tempHtmlPath = '/tmp/kashdog-preview.html';
    fs.writeFileSync(tempHtmlPath, placeholderContent);

    const tempServer2 = spawn('python3', ['-m', 'http.server', '3006'], {
      cwd: '/tmp',
      stdio: 'ignore',
      shell: true,
    });
    runningProcesses.push(tempServer2);

    await waitForServer('http://localhost:3006');
    const page5 = await context.newPage();
    await screenshotPage(page5, 'http://localhost:3006/kashdog-preview.html',
      path.join(ASSETS_DIR, 'kashdog-preview.png'),
      { waitMs: 1000 });
    await page5.close();

    // ─── 6. AllJavaCodes (not a web project) ────────────────────────────
    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log(' 6. AllJavaCodes');
    console.log('═══════════════════════════════════════════════════════════');
    // AllJavaCodes is a collection of standalone Java files
    const placeholderContent2 = `
    <!DOCTYPE html>
    <html>
    <head><title>AllJavaCodes - Java Programs</title>
    <style>
      body { font-family: system-ui; display: flex; align-items: center; justify-content: center;
             height: 100vh; margin: 0; background: #0a0a0f; color: #e4e4e7; }
      .card { text-align: center; padding: 40px; border-radius: 16px; background: #18181b;
              border: 1px solid #27272a; max-width: 500px; }
      h1 { color: #f4f4f5; margin-bottom: 8px; }
      p { color: #a1a1aa; line-height: 1.5; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 999px;
               background: #1e1b4b; color: #818cf8; font-size: 13px; font-weight: 600; margin-top: 16px; }
      .files { margin-top: 16px; text-align: left; columns: 2; font-size: 12px; color: #71717a; line-height: 1.8; }
    </style>
    </head><body>
    <div class="card">
      <h1>AllJavaCodes</h1>
      <p>A collection of Java programs covering<br>fundamental algorithms and concepts.</p>
      <div class="files">
        EvenOdd · PrimeCheck · Factorial · ReverseNumber · Palindrome · Armstrong<br>
        SumOfDigits · Fibonacci · GCD · LCM · PerfectNumber · HCF · CountDigits<br>
        SumOfEvenDigits · Power · CheckNeon · CheckHarshad · PrintFactors<br>
      </div>
      <div class="badge">Java · CLI Programs</div>
    </div>
    </body></html>`;

    const tempHtmlPath2 = '/tmp/alljavacodes-preview.html';
    fs.writeFileSync(tempHtmlPath2, placeholderContent2);

    // Reuse the server already running on 3006 (serving /tmp)
    // Just navigate to this new file
    const page6 = await context.newPage();
    await screenshotPage(page6, 'http://localhost:3006/alljavacodes-preview.html',
      path.join(ASSETS_DIR, 'alljavacodes-preview.png'),
      { waitMs: 1000 });
    await page6.close();

    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log(' ALL SCREENSHOTS COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (err) {
    console.error('Error during screenshotting:', err);
  } finally {
    // Cleanup: kill all server processes
    for (const proc of runningProcesses) {
      await killProcess(proc);
    }
    await browser.close();
  }
}

main().catch(console.error);
