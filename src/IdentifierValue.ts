import { AbstractTermValue } from "./AbstractTermValue.js";
import type { Identifier } from "./Identifier.js";

/**
 * Wraps an identifier (blank node or IRI) with some methods for converting it to other types.
 */
export class IdentifierValue extends AbstractTermValue<Identifier> {
  toIdentifier(): Identifier {
    return this.term;
  }
}
