// Reference-level drift check for one slice (or a whole chunk). COPY OF THE
// FLEET PRECEDENT (call-of-roque / kals-valley / ziggy-card / stillwater /
// pelota / taipei-rush-tokyo / kowloon / a-place-beyond tools/refcheck.mjs) for
// ROADSTER: THE FLYING CAR. Nothing is read from another mirror at runtime.
//
// The token-level round trip in tools/audit.js proves the slice is its source
// range with identifiers substituted. It cannot see a rename applied at *some*
// references and not others: the token stream still lines up, because a renamed
// token and an unrenamed one are both just identifiers. The failure only shows
// up as a name that is used but never bound.
//
// So compare the two sides directly. A chunk is one scope shared by every
// slice, so a slice legitimately references bindings declared in its siblings
// -- those are unbound *in this file* and must match the source range exactly.
// A name that is unbound in the slice but not in its source range is a rename
// that lost its declaration (or its call sites); the reverse is a declaration
// renamed without its call sites. Either way the slice would throw at runtime.
//
// acorn resolves through tools/lib-acorn.mjs (tools/.deps, authoring-time only).
import { getAcorn } from "./lib-acorn.mjs";

let acorn = null;
const ensure = async () => {
  if (!acorn) acorn = await getAcorn();
  return acorn;
};

// Environment and library globals a browser bundle may legitimately reference
// without declaring them here.
const GLOBALS = new Set([
  "globalThis", "console", "Math", "JSON", "Object", "Array", "String", "Number", "Boolean", "Symbol", "BigInt",
  "Map", "Set", "WeakMap", "WeakSet", "Promise", "Error", "TypeError", "RangeError", "SyntaxError", "ReferenceError",
  "EvalError", "URIError", "AggregateError", "Function", "Date", "RegExp", "Infinity", "NaN", "undefined",
  "window", "document", "self", "global", "globalThis",
  "Float32Array", "Float64Array", "Int32Array", "Uint32Array", "Uint8Array", "Uint16Array", "Int16Array", "Uint8ClampedArray",
  "BigInt64Array", "BigUint64Array", "ArrayBuffer", "SharedArrayBuffer", "DataView", "performance", "requestAnimationFrame",
  "cancelAnimationFrame", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "queueMicrotask",
  "fetch", "navigator", "location", "history", "localStorage", "sessionStorage", "indexedDB", "caches",
  "Image", "ImageBitmap", "Audio", "ImageData", "OffscreenCanvas", "CanvasRenderingContext2D", "WebGLRenderingContext",
  "WebGL2RenderingContext", "AudioContext", "webkitAudioContext", "OfflineAudioContext", "AnalyserNode", "AudioBuffer",
  "Proxy", "Reflect", "Intl", "URL", "URLSearchParams", "TextEncoder", "TextDecoder", "crypto", "structuredClone",
  "process", "top", "parent", "frames", "screen", "devicePixelRatio", "matchMedia", "ResizeObserver",
  "IntersectionObserver", "MutationObserver", "Worker", "SharedWorker", "Blob", "File", "FileReader", "FormData",
  "DOMParser", "XMLHttpRequest", "Event", "CustomEvent", "EventTarget", "Notification", "alert", "confirm", "prompt",
  "arguments", "eval", "super", "import", "require", "module", "exports", "__dirname", "__filename", "__vite__mapDeps",
  "GPUTextureUsage", "GPUBufferUsage", "GPUMapMode", "GPUShaderStage", "HTMLElement", "HTMLCanvasElement",
  "HTMLButtonElement", "HTMLDivElement", "HTMLImageElement", "HTMLInputElement", "HTMLVideoElement", "HTMLLinkElement",
  "HTMLScriptElement", "Element", "Node", "Document", "CSS", "Path2D", "getComputedStyle", "requestIdleCallback",
  "cancelIdleCallback", "PointerEvent", "WheelEvent", "KeyboardEvent", "MouseEvent", "TouchEvent", "DragEvent",
  "MediaQueryList", "isSecureContext", "origin", "addEventListener", "removeEventListener", "dispatchEvent",
  "WebAssembly", "Atomics", "FinalizationRegistry", "WeakRef", "encodeURIComponent", "decodeURIComponent",
  "encodeURI", "decodeURI", "parseInt", "parseFloat", "isNaN", "isFinite", "escape", "unescape",
]);

const SKIP_KEYS = new Set(["type", "start", "end", "loc", "range", "raw", "__scope", "__fnStack"]);

/** Names referenced but bound nowhere in `code`, and a binding trace. */
export async function unboundNames(code) {
  const acornMod = await ensure();
  let ast;
  try {
    ast = acornMod.parse(code, { ecmaVersion: 2023, sourceType: "module" });
  } catch {
    ast = acornMod.parse(code, { ecmaVersion: 2023, sourceType: "script" });
  }

  const out = new Map(); // name -> count
  const declared = new Set(); // names bound at this file's top level
  const trace = []; // one entry per identifier reference, in walk order
  let current = { parent: null, fnScope: null, names: new Set(), id: 0 };
  current.fnScope = current;
  const programScope = current;
  let nextScopeId = 1;

  const declare = (name, kind, scope = current) => {
    if (kind === "var" || kind === "function") scope = scope.fnScope;
    scope.names.add(name);
    if (scope === programScope) declared.add(name);
    return scope;
  };
  const push = (isFunction) => {
    const s = { parent: current, fnScope: null, names: new Set(), id: nextScopeId++ };
    s.fnScope = isFunction ? s : current.fnScope;
    current = s;
    return s;
  };
  const pop = () => {
    const s = current;
    current = s.parent;
    return s;
  };
  const resolve = (name) => {
    for (let s = current; s; s = s.parent) if (s.names.has(name)) return s;
    return null;
  };
  const pat = (p, kind = "let") => {
    if (!p) return;
    if (p.type === "Identifier") declare(p.name, kind);
    else if (p.type === "ObjectPattern") for (const q of p.properties) pat(q.type === "RestElement" ? q.argument : q.value, kind);
    else if (p.type === "ArrayPattern") for (const q of p.elements) pat(q, kind);
    else if (p.type === "AssignmentPattern") pat(p.left, kind);
    else if (p.type === "RestElement") pat(p.argument, kind);
  };
  const isName = (node, parent) => {
    if (!parent) return false;
    if (parent.type === "MemberExpression" && parent.property === node && !parent.computed) return true;
    if (parent.type === "Property" && parent.key === node) return !parent.computed && !parent.shorthand;
    if (parent.type === "MethodDefinition" && parent.key === node && !parent.computed) return true;
    if (parent.type === "PropertyDefinition" && parent.key === node && !parent.computed) return true;
    if ((parent.type === "LabeledStatement" || parent.type === "BreakStatement" || parent.type === "ContinueStatement") && parent.label === node) return true;
    if (parent.type === "ImportSpecifier" || parent.type === "ImportDefaultSpecifier" || parent.type === "ImportNamespaceSpecifier") return true;
    if (parent.type === "ExportSpecifier") return true;
    return false;
  };
  const hoist = (st) => {
    if (!st) return;
    // EVERY binding a statement introduces must be known before any statement in
    // the block is walked — a `const white = …` below a `function f(){…white…}`
    // in the same block is in scope throughout it.
    if ((st.type === "FunctionDeclaration" || st.type === "ClassDeclaration") && st.id) declare(st.id.name, "let");
    else if (st.type === "VariableDeclaration") for (const d of st.declarations) pat(d.id, st.kind);
    // Imported locals ARE module-scope bindings: without declaring them, every
    // use of an imported name reads as unbound and a renamed import alias (the
    // campaign renames locals, never the imported public name) would be
    // reported as drift on one side only.
    else if (st.type === "ImportDeclaration") for (const s of st.specifiers) declare(s.local.name, "let");
  };

  function walk(node, parent) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const c of node) walk(c, parent);
      return;
    }
    if (typeof node.type !== "string") {
      for (const k of Object.keys(node)) if (!SKIP_KEYS.has(k)) walk(node[k], node);
      return;
    }
    switch (node.type) {
      case "Program":
        for (const s of node.body) hoist(s);
        for (const s of node.body) walk(s, node);
        return;
      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ArrowFunctionExpression": {
        if (node.type === "FunctionDeclaration" && node.id) declare(node.id.name, "function");
        const s = push(true);
        if (node.type !== "FunctionDeclaration" && node.id) declare(node.id.name, "function", s);
        for (const p of node.params) pat(p);
        if (node.body.type === "BlockStatement") {
          for (const st of node.body.body) hoist(st);
          for (const st of node.body.body) walk(st, node);
        } else walk(node.body, node);
        pop();
        return;
      }
      case "BlockStatement":
      case "StaticBlock": {
        push(false);
        for (const st of node.body) {
          hoist(st);
          walk(st, node);
        }
        pop();
        return;
      }
      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement": {
        push(false);
        if (node.init && node.init.type !== "VariableDeclaration") walk(node.init, node);
        else if (node.init) {
          for (const d of node.init.declarations) pat(d.id, node.init.kind);
          walk(node.init, node);
        }
        if (node.left && node.left.type !== "VariableDeclaration") pat(node.left, "var");
        else if (node.left) for (const d of node.left.declarations) pat(d.id, node.left.kind);
        walk(node.test, node);
        walk(node.update, node);
        walk(node.right, node);
        walk(node.body, node);
        pop();
        return;
      }
      case "VariableDeclaration":
        for (const d of node.declarations) {
          pat(d.id, node.kind);
          walk(d.init, node);
        }
        return;
      case "CatchClause":
        push(false);
        if (node.param) pat(node.param);
        walk(node.body, node);
        pop();
        return;
      case "ClassDeclaration":
      case "ClassExpression": {
        // Walk the class body: an outer binding referenced inside a method has
        // to be seen by the reference and binding drift checks.
        if (node.id) declare(node.id.name, "class");
        push(false);
        if (node.superClass) walk(node.superClass, node);
        for (const el of node.body.body) walk(el, node);
        pop();
        return;
      }
      case "Identifier": {
        if (isName(node, parent)) return;
        // Record WHICH binding this name resolves to, not just whether it
        // resolves: two sides can both be fully bound and still disagree.
        const scope = resolve(node.name);
        trace.push(scope ? scope.id : 0);
        if (scope || GLOBALS.has(node.name)) return;
        out.set(node.name, (out.get(node.name) || 0) + 1);
        return;
      }
      case "ImportDeclaration":
        return;
      case "ExportNamedDeclaration":
        if (node.declaration) walk(node.declaration, node);
        return;
      case "ExportAllDeclaration":
        return;
    }
    for (const k of Object.keys(node)) if (!SKIP_KEYS.has(k)) walk(node[k], node);
  }
  walk(ast, null);
  lastTrace = trace;
  lastDeclared = declared;
  return out;
}

// The most recent unboundNames() call's top-level declarations.
let lastDeclared = new Set();

/** Names bound at the top level of `code` — this file's contribution to its chunk's scope. */
export async function topLevelNames(code) {
  await unboundNames(code);
  return lastDeclared;
}

// Populated by the most recent unboundNames() call: the resolved-scope id of
// every identifier reference, in walk order.
let lastTrace = [];

/**
 * Does every identifier in `sliceCode` still resolve to the SAME binding it
 * does in `sourceCode`? Both sides walk identically (the token gate already
 * proved the structure matches), so scope creation order is identical and the
 * per-reference scope ids must match element for element.
 */
export async function bindingDrift(sliceCode, sourceCode) {
  await unboundNames(sliceCode);
  const a = lastTrace;
  await unboundNames(sourceCode);
  const b = lastTrace;
  if (a.length !== b.length) return { at: Math.min(a.length, b.length), reason: "reference count" };
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return { at: i, reason: "rebound" };
  return null;
}

/** Compare a slice against its source range. Returns null when they agree. */
export async function refDrift(sliceCode, sourceCode) {
  const a = await unboundNames(sliceCode);
  const b = await unboundNames(sourceCode);
  const extra = [...a.keys()].filter((n) => !b.has(n));
  const missing = [...b.keys()].filter((n) => !a.has(n));
  return extra.length || missing.length ? { extra, missing } : null;
}
