import type { BlankNode, Literal, NamedNode } from "@rdfjs/types";
import { Either, Left } from "purify-ts";
import { fromRdf } from "rdf-literal";
import { AbstractTermValue } from "./AbstractTermValue.js";
import type { Identifier } from "./Identifier.js";
import { MistypedTermValueError } from "./MistypedTermValueError.js";
import { Resource } from "./Resource.js";
import type { ValueError } from "./ValueError.js";
import { Values } from "./Values.js";

/**
 * Wraps a term (blank node or IRI or literal) with some methods for converting it to other types.
 */
export class TermValue extends AbstractTermValue<
  BlankNode | Literal | NamedNode
> {
  /**
   * Try to convert the term to a boolean literal.
   */
  toBoolean(): Either<MistypedTermValueError, boolean> {
    return this.toPrimitive().chain((primitive) =>
      typeof primitive === "boolean"
        ? Either.of(primitive)
        : Left(this.newMistypedValueError("boolean")),
    );
  }

  /**
   * Try to convert the term to a date literal.
   */
  toDate(): Either<MistypedTermValueError, Date> {
    return this.toPrimitive().chain((primitive) =>
      primitive instanceof Date
        ? Either.of(primitive)
        : Left(this.newMistypedValueError("Date")),
    );
  }

  /**
   * Try to convert the term to an identifier (blank node or IRI).
   */
  toIdentifier(): Either<MistypedTermValueError, Identifier> {
    switch (this.term.termType) {
      case "BlankNode":
      case "NamedNode":
        return Either.of(this.term);
      default:
        return Left(this.newMistypedValueError("BlankNode|NamedNode"));
    }
  }

  /**
   * Try to convert the term to an RDF list.
   */
  toList(): Either<ValueError, readonly TermValue[]> {
    return this.toResource().chain((resource) => resource.toList());
  }

  /**
   * Try to convert the term to a literal.
   */
  toLiteral(): Either<MistypedTermValueError, Literal> {
    return this.term.termType === "Literal"
      ? Either.of(this.term)
      : Left(this.newMistypedValueError("Literal"));
  }

  /**
   * Try to convert the term to a number literal.
   */
  toNumber(): Either<MistypedTermValueError, number> {
    return this.toPrimitive().chain((primitive) =>
      typeof primitive === "number"
        ? Either.of(primitive)
        : Left(this.newMistypedValueError("number")),
    );
  }

  /**
   * Try to convert the term to a JavaScript primitive (boolean | Date | number | string).
   */
  toPrimitive(): Either<
    MistypedTermValueError,
    boolean | Date | number | string
  > {
    if (this.term.termType !== "Literal") {
      return Left(
        new MistypedTermValueError({
          actualValue: this.term,
          expectedValueType: "Literal",
          focusResource: this.focusResource,
          predicate: this.predicate,
        }),
      );
    }

    try {
      return Either.of(fromRdf(this.term, true));
    } catch {
      return Left(
        new MistypedTermValueError({
          actualValue: this.term,
          expectedValueType: "primitive",
          focusResource: this.focusResource,
          predicate: this.predicate,
        }),
      );
    }
  }

  /**
   * Try to convert the term to a resource (identified by a blank node or IRI).
   */
  toResource(): Either<MistypedTermValueError, Resource> {
    return this.toIdentifier().map(
      (identifier) => new Resource(this.focusResource.dataset, identifier),
    );
  }

  /**
   * Try to convert the term to a string literal.
   */
  override toString(): Either<MistypedTermValueError, string> {
    return this.toPrimitive().chain((primitive) =>
      typeof primitive === "string"
        ? Either.of(primitive as string)
        : Left(this.newMistypedValueError("string")),
    );
  }

  /**
   * Convert this value into a singleton sequence of values.
   */
  toValues(): Values<TermValue> {
    return Values.fromValue({
      focusResource: this.focusResource,
      predicate: this.predicate,
      value: this,
    });
  }
}
