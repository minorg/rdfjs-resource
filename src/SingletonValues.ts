import type { NamedNode } from "@rdfjs/types";
import type { Resource } from "./Resource.js";
import { Values } from "./Values.js";

/**
 * Implementation of Values that iterates over a single value.
 */
export class SingletonValues<ValueT> extends Values<ValueT> {
  override readonly length = 1;
  private readonly value: ValueT;

  constructor({
    value,
    ...superParameters
  }: { focusResource: Resource; value: ValueT; predicate: NamedNode }) {
    super(superParameters);
    this.value = value;
  }

  override *[Symbol.iterator](): Iterator<ValueT> {
    yield this.value;
  }

  override toArray(): readonly ValueT[] {
    return [this.value];
  }
}
