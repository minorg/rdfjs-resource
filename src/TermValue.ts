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
import { MistypedTermValueError } from "./MistypedTermValueError.js";
import type { Primitive } from "./Primitive.js";
import { Resource } from "./Resource.js";
import { Value } from "./Value.js";
import type { ValueError } from "./ValueError.js";
import { Values } from "./Values.js";

/**
 * Wraps a term (blank node or IRI or literal) with some methods for converting it to other types.
 */
export class TermValue<
  TermT extends BlankNode | Literal | NamedNode =
    | BlankNode
    | Literal
    | NamedNode,
> extends Value<TermT> {
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

  /**
   * Try to convert the term to a bigint.
   */
  toBigInt(): Either<MistypedTermValueError, bigint> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeBigIntLiteral)
      .mapLeft(() => this.newMistypedValueError("bigint"));
  }

  /**
   * Try to convert the term to a blank node.
   */
  toBlankNode(): Either<MistypedTermValueError, BlankNode> {
    return this.term.termType === "BlankNode"
      ? Either.of(this.term as BlankNode)
      : Left(this.newMistypedValueError("BlankNode"));
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
        return Either.of(this.term satisfies Identifier);
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
   * Try to convert the term to an IRI / NamedNode.
   */
  toIri(): Either<MistypedTermValueError, NamedNode> {
    return this.term.termType === "NamedNode"
      ? Either.of(this.term as NamedNode)
      : Left(this.newMistypedValueError("NamedNode"));
  }

  /**
   * Try to convert the term to an RDF list.
   */
  toList(options?: {
    graph?: Exclude<Quad_Graph, Variable>;
  }): Either<ValueError, readonly TermValue[]> {
    return this.toResource().chain((resource) =>
      resource.toList({ graph: options?.graph }),
    );
  }

  /**
   * Try to convert the term to a Literal.
   */
  toLiteral(): Either<MistypedTermValueError, Literal> {
    return this.term.termType === "Literal"
      ? Either.of(this.term satisfies Literal)
      : Left(this.newMistypedValueError("Literal"));
  }

  /**
   * Try to convert the term to a named resource.
   */
  toNamedResource(): Either<MistypedTermValueError, Resource<NamedNode>> {
    return this.toIri().map(
      (identifier) =>
        new Resource<NamedNode>(this.focusResource.dataset, identifier, {
          dataFactory: this.dataFactory,
        }),
    );
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
      (identifier) =>
        new Resource(this.focusResource.dataset, identifier, {
          dataFactory: this.dataFactory,
        }),
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

  toTerm(): TermT {
    return this.term;
  }

  /**
   * Convert this value into a singleton sequence of values.
   */
  toValues(): Values<TermValue> {
    return Values.fromValue({
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
      value: this,
    });
  }

  private newMistypedValueError(
    expectedValueType: string,
  ): MistypedTermValueError {
    return new MistypedTermValueError({
      actualValue: this.term,
      expectedValueType,
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
    });
  }
}
