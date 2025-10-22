import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, GatewayIntentBits, Message } from 'discord.js';
import { SearchCommand } from './commands/search.command';
import { ChatCommand } from './commands/chat.command';
import { VerifyCommand } from './commands/verify.command';
import { HelpCommand } from './commands/help.command';
import { ICommand } from 'src/shared/interfaces/command.interface';

@Injectable()
export class DiscordService implements OnModuleInit {
  private readonly logger = new Logger(DiscordService.name);
  private readonly client: Client;
  private readonly prefix: string;
  private readonly commands: Map<string, ICommand>;

  constructor(
    private readonly configService: ConfigService,
    private readonly searchCommand: SearchCommand,
    private readonly chatCommand: ChatCommand,
    private readonly verifyCommand: VerifyCommand,
    private readonly helpCommand: HelpCommand,
  ) {
    this.prefix = this.configService.get<string>('BOT_PREFIX', '!');
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    // Tipagem correta usando ICommand
    this.commands = new Map<string, ICommand>([
      ['search', this.searchCommand],
      ['buscar', this.searchCommand],
      ['s', this.searchCommand],
      ['chat', this.chatCommand],
      ['conversar', this.chatCommand],
      ['c', this.chatCommand],
      ['verify', this.verifyCommand],
      ['verificar', this.verifyCommand],
      ['check', this.verifyCommand],
      ['v', this.verifyCommand],
      ['help', this.helpCommand],
      ['ajuda', this.helpCommand],
      ['h', this.helpCommand],
      ['?', this.helpCommand],
    ]);

    this.setupEventHandlers();
  }

  async onModuleInit() {
    const token = this.configService.get<string>('DISCORD_TOKEN');
    await this.client.login(token);
  }

  private setupEventHandlers() {
    this.client.once('ready', () => {
      this.logger.log(` Bot logado como ${this.client.user?.tag}`);
      this.client.user?.setPresence({
        activities: [{ name: `${this.prefix}help para comandos` }],
      });
    });

    this.client.on('messageCreate', async (message: Message) => {
      await this.handleMessage(message);
    });
  }

  private async handleMessage(message: Message) {
    // Ignora bots e mensagens sem prefixo
    if (message.author.bot || !message.content.startsWith(this.prefix)) {
      return;
    }

    const args = message.content
      .slice(this.prefix.length)
      .trim()
      .split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = this.commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args);
    } catch (error) {
      this.logger.error(`Erro no comando ${commandName}:`, error);
      await message.reply(' Ocorreu um erro ao executar o comando.');
    }
  }
}
