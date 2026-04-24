import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'lodash';

export class UpperSnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  tableName(className: string, customName: string): string {
    return customName || snakeCase(className).toUpperCase();
  }

  columnName(propertyName: string, customName: string): string {
    return customName || snakeCase(propertyName).toUpperCase();
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName).toUpperCase();
  }

  joinColumnName(
    relationName: string,
    referencedColumnName: string,
  ): string {
    return `${snakeCase(relationName).toUpperCase()}_${referencedColumnName}`;
  }
}
