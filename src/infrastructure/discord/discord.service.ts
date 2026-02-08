import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, GatewayIntentBits, Message } from 'discord.js';
import { SearchCommand } from './commands/search.command';
import { ChatCommand } from './commands/chat.command';
import { VerifyCommand } from './commands/verify.command';
import { HelpCommand } from './commands/help.command';
import { AnalyzeCommand } from './commands/analyze.command';
import { ICommand } from 'src/shared/interfaces/command.interface';
import { ConversationMemoryService } from './services/conversation-memory.service';

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
    private readonly analyzeCommand: AnalyzeCommand,
    private readonly memoryService: ConversationMemoryService,
  ) {
    this.prefix = this.configService.get<string>('BOT_PREFIX', '!');
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

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
      ['analyze', this.analyzeCommand],
      ['analisar', this.analyzeCommand],
      ['img', this.analyzeCommand],
      ['image', this.analyzeCommand],
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
      this.logger.log(`✅ Bot logado como ${this.client.user?.tag}`);
      this.client.user?.setPresence({
        activities: [{ name: `${this.prefix}help para comandos` }],
      });
    });

    this.client.on('messageCreate', async (message: Message) => {
      await this.handleMessage(message);
    });
  }

  private async handleMessage(message: Message) {
    // Ignora bots
    if (message.author.bot) return;

    const channelId = message.channel.id;
    const userId = message.author.id;
    const userName = message.author.username;

    // Se não tem prefixo, adiciona ao contexto do canal mas não processa
    if (!message.content.startsWith(this.prefix)) {
      // Adiciona mensagens sem prefixo ao contexto geral do canal
      this.memoryService.addChannelMessage(
        channelId,
        userId,
        userName,
        message.content,
      );
      return;
    }

    const args = message.content.slice(this.prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = this.commands.get(commandName);
    if (!command) return;

    try {
      // Comandos de chat e analyze usam memória
      if (
        commandName === 'chat' ||
        commandName === 'c' ||
        commandName === 'conversar' ||
        commandName === 'analyze' ||
        commandName === 'analisar' ||
        commandName === 'img' ||
        commandName === 'image'
      ) {
        await this.handleChatWithMemory(message, args, command);
      } else {
        // Outros comandos processam normalmente
        await command.execute(message, args);
      }
    } catch (error) {
      this.logger.error(`Erro no comando ${commandName}:`, error);
      await message.reply('❌ Ocorreu um erro ao executar o comando.');
    }
  }

  private async handleChatWithMemory(
    message: Message,
    args: string[],
    command: ICommand,
  ) {
    const userId = message.author.id;
    const userName = message.author.username;
    const channelId = message.channel.id;
    const userMessage = args.join(' ');

    // Adiciona mensagem do usuário à memória pessoal
    this.memoryService.addUserMessage(userId, userName, userMessage);

    // Adiciona ao contexto do canal
    this.memoryService.addChannelMessage(
      channelId,
      userId,
      userName,
      userMessage,
    );

    // Obtém memória do usuário
    const userMemory = this.memoryService.getUserMemory(userId);

    // Obtém contexto do canal
    const channelContext = this.memoryService.getChannelContext(channelId);

    // Cria mensagem wrapper que intercepta o reply
    const messageWrapper = {
      ...message,
      reply: async (content: any) => {
        const reply = await message.reply(content);

        // Salva resposta do bot na memória
        if (typeof content === 'string') {
          this.memoryService.addBotResponse(userId, content);
          this.memoryService.addChannelMessage(
            channelId,
            this.client.user!.id,
            this.client.user!.username,
            content,
          );
        }

        return reply;
      },
      // Passa contexto do canal junto
      channelContext,
    } as any;

    // Injeta memória no args para o comando acessar
    (messageWrapper as any).userMemory = userMemory;

    await command.execute(messageWrapper, args);
  }
}
