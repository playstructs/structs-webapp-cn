// The Chinese overlay's runtime, loaded ahead of structs-webapp's entry.
//
// Most of webapp's text is in its own source, which zh/strings/ translates at
// build time. Game data is not: struct classes, weapon names and the like come
// from the guild API in English, and some of it (structType.type) is also
// what webapp's code compares against. Such text is translated where it is
// shown, by overlay entries that call these helpers, never where it is read.
//
// __zh.guild is the guild this page plays through (guild.js), and
// __zh.recovery moves a recovered player of another guild into it (recovery.js).
// __zh.account creates the account at sign-up without showing its recovery
// key, and offers Download Player in place of Log Out (account.js).
import terms from './terms.json';
import {guild} from './guild.js';
import {recovery} from './recovery.js';
import {account} from './account.js';

const lookup = new Map(Object.entries(terms));
const reported = new Set();

globalThis.__zh = Object.freeze({

  guild,

  recovery,

  account,

  /**
   * @param {*} text English game data
   * @return {*} its Chinese, or the value as it was
   */
  t(text) {
    if (typeof text !== 'string') {
      return text;
    }
    const chinese = lookup.get(text);
    // A guild's wording that terms.json lacks is shown in English, and said once.
    if (chinese === undefined && /[A-Za-z]{2}/.test(text) && !reported.has(text)) {
      reported.add(text);
      console.warn(`[zh] no Chinese for game data ${JSON.stringify(text)}: add it to zh/runtime/terms.json`);
    }
    return chinese ?? text;
  },

  /**
   * Replaces the named text fields of a display-only copy in place.
   *
   * @param {object} obj
   * @param {string[]} names
   * @return {object} obj
   */
  fields(obj, names) {
    for (const name of names) {
      obj[name] = this.t(obj[name]);
    }
    return obj;
  },
});
