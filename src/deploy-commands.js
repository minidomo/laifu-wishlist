'use strict';

require('./init').run();

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

const config = require('../config.json');

const commands = fs.readdirSync('./src/commands')
    .filter(file => file.endsWith('.js'))
    .map(filename => require(`./commands/${filename}`).data.toJSON());
const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);
const guildIds = process.env.BOT_TOKEN === process.env.DEV_TOKEN ? config.guilds.dev : config.guilds.prod;

for (const guildId of guildIds) {
    rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), { body: commands })
        .then(() => console.log(`Successfully registered application commands for ${guildId}.`))
        .catch(console.error);
}
