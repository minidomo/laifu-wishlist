// const Discord = require('discord.js');

module.exports = {
    /**
     * @param {Discord.MessageEmbed} embed
     * @returns {boolean}
     */
    isGacha(embed) {
        return embed.fields.some(e => e.name === 'Account');
    },
    /**
     * @param {Discord.MessageEmbed} embed
     * @returns {boolean}
     */
    isView(embed) {
        return embed.author && embed.author.name && embed.author.name.endsWith('is Viewing...');
    },
    /**
     * @param {Discord.MessageEmbed} embed
     * @returns {boolean}
     */
    isBurn(embed) {
        return embed.fields.some(e => e.name === 'Guide');
    },
    /**
     * @param {Discord.MessageEmbed} embed
     * @returns {number}
     */
    getCardNumber(embed) {
        const title = embed.title;
        const REGEX = /.*#(\d).+/;
        const [, num] = REGEX.exec(title);
        return parseInt(num);
    },
    /**
    * @param {Discord.MessageEmbed} embed
    * @returns {number}
    */
    getGID(embed) {
        const field = embed.fields.find(e => e.name === 'General Info');
        const REGEX = /.*\*\*GID:\*\* (\d+).*/;
        const [, gid] = REGEX.exec(field.value);
        return parseInt(gid);
    },
    /**
    * @param {Discord.MessageEmbed} embed
    * @returns {number}
    */
    getSID(embed) {
        const field = embed.fields.find(e => e.name === 'Main Series');
        const REGEX = /.*\*\*SID:\*\* (\d+).*/;
        const [, sid] = REGEX.exec(field.value);
        return parseInt(sid);
    },
};