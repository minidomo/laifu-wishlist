'use strict';

const fs = require('fs');
const jsonpack = require('jsonpack');
const config = require('../config.json');

/**
 * @typedef {Object} Series
 * @property {string} eng
 * @property {string} jp
 * @property {number} sid
 */

/**
 * @typedef {Object} Character
 * @property {number} gid
 * @property {string} name
 * @property {Series} series
 */

/**
 * @typedef {Object} DatabaseSeries
 * @property {string} eng
 * @property {string} jp
 * @property {number} sid
 * @property {Map<number, Character>} characters
 */

/**
 * @typedef {Object} Database
 * @property {Map<number, Character>} characters
 * @property {Map<number, DatabaseSeries>} series
 */

/**
 * @typedef {Object} QueryOptions
 * @property {number=} gid
 * @property {string[]=} nameKeywords
 * @property {string[]=} seriesKeywords
 * @property {number=} sid
 */

/**
 * @typedef {Object} CharacterQueryOptions
 * @property {number=} gid
 * @property {string[]=} nameKeywords
 */

/**
 * @typedef {Object} SeriesQueryOptions
 * @property {string[]=} seriesKeywords
 * @property {number=} sid
 */

/**
 * @param {Character} character
 * @returns {boolean}
 */
const assertValidCharacter = character => {
    const validGid = typeof character.gid === 'number';
    const validName = typeof character.name === 'string';
    const validSeriesEng = typeof character.series?.eng === 'string';
    const validSeriesJp = typeof character.series?.jp === 'string';
    const validSeriesSid = typeof character.series?.sid === 'number';
    return validGid && validName && validSeriesEng && validSeriesJp && validSeriesSid;
};

/**
 * @returns {Database}
 */
const load = () => {
    const obj = {
        characters: new Map(),
        series: new Map(),
    };

    const loc = config.database.laifu.path;
    if (fs.existsSync(loc)) {
        const raw = fs.readFileSync(loc, { encoding: 'utf-8' });
        /**
         * @type {Character[]}
         */
        const arr = jsonpack.unpack(raw);
        arr.forEach(character => {
            obj.characters.set(character.gid, character);
            if (!obj.series.has(character.series.sid)) {
                obj.series.set(character.series.sid, {
                    eng: character.series.eng,
                    jp: character.series.jp,
                    sid: character.series.sid,
                    characters: new Map(),
                });
            }
            obj.series.get(character.series.sid).characters.set(character.gid, character);
        });
        console.log('Loaded characters file');
    } else {
        console.log('Could not load file');
    }

    return obj;
};

let database = load();

module.exports = {
    load() {
        database = load();
    },
    /**
     * @param {Character} character
     */
    add(character) {
        if (!assertValidCharacter(character)) {
            console.log(character);
            return;
        }
        this.remove(character);
        const copy = {
            gid: character.gid,
            name: character.name.trim(),
            series: {
                eng: character.series.eng.trim(),
                jp: character.series.jp.trim(),
                sid: character.series.sid,
            },
        };
        database.characters.set(copy.gid, copy);
        if (!database.series.has(copy.series.sid)) {
            database.series.set(copy.series.sid, {
                eng: copy.series.eng,
                jp: copy.series.jp,
                sid: copy.series.sid,
                characters: new Map(),
            });
        }
        database.series.get(character.series.sid).characters.set(character, character.gid);
    },
    /**
     * @param {Character} character
     */
    remove(character) {
        if (!assertValidCharacter(character)) {
            console.log(character);
            return;
        }
        const copy = {
            gid: character.gid,
            name: character.name.trim(),
            series: {
                eng: character.series.eng.trim(),
                jp: character.series.jp.trim(),
                sid: character.series.sid,
            },
        };
        if (database.characters.has(copy.gid)) database.characters.delete(copy.gid);
        if (database.series.has(copy.series.sid)) {
            const series = database.series.get(copy.series.sid);
            if (series.characters.has(copy.gid)) series.characters.delete(copy.gid);
        }
    },
    /**
     * @param {QueryOptions} queryOptions
     * @returns {Character[]|DatabaseSeries[]}
     */
    query(queryOptions) {
        if (queryOptions.gid) {
            return database.characters.has(queryOptions.gid) ? [database.characters.get(queryOptions.gid)] : [];
        }
        if (queryOptions.nameKeywords) {
            const arr = [];
            database.characters.forEach(character => {
                const parts = character.name.split(/\s+/);
                if (queryOptions.nameKeywords.every(keyword => parts.includes(keyword))) arr.push(character);
            });
            return arr;
        }
        if (queryOptions.seriesKeywords) {
            const arr = [];
            database.series.forEach(series => {
                const engParts = series.eng.split(/\s+/);
                const jpParts = series.jp.split(/\s+/);
                if (queryOptions.seriesKeywords.every(keyword => engParts.includes(keyword))) arr.push(series);
                if (queryOptions.seriesKeywords.every(keyword => jpParts.includes(keyword))) arr.push(series);
            });
            return arr;
        }
        if (queryOptions.sid) {
            return database.series.has(queryOptions.sid) ? [database.series.get(queryOptions.sid)] : [];
        }
        return [];
    },
    /**
     * @param {CharacterQueryOptions} characterQueryOptions
     * @returns {Character[]}
     */
    queryCharacter(characterQueryOptions) {
        return this.query(characterQueryOptions);
    },
    /**
     * @param {SeriesQueryOptions} seriesQueryOptions
     * @returns {DatabaseSeries[]}
     */
    querySeries(seriesQueryOptions) {
        return this.query(seriesQueryOptions);
    },
    /**
     * @returns {number}
     */
    characterCount() {
        return database.characters.size;
    },
    /**
     * @returns {number}
     */
    seriesCount() {
        return database.series.size;
    },
    /**
     * @returns {Character[]}
     */
    characters() {
        const ret = [];
        const it = database.characters.values();
        for (let cur = it.next(); !cur.done; cur = it.next()) {
            const deepClone = JSON.parse(JSON.stringify(cur.value));
            ret.push(deepClone);
        }
        return ret;
    },
    /**
     * @returns {number[]}
     */
    gids() {
        const ret = [];
        const it = database.characters.keys();
        for (let cur = it.next(); !cur.done; cur = it.next()) {
            ret.push(cur.value);
        }
        return ret;
    },
};
