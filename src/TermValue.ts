import type { BlankNode, Literal, NamedNode } from "@rdfjs/types";
import { Either, Left } from "purify-ts";
import { Resource } from "./Resource.js";

/**
 * Wraps a term (blank node or IRI or literal) with some methods for converting it to other types.
 */
export class TermValue extends AbstractTermValue<
  BlankNode | Literal | NamedNode
> {
  /**
   * Is the term a boolean literal?
   */
  isBoolean(): boolean {
    return this.toBoolean().isRight();
  }

  /**
   * Is the term a date literal?
   */
  isDate(): boolean {
    return this.toDate().isRight();
  }

  /**
   * Is the term an identifier (blank node or IRI)?
   */
  isIdentifier(): boolean {
    switch (this.term.termType) {
      case "BlankNode":
      case "NamedNode":
        return true;
      default:
        return false;
    }
  }

  /**
   * Is the term an RDF list?
   */
  isList(): boolean {
    return this.toList().isRight();
  }

  /**
   * Is the term a literal?
   */
  isLiteral(): boolean {
    return this.term.termType === "Literal";
  }

  /**
   * Is the term a number literal?
   */
  isNumber(): boolean {
    return this.toNumber().isRight();
  }

  /**
   * Is the term a JavaScript primitive literal (boolean | Date | number | string)?
   */
  isPrimitive(): boolean {
    return this.toPrimitive().isRight();
  }

  /**
   * Is the term a string literal?
   */
  isString(): boolean {
    return this.toString().isRight();
  }

  /**
   * Try to convert the term to a boolean literal.
   */
  toBoolean(): Either<Resource.MistypedTermValueError, boolean> {
    return this.toPrimitive().chain((primitive) =>
      typeof primitive === "boolean"
        ? Either.of(primitive)
        : Left(this.newMistypedValueError("boolean")),
    );
  }

  /**
   * Try to convert the term to a date literal.
   */
  toDate(): Either<Resource.MistypedTermValueError, Date> {
    return this.toPrimitive().chain((primitive) =>
      primitive instanceof Date
        ? Either.of(primitive)
        : Left(this.newMistypedValueError("Date")),
    );
  }

  /**
   * Try to convert the term to an identifier (blank node or IRI).
   */
  toIdentifier(): Either<Resource.MistypedTermValueError, Resource.Identifier> {
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
  toList(): Either<Resource.ValueError, readonly Resource.TermValue[]> {
    return this.toResource().chain((resource) => resource.toList());
  }

  /**
   * Try to convert the term to a literal.
   */
  toLiteral(): Either<Resource.MistypedTermValueError, Literal> {
    return this.term.termType === "Literal"
      ? Either.of(this.term)
      : Left(this.newMistypedValueError("Literal"));
  }

  /**
   * Try to convert the term to a number literal.
   */
  toNumber(): Either<Resource.MistypedTermValueError, number> {
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
    Resource.MistypedTermValueError,
    boolean | Date | number | string
  > {
    if (this.term.termType !== "Literal") {
      return Left(
        new Resource.MistypedTermValueError({
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
        new Resource.MistypedTermValueError({
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
  toResource(): Either<Resource.MistypedTermValueError, Resource> {
    return this.toIdentifier().map(
      (identifier) =>
        new Resource({ dataset: this.focusResource.dataset, identifier }),
    );
  }

  /**
   * Try to convert the term to a string literal.
   */
  override toString(): Either<Resource.MistypedTermValueError, string> {
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
