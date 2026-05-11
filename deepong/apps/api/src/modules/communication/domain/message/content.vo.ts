export class MessageContent {
  private constructor(readonly value: string) {}

  static of(value: string): MessageContent {
    if (!value || value.trim().length === 0) throw new Error('Content cannot be empty');
    if (value.length > 10000) throw new Error('Content too long');
    return new MessageContent(value);
  }

  equals(other: MessageContent): boolean { return this.value === other.value; }
}
