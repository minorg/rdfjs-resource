import type {
  BlankNode,
  Literal,
  NamedNode,
  Quad_Graph,
  Term,
  Variable,
} from "@rdfjs/types";
import type { Either } from "purify-ts";
import type { Identifier } from "./Identifier.js";
import type { Primitive } from "./Primitive.js";
import type { PropertyPath } from "./PropertyPath.js";
import type { Resource } from "./Resource.js";
import { Values } from "./Values.js";

export abstract class Value<T> {
  readonly focusResource: Resource;
  readonly propertyPath: PropertyPath;
  readonly value: T;

  constructor({
    focusResource,
    propertyPath,
    value,
  }: {
    focusResource: Resource;
    propertyPath: PropertyPath;
    value: T;
  }) {
    this.focusResource = focusResource;
    this.propertyPath = propertyPath;
    this.value = value;
  }

  /**
   * Try to convert this value to a bigint.
   */
  abstract toBigIntValue(): Either<Error, Value<bigint>>;

  /**
   * Try to convert this value to a blank node.
   */
  abstract toBlankNodeValue(): Either<Error, Value<BlankNode>>;

  /**
   * Try to convert this value to a boolean.
   */
  abstract toBooleanValue(): Either<Error, Value<boolean>>;

  /**
   * Try to convert this value to a date-time.
   */
  abstract toDateTimeValue(): Either<Error, Value<Date>>;

  /**
   * Try to convert this value to a date.
   */
  abstract toDateValue(): Either<Error, Value<Date>>;

  /**
   * Try to convert this value to a float.
   */
  abstract toFloatValue(): Either<Error, Value<number>>;

  /**
   * Try to convert this value to an identifier (blank node or IRI).
   */
  abstract toIdentifierValue(): Either<Error, Value<Identifier>>;

  /**
   * Try to convert this value to an int.
   */
  abstract toIntValue(): Either<Error, Value<number>>;

  /**
   * Try to convert this value to an IRI / NamedNode.
   */
  abstract toIriValue(): Either<Error, Value<NamedNode>>;

  /**
   * Try to convert this value to an RDF list.
   */
  toList(options?: {
    graph?: Exclude<Quad_Graph, Variable>;
  }): Either<Error, Values<Term>> {
    return this.toResourceValue().chain((resourceValue) =>
      resourceValue.value.toList({ graph: options?.graph }),
    );
  }

  /**
   * Try to convert this value to a Literal.
   */
  abstract toLiteralValue(): Either<Error, Value<Literal>>;

  /**
   * Try to convert this value to a named resource.
   */
  abstract toNamedResourceValue(): Either<Error, Value<Resource<NamedNode>>>;

  /**
   * Try to convert this value to a number.
   */
  abstract toNumberValue(): Either<Error, Value<number>>;

  /**
   * Try to convert this value to a JavaScript primitive (boolean | Date | number | string).
   */
  abstract toPrimitiveValue(): Either<Error, Value<Primitive>>;

  /**
   * Try to convert this value to a resource (identified by a blank node or IRI).
   */
  abstract toResourceValue(): Either<Error, Value<Resource>>;

  /**
   * Try to convert this value to a string.
   */
  abstract toStringValue(): Either<Error, Value<string>>;

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
}
