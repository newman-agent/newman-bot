import { Message } from 'discord.js';

export interface ICommand {
  execute(message: Message, args: string[]): Promise<void>;
}
