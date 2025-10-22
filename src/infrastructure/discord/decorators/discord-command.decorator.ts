import { SetMetadata } from '@nestjs/common';

export const COMMAND_METADATA = 'discord:command';

export interface CommandMetadata {
  name: string;
  description: string;
  aliases?: string[];
  permissions?: string[];
  cooldown?: number; // em segundos
  category?: 'search' | 'chat' | 'utility' | 'admin';
  adminOnly?: boolean;
  guildOnly?: boolean;
}

export const DiscordCommand = (metadata: CommandMetadata) =>
  SetMetadata(COMMAND_METADATA, metadata);

export const getCommandMetadata = (target: any): CommandMetadata | undefined => {
  return Reflect.getMetadata(COMMAND_METADATA, target);
};

export const isDiscordCommand = (target: any): boolean => {
  return Reflect.hasMetadata(COMMAND_METADATA, target);
};
