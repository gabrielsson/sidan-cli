#!/usr/bin/env -S deno run --allow-net
/**
 * Melker interaction script for LLM-driven UI testing.
 *
 * Usage:
 *   deno run --allow-net melker-interact.ts <command> [args...]
 *
 * Commands:
 *   snapshot              - Get --ai-context style document tree
 *   inject-key <key>      - Inject a keypress (e.g. Tab, Enter, ctrl+r)
 *   click <x> <y>         - Inject a mouse click
 *   dispatch <name>       - Dispatch a named event
 *   switch-tab <tabId>    - Click a tab button by element id
 *
 * Env:
 *   MELKER_PORT  - port (default 9877)
 *   MELKER_TOKEN - token (default devtoken)
 */

const PORT = Deno.env.get("MELKER_PORT") ?? "9877";
const TOKEN = Deno.env.get("MELKER_TOKEN") ?? "devtoken";
const WS_URL = `ws://localhost:${PORT}/?token=${TOKEN}`;

const [command, ...args] = Deno.args;

const ws = new WebSocket(WS_URL);

function send(type: string, data?: unknown) {
  ws.send(JSON.stringify({ type, data }));
}

function waitForMessage(type: string, timeoutMs = 5000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${type}`)), timeoutMs);
    const handler = (ev: MessageEvent) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === type) {
        clearTimeout(timer);
        ws.removeEventListener("message", handler);
        resolve(msg.data);
      }
    };
    ws.addEventListener("message", handler);
  });
}

function waitForRender(timeoutMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs); // resolve anyway after timeout
    const handler = (ev: MessageEvent) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === "render-notifications-update") {
        clearTimeout(timer);
        ws.removeEventListener("message", handler);
        setTimeout(resolve, 100); // small settle delay
      }
    };
    ws.addEventListener("message", handler);
  });
}

ws.onopen = async () => {
  // Subscribe to render notifications
  send("subscribe", { subscriptions: ["render-notifications"] });

  switch (command) {
    case "snapshot": {
      send("get-document-tree");
      const tree = await waitForMessage("document-tree");
      console.log(JSON.stringify(tree, null, 2));
      break;
    }

    case "inject-key": {
      const key = args[0];
      if (!key) { console.error("Usage: inject-key <key>"); Deno.exit(1); }
      const [modStr, ...keyParts] = key.includes("+") ? key.split("+") : [null, key];
      const actualKey = keyParts.length ? keyParts.join("+") : (modStr ?? key);
      const modifiers: Record<string, boolean> = {};
      if (modStr?.toLowerCase() === "ctrl") modifiers.ctrlKey = true;
      if (modStr?.toLowerCase() === "alt") modifiers.altKey = true;
      if (modStr?.toLowerCase() === "shift") modifiers.shiftKey = true;
      send("inject-key", { key: actualKey, code: actualKey, modifiers, type: "keydown" });
      await waitForRender();
      send("get-document-tree");
      const tree = await waitForMessage("document-tree");
      console.log(JSON.stringify(tree, null, 2));
      break;
    }

    case "click": {
      const x = parseInt(args[0]), y = parseInt(args[1]);
      send("inject-click", { x, y, button: 0 });
      await waitForRender();
      send("get-document-tree");
      const tree = await waitForMessage("document-tree");
      console.log(JSON.stringify(tree, null, 2));
      break;
    }

    case "dispatch": {
      const name = args[0];
      send("dispatch-named-event", { name, detail: args[1] ? JSON.parse(args[1]) : undefined });
      await waitForRender();
      send("get-document-tree");
      const tree = await waitForMessage("document-tree");
      console.log(JSON.stringify(tree, null, 2));
      break;
    }

    case "engine-state": {
      send("get-engine-state");
      const state = await waitForMessage("engine-state");
      console.log(JSON.stringify(state, null, 2));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.error("Commands: snapshot, inject-key, click, dispatch, engine-state");
      Deno.exit(1);
  }

  ws.close();
};

ws.onerror = (e) => {
  console.error("WebSocket error:", e);
  Deno.exit(1);
};
