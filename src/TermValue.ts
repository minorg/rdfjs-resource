import type { BlankNode, Literal, NamedNode } from "@rdfjs/types";
import { Either, Left } from "purify-ts";
import { AbstractTermValue } from "./AbstractTermValue.js";
import type { Identifier } from "./Identifier.js";
import { LiteralDecoder } from "./LiteralDecoder.js";
import type { MistypedTermValueError } from "./MistypedTermValueError.js";
import type { Primitive } from "./Primitive.js";
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
   * Try to convert the term to a bigint.
   */
  toBigInt(): Either<MistypedTermValueError, bigint> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeBigIntLiteral)
      .mapLeft(() => this.newMistypedValueError("bigint"));
  }

  /**
   * Try to convert the term to a boolean.
   */
  toBoolean(): Either<MistypedTermValueError, boolean> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeBooleanLiteral)
      .mapLeft(() => this.newMistypedValueError("boolean"));
  }

  /**
   * Try to convert the term to a date.
   */
  toDate(): Either<MistypedTermValueError, Date> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeDateLiteral)
      .mapLeft(() => this.newMistypedValueError("date"));
  }

  /**
   * Try to convert the term to a date-time.
   */
  toDateTime(): Either<MistypedTermValueError, Date> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeDateTimeLiteral)
      .mapLeft(() => this.newMistypedValueError("date-time"));
  }

  /**
   * Try to convert the term to a float.
   */
  toFloat(): Either<MistypedTermValueError, number> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeFloatLiteral)
      .mapLeft(() => this.newMistypedValueError("float"));
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
   * Try to convert the term to an int.
   */
  toInt(): Either<MistypedTermValueError, number> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeIntLiteral)
      .mapLeft(() => this.newMistypedValueError("int"));
  }

  /**
   * Try to convert the term to an RDF list.
   */
  toList(): Either<ValueError, readonly TermValue[]> {
    return this.toResource().chain((resource) => resource.toList());
  }

  /**
   * Try to convert the term to a Literal.
   */
  toLiteral(): Either<MistypedTermValueError, Literal> {
    return this.term.termType === "Literal"
      ? Either.of(this.term)
      : Left(this.newMistypedValueError("Literal"));
  }

  /**
   * Try to convert the term to a number.
   */
  toNumber(): Either<MistypedTermValueError, number> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeNumberLiteral)
      .mapLeft(() => this.newMistypedValueError("number"));
  }

  /**
   * Try to convert the term to a JavaScript primitive (boolean | Date | number | string).
   */
  toPrimitive(): Either<MistypedTermValueError, Primitive> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodePrimitiveLiteral)
      .mapLeft(() => this.newMistypedValueError("primitive"));
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
    return this.toLiteral()
      .chain(LiteralDecoder.decodeStringLiteral)
      .mapLeft(() => this.newMistypedValueError("string"));
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
