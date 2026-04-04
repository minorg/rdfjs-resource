import type {
  BlankNode,
  DataFactory,
  Literal,
  NamedNode,
  Quad_Graph,
  Variable,
} from "@rdfjs/types";

import type { Either } from "purify-ts";

import type { Identifier } from "./Identifier.js";
import type { Primitive } from "./Primitive.js";
import { PrimitiveValue } from "./PrimitiveValue.js";
import type { PropertyPath } from "./PropertyPath.js";
import { Resource } from "./Resource.js";
import { ResourceValue } from "./ResourceValue.js";
import type { Term } from "./Term.js";
import { TermValue } from "./TermValue.js";
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

  protected abstract toNumber(): Either<Error, number>;

  /**
   * Try to convert this value to a JavaScript primitive (boolean | Date | number | string).
   */
  toPrimitiveValue(): Either<Error, Value<Primitive>> {
    return this.toPrimitive().map((value) => this.newPrimitiveValue(value));
  }

  protected abstract toPrimitive(): Either<Error, Primitive>;

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

  protected toResource(): Either<Error, Resource> {
    return this.toIdentifier().map(
      (value) =>
        new Resource(this.focusResource.dataset, value, {
          dataFactory: this.dataFactory,
        }),
    );
  }

  protected abstract toString(): Either<Error, string>;

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
