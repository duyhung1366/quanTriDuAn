import { Client, User, Message } from "discord.js";

export default class DiscordService {
    private static client: Client;

    static async login(): Promise<void> {

        // try {
        DiscordService.client = new Client({
            intents: ["GuildMessages"],
        });
        await DiscordService.client.login(process.env.BOT_TOKEN);
        console.log('Logged in to Discord');
        // } catch (error) {
        // console.error('Error logging in to Discord', error);
        // throw error;
        // }
    }
    static async sendMessageToDiscord(messageContent: string, discordId: string): Promise<void> {
        const user: User = await DiscordService.client.users.fetch(discordId);
        try {
            const message: Message = await user.send(messageContent);
            console.log(`Message sent to Discord `);
        } catch (error) {
            // console.error('Error sending message to Discord', error);
            throw error;
        }
    }
}