// Style check for the new frontend (REQ-fs-004). Plain Node, no packages.
//
//   node scripts/frontend-style-check.mjs
//
// Reads every text file under frontend/src and prints one line per finding,
// with the file and the line. Exit 1 on any finding, 0 on none.
// It reads files only: it writes nothing and calls nothing.
//
// The rules:
//   a  no color literal outside styles/tokens.css
//   b  no px / em / rem number in a *.module.css or in styles/base.css
//   c  no import of antd, @ant-design or @fontsource-variable/inter
//   d  no import of axios or services/ from components, pages, routes, hooks, icons
//   e  the app name and the contact email are written only in config/app.ts
//   f  no onClick on a <div> or a <span>
//   g  no dangerouslySetInnerHTML
//   h  no box-shadow, no gradient, no "outline: none" in a stylesheet

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = path.join(REPO_ROOT, "frontend", "src");

const TOKENS_FILE = "styles/tokens.css";
const BASE_FILE = "styles/base.css";
const APP_CONFIG_FILE = "config/app.ts";
const CONFIG_CONSTANTS = ["APP_NAME", "CONTACT_EMAIL"];

// The one size literal a component stylesheet may hold: CSS variables cannot be
// used in a media query. Always written this way (architecture.md, "Tokens and styles").
const BREAKPOINT_LINE = "@media (max-width: 767.98px)";

const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".html", ".svg", ".json", ".md",
]);
const SCRIPT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

// Folders whose files may not reach the API themselves (rule d).
const UI_FOLDERS = ["components/", "pages/", "routes/", "hooks/", "icons/"];

const BANNED_PACKAGES = ["antd", "@ant-design", "@fontsource-variable/inter"];

const RULES = {
  a: "color literal outside styles/tokens.css",
  b: "px / em / rem literal in a component stylesheet or base.css",
  c: "import of antd, @ant-design or @fontsource-variable/inter",
  d: "import of axios or services/ from a UI folder",
  e: "app name or contact email outside config/app.ts",
  f: "onClick on a <div> or <span>",
  g: "dangerouslySetInnerHTML",
  h: "box-shadow, gradient or outline removed in a stylesheet",
};

// The CSS named colors (CSS Color Module Level 4). "transparent", "currentColor"
// and "inherit" are not in the list: they carry no color value of their own.
const NAMED_COLORS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue " +
    "blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk " +
    "crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki " +
    "darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen " +
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue " +
    "dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite " +
    "gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki " +
    "lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan " +
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen " +
    "lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen " +
    "magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen " +
    "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream " +
    "mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid " +
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum " +
    "powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
    "seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen " +
    "steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen"
  ).split(" "),
);

// "#fff", "#ffff", "#ffffff", "#ffffffff". Not "&#8217;" (a character code).
const HEX_COLOR = /(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/;
const COLOR_FUNCTION = /(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\s*\(/i;
// A named color given to a style property or an SVG attribute in a script file:
//   style={{ color: "red" }}   fill="black"   stroke={'white'}
const SCRIPT_COLOR_PROPERTY =
  /(?<![\w-])(?:color|background|backgroundColor|borderColor|border\w*Color|outlineColor|fill|stroke|stopColor|floodColor|caretColor|accentColor|textDecorationColor)\s*[:=]\s*\{?\s*["'`]\s*([a-zA-Z]+)\s*["'`]/g;

const SIZE_LITERAL = /(?<![\w#.-])[+-]?(?:\d+\.?\d*|\.\d+)(?:px|rem|em)(?![\w-])/;

const IMPORT_SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*|@import\s+(?:url\(\s*)?)["'`]([^"'`]+)["'`]/g;

const CLICKABLE_TAG = /<(div|span)(?![\w.-])/g;
const BANNED_STYLE = [
  { pattern: /(?<![\w-])box-shadow\s*:/i, what: "box-shadow" },
  { pattern: /gradient\s*\(/i, what: "gradient(" },
  { pattern: /(?<![\w-])outline\s*:\s*(?:none|0(?:px|em|rem)?)(?![\w.%])/i, what: "outline removed" },
];

const findings = [];
const counts = Object.fromEntries(Object.keys(RULES).map((rule) => [rule, 0]));

function report(rule, file, line, detail) {
  counts[rule] += 1;
  findings.push({ rule, file, line, detail });
}

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir).sort()) {
    if (name === "node_modules") continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

// Replaces every comment with spaces, keeping the line breaks, so line numbers
// stay right and a comment can never cause a finding in rules a, b, c, d, g, h.
function blank(text) {
  return text.replace(/[^\n]/g, " ");
}

function stripCssComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, blank);
}

function stripScriptComments(text) {
  let out = "";
  let i = 0;
  let quote = null; // the string we are inside: ", ' or `
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    if (quote) {
      out += ch;
      if (ch === "\\" && next !== undefined) {
        out += next;
        i += 2;
        continue;
      }
      // A ' or " string cannot cross a line. This also stops an apostrophe in
      // JSX text ("Don't") from hiding the lines after it.
      if (ch === quote || (ch === "\n" && quote !== "`")) quote = null;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end === -1 ? text.length : end + 2;
      out += blank(text.slice(i, stop));
      i = stop;
      continue;
    }
    // "//" starts a comment, except in "http://" written as plain JSX text.
    if (ch === "/" && next === "/" && text[i - 1] !== ":") {
      const end = text.indexOf("\n", i);
      const stop = end === -1 ? text.length : end;
      out += blank(text.slice(i, stop));
      i = stop;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) if (text[i] === "\n") line += 1;
  return line;
}

// Reads the constants of config/app.ts so their values are not written twice.
function readConfigValues() {
  const file = path.join(SRC_DIR, APP_CONFIG_FILE);
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return { error: `cannot read frontend/src/${APP_CONFIG_FILE}` };
  }
  const values = [];
  for (const name of CONFIG_CONSTANTS) {
    const match = text.match(new RegExp(`export\\s+const\\s+${name}\\s*=\\s*(["'\`])(.+?)\\1`));
    if (!match || match[2].trim() === "") {
      return { error: `cannot find a text value for ${name} in frontend/src/${APP_CONFIG_FILE}` };
    }
    values.push({ name, value: match[2] });
  }
  return { values };
}

// ----- rule a ---------------------------------------------------------------

function checkColorLiterals(rel, lines) {
  lines.forEach((line, index) => {
    const hex = line.match(HEX_COLOR);
    if (hex) report("a", rel, index + 1, `hex color ${hex[0]}`);
    const fn = line.match(COLOR_FUNCTION);
    if (fn) report("a", rel, index + 1, `color function ${fn[0].replace(/\s+/g, "")}`);
  });
}

// A CSS value with the parts that are names, not values, taken out.
function cssValueWords(value) {
  const cleaned = value
    .replace(/(["'])(?:\\.|(?!\1).)*\1/g, " ")
    .replace(/url\([^)]*\)/gi, " ")
    .replace(/--[\w-]+/g, " ");
  return cleaned.match(/[a-zA-Z][\w-]*/g) ?? [];
}

function checkCssNamedColors(rel, lines) {
  let inValue = false; // true while a declaration runs on over several lines
  lines.forEach((line, index) => {
    let value = null;
    if (inValue) {
      value = line;
    } else if (!line.includes("{")) {
      const declaration = line.match(/^\s*(--)?[\w-]+\s*:(.*)$/);
      // "a:hover," is one line of a selector list, not a declaration.
      const isSelector = /^\s*[\w-]+:\S.*,\s*$/.test(line);
      if (declaration && !isSelector) value = declaration[2];
    } else {
      // "a { color: red; }" on one line: look inside the braces.
      const inside = line.slice(line.indexOf("{") + 1);
      const declaration = inside.match(/^\s*(--)?[\w-]+\s*:(.*)$/);
      if (declaration) value = declaration[2];
    }
    if (value === null) return;
    inValue = !/[;}]/.test(value);
    for (const word of cssValueWords(value)) {
      if (NAMED_COLORS.has(word.toLowerCase())) {
        report("a", rel, index + 1, `named color "${word}"`);
      }
    }
  });
}

function checkScriptNamedColors(rel, lines) {
  lines.forEach((line, index) => {
    for (const match of line.matchAll(SCRIPT_COLOR_PROPERTY)) {
      if (NAMED_COLORS.has(match[1].toLowerCase())) {
        report("a", rel, index + 1, `named color "${match[1]}"`);
      }
    }
  });
}

// ----- rule b ---------------------------------------------------------------

function checkSizeLiterals(rel, lines) {
  lines.forEach((line, index) => {
    const trimmed = line.trim().replace(/\s*\{$/, "");
    if (trimmed === BREAKPOINT_LINE) return;
    const match = line.match(SIZE_LITERAL);
    if (match) report("b", rel, index + 1, `size literal ${match[0]} (use a token)`);
  });
}

// ----- rules c and d --------------------------------------------------------

function isPackage(specifier, name) {
  return specifier === name || specifier.startsWith(`${name}/`);
}

function checkImports(rel, text) {
  const inUiFolder = UI_FOLDERS.some((folder) => rel.startsWith(folder));
  for (const match of text.matchAll(IMPORT_SPECIFIER)) {
    const specifier = match[1];
    const line = lineOf(text, match.index);
    const banned = BANNED_PACKAGES.find((name) => isPackage(specifier, name));
    if (banned) report("c", rel, line, `import of "${specifier}"`);
    if (!inUiFolder) continue;
    if (isPackage(specifier, "axios")) {
      report("d", rel, line, `import of "${specifier}" (API calls live in services/)`);
    } else if (/(?:^|\/)services(?:\/|$)/.test(specifier)) {
      report("d", rel, line, `import of "${specifier}" (read atoms and call actions instead)`);
    }
  }
}

// ----- rule e ---------------------------------------------------------------

function checkConfigValues(rel, rawLines, configValues) {
  rawLines.forEach((line, index) => {
    for (const { name, value } of configValues) {
      if (line.includes(value)) report("e", rel, index + 1, `the value of ${name} (import it from config/app)`);
    }
  });
}

// ----- rule f ---------------------------------------------------------------

// Returns the text of the opening tag that starts at `start`, up to its ">".
// Text inside {...} and inside strings is replaced by spaces, so only real
// attribute names are left.
function openingTagAttributes(text, start) {
  let depth = 0;
  let quote = null;
  let out = "";
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\") i += 1;
      else if (ch === quote) quote = null;
      out += ch === "\n" ? "\n" : " ";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      out += " ";
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    else if (ch === ">" && depth === 0) return out;
    out += depth === 0 || ch === "\n" ? ch : " ";
  }
  return out;
}

function checkClickableBoxes(rel, text) {
  for (const match of text.matchAll(CLICKABLE_TAG)) {
    const attributes = openingTagAttributes(text, match.index + match[0].length);
    const handler = attributes.search(/(?<![\w-])onClick(?![\w-])/);
    if (handler === -1) continue;
    const line = lineOf(text, match.index + match[0].length + handler);
    report("f", rel, line, `onClick on a <${match[1]}> (use a real <button> or <a>)`);
  }
}

// ----- rules g and h --------------------------------------------------------

function checkUnsafeHtml(rel, lines) {
  lines.forEach((line, index) => {
    if (line.includes("dangerouslySetInnerHTML")) report("g", rel, index + 1, "dangerouslySetInnerHTML");
  });
}

function checkBannedStyles(rel, lines) {
  lines.forEach((line, index) => {
    for (const { pattern, what } of BANNED_STYLE) {
      if (pattern.test(line)) report("h", rel, index + 1, what);
    }
  });
}

// ----- run ------------------------------------------------------------------

function main() {
  let files;
  try {
    files = walk(SRC_DIR);
  } catch {
    console.error(`frontend-style-check: cannot read ${SRC_DIR}`);
    process.exit(1);
  }

  const config = readConfigValues();
  if (config.error) {
    console.error(`frontend-style-check: ${config.error}. Rule e cannot run, so the check fails.`);
    process.exit(1);
  }

  let checked = 0;
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    checked += 1;

    const rel = path.relative(SRC_DIR, file).split(path.sep).join("/");
    const raw = readFileSync(file, "utf8");
    const isCss = ext === ".css";
    const isScript = SCRIPT_EXTENSIONS.has(ext);
    const text = isCss ? stripCssComments(raw) : isScript ? stripScriptComments(raw) : raw;
    const lines = text.split("\n");

    if (rel !== TOKENS_FILE) {
      checkColorLiterals(rel, lines);
      if (isCss) checkCssNamedColors(rel, lines);
      if (isScript) checkScriptNamedColors(rel, lines);
    }
    if (rel.endsWith(".module.css") || rel === BASE_FILE) checkSizeLiterals(rel, lines);
    if (isCss || isScript) checkImports(rel, text);
    if (rel !== APP_CONFIG_FILE) checkConfigValues(rel, raw.split("\n"), config.values);
    if (ext === ".tsx" || ext === ".jsx") checkClickableBoxes(rel, text);
    if (isScript) checkUnsafeHtml(rel, lines);
    if (isCss) checkBannedStyles(rel, lines);
  }

  if (checked === 0) {
    console.error("frontend-style-check: found no file to check under frontend/src, so the check fails.");
    process.exit(1);
  }

  findings.sort(
    (x, y) => x.file.localeCompare(y.file) || x.line - y.line || x.rule.localeCompare(y.rule),
  );
  for (const { rule, file, line, detail } of findings) {
    console.log(`FAIL [${rule}] frontend/src/${file}:${line}  ${detail}`);
  }
  if (findings.length > 0) console.log("");

  console.log(`frontend-style-check: ${checked} files checked`);
  for (const [rule, title] of Object.entries(RULES)) {
    console.log(`  ${rule}  ${String(counts[rule]).padStart(3)}  ${title}`);
  }
  console.log(findings.length === 0 ? "PASS: no findings" : `FAIL: ${findings.length} finding(s)`);
  process.exit(findings.length === 0 ? 0 : 1);
}

main();
