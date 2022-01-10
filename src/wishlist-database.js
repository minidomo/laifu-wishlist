'use strict';

const fs = require('fs');
const jsonpack = require('jsonpack');
const config = require('../config.json');

const dataPath = process.env.CURRENT_BRANCH === 'dev' ?
    config.dev.database.wishlist.path : config.prod.database.wishlist.path;

/**
 * @typedef {Object} DatabaseValue
 * @property {Map<number,Set<number>>} gids
 * @property {Set<number>} sids
 */

/**
 * @returns {Map<string,DatabaseValue}
 */
const load = () => {
    let data;
    if (fs.existsSync(dataPath)) {
        const raw = fs.readFileSync(dataPath, { encoding: 'utf-8' });
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
        const directoryPath = dataPath.substring(0, dataPath.lastIndexOf('/'));
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }
        fs.writeFileSync(dataPath, packed, { encoding: 'utf-8' });
        console.log('Overwrote wishlist data');
    },
    /**
     * @param {Object} data
     * @param {string} data.userId
     */
    make(data) {
        database.set(data.userId, {
            gids: new Map(),
            sids: new Set(),
        });
    },
    /**
     * @param {Object} data
     * @param {string} data.userId
     * @param {string} data.category
     * @param {number} data.id
     * @param {string=} data.cardNumbers
     */
    add(data) {
        if (!database.has(data.userId)) this.make({ userId: data.userId });
        const { gids, sids } = database.get(data.userId);
        if (data.category === 'gid') {
            if (!gids.has(data.id)) gids.set(data.id, new Set());
            const cardNums = gids.get(data.id);
            if (data.cardNumbers) {
                for (const c of data.cardNumbers) cardNums.add(parseInt(c));
            } else {
                for (let i = 1; i < 10; i++) cardNums.add(i);
            }
        } else {
            sids.add(data.id);
        }
    },
    /**
     * @param {Object} data
     * @param {string} data.userId
     * @param {string} data.category
     * @param {number} data.id
     * @param {string=} data.cardNumbers
     */
    remove(data) {
        if (!database.has(data.userId)) this.make({ userId: data.userId });
        const { gids, sids } = database.get(data.userId);
        if (data.category === 'gid') {
            if (gids.has(data.id)) {
                const cardNums = gids.get(data.id);
                if (data.cardNumbers) {
                    for (const c of data.cardNumbers) cardNums.delete(parseInt(c));
                } else {
                    cardNums.clear();
                }
                if (cardNums.size === 0) gids.delete(data.id);
            }
        } else {
            sids.delete(data.id);
        }
    },
    /**
     * @param {Object} data
     * @param {string} data.userId
     * @returns {?DatabaseValue}
     */
    query(data) {
        return database.has(data.userId) ? database.get(data.userId) : null;
    },
    /**
     * @param {Object} data
     * @param {number} data.gid
     * @param {number} data.sid
     * @param {number} data.cardNumber
     * @returns {string[]}
     */
    search(data) {
        const users = [];
        database.forEach((dataValue, userId) => {
            if (dataValue.sids.has(data.sid)) {
                users.push(userId);
            } else if (dataValue.gids.has(data.gid) && dataValue.gids.get(data.gid).has(data.cardNumber)) {
                users.push(userId);
            }
        });
        return users;
    },
};
