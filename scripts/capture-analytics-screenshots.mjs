import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const OUTPUT_DIR = join(process.cwd(), "output", "stage-3-step-2d1");
mkdirSync(OUTPUT_DIR, { recursive: true });

// Read cookie from cookies.txt
const cookieContent = readFileSync(join(process.cwd(), "cookies.txt"), "utf-8");
const lines = cookieContent.split("\n");
let authTokenVal = "";

for (const l of lines) {
  if (l.includes("sb-tqwgmmiljcumomhxwxit-auth-token")) {
    const parts = l.split("\t");
    authTokenVal = parts[parts.length - 1].trim();
    break;
  }
}

if (!authTokenVal) {
  console.error("No auth token cookie found!");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const tmpDir = `/tmp/himatu-chrome-${Date.now()}`;
  mkdirSync(tmpDir, { recursive: true });

  const chromeProc = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--remote-debugging-port=9222",
      `--user-data-dir=${tmpDir}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  console.log("Waiting for Chrome DevTools...");
  await sleep(1500);

  const versionRes = await fetch("http://127.0.0.1:9222/json/list");
  const pages = await versionRes.json();
  const wsUrl = pages[0]?.webSocketDebuggerUrl;

  if (!wsUrl) {
    console.error("Could not obtain Chrome WebSocket URL");
    chromeProc.kill();
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((resolve) => ws.onopen = resolve);

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send("Page.enable");
  await send("Network.enable");

  // Set auth cookies
  await send("Network.setCookie", {
    name: "sb-tqwgmmiljcumomhxwxit-auth-token",
    value: authTokenVal,
    domain: "localhost",
    path: "/",
    httpOnly: true,
  });

  await send("Network.setCookie", {
    name: "himatu-remember",
    value: "1",
    domain: "localhost",
    path: "/",
  });

  async function capture(name, width = 1440, height = 900) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await sleep(500);

    const { data } = await send("Page.captureScreenshot", { format: "png" });
    const buf = Buffer.from(data, "base64");
    const filePath = join(OUTPUT_DIR, name);
    writeFileSync(filePath, buf);
    console.log(`Saved screenshot: ${name} (${buf.length} bytes, ${width}x${height})`);
  }

  console.log("Navigating to http://localhost:3000/admin/analytics...");
  await send("Page.navigate", { url: "http://localhost:3000/admin/analytics" });
  await sleep(3500); // Wait for React to render

  // 1. Overview
  await capture("01-analytics-overview.png", 1440, 1000);

  // 2. Click Revenue Tab
  await send("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const revBtn = btns.find(b => b.textContent && b.textContent.includes('Revenue & Finance'));
      if (revBtn) revBtn.click();
    `,
  });
  await sleep(1000);
  await capture("02-revenue-intelligence.png", 1440, 950);

  // 3. Click Collections Tab
  await send("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const colBtn = btns.find(b => b.textContent && b.textContent.includes('Collections & Figures'));
      if (colBtn) colBtn.click();
    `,
  });
  await sleep(1000);
  await capture("03-collection-performance.png", 1440, 950);
  await capture("06-product-leaderboard.png", 1440, 950);

  // 4. Click Inventory Tab
  await send("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const invBtn = btns.find(b => b.textContent && b.textContent.includes('Inventory Health'));
      if (invBtn) invBtn.click();
    `,
  });
  await sleep(1000);
  await capture("04-inventory-health.png", 1440, 950);
  await capture("05-order-fulfilment.png", 1440, 950);

  // 5. Click Funnel Tab
  await send("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const funBtn = btns.find(b => b.textContent && b.textContent.includes('Funnel & Customers'));
      if (funBtn) funBtn.click();
    `,
  });
  await sleep(1000);
  await capture("08-conversion-funnel.png", 1440, 950);
  await capture("07-customer-insights.png", 1440, 950);

  // 6. Click AI Insights Tab
  await send("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const aiBtn = btns.find(b => b.textContent && b.textContent.includes('AI Business Insights'));
      if (aiBtn) aiBtn.click();
    `,
  });
  await sleep(1000);
  await capture("09-ai-business-insights.png", 1440, 950);

  // 7. Responsive testing
  console.log("Capturing responsive breakpoints...");
  // Back to overview
  await send("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('button'));
      const allBtn = btns.find(b => b.textContent && b.textContent.includes('Executive Overview'));
      if (allBtn) allBtn.click();
    `,
  });
  await sleep(800);

  await capture("responsive-1440px.png", 1440, 900);
  await capture("responsive-1024px.png", 1024, 850);
  await capture("responsive-768px.png", 768, 850);
  await capture("responsive-390px.png", 390, 800);
  await capture("responsive-375px.png", 375, 750);
  await capture("responsive-320px.png", 320, 700);

  console.log("All screenshots captured successfully!");
  ws.close();
  chromeProc.kill();
  rmSync(tmpDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});

