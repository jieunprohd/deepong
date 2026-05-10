import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class RelationshipAcl {
  constructor(private readonly dataSource: DataSource) {}

  async areFriends(userIdA: number, userIdB: number): Promise<boolean> {
    const rows = await this.dataSource.query(
      `SELECT id FROM FRIENDSHIP
       WHERE ((REQUESTER_USER_ID = ? AND ADDRESSEE_USER_ID = ?)
           OR (REQUESTER_USER_ID = ? AND ADDRESSEE_USER_ID = ?))
         AND STATUS = 'ACCEPTED'
       LIMIT 1`,
      [userIdA, userIdB, userIdB, userIdA],
    );
    return rows.length > 0;
  }
}
