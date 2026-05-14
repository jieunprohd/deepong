import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@shared/redis/redis.module';

@Injectable()
export class RoomSequenceGenerator {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async next(roomId: number): Promise<number> {
    return this.redis.incr(`room:seq:${roomId}`);
  }
}
