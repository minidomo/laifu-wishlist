'use strict';

const Builders = require('@discordjs/builders');

module.exports = {
    data: new Builders.SlashCommandBuilder()
        .setName('test')
        .setDescription('Test command')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Do something with a user')
                .setRequired(true),
        )
        .setDefaultPermission(false),
    async execute(interaction) {
        const data = interaction.options.data;
        /**
         * @type {Discord.GuildMember}
         */
        const userObj = data[0];
        await interaction.reply({ content: `their user id is ${userObj.user.id}`, ephemeral: true });
    },
};
