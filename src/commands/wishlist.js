const Discord = require('discord.js');
const WishlistData = require('../WishlistData');
const LaifuData = require('../LaifuData');

/**
 * @param {Discord.Client} client
 * @param {string} category
 * @param {string} userId
 * @param {number} page
 * @returns {Promise<Discord.MessageOptions>}
 */
const query = async (client, category, userId, page) => {
    const queryResult = WishlistData.query(userId);
    if (queryResult === null) {
        return { content: `No user was found with the id: ${userId}` };
    }
    const user = await client.users.fetch(userId);
    const LIMIT_PER_PAGE = 20;
    const embed = new Discord.MessageEmbed()
        .setAuthor(`${user.username}'s wishlist: ${category === 'gid' ? 'Characters' : 'Series'}`, user.avatarURL())
        .setDescription((() => {
            let res = '';
            const upperBound = LIMIT_PER_PAGE * page - 1;
            const lowerBound = LIMIT_PER_PAGE * (page - 1);
            let index = 0;
            if (category === 'gid') {
                const it = queryResult.gids.entries();
                while (index <= upperBound) {
                    const obj = it.next();
                    if (obj.done) break;
                    if (index >= lowerBound) {
                        const [gid, ids] = obj.value;
                        const result = LaifuData.queryCharacter({ gid: gid });
                        let value;
                        if (result.length > 0) {
                            value = `${result[0].gid} | ${result[0].name}`;
                        } else {
                            value = gid;
                        }
                        res += `${value} - ${[...ids].join('')}\n`;
                    }
                    index++;
                }
            } else {
                const it = queryResult.sids.values();
                while (index <= upperBound) {
                    const obj = it.next();
                    if (obj.done) break;
                    if (index >= lowerBound) {
                        const sid = obj.value;
                        const result = LaifuData.querySeries({ sid: sid });
                        let value;
                        if (result.length > 0) {
                            value = `${result[0].sid} | ${result[0].eng}`;
                        } else {
                            value = sid;
                        }
                        res += `${value}\n`;
                    }
                    index++;
                }
            }
            return res.trim();
        })())
        .setFooter((() => {
            const categoryData = category === 'gid' ? queryResult.gids : queryResult.sids;
            const pages = Math.max(1, Math.ceil(categoryData.size / LIMIT_PER_PAGE));
            return `Page ${page}/${pages} - Total ${categoryData.size} | ${category} - ${userId}`;
        })());
    const row = new Discord.MessageActionRow()
        .addComponents(
            new Discord.MessageSelectMenu()
                .setCustomId('wishlist')
                .setPlaceholder(`Page ${page}`)
                .addOptions(
                    (() => {
                        const arr = [];
                        const categoryData = category === 'gid' ? queryResult.gids : queryResult.sids;
                        const pages = Math.max(1, Math.ceil(categoryData.size / LIMIT_PER_PAGE));
                        for (let i = 1; i <= pages; i++) arr.push({ label: `Page ${i}`, description: ' ', value: `${i}` });
                        return arr;
                    })()),
        );
    return { embeds: [embed], components: [row] };
};

module.exports = {
    name: 'wishlist',
    description: 'Shows a user\'s wishlist',
    /**
     * @param {Discord.CommandInteraction} interaction
     */
    async execute(interaction) {
        const data = interaction.options.data;
        const [category] = data;
        const userId = data.length === 1 ? interaction.member.id : data[1].value;
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