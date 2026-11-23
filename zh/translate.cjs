// Applies the Simplified Chinese overlay to one structs-webapp source file.
//
// Nothing upstream is edited. Each upstream file that needs Chinese has a twin
// under zh/strings/ (js/foo/Bar.js -> zh/strings/js/foo/Bar.js.json) mapping
// exact source text to its replacement. zh/patches.cjs holds the few changes
// that are not text (endpoints). Both are applied to the source as webpack
// reads it, so a newer structs-webapp builds with the same overlay; any entry
// whose text upstream no longer contains is reported as stale.
const fs = require('node:fs');
const path = require('node:path');

const UPSTREAM_SRC = path.resolve(__dirname, '../structs-webapp/src');
const STRINGS_DIR = path.join(__dirname, 'strings');
const identity = require('./identity.json');
const IDENTITY = {GUILD: identity.name, TAG: identity.tag, MOTTO: identity.motto, BADGE: identity.badge};
for (const value of Object.values(IDENTITY)) {
  // It lands inside webapp's string literals and markup.
  if (/['"`<>\\$&]/.test(value)) throw new Error(`zh: identity.json: ${value} can't be quoted`);
}

const PATCHES_FILE = path.join(__dirname, 'patches.cjs');

/** @param {string} file absolute path inside structs-webapp/src */
function upstreamPath(file) {
  return path.relative(UPSTREAM_SRC, file).split(path.sep).join('/');
}

/** @param {string} rel upstream path, e.g. js/index.js */
function stringsFile(rel) {
  return path.join(STRINGS_DIR, rel + '.json');
}

/**
 * The file's twin, as written: source text to replacement, plus an optional
 * "$keep" list of English left as is on purpose (read by zh/audit.cjs).
 *
 * @return {Object<string, string|string[]>}
 */
function readStringsFile(rel) {
  const file = stringsFile(rel);
  if (!fs.existsSync(file)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`zh: ${path.relative(process.cwd(), file)}: ${error.message}`);
  }
}

/**
 * The guild this site is, where webapp says SN Corp: @GUILD@, @TAG@, @MOTTO@
 * and @BADGE@ in a replacement stand for zh/identity.json's values.
 */
function withIdentity(text) {
  return text.replace(/@(GUILD|TAG|MOTTO|BADGE)@/g, (match, name) => IDENTITY[name]);
}

/** @return {Object<string, string>} the replacements alone */
function loadStrings(rel) {
  return Object.fromEntries(Object.entries(readStringsFile(rel))
    .filter(([key]) => key !== '$keep')
    .map(([key, text]) => [key, withIdentity(text)]));
}

/** @return {Array<[string, string]>} */
function loadPatches(rel) {
  delete require.cache[PATCHES_FILE];
  return require(PATCHES_FILE)[rel] ?? [];
}

/**
 * One pass over the source, longest text first, so a sentence is replaced
 * whole before any word in it. It has to be one pass: a second pass
 * could find a short key inside a replacement that was already made.
 *
 * @param {string} source
 * @param {Array<[string, string]>} pairs
 * @param {string[]} stale collects the source text that was not found
 */
function replaceAll(source, pairs, stale) {
  const live = pairs.filter(([from]) => source.includes(from) || !stale.push(from));
  if (live.length === 0) {
    return source;
  }
  const replacements = new Map(live);
  const alternatives = [...replacements.keys()]
    .sort((a, b) => b.length - a.length)
    .map(text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return source.replace(new RegExp(alternatives.join('|'), 'g'), text => replacements.get(text));
}

/**
 * @param {string} rel upstream path
 * @param {string} source upstream text
 * @return {{code: string, stale: string[], dependencies: string[]}}
 */
function translate(rel, source) {
  const stale = [];
  const patched = replaceAll(source, loadPatches(rel), stale);
  const code = replaceAll(patched, Object.entries(loadStrings(rel)), stale);
  return {code, stale, dependencies: [stringsFile(rel), PATCHES_FILE]};
}

module.exports = {UPSTREAM_SRC, STRINGS_DIR, upstreamPath, stringsFile, readStringsFile, loadStrings, translate};
