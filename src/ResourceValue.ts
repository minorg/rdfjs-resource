import type { BlankNode, Literal, NamedNode } from "@rdfjs/types";

import { Either, Left } from "purify-ts";

import type { Identifier } from "./Identifier.js";
import { MistypedTermValueError } from "./MistypedTermValueError.js";
import type { Primitive } from "./Primitive.js";
import type { Resource } from "./Resource.js";
import type { Term } from "./Term.js";
import { Value } from "./Value.js";

export class ResourceValue<
  ResourceT extends Resource,
> extends Value<ResourceT> {
  protected newMistypedTermValueError(
    expectedValueType: string,
  ): MistypedTermValueError {
    return new MistypedTermValueError({
      actualValue: this.value.identifier,
      expectedValueType,
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
    });
  }

  protected override toBigInt(): Either<Error, bigint> {
    return Left(this.newMistypedTermValueError("bigint"));
  }

  protected override toBlankNode(): Either<Error, BlankNode> {
    return this.value.identifier.termType === "BlankNode"
      ? Either.of(this.value.identifier)
      : Left(this.newMistypedTermValueError("BlankNode"));
  }

  protected override toBoolean(): Either<Error, boolean> {
    return Left(this.newMistypedTermValueError("boolean"));
  }

  protected override toDate(): Either<Error, Date> {
    return Left(this.newMistypedTermValueError("Date"));
  }

  protected override toDateTime(): Either<Error, Date> {
    return Left(this.newMistypedTermValueError("DateTime"));
  }

  protected override toFloat(): Either<Error, number> {
    return Left(this.newMistypedTermValueError("float"));
  }

  protected override toIdentifier(): Either<Error, Identifier> {
    return Either.of(this.value.identifier);
  }

  protected override toInt(): Either<Error, number> {
    return Left(this.newMistypedTermValueError("int"));
  }

  protected override toIri(): Either<Error, NamedNode> {
    throw new Error("Method not implemented.");
  }

  protected override toLiteral(): Either<Error, Literal> {
    return Left(this.newMistypedTermValueError("Literal"));
  }

  protected override toNumber(): Either<Error, number> {
    return Left(this.newMistypedTermValueError("number"));
  }

  protected override toPrimitive(): Either<Error, Primitive> {
    return Left(this.newMistypedTermValueError("Primitive"));
  }

  protected override toString(): Either<Error, string> {
    return Left(this.newMistypedTermValueError("string"));
  }

  protected override toTerm(): Either<Error, Term> {
    return Either.of(this.value.identifier);
  }
}
