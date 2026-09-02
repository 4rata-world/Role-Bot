
const { Client, GatewayIntentBits, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// 設定：ボタンの名前、ロールID、ボタンの色（Primary, Success, Dangerなど）
const roleSettings = [
    { label: '赤のロールをGET', roleId: 'ここにロールID1を入れる', style: ButtonStyle.Primary },
    { label: '青のロールをGET', roleId: 'ここにロールID2を入れる', style: ButtonStyle.Success },
];

client.once('ready', async () => {
    console.log(`ログイン完了！ ${client.user.tag} として起動したよ！`);

    // スラッシュコマンド（/rolepanel）をDiscordに登録するよ
    const data = new SlashCommandBuilder()
        .setName('rolepanel')
        .setDescription('ロール付与用のボタンパネルを表示するよ');

    await client.application.commands.create(data);
});

client.on('interactionCreate', async interaction => {
    // スラッシュコマンドが実行されたとき
    if (interaction.isChatInputCommand() && interaction.commandName === 'rolepanel') {
        // 権限チェック（管理者だけがパネルを出せるようにする場合）
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'このコマンドは管理者しか使えないよ！', ephemeral: true });
        }

        // ボタンを作成
        const buttons = roleSettings.map(setting => 
            new ButtonBuilder()
                .setCustomId(`role_${setting.roleId}`)
                .setLabel(setting.label)
                .setStyle(setting.style)
        );

        const row = new ActionRowBuilder().addComponents(buttons);

        await interaction.reply({
            content: '下のボタンを押して、好きなロールを受け取ってね！',
            components: [row],
        });
    }

    // ボタンが押されたとき
    if (interaction.isButton()) {
        const customId = interaction.customId;
        if (!customId.startsWith('role_')) return;

        const roleId = customId.replace('role_', '');
        const member = interaction.member;
        const guild = interaction.guild;

        const role = guild.roles.cache.get(roleId);
        if (!role) {
            return interaction.reply({ content: 'ロールが見つからなかったよ……設定を確認してね。', ephemeral: true });
        }

        try {
            if (member.roles.cache.has(roleId)) {
                // すでに持っていたら外す
                await member.roles.remove(roleId);
                await interaction.reply({ content: `**${role.name}** を外したよ！`, ephemeral: true });
            } else {
                // 持っていなかったら付与する
                await member.roles.add(roleId);
                await interaction.reply({ content: `**${role.name}** を付与したよ！`, ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'ロールの変更に失敗しちゃった。ボットの権限（ロールの階層が上にあるか）を確認してね！', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
