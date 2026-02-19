import { Values } from "./Values.js";

/**
 * Private implementation of Resource.Values that iterates over an array.
 */
class ArrayValues<ValueT> extends Values<ValueT> {
  private readonly values: readonly ValueT[];

  constructor({
    values,
    ...superParameters
  }: {
    focusResource: Resource;
    predicate: NamedNode;
    values: readonly ValueT[];
  }) {
    super(superParameters);
    this.values = values;
  }

  override get length(): number {
    return this.values.length;
  }

  override [Symbol.iterator](): Iterator<ValueT> {
    return this.values[Symbol.iterator]();
  }

  override toArray(): readonly ValueT[] {
    return this.values;
  }
}
