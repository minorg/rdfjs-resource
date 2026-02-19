import type { NamedNode } from "@rdfjs/types";
import type { Resource } from "./Resource.js";

export abstract class ValueError extends Error {
  readonly focusResource: Resource;
  readonly predicate: NamedNode;

  constructor({
    focusResource,
    message,
    predicate,
  }: { focusResource: Resource; message: string; predicate: NamedNode }) {
    super(message);
    this.focusResource = focusResource;
    this.predicate = predicate;
  }
}
