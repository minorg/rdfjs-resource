import type { NamedNode } from "@rdfjs/types";
import { Identifier } from "./Identifier.js";
import type { Resource } from "./Resource.js";
import { ValueError } from "./ValueError.js";

export class MissingValueError extends ValueError {
  constructor({
    focusResource,
    predicate,
  }: {
    focusResource: Resource;
    predicate: NamedNode;
  }) {
    super({
      focusResource,
      message: `${Identifier.toString(focusResource.identifier)} missing ${predicate.value}`,
      predicate,
    });
  }
}
