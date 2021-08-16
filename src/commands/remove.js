const WishlistData = require('../WishlistData');

module.exports = {
    name: 'remove',
    description: 'Remove a character or series from your wishlist',
    async execute(interaction) {
        const data = interaction.options.data;
        const [category, id] = data;
        const cardNumbers = data.length === 2 ? '123456789' : data[2].value;
        WishlistData.remove(interaction.member.id, category.value, id.value, cardNumbers);
        let ret = 'Removed ';
        if (category.value === 'gid') {
            ret += `GID ${id.value} - Card Numbers: ${cardNumbers}`;
        } else {
            ret += `SID ${id.value}`;
        }
        await interaction.reply({ content: ret, ephemeral: true });
    },
};