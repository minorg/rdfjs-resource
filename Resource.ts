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
import { rdf } from "@tpluscode/rdf-ns-builders";
import { type Either, Left, Right } from "purify-ts";
import { fromRdf } from "rdf-literal";
import { isRdfInstanceOf } from "./isRdfInstanceOf.js";

function defaultValueOfFilter(_valueOf: Resource.ValueOf): boolean {
  return true;
}

function defaultValueFilter(_value: Resource.Value): boolean {
  return true;
}

/**
 * A Resource abstraction over subjects or objects in an RDF/JS dataset.
 */
export class Resource<
  IdentifierT extends Resource.Identifier = Resource.Identifier,
> {
  readonly dataset: DatasetCore;
  readonly identifier: IdentifierT;

  constructor({ dataset, identifier }: Resource.Parameters<IdentifierT>) {
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
    return isRdfInstanceOf({
      class_,
      dataset: this.dataset,
      instance: this.identifier,
      ...options,
    });
  }

  /**
   * Consider the resource itself as an RDF list.
   */
  toList(): Either<Resource.ValueError, readonly Resource.Value[]> {
    if (this.identifier.equals(rdf.nil)) {
      return Right([]);
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

    return Right([new Resource.Value(this, rdf.first, firstObject)]).chain(
      (items) =>
        new Resource({ dataset: this.dataset, identifier: restObject })
          .toList()
          .map((restItems) => items.concat(restItems)),
    );
  }

  /**
   * Get the first matching value of dataset statements (this.identifier, predicate, value).
   */
  value(
    predicate: NamedNode,
    options?: {
      filter?: (value: Resource.Value) => boolean;
    },
  ): Either<Resource.ValueError, Resource.Value> {
    const filter_ = options?.filter ?? defaultValueFilter;
    for (const value of this.values(predicate)) {
      if (filter_(value)) {
        return Right(value);
      }
    }
    return Left(
      new Resource.MissingValueError({
        focusResource: this,
        predicate,
      }),
    );
  }

  /**
   * Get the first matching subject of dataset statements (subject, predicate, this.identifier).
   */
  valueOf(
    predicate: NamedNode,
    options?: {
      filter?: (subject: Resource.ValueOf) => boolean;
    },
  ): Either<Resource.ValueError, Resource.ValueOf> {
    const filter_ = options?.filter ?? defaultValueOfFilter;
    for (const valueOf_ of this.valuesOf(predicate)) {
      if (filter_(valueOf_)) {
        return Right(valueOf_);
      }
    }
    return Left(
      new Resource.MissingValueError({
        focusResource: this,
        predicate,
      }),
    );
  }

  /**
   * Get all values of dataset statements (this.identifier, predicate, value).
   */
  *values(
    predicate: NamedNode,
    options?: { unique?: boolean },
  ): Generator<Resource.Value> {
    const uniqueObjects = options?.unique
      ? new TermSet<BlankNode | Literal | NamedNode>()
      : undefined;

    for (const quad of this.dataset.match(
      this.identifier,
      predicate,
      null,
      null,
    )) {
      switch (quad.object.termType) {
        case "BlankNode":
        case "Literal":
        case "NamedNode":
          if (uniqueObjects) {
            if (uniqueObjects.has(quad.object)) {
              continue;
            }
            yield new Resource.Value(this, predicate, quad.object);
            uniqueObjects.add(quad.object);
          } else {
            yield new Resource.Value(this, predicate, quad.object);
          }
          break;
      }
    }
  }

  /**
   * Get the first subject of dataset statements (subject, predicate, this.identifier).
   */
  *valuesOf(
    predicate: NamedNode,
    options?: { unique: true },
  ): Generator<Resource.ValueOf> {
    const uniqueSubjects = options?.unique
      ? new TermSet<BlankNode | NamedNode>()
      : undefined;
    for (const quad of this.dataset.match(
      null,
      predicate,
      this.identifier,
      null,
    )) {
      switch (quad.subject.termType) {
        case "BlankNode":
        case "NamedNode":
          if (uniqueSubjects) {
            if (uniqueSubjects.has(quad.subject)) {
              continue;
            }
            yield new Resource.ValueOf(quad.subject, predicate, this);
            uniqueSubjects.add(quad.subject);
          } else {
            yield new Resource.ValueOf(quad.subject, predicate, this);
          }
          break;
      }
    }
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

  export interface Parameters<IdentifierT extends Identifier> {
    dataset: DatasetCore;
    identifier: IdentifierT;
  }

  export class Value {
    constructor(
      private readonly subject: Resource,
      private readonly predicate: NamedNode,
      private readonly object: Exclude<Quad_Object, Quad | Variable>,
    ) {}

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
          ? Right(primitive)
          : Left(this.newMistypedValueError("boolean")),
      );
    }

    toDate(): Either<Resource.MistypedValueError, Date> {
      return this.toPrimitive().chain((primitive) =>
        primitive instanceof Date
          ? Right(primitive)
          : Left(this.newMistypedValueError("Date")),
      );
    }

    toIdentifier(): Either<Resource.MistypedValueError, Resource.Identifier> {
      switch (this.object.termType) {
        case "BlankNode":
        case "NamedNode":
          return Right(this.object);
        default:
          return Left(this.newMistypedValueError("BlankNode|NamedNode"));
      }
    }

    toIri(): Either<Resource.MistypedValueError, NamedNode> {
      return this.object.termType === "NamedNode"
        ? Right(this.object)
        : Left(this.newMistypedValueError("NamedNode"));
    }

    toList(): Either<Resource.ValueError, readonly Resource.Value[]> {
      return this.toResource().chain((resource) => resource.toList());
    }

    toLiteral(): Either<Resource.MistypedValueError, Literal> {
      return this.object.termType === "Literal"
        ? Right(this.object)
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
          ? Right(primitive)
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
        return Right(fromRdf(this.object, true));
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
          ? Right(primitive as string)
          : Left(this.newMistypedValueError("string")),
      );
    }

    toTerm(): Exclude<Quad_Object, Quad | Variable> {
      return this.object;
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
    constructor(
      private readonly subject: Exclude<Quad_Subject, Quad | Variable>,
      private readonly predicate: NamedNode,
      private readonly object: Resource,
    ) {}

    isIri(): boolean {
      return this.subject.termType === "NamedNode";
    }

    toIdentifier(): Identifier {
      return this.subject;
    }

    toIri(): Either<Resource.MistypedValueError, NamedNode> {
      return this.subject.termType === "NamedNode"
        ? Right(this.subject)
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
}
