'use strict';

const Builders = require('@discordjs/builders');
const laifuDatabase = require('../laifu-database');

module.exports = {
    data: new Builders.SlashCommandBuilder()
        .setName('load')
        .setDescription('Reload Laifu database')
        .setDefaultPermission(false),
    async execute(interaction) {
        laifuDatabase.load();
        await interaction.reply({ content: `Reloaded Laifu database`, ephemeral: true });
    },
};
