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
import { Term } from "./Term.js";
import { Values } from "./Values.js";

export class TermWrapper<TermT extends Term = Term> {
  private readonly dataFactory: DataFactory;
  private readonly focusResource: Resource;
  private readonly propertyPath: PropertyPath;

  readonly term: TermT;

  constructor({
    dataFactory,
    focusResource,
    propertyPath,
    term,
  }: {
    dataFactory: DataFactory;
    focusResource: Resource;
    propertyPath: PropertyPath;
    term: TermT;
  }) {
    this.dataFactory = dataFactory;
    this.focusResource = focusResource;
    this.propertyPath = propertyPath;
    this.term = term;
  }

  /**
   * Try to convert this term to a bigint.
   */
  toBigInt(): Either<Error, bigint>;
  toBigInt<T extends bigint>(in_: readonly T[]): Either<Error, T>;
  toBigInt<T extends bigint>(in_?: readonly T[]): Either<Error, T | bigint> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeBigIntLiteral)
      .mapLeft(() =>
        this.newMistypedTermValueError(
          in_ ? in_.map((_) => _.toString()).join(" | ") : "bigint",
        ),
      )
      .chain((value) => this.constrainPrimitive(value, in_));
  }

  /**
   * Try to convert this term to a blank node.
   */
  toBlankNode(): Either<Error, BlankNode> {
    return this.term.termType === "BlankNode"
      ? Either.of(this.term as BlankNode)
      : Left(this.newMistypedTermValueError("BlankNode"));
  }

  /**
   * Try to convert this term to a boolean.
   */
  toBoolean(): Either<Error, boolean>;
  toBoolean<T extends boolean>(in_: readonly T[]): Either<Error, T>;
  toBoolean<T extends boolean>(in_?: readonly T[]): Either<Error, T | boolean> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeBooleanLiteral)
      .mapLeft(() =>
        this.newMistypedTermValueError(
          in_ ? in_.map((_) => _.toString()).join(" |") : "boolean",
        ),
      )
      .chain((value) => this.constrainPrimitive(value, in_));
  }

  /**
   * Try to convert this term to a date-time.
   */
  toDateTime(in_?: readonly Date[]): Either<Error, Date> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeDateTimeLiteral)
      .mapLeft(() =>
        this.newMistypedTermValueError(
          in_ ? in_.map((_) => _.toISOString()).join(" |") : "boolean",
        ),
      )
      .chain((value) => this.constrainDate(value, in_));
  }

  /**
   * Try to convert this term to a date.
   */
  toDate(in_?: readonly Date[]): Either<Error, Date> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeDateLiteral)
      .mapLeft(() =>
        this.newMistypedTermValueError(
          in_ ? in_.map((_) => _.toISOString()).join(" |") : "boolean",
        ),
      )
      .chain((value) => this.constrainDate(value, in_));
  }

  /**
   * Try to convert this term to a float.
   */
  toFloat(): Either<Error, number>;
  toFloat<T extends number>(in_: readonly T[]): Either<Error, T>;
  toFloat<T extends number>(in_?: readonly T[]): Either<Error, T | number> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeFloatLiteral)
      .mapLeft(() =>
        this.newMistypedTermValueError(
          in_ ? in_.map((_) => _.toString()).join(" | ") : "float",
        ),
      )
      .chain((value) => this.constrainPrimitive(value, in_));
  }

  /**
   * Try to convert this term to an identifier (blank node or IRI).
   */
  toIdentifier(): Either<Error, Identifier>;
  toIdentifier<T extends Identifier>(in_: readonly T[]): Either<Error, T>;
  toIdentifier<T extends Identifier>(
    in_?: readonly T[],
  ): Either<Error, T | Identifier> {
    if (this.term.termType === "Literal") {
      return Left(this.newMistypedTermValueError("Identifier"));
    }
    return this.constrainTerm(this.term as Identifier, in_);
  }

  /**
   * Try to convert this term to an int.
   */
  toInt(): Either<Error, number>;
  toInt<T extends number>(in_: readonly T[]): Either<Error, T>;
  toInt<T extends number>(in_?: readonly T[]): Either<Error, T | number> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeIntLiteral)
      .mapLeft(() =>
        this.newMistypedTermValueError(
          in_ ? in_.map((_) => _.toString()).join(" | ") : "int",
        ),
      )
      .chain((value) => this.constrainPrimitive(value, in_));
  }

  /**
   * Try to convert this term to an IRI / NamedNode.
   */
  toIri(): Either<Error, NamedNode>;
  toIri<T extends NamedNode>(in_: readonly T[]): Either<Error, T>;
  toIri<T extends NamedNode>(in_?: readonly T[]): Either<Error, T | NamedNode> {
    if (this.term.termType !== "NamedNode") {
      return Left(this.newMistypedTermValueError("IRI"));
    }
    return this.constrainTerm(this.term as NamedNode, in_);
  }

  /**
   * Try to convert this term to an RDF list.
   */
  toList(options?: {
    graph?: Exclude<Quad_Graph, Variable>;
  }): Either<Error, Values<TermWrapper>> {
    return this.toResource().chain((resource) =>
      resource.toList({ graph: options?.graph }),
    );
  }

  /**
   * Try to convert this term to a Literal.
   */
  toLiteral(in_?: readonly Literal[]): Either<Error, Literal> {
    if (this.term.termType !== "Literal") {
      return Left(
        this.newMistypedTermValueError(
          in_ ? in_.map((_) => Term.toString(_)).join(" | ") : "Literal",
        ),
      );
    }

    if (in_ && !in_.some((check) => check.equals(this.term))) {
      return Left(
        this.newMistypedTermValueError(
          in_ ? in_.map((_) => Term.toString(_)).join(" | ") : "Literal",
        ),
      );
    }

    return Either.of(this.term as Literal);
  }

  /**
   * Try to convert this term to a number.
   */
  toNumber(): Either<Error, number>;
  toNumber<T extends number>(in_: readonly T[]): Either<Error, T>;
  toNumber<T extends number>(in_?: readonly T[]): Either<Error, T | number> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeNumberLiteral)
      .mapLeft(() =>
        this.newMistypedTermValueError(
          in_ ? in_.map((_) => _.toString()).join(" | ") : "float",
        ),
      )
      .chain((value) => this.constrainPrimitive(value, in_));
  }

  /**
   * Try to convert this term to a JavaScript primitive (boolean | Date | number | string).
   */
  toPrimitive(): Either<Error, Primitive>;
  toPrimitive<T extends Primitive>(in_: readonly T[]): Either<Error, T>;
  toPrimitive<T extends Primitive>(
    in_?: readonly T[],
  ): Either<Error, T | Primitive> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodePrimitiveLiteral)
      .mapLeft(() =>
        this.newMistypedTermValueError(
          in_ ? in_.map((_) => _.toString()).join(" | ") : "primitive",
        ),
      )
      .chain((value) => this.constrainPrimitive(value, in_));
  }

  /**
   * Try to convert this term to a resource (identified by a blank node or IRI).
   */
  toResource(): Either<Error, Resource>;
  toResource<T extends Identifier>(in_: readonly T[]): Either<Error, T>;
  toResource<T extends Identifier>(
    in_?: readonly T[],
  ): Either<Error, T | Resource> {
    return (in_ ? this.toIdentifier(in_) : this.toIdentifier()).map(
      (identifier) =>
        new Resource(this.focusResource.dataset, identifier, {
          dataFactory: this.dataFactory,
        }),
    );
  }

  /**
   * Try to convert this term to a string.
   */
  toString(): Either<Error, string>;
  toString<T extends string>(in_: readonly T[]): Either<Error, T>;
  toString<T extends string>(in_?: readonly T[]): Either<Error, T | string> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeStringLiteral)
      .chain((value) => this.constrainPrimitive(value, in_))
      .mapLeft(() =>
        this.newMistypedTermValueError(
          in_ ? in_.map((_) => JSON.stringify(_)).join(" | ") : "string",
        ),
      );
  }

  /**
   * Convert this term into a singleton sequence of values.
   */
  toValues(): Values<TermWrapper<TermT>> {
    return Values.fromValue({
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
      value: this,
    });
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

  private constrainDate(
    value: Date,
    in_?: readonly Date[],
  ): Either<Error, Date> {
    if (in_ && !in_.some((check) => value.getTime() === check.getTime())) {
      return Left(
        new MistypedPrimitiveValueError({
          actualValue: value,
          expectedValueType: in_.map((_) => _.toISOString()).join(" | "),
          focusResource: this.focusResource,
          propertyPath: this.propertyPath,
        }),
      );
    }
    return Either.of<Error, Date>(value);
  }

  private constrainPrimitive<
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
          expectedValueType: in_.map((_) => _.toString()).join(" | "),
          focusResource: this.focusResource,
          propertyPath: this.propertyPath,
        }),
      );
    }
    return Either.of<Error, UnconstrainedT>(value as ConstrainedT);
  }

  private constrainTerm<
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
          expectedValueType: in_.map(Term.toString).join(" | "),
          focusResource: this.focusResource,
          propertyPath: this.propertyPath,
        }),
      );
    }
    return Either.of<Error, UnconstrainedT>(value as ConstrainedT);
  }
}
