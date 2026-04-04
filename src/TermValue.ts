import type { BlankNode, Literal, NamedNode } from "@rdfjs/types";

import { Either, Left } from "purify-ts";

import type { Identifier } from "./Identifier.js";
import { LiteralDecoder } from "./LiteralDecoder.js";
import { MistypedTermValueError } from "./MistypedTermValueError.js";
import type { Primitive } from "./Primitive.js";
import type { Term } from "./Term.js";
import { Value } from "./Value.js";

export class TermValue<TermT extends Term = Term> extends Value<TermT> {
  private get term(): TermT {
    return this.value;
  }

  protected newMistypedTermValueError(
    expectedValueType: string,
  ): MistypedTermValueError {
    return new MistypedTermValueError({
      actualValue: this.term,
      expectedValueType,
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
    });
  }

  protected override toBigInt(): Either<Error, bigint> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeBigIntLiteral)
      .mapLeft(() => this.newMistypedTermValueError("bigint"));
  }

  protected override toBlankNode(): Either<Error, BlankNode> {
    return this.term.termType === "BlankNode"
      ? Either.of(this.term as BlankNode)
      : Left(this.newMistypedTermValueError("BlankNode"));
  }

  protected override toBoolean(): Either<Error, boolean> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeBooleanLiteral)
      .mapLeft(() => this.newMistypedTermValueError("boolean"));
  }

  protected override toDate(): Either<Error, Date> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeDateLiteral)
      .mapLeft(() => this.newMistypedTermValueError("date"));
  }

  protected override toDateTime(): Either<Error, Date> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeDateTimeLiteral)
      .mapLeft(() => this.newMistypedTermValueError("date-time"));
  }

  protected override toFloat(): Either<Error, number> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeFloatLiteral)
      .mapLeft(() => this.newMistypedTermValueError("float"));
  }

  protected override toIdentifier(): Either<Error, Identifier> {
    switch (this.term.termType) {
      case "BlankNode":
      case "NamedNode":
        return Either.of(this.term as Identifier);
      default:
        return Left(this.newMistypedTermValueError("BlankNode|NamedNode"));
    }
  }

  protected override toInt(): Either<Error, number> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeIntLiteral)
      .mapLeft(() => this.newMistypedTermValueError("int"));
  }

  protected override toIri(): Either<Error, NamedNode> {
    return this.term.termType === "NamedNode"
      ? Either.of(this.term as NamedNode)
      : Left(this.newMistypedTermValueError("IRI"));
  }

  protected override toLiteral(): Either<Error, Literal> {
    return this.term.termType === "Literal"
      ? Either.of(this.term satisfies Literal)
      : Left(this.newMistypedTermValueError("Literal"));
  }

  protected override toNumber(): Either<Error, number> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeNumberLiteral)
      .mapLeft(() => this.newMistypedTermValueError("number"));
  }

  protected override toPrimitive(): Either<Error, Primitive> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodePrimitiveLiteral)
      .mapLeft(() => this.newMistypedTermValueError("primitive"));
  }

  protected override toString(): Either<Error, string> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeStringLiteral)
      .mapLeft(() => this.newMistypedTermValueError("string"));
  }

  protected override toTerm(): Either<Error, Term> {
    return Either.of(this.value);
  }
}
