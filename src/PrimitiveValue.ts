import type { BlankNode, Literal, NamedNode } from "@rdfjs/types";

import { Either, Left } from "purify-ts";

import type { Identifier } from "./Identifier.js";
import { MistypedPrimitiveValueError } from "./MistypedPrimitiveValueError.js";
import type { Primitive } from "./Primitive.js";
import type { Term } from "./Term.js";
import { Value } from "./Value.js";

export class PrimitiveValue<
  PrimitiveT extends Primitive = Primitive,
> extends Value<PrimitiveT> {
  protected override toBigInt(): Either<Error, bigint> {
    return typeof this.value === "bigint"
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("bigint"));
  }

  protected override toBlankNode(): Either<Error, BlankNode> {
    return Left(this.newMistypedPrimitiveValueError("BlankNode"));
  }

  protected override toBoolean(): Either<Error, boolean> {
    return typeof this.value === "boolean"
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("boolean"));
  }

  protected override toDate(): Either<Error, Date> {
    return this.toDateTime();
  }

  protected override toDateTime(): Either<Error, Date> {
    return typeof this.value === "object" && this.value instanceof Date
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("Date"));
  }

  protected override toFloat(): Either<Error, number> {
    return typeof this.value === "number" &&
      Number.isFinite(this.value) &&
      !Number.isInteger(this.value)
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("float"));
  }

  protected override toIdentifier(): Either<Error, Identifier> {
    return Left(this.newMistypedPrimitiveValueError("Identifier"));
  }

  protected override toInt(): Either<Error, number> {
    return typeof this.value === "number" &&
      Number.isFinite(this.value) &&
      Number.isInteger(this.value)
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("float"));
  }

  protected override toIri(): Either<Error, NamedNode> {
    return Left(this.newMistypedPrimitiveValueError("Iri"));
  }

  protected override toLiteral(): Either<Error, Literal> {
    return Left(this.newMistypedPrimitiveValueError("Literal"));
  }

  protected override toNumber(): Either<Error, number> {
    return typeof this.value === "number"
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("number"));
  }

  protected override toPrimitive(): Either<Error, Primitive> {
    return Either.of(this.value);
  }

  protected override toString(): Either<Error, string> {
    return typeof this.value === "string"
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("string"));
  }

  protected override toTerm(): Either<Error, Term> {
    return Left(this.newMistypedPrimitiveValueError("Term"));
  }

  private newMistypedPrimitiveValueError(
    expectedValueType: string,
  ): MistypedPrimitiveValueError {
    return new MistypedPrimitiveValueError({
      actualValue: this.value,
      expectedValueType,
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
    });
  }
}
