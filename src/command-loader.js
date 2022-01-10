'use strict';

const Discord = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

/**
 * @type {import('discord.js').Client}
 */
let _client;

module.exports = {
    /**
     * @param {Object} [data={}]
     * @param {import('discord.js').Client} data.client
     */
    init(data = {}) {
        if (!data.client) throw new Error('Client must be given to load commands');
        _client = data.client;
    },
    async load() {
        _client.commands = new Discord.Collection();
        const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            _client.commands.set(command.data.name, command);
        }

        const permissions = [
            {
                id: process.env.OWNER_USER_ID,
                type: 'USER',
                permission: true,
            },
        ];
        const guildIds = process.env.CURRENT_BRANCH === 'dev' ? config.dev.guilds : config.prod.guilds;
        const partialGuilds = await _client.guilds.fetch();
        partialGuilds
            .filter((pGuild, guildId) => guildIds.includes(guildId))
            .forEach(async pGuild => {
                const guild = await pGuild.fetch();
                const commands = await guild.commands.fetch();
                commands.forEach(command => command.permissions.set({ permissions }));
            });
    },
};
