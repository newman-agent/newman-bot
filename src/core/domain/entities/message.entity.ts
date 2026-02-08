export class MessageEntity {
  constructor(
    public readonly role: 'user' | 'assistant' | 'system',
    public readonly content: string,
  ) { }

  toJSON() {
    return {
      role: this.role,
      content: this.content,
    };
  }
}
