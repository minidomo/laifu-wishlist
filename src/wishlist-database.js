'use strict';

const fs = require('fs');
const jsonpack = require('jsonpack');
const config = require('../config.json');

/**
 * @typedef {Object} DatabaseValue
 * @property {Map<number,Set<number>>} gids
 * @property {Set<number>} sids
 */

/**
 * @returns {Map<string,DatabaseValue}
 */
const load = () => {
    const loc = config.database.wishlist.path;
    let data;
    if (fs.existsSync(loc)) {
        const raw = fs.readFileSync(loc, { encoding: 'utf-8' });
        data = jsonpack.unpack(raw);
    } else {
        console.log('Created wishlist data');
        return new Map();
    }

    const map = new Map();

    data.forEach(e => {
        const val = {
            gids: new Map(),
            sids: new Set(),
        };
        e.sids.forEach(sid => val.sids.add(sid));
        e.gids.forEach(gidObj => {
            val.gids.set(gidObj.gid, new Set(gidObj.ids));
        });
        map.set(e.userId, val);
    });

    console.log('Loaded wishlist data');

    return map;
};

const database = load();

module.exports = {
    export() {
        const arr = [];
        database.forEach((val, userId) => {
            const obj = {};
            obj.userId = userId;
            obj.sids = [...val.sids];
            obj.gids = [];
            val.gids.forEach((nums, gid1) => {
                obj.gids.push({
                    gid: gid1,
                    ids: [...nums],
                });
            });
            arr.push(obj);
        });
        const packed = jsonpack.pack(arr);
        const path = config.database.wishlist.path;
        const directoryPath = path.substring(0, path.lastIndexOf('/'));
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }
        fs.writeFileSync(path, packed, { encoding: 'utf-8' });
        console.log('Overwrote wishlist data');
    },
    /**
     * @param {string} userId
     */
    make(userId) {
        database.set(userId, {
            gids: new Map(),
            sids: new Set(),
        });
    },
    /**
     * @param {string} userId
     * @param {string} category
     * @param {number} id
     * @param {string} cardNumbers
     */
    add(userId, category, id, cardNumbers) {
        if (!database.has(userId)) this.make(userId);
        const { gids, sids } = database.get(userId);
        if (category === 'gid') {
            if (!gids.has(id)) gids.set(id, new Set());
            for (const c of cardNumbers) {
                if (c >= '0' && c <= '9') {
                    gids.get(id).add(parseInt(c));
                }
            }
        } else {
            sids.add(id);
        }
    },
    /**
     * @param {string} userId
     * @param {string} category
     * @param {number} id
     * @param {string} cardNumbers
     */
    remove(userId, category, id, cardNumbers) {
        if (!database.has(userId)) this.make(userId);
        const { gids, sids } = database.get(userId);
        if (category === 'gid') {
            if (gids.has(id)) {
                for (const c of cardNumbers) {
                    if (c >= '0' && c <= '9') {
                        gids.get(id).delete(parseInt(c));
                    }
                }
                if (gids.get(id).size === 0) gids.delete(id);
            }
        } else {
            sids.delete(id);
        }
    },
    /**
     * @param {string} userId
     * @returns {?DatabaseValue}
     */
    query(userId) {
        return database.has(userId) ? database.get(userId) : null;
    },
    /**
     * @param {number} gid
     * @param {number} sid
     * @param {number} cardNumber
     * @returns {string[]}
     */
    search(gid, sid, cardNumber) {
        const users = [];
        database.forEach((data, userId) => {
            if (data.sids.has(sid)) {
                users.push(userId);
            } else if (data.gids.has(gid) && data.gids.get(gid).has(cardNumber)) {
                users.push(userId);
            }
        });
        return users;
    },
};
