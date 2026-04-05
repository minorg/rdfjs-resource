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
import { LiteralFactory } from "./LiteralFactory.js";
import { MistypedPrimitiveValueError } from "./MistypedPrimitiveValueError.js";
import { MistypedTermValueError } from "./MistypedTermValueError.js";
import type { Primitive } from "./Primitive.js";
import type { PropertyPath } from "./PropertyPath.js";
import { Resource } from "./Resource.js";
import type { Term } from "./Term.js";
import { Values } from "./Values.js";

export abstract class Value<T> {
  protected readonly dataFactory: DataFactory;
  protected readonly focusResource: Resource;
  protected readonly propertyPath: PropertyPath;
  protected readonly value: T;

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

  static fromTerm<TermT extends Term>(parameters: {
    dataFactory: DataFactory;
    focusResource: Resource;
    propertyPath: PropertyPath;
    value: TermT;
  }) {
    return new TermValue(parameters);
  }

  /**
   * Try to convert this value to a bigint.
   */
  toBigIntValue(): Either<Error, Value<bigint>>;
  toBigIntValue<T extends bigint>(in_: readonly T[]): Either<Error, Value<T>>;
  toBigIntValue<T extends bigint>(
    in_?: readonly T[],
  ): Either<Error, Value<T | bigint>> {
    return (in_ ? this.toBigInt<T>(in_) : this.toBigInt()).map((value) =>
      this.newPrimitiveValue(value),
    );
  }

  /**
   * Try to convert this value to a blank node.
   */
  toBlankNodeValue(): Either<Error, Value<BlankNode>> {
    return this.toBlankNode().map((value) => this.newTermValue(value));
  }

  /**
   * Try to convert this value to a boolean.
   */
  toBooleanValue(): Either<Error, Value<boolean>>;
  toBooleanValue<T extends boolean>(in_: readonly T[]): Either<Error, Value<T>>;
  toBooleanValue<T extends boolean>(
    in_?: readonly T[],
  ): Either<Error, Value<T | boolean>> {
    return (in_ ? this.toBoolean<T>(in_) : this.toBoolean()).map((value) =>
      this.newPrimitiveValue(value),
    );
  }

  /**
   * Try to convert this value to a date-time.
   */
  toDateTimeValue(in_?: readonly Date[]): Either<Error, Value<Date>> {
    return this.toDateTime(in_).map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to a date.
   */
  toDateValue(in_?: readonly Date[]): Either<Error, Value<Date>> {
    return this.toDate(in_).map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to a float.
   */
  toFloatValue(): Either<Error, Value<number>>;
  toFloatValue<T extends number>(in_: readonly T[]): Either<Error, Value<T>>;
  toFloatValue<T extends number>(
    in_?: readonly T[],
  ): Either<Error, Value<T | number>> {
    return this.toFloat(in_).map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to an identifier (blank node or IRI).
   */
  toIdentifierValue(): Either<Error, Value<Identifier>>;
  toIdentifierValue<T extends Identifier>(
    in_: readonly T[],
  ): Either<Error, Value<T>>;
  toIdentifierValue<T extends Identifier>(
    in_?: readonly T[],
  ): Either<Error, Value<T | Identifier>> {
    return this.toIdentifier(in_).map((value) => this.newTermValue(value));
  }

  /**
   * Try to convert this value to an int.
   */
  toIntValue(): Either<Error, Value<number>>;
  toIntValue<T extends number>(in_: readonly T[]): Either<Error, Value<T>>;
  toIntValue<T extends number>(
    in_?: readonly T[],
  ): Either<Error, Value<T | number>> {
    return this.toInt(in_).map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to an IRI / NamedNode.
   */
  toIriValue(): Either<Error, Value<NamedNode>>;
  toIriValue<T extends NamedNode>(in_: readonly T[]): Either<Error, Value<T>>;
  toIriValue<T extends NamedNode>(
    in_?: readonly T[],
  ): Either<Error, Value<T | NamedNode>> {
    return this.toIri(in_).map((value) => this.newTermValue(value));
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
  toLiteralValue(in_?: readonly Literal[]): Either<Error, Value<Literal>> {
    return this.toLiteral(in_).map((value) => this.newTermValue(value));
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
  toNumberValue(): Either<Error, Value<number>>;
  toNumberValue<T extends number>(in_: readonly T[]): Either<Error, Value<T>>;
  toNumberValue<T extends number>(
    in_?: readonly T[],
  ): Either<Error, Value<T | number>> {
    return this.toNumber(in_).map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to a JavaScript primitive (boolean | Date | number | string).
   */
  toPrimitiveValue(): Either<Error, Value<Primitive>>;
  toPrimitiveValue<T extends Primitive>(
    in_: readonly T[],
  ): Either<Error, Value<T>>;
  toPrimitiveValue<T extends Primitive>(
    in_?: readonly T[],
  ): Either<Error, Value<T | Primitive>> {
    return this.toPrimitive(in_).map((value) => this.newPrimitiveValue(value));
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
  toStringValue(): Either<Error, Value<string>>;
  toStringValue<T extends string>(in_: readonly T[]): Either<Error, Value<T>>;
  toStringValue<T extends string>(
    in_?: readonly T[],
  ): Either<Error, Value<T | string>> {
    return this.toString(in_).map((value) => this.newPrimitiveValue(value));
  }

  /**
   * Try to convert this value to a term.
   */
  toTermValue(): Either<Error, Value<Term>>;
  toTermValue<T extends Term>(in_: readonly T[]): Either<Error, Value<T>>;
  toTermValue<T extends Term>(
    in_?: readonly T[],
  ): Either<Error, Value<T | Term>> {
    return this.toTerm(in_).map((value) => this.newTermValue(value));
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

  unwrap(): T {
    return this.value;
  }

  protected constrainDate(
    value: Date,
    in_?: readonly Date[],
  ): Either<Error, Date> {
    if (in_ && !in_.some((check) => value.getTime() === check.getTime())) {
      return Left(
        new MistypedPrimitiveValueError({
          actualValue: value,
          expectedValueType: JSON.stringify(in_.map((_) => _.toString())),
          focusResource: this.focusResource,
          propertyPath: this.propertyPath,
        }),
      );
    }
    return Either.of<Error, Date>(value);
  }

  protected constrainPrimitive<
    ConstrainedT extends UnconstrainedT,
    UnconstrainedT extends Primitive,
  >(
    value: UnconstrainedT,
    in_?: readonly ConstrainedT[],
  ): Either<Error, ConstrainedT | UnconstrainedT> {
    if (in_ && !in_.some((check) => value === check)) {
      return Left(
        new MistypedPrimitiveValueError({
          actualValue: value,
          expectedValueType: JSON.stringify(in_.map((_) => _.toString())),
          focusResource: this.focusResource,
          propertyPath: this.propertyPath,
        }),
      );
    }
    return Either.of<Error, UnconstrainedT>(value as ConstrainedT);
  }

  protected constrainTerm<
    ConstrainedT extends UnconstrainedT,
    UnconstrainedT extends Term,
  >(
    value: UnconstrainedT,
    in_?: readonly ConstrainedT[],
  ): Either<Error, ConstrainedT | UnconstrainedT> {
    if (in_ && !in_.some((check) => value.equals(check))) {
      return Left(
        new MistypedTermValueError({
          actualValue: value,
          expectedValueType: JSON.stringify(in_.map((_) => _.termType)),
          focusResource: this.focusResource,
          propertyPath: this.propertyPath,
        }),
      );
    }
    return Either.of<Error, UnconstrainedT>(value as ConstrainedT);
  }

  protected toBigInt<T extends bigint>(
    in_?: readonly T[],
  ): Either<Error, T | bigint> {
    return this.toUnconstrainedBigInt().chain((value) =>
      this.constrainPrimitive(value, in_),
    );
  }

  protected abstract toBlankNode(): Either<Error, BlankNode>;

  protected toBoolean<T extends boolean>(
    in_?: readonly T[],
  ): Either<Error, T | boolean> {
    return this.toUnconstrainedBoolean().chain((value) =>
      this.constrainPrimitive(value, in_),
    );
  }

  protected toDate(in_?: readonly Date[]): Either<Error, Date> {
    return this.toUnconstrainedDate().chain((value) =>
      this.constrainDate(value, in_),
    );
  }

  protected toDateTime(in_?: readonly Date[]): Either<Error, Date> {
    return this.toUnconstrainedDateTime().chain((value) =>
      this.constrainDate(value, in_),
    );
  }

  protected toFloat<T extends number>(
    in_?: readonly T[],
  ): Either<Error, T | number> {
    return this.toUnconstrainedFloat().chain((value) =>
      this.constrainPrimitive(value, in_),
    );
  }

  protected toIdentifier<T extends Identifier>(
    in_?: readonly Identifier[],
  ): Either<Error, T | Identifier> {
    return this.toUnconstrainedIdentifier().chain((value) =>
      this.constrainTerm(value, in_),
    );
  }

  protected toInt<T extends number>(
    in_?: readonly T[],
  ): Either<Error, T | number> {
    return this.toUnconstrainedInt().chain((value) =>
      this.constrainPrimitive(value, in_),
    );
  }

  protected toIri<T extends NamedNode>(
    in_?: readonly NamedNode[],
  ): Either<Error, T | NamedNode> {
    return this.toUnconstrainedIri().chain((value) =>
      this.constrainTerm(value, in_),
    );
  }

  protected toLiteral(in_?: readonly Literal[]): Either<Error, Literal> {
    return this.toUnconstrainedLiteral().chain((value) =>
      this.constrainTerm(value, in_),
    );
  }

  protected toNamedResource(): Either<Error, Resource<NamedNode>> {
    return this.toUnconstrainedIri().map(
      (iri) =>
        new Resource<NamedNode>(this.focusResource.dataset, iri, {
          dataFactory: this.dataFactory,
        }),
    );
  }

  protected toNumber<T extends number>(
    in_?: readonly T[],
  ): Either<Error, T | number> {
    return this.toUnconstrainedNumber().chain((value) =>
      this.constrainPrimitive(value, in_),
    );
  }

  protected toPrimitive<T extends Primitive>(
    in_?: readonly T[],
  ): Either<Error, T | Primitive> {
    return this.toUnconstrainedPrimitive().chain((value) =>
      this.constrainPrimitive(value, in_),
    );
  }

  protected toResource(): Either<Error, Resource> {
    return this.toUnconstrainedIdentifier().map(
      (value) =>
        new Resource(this.focusResource.dataset, value, {
          dataFactory: this.dataFactory,
        }),
    );
  }

  protected toString<T extends string>(
    in_?: readonly T[],
  ): Either<Error, T | string> {
    return this.toUnconstrainedString().chain((value) =>
      this.constrainPrimitive(value, in_),
    );
  }

  protected toTerm<T extends Term>(
    in_?: readonly Term[],
  ): Either<Error, T | Term> {
    return this.constrainTerm(this.toUnconstrainedTerm(), in_);
  }

  protected abstract toUnconstrainedBigInt(): Either<Error, bigint>;

  protected abstract toUnconstrainedBoolean(): Either<Error, boolean>;

  protected abstract toUnconstrainedDate(): Either<Error, Date>;

  protected abstract toUnconstrainedDateTime(): Either<Error, Date>;

  protected abstract toUnconstrainedFloat(): Either<Error, number>;

  protected abstract toUnconstrainedIdentifier(): Either<Error, Identifier>;

  protected abstract toUnconstrainedInt(): Either<Error, number>;

  protected abstract toUnconstrainedIri(): Either<Error, NamedNode>;

  protected abstract toUnconstrainedLiteral(): Either<Error, Literal>;

  protected abstract toUnconstrainedNumber(): Either<Error, number>;

  protected abstract toUnconstrainedPrimitive(): Either<Error, Primitive>;

  protected abstract toUnconstrainedString(): Either<Error, string>;

  protected abstract toUnconstrainedTerm(): Term;

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
  protected override toUnconstrainedBigInt(): Either<Error, bigint> {
    return typeof this.value === "bigint"
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("bigint"));
  }

  protected override toBlankNode(): Either<Error, BlankNode> {
    return Left(this.newMistypedPrimitiveValueError("BlankNode"));
  }

  protected override toUnconstrainedBoolean(): Either<Error, boolean> {
    return typeof this.value === "boolean"
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("boolean"));
  }

  protected override toUnconstrainedDate(): Either<Error, Date> {
    return this.toUnconstrainedDateTime();
  }

  protected override toUnconstrainedDateTime(): Either<Error, Date> {
    return typeof this.value === "object" && this.value instanceof Date
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("Date"));
  }

  protected override toUnconstrainedFloat(): Either<Error, number> {
    return typeof this.value === "number" &&
      Number.isFinite(this.value) &&
      !Number.isInteger(this.value)
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("float"));
  }

  protected override toUnconstrainedIdentifier(): Either<Error, Identifier> {
    return Left(this.newMistypedPrimitiveValueError("Identifier"));
  }

  protected override toUnconstrainedInt(): Either<Error, number> {
    return typeof this.value === "number" &&
      Number.isFinite(this.value) &&
      Number.isInteger(this.value)
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("float"));
  }

  protected override toUnconstrainedIri(): Either<Error, NamedNode> {
    return Left(this.newMistypedPrimitiveValueError("Iri"));
  }

  protected override toUnconstrainedLiteral(): Either<Error, Literal> {
    return Either.of(this.literalFactory.primitive(this.value));
  }

  protected override toUnconstrainedNumber(): Either<Error, number> {
    return typeof this.value === "number"
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("number"));
  }

  protected override toUnconstrainedPrimitive(): Either<Error, Primitive> {
    return Either.of(this.value);
  }

  protected override toUnconstrainedString(): Either<Error, string> {
    return typeof this.value === "string"
      ? Either.of(this.value)
      : Left(this.newMistypedPrimitiveValueError("string"));
  }

  protected override toUnconstrainedTerm(): Term {
    return this.literalFactory.primitive(this.value);
  }

  private get literalFactory(): LiteralFactory {
    return new LiteralFactory({ dataFactory: this.dataFactory });
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

  protected override toUnconstrainedBigInt(): Either<Error, bigint> {
    return Left(this.newMistypedTermValueError("bigint"));
  }

  protected override toBlankNode(): Either<Error, BlankNode> {
    return this.value.identifier.termType === "BlankNode"
      ? Either.of(this.value.identifier)
      : Left(this.newMistypedTermValueError("BlankNode"));
  }

  protected override toUnconstrainedBoolean(): Either<Error, boolean> {
    return Left(this.newMistypedTermValueError("boolean"));
  }

  protected override toUnconstrainedDate(): Either<Error, Date> {
    return Left(this.newMistypedTermValueError("Date"));
  }

  protected override toUnconstrainedDateTime(): Either<Error, Date> {
    return Left(this.newMistypedTermValueError("DateTime"));
  }

  protected override toUnconstrainedFloat(): Either<Error, number> {
    return Left(this.newMistypedTermValueError("float"));
  }

  protected override toUnconstrainedIdentifier(): Either<Error, Identifier> {
    return Either.of(this.value.identifier);
  }

  protected override toUnconstrainedInt(): Either<Error, number> {
    return Left(this.newMistypedTermValueError("int"));
  }

  protected override toUnconstrainedIri(): Either<Error, NamedNode> {
    throw new Error("Method not implemented.");
  }

  protected override toUnconstrainedLiteral(): Either<Error, Literal> {
    return Left(this.newMistypedTermValueError("Literal"));
  }

  protected override toUnconstrainedNumber(): Either<Error, number> {
    return Left(this.newMistypedTermValueError("number"));
  }

  protected override toUnconstrainedPrimitive(): Either<Error, Primitive> {
    return Left(this.newMistypedTermValueError("Primitive"));
  }

  protected override toUnconstrainedString(): Either<Error, string> {
    return Left(this.newMistypedTermValueError("string"));
  }

  protected override toUnconstrainedTerm(): Term {
    return this.value.identifier;
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

  protected override toUnconstrainedBigInt(): Either<Error, bigint> {
    return this.toUnconstrainedLiteral()
      .chain(LiteralDecoder.decodeBigIntLiteral)
      .mapLeft(() => this.newMistypedTermValueError("bigint"));
  }

  protected override toBlankNode(): Either<Error, BlankNode> {
    return this.term.termType === "BlankNode"
      ? Either.of(this.term as BlankNode)
      : Left(this.newMistypedTermValueError("BlankNode"));
  }

  protected override toUnconstrainedBoolean(): Either<Error, boolean> {
    return this.toUnconstrainedLiteral()
      .chain(LiteralDecoder.decodeBooleanLiteral)
      .mapLeft(() => this.newMistypedTermValueError("boolean"));
  }

  protected override toUnconstrainedDate(): Either<Error, Date> {
    return this.toUnconstrainedLiteral()
      .chain(LiteralDecoder.decodeDateLiteral)
      .mapLeft(() => this.newMistypedTermValueError("date"));
  }

  protected override toUnconstrainedDateTime(): Either<Error, Date> {
    return this.toUnconstrainedLiteral()
      .chain(LiteralDecoder.decodeDateTimeLiteral)
      .mapLeft(() => this.newMistypedTermValueError("date-time"));
  }

  protected override toUnconstrainedFloat(): Either<Error, number> {
    return this.toUnconstrainedLiteral()
      .chain(LiteralDecoder.decodeFloatLiteral)
      .mapLeft(() => this.newMistypedTermValueError("float"));
  }

  protected override toUnconstrainedIdentifier(): Either<Error, Identifier> {
    switch (this.term.termType) {
      case "BlankNode":
      case "NamedNode":
        return Either.of(this.term as Identifier);
      default:
        return Left(this.newMistypedTermValueError("BlankNode|NamedNode"));
    }
  }

  protected override toUnconstrainedInt(): Either<Error, number> {
    return this.toUnconstrainedLiteral()
      .chain(LiteralDecoder.decodeIntLiteral)
      .mapLeft(() => this.newMistypedTermValueError("int"));
  }

  protected override toUnconstrainedIri(): Either<Error, NamedNode> {
    return this.term.termType === "NamedNode"
      ? Either.of(this.term as NamedNode)
      : Left(this.newMistypedTermValueError("IRI"));
  }

  protected override toUnconstrainedLiteral(): Either<Error, Literal> {
    return this.term.termType === "Literal"
      ? Either.of(this.term satisfies Literal)
      : Left(this.newMistypedTermValueError("Literal"));
  }

  protected override toUnconstrainedNumber(): Either<Error, number> {
    return this.toUnconstrainedLiteral()
      .chain(LiteralDecoder.decodeNumberLiteral)
      .mapLeft(() => this.newMistypedTermValueError("number"));
  }

  protected override toUnconstrainedPrimitive(): Either<Error, Primitive> {
    return this.toUnconstrainedLiteral()
      .chain(LiteralDecoder.decodePrimitiveLiteral)
      .mapLeft(() => this.newMistypedTermValueError("primitive"));
  }

  protected override toUnconstrainedString(): Either<Error, string> {
    return this.toUnconstrainedLiteral()
      .chain(LiteralDecoder.decodeStringLiteral)
      .mapLeft(() => this.newMistypedTermValueError("string"));
  }

  protected override toUnconstrainedTerm(): Term {
    return this.value;
  }
}
