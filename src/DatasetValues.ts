import type { NamedNode } from "@rdfjs/types";
import type { Resource } from "./Resource.js";
import { Values } from "./Values.js";

export abstract class DatasetValues<ValueT> extends Values<ValueT> {
  protected readonly unique: boolean;

  constructor({
    focusResource,
    predicate,
    unique,
  }: {
    focusResource: Resource;
    predicate: NamedNode;
    unique: boolean;
  }) {
    super({ focusResource, predicate });
    this.unique = unique;
  }

  override get length(): number {
    let length = 0;
    for (const _ of this) {
      length++;
    }
    return length;
  }

  override toArray(): readonly ValueT[] {
    return [...this];
  }
}
