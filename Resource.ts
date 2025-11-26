import TermSet from "@rdfjs/term-set";
import type {
  BlankNode,
  DataFactory,
  DatasetCore,
  Literal,
  NamedNode,
  Quad,
  Variable,
} from "@rdfjs/types";
import { Either, Left } from "purify-ts";
import { fromRdf } from "rdf-literal";
import { rdf, rdfs } from "./vocabularies.js";

/**
 * A Resource abstraction over subjects or objects in an RDF/JS dataset.
 */
export class Resource<
  IdentifierT extends Resource.Identifier = Resource.Identifier,
> {
  readonly dataset: DatasetCore;
  readonly identifier: IdentifierT;

  constructor({
    dataset,
    identifier,
  }: {
    dataset: DatasetCore;
    identifier: IdentifierT;
  }) {
    this.dataset = dataset;
    this.identifier = identifier;
  }

  isInstanceOf(
    class_: NamedNode,
    options?: {
      excludeSubclasses?: boolean;
      instanceOfPredicate?: NamedNode;
      subClassOfPredicate?: NamedNode;
    },
  ): boolean {
    return isInstanceOfRecursive({
      class_,
      dataset: this.dataset,
      instance: this.identifier,
      visitedClasses: new TermSet<NamedNode>(),
    });

    function isInstanceOfRecursive({
      class_,
      dataset,
      instance,
      visitedClasses,
    }: {
      class_: NamedNode;
      dataset: DatasetCore;
      instance: BlankNode | NamedNode;
      visitedClasses: TermSet<NamedNode>;
    }): boolean {
      for (const _ of dataset.match(
        instance,
        options?.instanceOfPredicate ?? rdf.type,
        class_,
      )) {
        return true;
      }

      visitedClasses.add(class_);

      if (options?.excludeSubclasses) {
        return false;
      }

      // Recurse into class's sub-classes that haven't been visited yet.
      for (const quad of dataset.match(
        null,
        options?.subClassOfPredicate ?? rdfs.subClassOf,
        class_,
        null,
      )) {
        if (quad.subject.termType !== "NamedNode") {
          continue;
        }
        if (visitedClasses.has(quad.subject)) {
          continue;
        }
        if (
          isInstanceOfRecursive({
            class_: quad.subject,
            dataset,
            instance,
            visitedClasses,
          })
        ) {
          return true;
        }
      }

      return false;
    }
  }

  isSubClassOf(
    class_: NamedNode,
    options?: {
      subClassOfPredicate?: NamedNode;
    },
  ): boolean {
    return isSubClassOfRecursive({
      class_,
      dataset: this.dataset,
      thisIdentifier: this.identifier,
      visitedClasses: new TermSet<NamedNode>(),
    });

    function isSubClassOfRecursive({
      class_,
      dataset,
      thisIdentifier,
      visitedClasses,
    }: {
      class_: NamedNode;
      dataset: DatasetCore;
      thisIdentifier: BlankNode | NamedNode;
      visitedClasses: TermSet<NamedNode>;
    }): boolean {
      for (const _ of dataset.match(
        thisIdentifier,
        options?.subClassOfPredicate ?? rdfs.subClassOf,
        class_,
      )) {
        return true;
      }

      visitedClasses.add(class_);

      // Recurse into class's sub-classes that haven't been visited yet.
      for (const quad of dataset.match(
        null,
        options?.subClassOfPredicate ?? rdfs.subClassOf,
        class_,
        null,
      )) {
        if (quad.subject.termType !== "NamedNode") {
          continue;
        }
        if (visitedClasses.has(quad.subject)) {
          continue;
        }
        if (
          isSubClassOfRecursive({
            class_: quad.subject,
            dataset,
            thisIdentifier,
            visitedClasses,
          })
        ) {
          return true;
        }
      }

      return false;
    }
  }

  /**
   * Consider the resource itself as an RDF list.
   */
  toList(): Either<Resource.ValueError, readonly Resource.TermValue[]> {
    if (this.identifier.equals(rdf.nil)) {
      return Either.of([]);
    }

    const firstObjects = [
      ...new TermSet(
        [...this.dataset.match(this.identifier, rdf.first, null)].map(
          (quad) => quad.object,
        ),
      ),
    ];
    if (firstObjects.length === 0) {
      return Left(
        new Resource.ListStructureError({
          focusResource: this,
          message: "list has no rdf:first statements",
          predicate: rdf.first,
        }),
      );
    }
    if (firstObjects.length > 1) {
      return Left(
        new Resource.ListStructureError({
          focusResource: this,
          message: "list has multiple rdf:first statements",
          predicate: rdf.first,
        }),
      );
    }
    const firstObject = firstObjects[0];
    switch (firstObject.termType) {
      case "BlankNode":
      case "Literal":
      case "NamedNode":
        break;
      default:
        return Left(
          new Resource.MistypedTermValueError({
            actualValue: firstObject,
            expectedValueType: "BlankNode | Literal | NamedNode",
            focusResource: this,
            predicate: rdf.first,
          }),
        );
    }

    const restObjects = [
      ...new TermSet(
        [...this.dataset.match(this.identifier, rdf.rest, null)].map(
          (quad) => quad.object,
        ),
      ),
    ];
    if (restObjects.length === 0) {
      return Left(
        new Resource.ListStructureError({
          focusResource: this,
          message: "list has no rdf:rest statements",
          predicate: rdf.rest,
        }),
      );
    }
    if (restObjects.length > 1) {
      return Left(
        new Resource.ListStructureError({
          focusResource: this,
          message: "list has multiple rdf:rest statements",
          predicate: rdf.rest,
        }),
      );
    }
    const restObject = restObjects[0];
    switch (restObject.termType) {
      case "BlankNode":
      case "NamedNode":
        break;
      default:
        return Left(
          new Resource.MistypedTermValueError({
            actualValue: restObject,
            expectedValueType: "BlankNode | NamedNode",
            focusResource: this,
            predicate: rdf.rest,
          }),
        );
    }

    return Either.of<Resource.ValueError, readonly Resource.TermValue[]>([
      new Resource.TermValue({
        focusResource: this,
        predicate: rdf.first,
        term: firstObject,
      }),
    ]).chain((items) =>
      new Resource({ dataset: this.dataset, identifier: restObject })
        .toList()
        .map((restItems) => items.concat(restItems)),
    );
  }

  /**
   * Get the first matching value of dataset statements (this.identifier, predicate, value).
   */
  value(predicate: NamedNode): Either<Resource.ValueError, Resource.TermValue> {
    return this.values(predicate).head();
  }

  /**
   * Get the first matching subject of dataset statements (subject, predicate, this.identifier).
   */
  valueOf(
    predicate: NamedNode,
  ): Either<Resource.ValueError, Resource.IdentifierValue> {
    return this.valuesOf(predicate).head();
  }

  /**
   * Get all values of dataset statements (this.identifier, predicate, value).
   */
  values(
    predicate: NamedNode,
    options?: { unique?: boolean },
  ): Resource.Values<Resource.TermValue> {
    return new DatasetObjectValues({
      focusResource: this,
      predicate,
      unique: !!options?.unique,
    });
  }

  /**
   * Get the subject of dataset statements (subject, predicate, this.identifier).
   */
  valuesOf(
    predicate: NamedNode,
    options?: { unique: true },
  ): Resource.Values<Resource.IdentifierValue> {
    return new DatasetSubjectValues({
      focusResource: this,
      predicate,
      unique: !!options?.unique,
    });
  }
}

export namespace Resource {
  class AbstractTermValue<TermT extends BlankNode | Literal | NamedNode> {
    protected readonly focusResource: Resource;
    protected readonly predicate: NamedNode;
    protected readonly term: TermT;

    constructor({
      focusResource,
      predicate,
      term,
    }: {
      focusResource: Resource;
      predicate: NamedNode;
      term: TermT;
    }) {
      this.focusResource = focusResource;
      this.predicate = predicate;
      this.term = term;
    }

    /**
     * Is the term an IRI / NamedNode?
     */
    isIri(): boolean {
      return this.term.termType === "NamedNode";
    }

    /**
     * Try to convert the term to an IRI / NamedNode.
     */
    toIri(): Either<Resource.MistypedTermValueError, NamedNode> {
      return this.term.termType === "NamedNode"
        ? Either.of(this.term as NamedNode)
        : Left(this.newMistypedValueError("NamedNode"));
    }

    /**
     * Try to convert the term to a named resource.
     */
    toNamedResource(): Either<
      Resource.MistypedTermValueError,
      Resource<NamedNode>
    > {
      return this.toIri().map(
        (identifier) =>
          new Resource<NamedNode>({
            dataset: this.focusResource.dataset,
            identifier,
          }),
      );
    }

    toTerm(): TermT {
      return this.term;
    }

    protected newMistypedValueError(
      expectedValueType: string,
    ): Resource.MistypedTermValueError {
      return new Resource.MistypedTermValueError({
        actualValue: this.term,
        expectedValueType,
        focusResource: this.focusResource,
        predicate: this.predicate,
      });
    }
  }

  export type Identifier = BlankNode | NamedNode;

  export namespace Identifier {
    export function fromString({
      dataFactory,
      identifier,
    }: {
      dataFactory: DataFactory;
      identifier: string;
    }) {
      if (identifier.startsWith("_:")) {
        return dataFactory.blankNode(identifier.substring("_:".length));
      }
      if (
        identifier.startsWith("<") &&
        identifier.endsWith(">") &&
        identifier.length > 2
      ) {
        return dataFactory.namedNode(
          identifier.substring(1, identifier.length - 1),
        );
      }
      throw new RangeError(identifier);
    }

    // biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
    export function toString(identifier: Identifier) {
      switch (identifier.termType) {
        case "BlankNode":
          return `_:${identifier.value}`;
        case "NamedNode":
          return `<${identifier.value}>`;
      }
    }
  }

  /**
   * Wraps an identifier (blank node or IRI) with some methods for converting it to other types.
   */
  export class IdentifierValue extends AbstractTermValue<Identifier> {
    toIdentifier(): Identifier {
      return this.term;
    }
  }

  /**
   * Wraps a term (blank node or IRI or literal) with some methods for converting it to other types.
   */
  export class TermValue extends AbstractTermValue<
    BlankNode | Literal | NamedNode
  > {
    /**
     * Is the term a boolean literal?
     */
    isBoolean(): boolean {
      return this.toBoolean().isRight();
    }

    /**
     * Is the term a date literal?
     */
    isDate(): boolean {
      return this.toDate().isRight();
    }

    /**
     * Is the term an identifier (blank node or IRI)?
     */
    isIdentifier(): boolean {
      switch (this.term.termType) {
        case "BlankNode":
        case "NamedNode":
          return true;
        default:
          return false;
      }
    }

    /**
     * Is the term an RDF list?
     */
    isList(): boolean {
      return this.toList().isRight();
    }

    /**
     * Is the term a literal?
     */
    isLiteral(): boolean {
      return this.term.termType === "Literal";
    }

    /**
     * Is the term a number literal?
     */
    isNumber(): boolean {
      return this.toNumber().isRight();
    }

    /**
     * Is the term a JavaScript primitive literal (boolean | Date | number | string)?
     */
    isPrimitive(): boolean {
      return this.toPrimitive().isRight();
    }

    /**
     * Is the term a string literal?
     */
    isString(): boolean {
      return this.toString().isRight();
    }

    /**
     * Try to convert the term to a boolean literal.
     */
    toBoolean(): Either<Resource.MistypedTermValueError, boolean> {
      return this.toPrimitive().chain((primitive) =>
        typeof primitive === "boolean"
          ? Either.of(primitive)
          : Left(this.newMistypedValueError("boolean")),
      );
    }

    /**
     * Try to convert the term to a date literal.
     */
    toDate(): Either<Resource.MistypedTermValueError, Date> {
      return this.toPrimitive().chain((primitive) =>
        primitive instanceof Date
          ? Either.of(primitive)
          : Left(this.newMistypedValueError("Date")),
      );
    }

    /**
     * Try to convert the term to an identifier (blank node or IRI).
     */
    toIdentifier(): Either<
      Resource.MistypedTermValueError,
      Resource.Identifier
    > {
      switch (this.term.termType) {
        case "BlankNode":
        case "NamedNode":
          return Either.of(this.term);
        default:
          return Left(this.newMistypedValueError("BlankNode|NamedNode"));
      }
    }

    /**
     * Try to convert the term to an RDF list.
     */
    toList(): Either<Resource.ValueError, readonly Resource.TermValue[]> {
      return this.toResource().chain((resource) => resource.toList());
    }

    /**
     * Try to convert the term to a literal.
     */
    toLiteral(): Either<Resource.MistypedTermValueError, Literal> {
      return this.term.termType === "Literal"
        ? Either.of(this.term)
        : Left(this.newMistypedValueError("Literal"));
    }

    /**
     * Try to convert the term to a number literal.
     */
    toNumber(): Either<Resource.MistypedTermValueError, number> {
      return this.toPrimitive().chain((primitive) =>
        typeof primitive === "number"
          ? Either.of(primitive)
          : Left(this.newMistypedValueError("number")),
      );
    }

    /**
     * Try to convert the term to a JavaScript primitive (boolean | Date | number | string).
     */
    toPrimitive(): Either<
      Resource.MistypedTermValueError,
      boolean | Date | number | string
    > {
      if (this.term.termType !== "Literal") {
        return Left(
          new Resource.MistypedTermValueError({
            actualValue: this.term,
            expectedValueType: "Literal",
            focusResource: this.focusResource,
            predicate: this.predicate,
          }),
        );
      }

      try {
        return Either.of(fromRdf(this.term, true));
      } catch {
        return Left(
          new Resource.MistypedTermValueError({
            actualValue: this.term,
            expectedValueType: "primitive",
            focusResource: this.focusResource,
            predicate: this.predicate,
          }),
        );
      }
    }

    /**
     * Try to convert the term to a resource (identified by a blank node or IRI).
     */
    toResource(): Either<Resource.MistypedTermValueError, Resource> {
      return this.toIdentifier().map(
        (identifier) =>
          new Resource({ dataset: this.focusResource.dataset, identifier }),
      );
    }

    /**
     * Try to convert the term to a string literal.
     */
    override toString(): Either<Resource.MistypedTermValueError, string> {
      return this.toPrimitive().chain((primitive) =>
        typeof primitive === "string"
          ? Either.of(primitive as string)
          : Left(this.newMistypedValueError("string")),
      );
    }

    /**
     * Convert this value into a singleton sequence of values.
     */
    toValues(): Values<TermValue> {
      return Values.fromValue({
        focusResource: this.focusResource,
        predicate: this.predicate,
        value: this,
      });
    }
  }

  export abstract class ValueError extends Error {
    readonly focusResource: Resource;
    readonly predicate: NamedNode;

    constructor({
      focusResource,
      message,
      predicate,
    }: { focusResource: Resource; message: string; predicate: NamedNode }) {
      super(message);
      this.focusResource = focusResource;
      this.predicate = predicate;
    }
  }

  export class MissingValueError extends ValueError {
    constructor({
      focusResource,
      predicate,
    }: {
      focusResource: Resource;
      predicate: NamedNode;
    }) {
      super({
        focusResource,
        message: `${Identifier.toString(focusResource.identifier)} missing ${predicate.value}`,
        predicate,
      });
    }
  }

  export class MistypedTermValueError extends ValueError {
    readonly actualValue: BlankNode | Literal | NamedNode | Quad | Variable;
    readonly expectedValueType: string;

    constructor({
      actualValue,
      expectedValueType,
      focusResource,
      predicate,
    }: {
      actualValue: BlankNode | Literal | NamedNode | Quad | Variable;
      expectedValueType: string;
      focusResource: Resource;
      predicate: NamedNode;
    }) {
      super({
        focusResource,
        message: `expected ${Identifier.toString(focusResource.identifier)} ${predicate.value} to be a ${expectedValueType}, was ${actualValue.termType}`,
        predicate,
      });
      this.actualValue = actualValue;
      this.expectedValueType = expectedValueType;
    }
  }

  export class ListStructureError extends ValueError {}

  /**
   * Iterable sequence of values of a given type.
   *
   * Resource.values and .valuesOf return instances of this class instead of a simple array of values in order to
   * (1) preserve the focus resource that .values/.valuesOf was invoked on, in case of errors
   * (2) preserve the predicate that .values/.valuesOf was invoked with, in case of errors
   * (3) return purify types from methods like .find instead of null or undefined
   * (4) add some methods that aren't on arrays, like .chainMap and .head
   *
   * The class doesn't try to implement the entire Array interface. Methods are added as needed by downstream code.
   */
  export abstract class Values<ValueT> implements Iterable<ValueT> {
    abstract readonly length: number;
    protected readonly focusResource: Resource;
    protected readonly predicate: NamedNode;

    protected constructor({
      focusResource,
      predicate,
    }: {
      focusResource: Resource;
      predicate: NamedNode;
    }) {
      this.focusResource = focusResource;
      this.predicate = predicate;
    }

    abstract [Symbol.iterator](): Iterator<ValueT>;

    /**
     * For each value in the sequence, try to convert it to a new type / transform it using the provided callback.
     *
     * If any conversion fails, return the failure (the Left).
     *
     * If all of the conversions succeed, return a new Values with the converted values.
     *
     * This is a combination of Either.chain and Either.map.
     */
    chainMap<NewValueT>(
      callback: (value: ValueT, index: number) => Either<Error, NewValueT>,
    ): Either<Error, Values<NewValueT>> {
      const newValues: NewValueT[] = [];
      let valueI = 0;
      for (const value of this) {
        const callbackResult = callback(value, valueI);
        if (callbackResult.isLeft()) {
          return callbackResult;
        }
        newValues.push(callbackResult.extract() as NewValueT);
        valueI++;
      }
      return Either.of(
        Values.fromArray({
          focusResource: this.focusResource,
          values: newValues,
          predicate: this.predicate,
        }),
      );
    }

    /**
     * Concatenate another values of the same type to this Values, returning a new Values instance.
     */
    concat(...values: readonly ValueT[]): Values<ValueT> {
      return Values.fromArray({
        focusResource: this.focusResource,
        predicate: this.predicate,
        values: this.toArray().concat(...values),
      });
    }

    /**
     * Filter the values, returning a new Values instance.
     */
    filter(
      predicate: (value: ValueT, index: number) => boolean,
    ): Resource.Values<ValueT> {
      const filteredValues: ValueT[] = [];
      let valueI = 0;
      for (const value of this) {
        if (predicate(value, valueI)) {
          filteredValues.push(value);
        }
        valueI++;
      }
      return Values.fromArray({
        focusResource: this.focusResource,
        predicate: this.predicate,
        values: filteredValues,
      });
    }

    /**
     * Find a value that satisfies the given predicate.
     *
     * Return Right if a value satisfies the predicate, otherwise Left.
     */
    find(
      predicate: (value: ValueT, index: number) => boolean,
    ): Either<MissingValueError, ValueT> {
      let valueI = 0;
      for (const value of this) {
        if (predicate(value, valueI)) {
          return Either.of(value);
        }
        valueI++;
      }
      return Left(
        new MissingValueError({
          focusResource: this.focusResource,
          predicate: this.predicate,
        }),
      );
    }

    /**
     * Flatten a Values of iterables into a new Values.
     *
     * Equivalent of Array.flat.
     */
    flat<NewValueT>(): Values<NewValueT> {
      return new ArrayValues<NewValueT>({
        focusResource: this.focusResource,
        predicate: this.predicate,
        values: this.toArray().flat() as readonly NewValueT[],
      });
    }

    /**
     * Map each value to an array of values of a new type. Flatten those arrays and return the result as a new Values.
     */
    flatMap<NewValueT>(
      callback: (value: ValueT, index: number) => ReadonlyArray<NewValueT>,
    ): Values<NewValueT> {
      const newValues: NewValueT[] = [];
      let valueI = 0;
      for (const value of this) {
        newValues.push(...callback(value, valueI));
        valueI++;
      }
      return Values.fromArray({
        focusResource: this.focusResource,
        predicate: this.predicate,
        values: newValues,
      });
    }

    /**
     * Create a Values instance from an array of values.
     */
    static fromArray<ValueT>(parameters: {
      focusResource: Resource;
      predicate: NamedNode;
      values: readonly ValueT[];
    }): Values<ValueT> {
      return new ArrayValues(parameters);
    }

    /**
     * Create a Values instance from a single value.
     */
    static fromValue<ValueT>(parameters: {
      focusResource: Resource;
      predicate: NamedNode;
      value: ValueT;
    }) {
      return new SingletonValues(parameters);
    }

    /**
     * Get the head of this sequence of values if the sequence is non-empty. Otherwise return Left.
     */
    head(): Either<ValueError, ValueT> {
      for (const value of this) {
        return Either.of(value);
      }
      return Left(
        new MissingValueError({
          focusResource: this.focusResource,
          predicate: this.predicate,
        }),
      );
    }

    /**
     * Map each value to a value of a new type and return a new Values with the mapped results.
     */
    map<NewValueT>(
      callback: (value: ValueT, index: number) => NewValueT,
    ): Values<NewValueT> {
      const newValues: NewValueT[] = [];
      let valueI = 0;
      for (const value of this) {
        newValues.push(callback(value, valueI));
        valueI++;
      }
      return Values.fromArray({
        focusResource: this.focusResource,
        predicate: this.predicate,
        values: newValues,
      });
    }

    /**
     * Convert this values to an array of the values.
     */
    abstract toArray(): readonly ValueT[];
  }
}

/**
 * Private implementation of Resource.Values that iterates over an array.
 */
class ArrayValues<ValueT> extends Resource.Values<ValueT> {
  private readonly values: readonly ValueT[];

  constructor({
    values,
    ...superParameters
  }: {
    focusResource: Resource;
    predicate: NamedNode;
    values: readonly ValueT[];
  }) {
    super(superParameters);
    this.values = values;
  }

  override get length(): number {
    return this.values.length;
  }

  override [Symbol.iterator](): Iterator<ValueT> {
    return this.values[Symbol.iterator]();
  }

  override toArray(): readonly ValueT[] {
    return this.values;
  }
}

abstract class DatasetValues<ValueT> extends Resource.Values<ValueT> {
  protected readonly unique: boolean;

  constructor({
    focusResource,
    predicate,
    unique,
  }: {
    focusResource: Resource;
    predicate: NamedNode;
    unique: boolean;
  }) {
    super({ focusResource, predicate });
    this.unique = unique;
  }

  override get length(): number {
    let length = 0;
    for (const _ of this) {
      length++;
    }
    return length;
  }

  override toArray(): readonly ValueT[] {
    return [...this];
  }
}

/**
 * Private implementation of Resource.Values that iterates over a DatasetCore.
 *
 * Instances of this class are returned from value/values, so focusResource is the subject of the predicate and we're looking for objects.
 */
class DatasetObjectValues extends DatasetValues<Resource.TermValue> {
  override get length(): number {
    let length = 0;
    for (const _ of this) {
      length++;
    }
    return length;
  }

  override *[Symbol.iterator](): Iterator<Resource.TermValue> {
    if (this.unique) {
      const uniqueTerms = new TermSet<BlankNode | Literal | NamedNode>();
      for (const nonUniqueTerm of this.nonUniqueTermIterator()) {
        if (uniqueTerms.has(nonUniqueTerm)) {
          continue;
        }
        yield new Resource.TermValue({
          focusResource: this.focusResource,
          predicate: this.predicate,
          term: nonUniqueTerm,
        });
        uniqueTerms.add(nonUniqueTerm);
      }
    } else {
      for (const nonUniqueTerm of this.nonUniqueTermIterator()) {
        yield new Resource.TermValue({
          focusResource: this.focusResource,
          predicate: this.predicate,
          term: nonUniqueTerm,
        });
      }
    }
  }

  private *nonUniqueTermIterator(): Generator<BlankNode | Literal | NamedNode> {
    // if (this.inverse) {
    //   for (const quad of this.focusResource.dataset.match(
    //     null,
    //     this.predicate,
    //     this.focusResource.identifier,
    //   )) {
    //     switch (quad.subject.termType) {
    //       case "BlankNode":
    //       case "NamedNode":
    //         yield quad.subject;
    //     }
    //   }
    // } else {
    for (const quad of this.focusResource.dataset.match(
      this.focusResource.identifier,
      this.predicate,
      null,
      null,
    )) {
      switch (quad.object.termType) {
        case "BlankNode":
        case "Literal":
        case "NamedNode":
          yield quad.object;
      }
    }
  }

  override toArray(): readonly Resource.TermValue[] {
    return [...this];
  }
}

/**
 * Private implementation of Resource.Values that iterates over a DatasetCore.
 *
 * Instances of this class are returned from valueOf/valuesOf, so focusResource is the object of the predicate and we're looking for subjects.
 */
class DatasetSubjectValues extends DatasetValues<Resource.IdentifierValue> {
  override *[Symbol.iterator](): Iterator<Resource.IdentifierValue> {
    if (this.unique) {
      const uniqueIdentifiers = new TermSet<BlankNode | Literal | NamedNode>();
      for (const nonUniqueIdentifier of this.nonUniqueIdentifierIterator()) {
        if (uniqueIdentifiers.has(nonUniqueIdentifier)) {
          continue;
        }
        yield new Resource.IdentifierValue({
          focusResource: this.focusResource,
          predicate: this.predicate,
          term: nonUniqueIdentifier,
        });
        uniqueIdentifiers.add(nonUniqueIdentifier);
      }
    } else {
      for (const nonUniqueIdentifier of this.nonUniqueIdentifierIterator()) {
        yield new Resource.IdentifierValue({
          focusResource: this.focusResource,
          predicate: this.predicate,
          term: nonUniqueIdentifier,
        });
      }
    }
  }

  private *nonUniqueIdentifierIterator(): Generator<BlankNode | NamedNode> {
    for (const quad of this.focusResource.dataset.match(
      null,
      this.predicate,
      this.focusResource.identifier,
    )) {
      switch (quad.subject.termType) {
        case "BlankNode":
        case "NamedNode":
          yield quad.subject;
      }
    }
  }
}

/**
 * Private implementation of Resource.Values that iterates over a single value.
 */
class SingletonValues<ValueT> extends Resource.Values<ValueT> {
  override readonly length = 1;
  private readonly value: ValueT;

  constructor({
    value,
    ...superParameters
  }: { focusResource: Resource; value: ValueT; predicate: NamedNode }) {
    super(superParameters);
    this.value = value;
  }

  override *[Symbol.iterator](): Iterator<ValueT> {
    yield this.value;
  }

  override toArray(): readonly ValueT[] {
    return [this.value];
  }
}
