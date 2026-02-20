import { AbstractTermValue } from "./AbstractTermValue.js";
import type { Identifier } from "./Identifier.js";
import { Resource } from "./Resource.js";

/**
 * Wraps an identifier (blank node or IRI) with some methods for converting it to other types.
 */
export class IdentifierValue extends AbstractTermValue<Identifier> {
  toIdentifier(): Identifier {
    return this.term;
  }

  toResource(): Resource {
    return new Resource(this.focusResource.dataset, this.term);
  }
}
