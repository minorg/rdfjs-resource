import TermSet from "@rdfjs/term-set";
import type {
  BlankNode,
  DataFactory,
  DatasetCore,
  Literal,
  NamedNode,
  Quad,
  Quad_Object,
  Quad_Subject,
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
  toList(): Either<Resource.ValueError, readonly Resource.Value[]> {
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
        new Resource.MissingValueError({
          focusResource: this,
          predicate: rdf.first,
        }),
      );
    }
    if (firstObjects.length > 1) {
      return Left(
        new Resource.MultipleValueError({
          focusResource: this,
          predicate: rdf.first,
          values: firstObjects,
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
          new Resource.MistypedValueError({
            actualValue: firstObject,
            expectedValueType: "BlankNode | NamedNode",
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
        new Resource.MissingValueError({
          focusResource: this,
          predicate: rdf.rest,
        }),
      );
    }
    if (restObjects.length > 1) {
      return Left(
        new Resource.MultipleValueError({
          focusResource: this,
          predicate: rdf.rest,
          values: restObjects,
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
          new Resource.MistypedValueError({
            actualValue: restObject,
            expectedValueType: "BlankNode | NamedNode",
            focusResource: this,
            predicate: rdf.rest,
          }),
        );
    }

    return Either.of<Resource.ValueError, readonly Resource.Value[]>([
      new Resource.Value({
        subject: this,
        predicate: rdf.first,
        object: firstObject,
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
  value(predicate: NamedNode): Either<Resource.ValueError, Resource.Value> {
    return this.values(predicate).head();
  }

  /**
   * Get the first matching subject of dataset statements (subject, predicate, this.identifier).
   */
  valueOf(predicate: NamedNode): Either<Resource.ValueError, Resource.ValueOf> {
    return this.valuesOf(predicate).head();
  }

  /**
   * Get all values of dataset statements (this.identifier, predicate, value).
   */
  values(
    predicate: NamedNode,
    options?: { unique?: boolean },
  ): Resource.Values {
    return new DatasetValues({
      subject: this,
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
  ): Resource.ValuesOf {
    return new DatasetValuesOf({
      object: this,
      predicate,
      unique: !!options?.unique,
    });
  }
}

export namespace Resource {
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

  export class Value {
    private readonly object: BlankNode | Literal | NamedNode;
    private readonly predicate: NamedNode;
    private readonly subject: Resource;

    constructor({
      object,
      predicate,
      subject,
    }: {
      object: BlankNode | Literal | NamedNode;
      predicate: NamedNode;
      subject: Resource;
    }) {
      this.object = object;
      this.predicate = predicate;
      this.subject = subject;
    }

    isBoolean(): boolean {
      return this.toBoolean().isRight();
    }

    isDate(): boolean {
      return this.toDate().isRight();
    }

    isIdentifier(): boolean {
      switch (this.object.termType) {
        case "BlankNode":
        case "NamedNode":
          return true;
        default:
          return false;
      }
    }

    isIri(): boolean {
      return this.object.termType === "NamedNode";
    }

    isList(): boolean {
      return this.toList().isRight();
    }

    isLiteral(): boolean {
      return this.object.termType === "Literal";
    }

    isNumber(): boolean {
      return this.toNumber().isRight();
    }

    isPrimitive(): boolean {
      return this.toPrimitive().isRight();
    }

    isString(): boolean {
      return this.toString().isRight();
    }

    toBoolean(): Either<Resource.MistypedValueError, boolean> {
      return this.toPrimitive().chain((primitive) =>
        typeof primitive === "boolean"
          ? Either.of(primitive)
          : Left(this.newMistypedValueError("boolean")),
      );
    }

    toDate(): Either<Resource.MistypedValueError, Date> {
      return this.toPrimitive().chain((primitive) =>
        primitive instanceof Date
          ? Either.of(primitive)
          : Left(this.newMistypedValueError("Date")),
      );
    }

    toIdentifier(): Either<Resource.MistypedValueError, Resource.Identifier> {
      switch (this.object.termType) {
        case "BlankNode":
        case "NamedNode":
          return Either.of(this.object);
        default:
          return Left(this.newMistypedValueError("BlankNode|NamedNode"));
      }
    }

    toIri(): Either<Resource.MistypedValueError, NamedNode> {
      return this.object.termType === "NamedNode"
        ? Either.of(this.object)
        : Left(this.newMistypedValueError("NamedNode"));
    }

    toList(): Either<Resource.ValueError, readonly Resource.Value[]> {
      return this.toResource().chain((resource) => resource.toList());
    }

    toLiteral(): Either<Resource.MistypedValueError, Literal> {
      return this.object.termType === "Literal"
        ? Either.of(this.object)
        : Left(this.newMistypedValueError("Literal"));
    }

    toNamedResource(): Either<
      Resource.MistypedValueError,
      Resource<NamedNode>
    > {
      return this.toIri().map(
        (identifier) =>
          new Resource<NamedNode>({
            dataset: this.subject.dataset,
            identifier,
          }),
      );
    }

    toNumber(): Either<Resource.MistypedValueError, number> {
      return this.toPrimitive().chain((primitive) =>
        typeof primitive === "number"
          ? Either.of(primitive)
          : Left(this.newMistypedValueError("number")),
      );
    }

    toPrimitive(): Either<
      Resource.MistypedValueError,
      boolean | Date | number | string
    > {
      if (this.object.termType !== "Literal") {
        return Left(
          new Resource.MistypedValueError({
            actualValue: this.object,
            expectedValueType: "Literal",
            focusResource: this.subject,
            predicate: this.predicate,
          }),
        );
      }

      try {
        return Either.of(fromRdf(this.object, true));
      } catch {
        return Left(
          new Resource.MistypedValueError({
            actualValue: this.object,
            expectedValueType: "primitive",
            focusResource: this.subject,
            predicate: this.predicate,
          }),
        );
      }
    }

    toResource(): Either<Resource.MistypedValueError, Resource> {
      return this.toIdentifier().map(
        (identifier) =>
          new Resource({ dataset: this.subject.dataset, identifier }),
      );
    }

    toString(): Either<Resource.MistypedValueError, string> {
      return this.toPrimitive().chain((primitive) =>
        typeof primitive === "string"
          ? Either.of(primitive as string)
          : Left(this.newMistypedValueError("string")),
      );
    }

    toTerm(): BlankNode | Literal | NamedNode {
      return this.object;
    }

    toValues(): Values {
      return new SingletonValues({
        object: this,
        predicate: this.predicate,
        subject: this.subject,
      });
    }

    private newMistypedValueError(
      expectedValueType: string,
    ): Resource.MistypedValueError {
      return new Resource.MistypedValueError({
        actualValue: this.object,
        expectedValueType,
        focusResource: this.subject,
        predicate: this.predicate,
      });
    }
  }

  export class ValueError extends Error {
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

  export class MistypedValueError extends ValueError {
    readonly actualValue: Exclude<Quad_Object, "Variable">;
    readonly expectedValueType: string;

    constructor({
      actualValue,
      expectedValueType,
      focusResource,
      predicate,
    }: {
      actualValue: Exclude<Quad_Object, "Variable">;
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

  export class MultipleValueError extends ValueError {
    readonly values: readonly Exclude<Quad_Object, "Variable">[];

    constructor({
      focusResource,
      predicate,
      values,
    }: {
      focusResource: Resource;
      predicate: NamedNode;
      values: readonly Exclude<Quad_Object, "Variable">[];
    }) {
      super({
        focusResource,
        message: `${Identifier.toString(focusResource.identifier)} has multiple ${predicate.value} values: ${JSON.stringify(values.map((object) => object.value))}`,
        predicate,
      });
      this.values = values;
    }
  }

  export class ValueOf {
    private readonly object: Resource;
    private readonly predicate: NamedNode;
    private readonly subject: BlankNode | NamedNode;

    constructor({
      object,
      predicate,
      subject,
    }: {
      object: Resource;
      predicate: NamedNode;
      subject: BlankNode | NamedNode;
    }) {
      this.object = object;
      this.predicate = predicate;
      this.subject = subject;
    }

    isIri(): boolean {
      return this.subject.termType === "NamedNode";
    }

    toIdentifier(): Identifier {
      return this.subject;
    }

    toIri(): Either<Resource.MistypedValueError, NamedNode> {
      return this.subject.termType === "NamedNode"
        ? Either.of(this.subject)
        : Left(this.newMistypedValueError("NamedNode"));
    }

    toNamedResource(): Either<
      Resource.MistypedValueError,
      Resource<NamedNode>
    > {
      return this.toIri().map(
        (identifier) =>
          new Resource<NamedNode>({
            dataset: this.object.dataset,
            identifier,
          }),
      );
    }

    toResource(): Resource {
      return new Resource({
        dataset: this.object.dataset,
        identifier: this.subject,
      });
    }

    toTerm(): Exclude<Quad_Subject, Quad | Variable> {
      return this.subject;
    }

    private newMistypedValueError(
      expectedValueType: string,
    ): Resource.MistypedValueError {
      return new Resource.MistypedValueError({
        actualValue: this.subject,
        expectedValueType,
        focusResource: this.object,
        predicate: this.predicate,
      });
    }
  }

  export abstract class Values implements Iterable<Value> {
    protected readonly predicate: NamedNode;
    protected readonly subject: Resource;

    protected constructor({
      predicate,
      subject,
    }: {
      predicate: NamedNode;
      subject: Resource;
    }) {
      this.predicate = predicate;
      this.subject = subject;
    }

    abstract [Symbol.iterator](): Iterator<Value>;

    filter(
      predicate: (value: Value, index: number) => boolean,
    ): Resource.Values {
      const array: Resource.Value[] = [];
      let valueI = 0;
      for (const value of this) {
        if (predicate(value, valueI)) {
          array.push(value);
        }
        valueI++;
      }
      return new ArrayValues({
        objects: array,
        predicate: this.predicate,
        subject: this.subject,
      });
    }

    find(
      predicate: (value: Value, index: number) => boolean,
    ): Either<MissingValueError, Value> {
      let valueI = 0;
      for (const value of this) {
        if (predicate(value, valueI)) {
          return Either.of(value);
        }
        valueI++;
      }
      return Left(
        new MissingValueError({
          focusResource: this.subject,
          predicate: this.predicate,
        }),
      );
    }

    flatMap<U>(
      callback: (value: Value, index: number) => U | ReadonlyArray<U>,
    ): readonly U[] {
      return this.toArray().flatMap(callback);
    }

    head(): Either<ValueError, Value> {
      for (const value of this) {
        return Either.of(value);
      }
      return Left(
        new MissingValueError({
          focusResource: this.subject,
          predicate: this.predicate,
        }),
      );
    }

    map<U>(callback: (value: Value, index: number) => U): readonly U[] {
      return this.toArray().map(callback);
    }

    abstract toArray(): readonly Value[];
  }

  export abstract class ValuesOf implements Iterable<ValueOf> {
    protected readonly object: Resource;
    protected readonly predicate: NamedNode;

    protected constructor({
      object,
      predicate,
    }: { object: Resource; predicate: NamedNode }) {
      this.object = object;
      this.predicate = predicate;
    }

    abstract [Symbol.iterator](): Iterator<ValueOf>;

    filter(
      predicate: (valueOf_: ValueOf, index: number) => boolean,
    ): Resource.ValuesOf {
      const array: Resource.ValueOf[] = [];
      let valueI = 0;
      for (const valueOf_ of this) {
        if (predicate(valueOf_, valueI)) {
          array.push(valueOf_);
        }
        valueI++;
      }
      return new ArrayValuesOf({
        object: this.object,
        predicate: this.predicate,
        subjects: array,
      });
    }

    flatMap<U>(
      callback: (value: ValueOf, index: number) => U | ReadonlyArray<U>,
    ): readonly U[] {
      return this.toArray().flatMap(callback);
    }

    head(): Either<ValueError, ValueOf> {
      for (const valueOf_ of this) {
        return Either.of(valueOf_);
      }
      return Left(
        new MissingValueError({
          focusResource: this.object,
          predicate: this.predicate,
        }),
      );
    }

    map<U>(callback: (value: ValueOf, index: number) => U): readonly U[] {
      return this.toArray().map(callback);
    }

    abstract toArray(): readonly ValueOf[];
  }
}

/**
 * Private implementation of Resource.Values that iterates over an array.
 */
class ArrayValues extends Resource.Values {
  private readonly objects: readonly Resource.Value[];

  constructor({
    objects,
    predicate,
    subject,
  }: {
    objects: readonly Resource.Value[];
    predicate: NamedNode;
    subject: Resource;
  }) {
    super({ predicate, subject });
    this.objects = objects;
  }

  override [Symbol.iterator](): Iterator<Resource.Value> {
    return this.objects[Symbol.iterator]();
  }

  override toArray(): readonly Resource.Value[] {
    return this.objects;
  }
}

/**
 * Private implementation of Resource.ValuesOf that iterates over an array.
 */
class ArrayValuesOf extends Resource.ValuesOf {
  private readonly subjects: readonly Resource.ValueOf[];

  constructor({
    object,
    predicate,
    subjects,
  }: {
    predicate: NamedNode;
    object: Resource;
    subjects: readonly Resource.ValueOf[];
  }) {
    super({ object, predicate });
    this.subjects = subjects;
  }

  override [Symbol.iterator](): Iterator<Resource.ValueOf> {
    return this.subjects[Symbol.iterator]();
  }

  override toArray(): readonly Resource.ValueOf[] {
    return this.subjects;
  }
}

/**
 * Private implementation of Resource.Values that iterates over a DatasetCore.
 */
class DatasetValues extends Resource.Values {
  private readonly unique: boolean;

  constructor({
    predicate,
    subject,
    unique,
  }: { predicate: NamedNode; subject: Resource; unique: boolean }) {
    super({ predicate, subject });
    this.unique = unique;
  }

  override *[Symbol.iterator](): Iterator<Resource.Value> {
    if (this.unique) {
      const objects = new TermSet<BlankNode | Literal | NamedNode>();
      for (const quad of this.subject.dataset.match(
        this.subject.identifier,
        this.predicate,
        null,
        null,
      )) {
        switch (quad.object.termType) {
          case "BlankNode":
          case "Literal":
          case "NamedNode":
            if (objects.has(quad.object)) {
              continue;
            }
            yield new Resource.Value({
              object: quad.object,
              predicate: this.predicate,
              subject: this.subject,
            });
            objects.add(quad.object);
            break;
        }
      }
      return;
    }

    for (const quad of this.subject.dataset.match(
      this.subject.identifier,
      this.predicate,
      null,
      null,
    )) {
      switch (quad.object.termType) {
        case "BlankNode":
        case "Literal":
        case "NamedNode":
          yield new Resource.Value({
            object: quad.object,
            predicate: this.predicate,
            subject: this.subject,
          });
          break;
      }
    }
  }

  override toArray(): readonly Resource.Value[] {
    return [...this];
  }
}

/**
 * Private implementation of Resource.ValuesOf that iterates over a DatasetCore.
 */
class DatasetValuesOf extends Resource.ValuesOf {
  private readonly unique: boolean;

  constructor({
    object,
    predicate,
    unique,
  }: {
    object: Resource;
    predicate: NamedNode;
    unique: boolean;
  }) {
    super({ object, predicate });
    this.unique = unique;
  }

  override *[Symbol.iterator](): Iterator<Resource.ValueOf> {
    if (this.unique) {
      const subjects = new TermSet<BlankNode | NamedNode>();
      for (const quad of this.object.dataset.match(
        null,
        this.predicate,
        this.object.identifier,
        null,
      )) {
        switch (quad.subject.termType) {
          case "BlankNode":
          case "NamedNode":
            if (subjects.has(quad.subject)) {
              continue;
            }
            yield new Resource.ValueOf({
              object: this.object,
              predicate: this.predicate,
              subject: quad.subject,
            });
            subjects.add(quad.subject);
            break;
        }
      }
      return;
    }

    for (const quad of this.object.dataset.match(
      null,
      this.predicate,
      this.object.identifier,
      null,
    )) {
      switch (quad.subject.termType) {
        case "BlankNode":
        case "NamedNode":
          yield new Resource.ValueOf({
            object: this.object,
            predicate: this.predicate,
            subject: quad.subject,
          });
      }
    }
  }

  override toArray(): readonly Resource.ValueOf[] {
    return [...this];
  }
}

/**
 * Private implementation of Resource.Values that iterates over a single value.
 */
class SingletonValues extends Resource.Values {
  private readonly object: Resource.Value;

  constructor({
    object,
    predicate,
    subject,
  }: { object: Resource.Value; predicate: NamedNode; subject: Resource }) {
    super({ predicate, subject });
    this.object = object;
  }

  override *[Symbol.iterator](): Iterator<Resource.Value> {
    yield this.object;
  }

  override toArray(): readonly Resource.Value[] {
    return [this.object];
  }
}
