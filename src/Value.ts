import type {
  BlankNode,
  DataFactory,
  Literal,
  NamedNode,
  Quad_Graph,
  Variable,
} from "@rdfjs/types";

import { Either, Left } from "purify-ts";

import type { Identifier } from "./Identifier.js";
import { LiteralDecoder } from "./LiteralDecoder.js";
import { MistypedPrimitiveValueError } from "./MistypedPrimitiveValueError.js";
import { MistypedTermValueError } from "./MistypedTermValueError.js";
import type { Primitive } from "./Primitive.js";
import type { PropertyPath } from "./PropertyPath.js";
import { Resource } from "./Resource.js";
import type { Term } from "./Term.js";
import { Values } from "./Values.js";

export abstract class Value<T> {
  protected readonly dataFactory: DataFactory;

  readonly focusResource: Resource;
  readonly propertyPath: PropertyPath;
  readonly value: T;

  constructor({
    dataFactory,
    focusResource,
    propertyPath,
    value,
  }: {
    dataFactory: DataFactory;
    focusResource: Resource;
    propertyPath: PropertyPath;
    value: T;
  }) {
    this.dataFactory = dataFactory;
    this.focusResource = focusResource;
    this.propertyPath = propertyPath;
    this.value = value;
  }

  /**
   * Try to convert this value to a bigint.
   */
  toBigIntValue(): Either<Error, Value<bigint>> {
    return this.toBigInt().map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to a blank node.
   */
  toBlankNodeValue(): Either<Error, Value<BlankNode>> {
    return this.toBlankNode().map((value) => this.newTermValue(value));
  }

  static fromTerm<TermT extends Term>(parameters: {
    dataFactory: DataFactory;
    focusResource: Resource;
    propertyPath: PropertyPath;
    value: TermT;
  }) {
    return new TermValue(parameters);
  }

  /**
   * Try to convert this value to a boolean.
   */
  toBooleanValue(): Either<Error, Value<boolean>> {
    return this.toBoolean().map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to a date-time.
   */
  toDateTimeValue(): Either<Error, Value<Date>> {
    return this.toDateTime().map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to a date.
   */
  toDateValue(): Either<Error, Value<Date>> {
    return this.toDate().map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to a float.
   */
  toFloatValue(): Either<Error, Value<number>> {
    return this.toFloat().map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to an identifier (blank node or IRI).
   */
  toIdentifierValue(): Either<Error, Value<Identifier>> {
    return this.toIdentifier().map((value) => this.newTermValue(value));
  }

  /**
   * Try to convert this value to an int.
   */
  toIntValue(): Either<Error, Value<number>> {
    return this.toInt().map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to an IRI / NamedNode.
   */
  toIriValue(): Either<Error, Value<NamedNode>> {
    return this.toIri().map((value) => this.newTermValue(value));
  }

  /**
   * Try to convert this value to an RDF list.
   */
  toList(options?: {
    graph?: Exclude<Quad_Graph, Variable>;
  }): Either<Error, Values<Term>> {
    return this.toResource().chain((resource) =>
      resource.toList({ graph: options?.graph }),
    );
  }

  /**
   * Try to convert this value to a Literal.
   */
  toLiteralValue(): Either<Error, Value<Literal>> {
    return this.toLiteral().map((value) => this.newTermValue(value));
  }

  /**
   * Try to convert this value to a named resource.
   */
  toNamedResourceValue(): Either<Error, Value<Resource<NamedNode>>> {
    return this.toNamedResource().map((value) => this.newResourceValue(value));
  }

  /**
   * Try to convert this value to a number.
   */
  toNumberValue(): Either<Error, Value<number>> {
    return this.toNumber().map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to a JavaScript primitive (boolean | Date | number | string).
   */
  toPrimitiveValue(): Either<Error, Value<Primitive>> {
    return this.toPrimitive().map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to a resource (identified by a blank node or IRI).
   */
  toResourceValue(): Either<Error, Value<Resource>> {
    return this.toResource().map((value) => this.newResourceValue(value));
  }

  /**
   * Try to convert this value to a string.
   */
  toStringValue(): Either<Error, Value<string>> {
    return this.toString().map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to a term.
   */
  toTermValue(): Either<Error, Value<Term>> {
    return this.toTerm().map((value) => this.newTermValue(value));
  }

  /**
   * Convert this value into a singleton sequence of values.
   */
  toValues(): Values<T> {
    return Values.fromValue({
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
      value: this,
    });
  }

  protected abstract toBigInt(): Either<Error, bigint>;

  protected abstract toBlankNode(): Either<Error, BlankNode>;

  protected abstract toBoolean(): Either<Error, boolean>;

  protected abstract toDate(): Either<Error, Date>;

  protected abstract toDateTime(): Either<Error, Date>;

  protected abstract toFloat(): Either<Error, number>;

  protected abstract toIdentifier(): Either<Error, Identifier>;

  protected abstract toInt(): Either<Error, number>;

  protected abstract toIri(): Either<Error, NamedNode>;

  protected abstract toLiteral(): Either<Error, Literal>;

  protected toNamedResource(): Either<Error, Resource<NamedNode>> {
    return this.toIri().map(
      (iri) =>
        new Resource<NamedNode>(this.focusResource.dataset, iri, {
          dataFactory: this.dataFactory,
        }),
    );
  }

  protected abstract toNumber(): Either<Error, number>;

  protected abstract toPrimitive(): Either<Error, Primitive>;

  protected toResource(): Either<Error, Resource> {
    return this.toIdentifier().map(
      (value) =>
        new Resource(this.focusResource.dataset, value, {
          dataFactory: this.dataFactory,
        }),
    );
  }

  protected abstract toString(): Either<Error, string>;

  protected abstract toTerm(): Either<Error, Term>;

  private newPrimitiveValue<PrimitiveT extends Primitive>(
    value: PrimitiveT,
  ): Value<PrimitiveT> {
    return new PrimitiveValue({
      dataFactory: this.dataFactory,
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
      value,
    });
  }

  private newResourceValue<ResourceT extends Resource>(
    value: ResourceT,
  ): Value<ResourceT> {
    return new ResourceValue<ResourceT>({
      dataFactory: this.dataFactory,
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
      value,
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
}

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

class TermValue<TermT extends Term = Term> extends Value<TermT> {
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
