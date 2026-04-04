import type { BlankNode, DataFactory, Literal, NamedNode } from "@rdfjs/types";

import { Either, Left } from "purify-ts";

import type { Identifier } from "./Identifier.js";
import { LiteralDecoder } from "./LiteralDecoder.js";
import { MistypedTermValueError } from "./MistypedTermValueError.js";
import type { Primitive } from "./Primitive.js";
import { Resource } from "./Resource.js";
import type { Term } from "./Term.js";
import { Value } from "./Value.js";

/**
 * Wraps a term (blank node or IRI or literal) with some methods for converting it to other types.
 */
export class TermValue<TermT extends Term = Term> extends Value<TermT> {
  private readonly dataFactory: DataFactory;

  constructor({
    dataFactory,
    ...superParameters
  }: { dataFactory: DataFactory } & ConstructorParameters<
    typeof Value<TermT>
  >[0]) {
    super(superParameters);
    this.dataFactory = dataFactory;
  }

  private get term(): TermT {
    return this.value;
  }

  override toBigIntValue(): Either<Error, Value<bigint>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeBigIntLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedTermValueError("bigint"));
  }

  override toBlankNodeValue(): Either<Error, Value<BlankNode>> {
    return this.term.termType === "BlankNode"
      ? Either.of(this.newTermValue(this.term as BlankNode))
      : Left(this.newMistypedTermValueError("BlankNode"));
  }

  override toBooleanValue(): Either<Error, Value<boolean>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeBooleanLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedTermValueError("boolean"));
  }

  override toDateTimeValue(): Either<Error, Value<Date>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeDateTimeLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedTermValueError("date-time"));
  }

  override toDateValue(): Either<Error, Value<Date>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeDateLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedTermValueError("date"));
  }

  override toFloatValue(): Either<Error, Value<number>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeFloatLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedTermValueError("float"));
  }

  override toIdentifierValue(): Either<Error, Value<Identifier>> {
    return this.toIdentifier().map((value) => this.newTermValue(value));
  }

  override toIntValue(): Either<Error, Value<number>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeIntLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedTermValueError("int"));
  }

  override toIriValue(): Either<Error, Value<NamedNode>> {
    return this.toIri().map((value) => this.newTermValue(value));
  }

  override toLiteralValue(): Either<Error, Value<Literal>> {
    return this.toLiteral().map((value) => this.newTermValue(value));
  }

  override toNamedResourceValue(): Either<Error, Value<Resource<NamedNode>>> {
    return this.toIri().map((iri) =>
      this.newValue(
        new Resource<NamedNode>(this.focusResource.dataset, iri, {
          dataFactory: this.dataFactory,
        }),
      ),
    );
  }

  override toNumberValue(): Either<Error, Value<number>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeNumberLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedTermValueError("number"));
  }

  override toPrimitiveValue(): Either<Error, Value<Primitive>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodePrimitiveLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedTermValueError("primitive"));
  }

  override toResourceValue(): Either<Error, Value<Resource>> {
    return this.toResource().map((value) => this.newValue(value));
  }

  override toStringValue(): Either<Error, Value<string>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeStringLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedTermValueError("string"));
  }

  private newMistypedTermValueError(
    expectedValueType: string,
  ): MistypedTermValueError {
    return new MistypedTermValueError({
      actualValue: this.term,
      expectedValueType,
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
    });
  }

  private newTermValue<TermT extends Term>(value: TermT): Value<TermT> {
    return new TermValue<TermT>({
      dataFactory: this.dataFactory,
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
      value,
    });
  }

  private newValue<T>(value: T): Value<T> {
    return new Value({
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
      value,
    });
  }

  private toIdentifier(): Either<Error, Identifier> {
    switch (this.term.termType) {
      case "BlankNode":
      case "NamedNode":
        return Either.of(this.term as Identifier);
      default:
        return Left(this.newMistypedTermValueError("BlankNode|NamedNode"));
    }
  }

  private toIri(): Either<Error, NamedNode> {
    return this.term.termType === "NamedNode"
      ? Either.of(this.term as NamedNode)
      : Left(this.newMistypedTermValueError("IRI"));
  }

  private toLiteral(): Either<Error, Literal> {
    return this.term.termType === "Literal"
      ? Either.of(this.term satisfies Literal)
      : Left(this.newMistypedTermValueError("Literal"));
  }

  private toResource(): Either<Error, Resource> {
    return this.toIdentifier().map(
      (identifier) =>
        new Resource(this.focusResource.dataset, identifier, {
          dataFactory: this.dataFactory,
        }),
    );
  }
}
