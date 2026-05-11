import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AggregateRoot } from '@shared/types/aggregate-root.base';
import { Tone, ToneType } from './tone.vo';
import { MessageContent } from './content.vo';
import { MessageSentEvent } from './events/message-sent.event';
import { MessageEditedEvent } from './events/message-edited.event';
import { MessageDeletedEvent } from './events/message-deleted.event';

export type ContentType = 'TEXT' | 'IMAGE' | 'LINK' | 'MIXED';

@Entity('MESSAGE')
export class Message extends AggregateRoot {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'bigint', unsigned: true })
  roomId!: number;

  @Column({ type: 'bigint', unsigned: true })
  senderUserId!: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  seq!: number | null;

  @Column({ type: 'varchar', length: 64 })
  clientMessageId!: string;

  @Column({ type: 'enum', enum: ['CHAT', 'ASK', 'URGENT', 'SHARE'] })
  private _tone!: string;

  @Column({ type: 'enum', enum: ['TEXT', 'IMAGE', 'LINK', 'MIXED'], default: 'TEXT' })
  contentType!: ContentType;

  @Column({ type: 'text' })
  private _content!: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  replyToMsgId!: number | null;

  @Column({ type: 'int', unsigned: true, default: 1 })
  version!: number;

  @Column({ type: 'boolean', default: false })
  archived!: boolean;

  @Column({ type: 'datetime', nullable: true })
  editedAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  deletedAt!: Date | null;

  @Column({ type: 'datetime', precision: 3 })
  createdAt!: Date;

  static initialize(props: {
    roomId: number;
    senderUserId: number;
    clientMessageId: string;
    tone: Tone;
    contentType?: ContentType;
    content: MessageContent;
    replyToMsgId?: number | null;
  }): Message {
    const msg = new Message();
    msg.roomId = props.roomId;
    msg.senderUserId = props.senderUserId;
    msg.clientMessageId = props.clientMessageId;
    msg._tone = props.tone.value;
    msg.contentType = props.contentType ?? 'TEXT';
    msg._content = props.content.value;
    msg.replyToMsgId = props.replyToMsgId ?? null;
    msg.seq = null;
    msg.version = 1;
    msg.archived = false;
    msg.editedAt = null;
    msg.deletedAt = null;
    msg.createdAt = new Date();
    return msg;
  }

  get tone(): Tone { return Tone.from(this._tone as ToneType); }
  get content(): MessageContent { return MessageContent.of(this._content); }

  assignSequence(seq: number): void {
    if (this.seq !== null) throw new Error('Sequence already assigned');
    this.seq = seq;
    this.addDomainEvent(
      new MessageSentEvent(this.id, this.roomId, this.senderUserId, this._tone, seq, this._content, this.createdAt),
    );
  }

  edit(newContent: MessageContent, expectedVersion: number): void {
    if (this.deletedAt) throw new Error('Cannot edit deleted message');
    if (this.version !== expectedVersion) throw new Error('VERSION_CONFLICT');
    this._content = newContent.value;
    this.version += 1;
    this.editedAt = new Date();
    this.addDomainEvent(
      new MessageEditedEvent(this.id, this.roomId, this._content, this.version, this.editedAt),
    );
  }

  softDelete(): void {
    if (this.deletedAt) return;
    this.deletedAt = new Date();
    this.addDomainEvent(
      new MessageDeletedEvent(this.id, this.roomId, this.seq!, this.deletedAt),
    );
  }
}
