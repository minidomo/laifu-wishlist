'use strict';

const Builders = require('@discordjs/builders');
const laifuDatabase = require('../laifu-database');

module.exports = {
    data: new Builders.SlashCommandBuilder()
        .setName('load')
        .setDescription('Reload Laifu database')
        .setDefaultPermission(false),
    /**
     * @param {import('discord.js').CommandInteraction<import('discord.js').CacheType>} interaction
     */
    async execute(interaction) {
        laifuDatabase.load();
        await interaction.reply({ content: `Reloaded Laifu database`, ephemeral: true });
    },
};
