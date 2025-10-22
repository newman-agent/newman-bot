export class MessageEntity {
  constructor(
    public readonly reole: 'user' | 'assistant' | 'system',
    public readonly content: string,
  ) { }

  toJSON() {
    return {
      role: this.reole,
      content: this.content,
    };
  }
}
