'use strict';

const Builders = require('@discordjs/builders');
const wishlistDatabase = require('../wishlist-database');

module.exports = {
    data: new Builders.SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a character or series to your wishlist')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The category to be added')
                .setRequired(true)
                .setChoices([
                    ['Character', 'gid'],
                    ['Series', 'sid'],
                ]),
        )
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('The id of the character/series')
                .setRequired(true),
        )
        .addStringOption(option =>
            option.setName('card_numbers')
                .setDescription('The card numbers to look for. Only type the numbers (no spaces).'
                    + ' All numbers are added by default.')
                .setRequired(false),
        )
        .setDefaultPermission(true),
    async execute(interaction) {
        const data = interaction.options.data;
        const [category, id] = data;
        const cardNumbers = data.length === 2 ? '123456789' : data[2].value;
        wishlistDatabase.add(interaction.member.id, category.value, id.value, cardNumbers);
        let ret = 'Added ';
        if (category.value === 'gid') {
            ret += `GID ${id.value} - Card Numbers: ${cardNumbers}`;
        } else {
            ret += `SID ${id.value}`;
        }
        await interaction.reply({ content: ret, ephemeral: true });
    },
};
