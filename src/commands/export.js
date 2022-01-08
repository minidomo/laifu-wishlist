'use strict';

const Builders = require('@discordjs/builders');
const wishlistDatabase = require('../wishlist-database');

module.exports = {
    data: new Builders.SlashCommandBuilder()
        .setName('export')
        .setDescription('Export wishlist data')
        .setDefaultPermission(false),
    async execute(interaction) {
        wishlistDatabase.export();
        await interaction.reply({ content: `Exported wishlist data`, ephemeral: true });
    },
};
