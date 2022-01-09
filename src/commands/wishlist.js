'use strict';

const Discord = require('discord.js');
const Builders = require('@discordjs/builders');
const Laifu = require('laifu-util');
const wishlistDatabase = require('../wishlist-database');
const laifuDatabase = require('../laifu-database');

const LIMIT_PER_PAGE = 20;

/**
 * @param {IterableIterator<any>} it
 * @param {number} page
 * @param {Function} formatData
 * @returns {string}
 */
const forEachValidEntry = (it, page, formatData) => {
    let res = '';
    const upperBound = LIMIT_PER_PAGE * page - 1;
    const lowerBound = LIMIT_PER_PAGE * (page - 1);
    let index = 0;
    let cur = it.next();
    while (index <= upperBound && !cur.done) {
        if (index >= lowerBound) res += formatData(cur.value);
        index++;
        cur = it.next();
    }
    return res;
};

/**
 * @param {wishlistDatabase.DatabaseValue} queryResult
 * @param {string} category
 * @param {number} page
 * @returns {string}
 */
const generateDescription = (queryResult, category, page) => {
    let it, formatData;
    if (category === 'gid') {
        it = queryResult.gids.entries();
        /**
         * @param {Object} obj
         * @param {number} obj.gid
         * @param {string} obj.ids
         * @returns {string}
         */
        formatData = obj => {
            const [gid, ids] = obj;
            const result = laifuDatabase.queryCharacter({ gid: gid });
            let value;
            if (result.length > 0) {
                value = `${gid} | ${Laifu.Util.cleanCharacterName(result[0].name)}`;
            } else {
                value = `${gid} |`;
            }
            return `${value} - ${[...ids].join('')}\n`;
        };
    } else {
        it = queryResult.sids.values();
        /**
         * @param {number} sid
         * @returns {string}
         */
        formatData = sid => {
            const result = laifuDatabase.querySeries({ sid: sid });
            let value;
            if (result.length > 0) {
                value = `${sid} | ${result[0].eng}`;
            } else {
                value = sid;
            }
            return `${value}\n`;
        };
    }

    const res = forEachValidEntry(it, page, formatData).trim();
    return res;
};

/**
 * @param {wishlistDatabase.DatabaseValue} queryResult
 * @param {string} category
 * @param {string} userId
 * @param {number} page
 * @returns {Discord.EmbedFooterData}
 */
const generateFooter = (queryResult, category, userId, page) => {
    const categoryData = category === 'gid' ? queryResult.gids : queryResult.sids;
    const pages = Math.max(1, Math.ceil(categoryData.size / LIMIT_PER_PAGE));
    return { text: `Page ${page}/${pages} - Total ${categoryData.size} | ${category} - ${userId}` };
};

/**
 * @param {wishlistDatabase.DatabaseValue} queryResult
 * @param {string} category
 * @returns {Discord.MessageSelectOptionData[]}
 */
const generatePageOptions = (queryResult, category) => {
    const arr = [];
    const categoryData = category === 'gid' ? queryResult.gids : queryResult.sids;
    const pages = Math.max(1, Math.ceil(categoryData.size / LIMIT_PER_PAGE));
    for (let i = 1; i <= pages; i++) {
        arr.push({ label: `Page ${i}`, description: ' ', value: `${i}` });
    }
    return arr;
};

/**
 * @param {Discord.Client} client
 * @param {string} category
 * @param {string} userId
 * @param {number} page
 * @returns {Promise<Discord.MessageOptions>}
 */
const query = async (client, category, userId, page) => {
    const queryResult = wishlistDatabase.query(userId);
    if (queryResult === null) {
        return { content: `No user was found with the id: ${userId}` };
    }
    const user = await client.users.fetch(userId);

    const embed = new Discord.MessageEmbed()
        .setAuthor({
            name: `${user.username}'s wishlist: ${category === 'gid' ? 'Characters' : 'Series'}`,
            iconURL: user.avatarURL(),
        })
        .setDescription(generateDescription(queryResult, category, page))
        .setFooter(generateFooter(queryResult, category, userId, page))
        .setColor('RANDOM');

    const row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageSelectMenu()
                .setCustomId('wishlist')
                .setPlaceholder(`Page ${page}`)
                .addOptions(generatePageOptions(queryResult)),
        );

    return { embeds: [embed], components: [row] };
};

module.exports = {
    data: new Builders.SlashCommandBuilder()
        .setName('wishlist')
        .setDescription('Shows a user\'s wishlist')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The category to display')
                .setRequired(true)
                .addChoices([
                    ['Characters', 'gid'],
                    ['Series', 'sid'],
                ]),
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription(`See a user's wishlist. Defaults to your own wishlist.`)
                .setRequired(false),
        )
        .setDefaultPermission(true),
    /**
     * @param {Discord.CommandInteraction} interaction
     */
    async execute(interaction) {
        const data = interaction.options.data;
        const [category] = data;
        const userId = data.length === 1 ? interaction.member.id : data[1].user.id;
        const res = await query(interaction.client, category.value, userId, 1);
        await interaction.reply(res);
    },
    /**
     * @param {Discord.SelectMenuInteraction} interaction
     */
    async update(interaction) {
        const [embed] = interaction.message.embeds;
        const parts = embed.footer.text.split('|');
        const [category, userId] = parts[1].split('-').map(str => str.trim());
        const page = parseInt(interaction.values[0]);
        const res = await query(interaction.client, category, userId, page);
        await interaction.update(res);
    },
};
