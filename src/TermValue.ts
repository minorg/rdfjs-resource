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
import type { Term } from "./Term.js";
import { Value } from "./Value.js";
import type { ValueError } from "./ValueError.js";
import { Values } from "./Values.js";

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

  /**
   * Try to convert the term to a bigint.
   */
  toBigIntValue(): Either<MistypedTermValueError, Value<bigint>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeBigIntLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedValueError("bigint"));
  }

  /**
   * Try to convert the term to a blank node.
   */
  toBlankNodeValue(): Either<MistypedTermValueError, Value<BlankNode>> {
    return this.term.termType === "BlankNode"
      ? Either.of(this.newTermValue(this.term as BlankNode))
      : Left(this.newMistypedValueError("BlankNode"));
  }

  /**
   * Try to convert the term to a boolean.
   */
  toBooleanValue(): Either<MistypedTermValueError, Value<boolean>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeBooleanLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedValueError("boolean"));
  }

  /**
   * Try to convert the term to a date-time.
   */
  toDateTimeValue(): Either<MistypedTermValueError, Value<Date>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeDateTimeLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedValueError("date-time"));
  }

  /**
   * Try to convert the term to a date.
   */
  toDateValue(): Either<MistypedTermValueError, Value<Date>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeDateLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedValueError("date"));
  }

  /**
   * Try to convert the term to a float.
   */
  toFloatValue(): Either<MistypedTermValueError, Value<number>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeFloatLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedValueError("float"));
  }

  /**
   * Try to convert the term to an identifier (blank node or IRI).
   */
  toIdentifierValue(): Either<MistypedTermValueError, Value<Identifier>> {
    return this.toIdentifier().map((value) => this.newTermValue(value));
  }

  /**
   * Try to convert the term to an int.
   */
  toIntValue(): Either<MistypedTermValueError, Value<number>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeIntLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedValueError("int"));
  }

  /**
   * Try to convert the term to an IRI / NamedNode.
   */
  toIriValue(): Either<MistypedTermValueError, Value<NamedNode>> {
    return this.toIri().map((value) => this.newTermValue(value));
  }

  /**
   * Try to convert the term to an RDF list.
   */
  toList(options?: {
    graph?: Exclude<Quad_Graph, Variable>;
  }): Either<ValueError, Values<Term>> {
    return this.toResource().chain((resource) =>
      resource.toList({ graph: options?.graph }),
    );
  }

  /**
   * Try to convert the term to a Literal.
   */
  toLiteralValue(): Either<MistypedTermValueError, Value<Literal>> {
    return this.toLiteral().map((value) => this.newTermValue(value));
  }

  /**
   * Try to convert the term to a named resource.
   */
  toNamedResourceValue(): Either<
    MistypedTermValueError,
    Value<Resource<NamedNode>>
  > {
    return this.toIri().map((iri) =>
      this.newValue(
        new Resource<NamedNode>(this.focusResource.dataset, iri, {
          dataFactory: this.dataFactory,
        }),
      ),
    );
  }

  /**
   * Try to convert the term to a number.
   */
  toNumberValue(): Either<MistypedTermValueError, Value<number>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeNumberLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedValueError("number"));
  }

  /**
   * Try to convert the term to a JavaScript primitive (boolean | Date | number | string).
   */
  toPrimitiveValue(): Either<MistypedTermValueError, Value<Primitive>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodePrimitiveLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedValueError("primitive"));
  }

  /**
   * Try to convert the term to a resource (identified by a blank node or IRI).
   */
  toResourceValue(): Either<MistypedTermValueError, Value<Resource>> {
    return this.toResource().map((value) => this.newValue(value));
  }

  /**
   * Try to convert the term to a string literal.
   */
  toStringValue(): Either<MistypedTermValueError, Value<string>> {
    return this.toLiteral()
      .chain(LiteralDecoder.decodeStringLiteral)
      .map((value) => this.newValue(value))
      .mapLeft(() => this.newMistypedValueError("string"));
  }

  /**
   * Convert this value into a singleton sequence of values.
   */
  toValues(): Values<TermT> {
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

  private toIdentifier(): Either<MistypedTermValueError, Identifier> {
    switch (this.term.termType) {
      case "BlankNode":
      case "NamedNode":
        return Either.of(this.term as Identifier);
      default:
        return Left(this.newMistypedValueError("BlankNode|NamedNode"));
    }
  }

  private toIri(): Either<MistypedTermValueError, NamedNode> {
    return this.term.termType === "NamedNode"
      ? Either.of(this.term as NamedNode)
      : Left(this.newMistypedValueError("IRI"));
  }

  private toLiteral(): Either<MistypedTermValueError, Literal> {
    return this.term.termType === "Literal"
      ? Either.of(this.term satisfies Literal)
      : Left(this.newMistypedValueError("Literal"));
  }

  private toResource(): Either<MistypedTermValueError, Resource> {
    return this.toIdentifier().map(
      (identifier) =>
        new Resource(this.focusResource.dataset, identifier, {
          dataFactory: this.dataFactory,
        }),
    );
  }
}
