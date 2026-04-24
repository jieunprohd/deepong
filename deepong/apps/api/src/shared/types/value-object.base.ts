export abstract class ValueObject<T> {
  abstract equals(other: T): boolean;
}
