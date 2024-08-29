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
import { Either, Just, Left, Maybe, Nothing } from "purify-ts";
import { fromRdf } from "rdf-literal";
import { getRdfList } from "./getRdfList.js";
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
  toList(): Either<Error, readonly Resource.Value[]> {
    return Either.encase(() =>
      [
        ...getRdfList({
          dataset: this.dataset,
          node: this.identifier,
        }),
      ].map((value) => new Resource.Value(value, this)),
    );
  }

  /**
   * Get the first matching value of dataset statements (this.identifier, property, value).
   */
  value(
    property: NamedNode,
    options?: {
      filter?: (value: Resource.Value) => boolean;
    },
  ): Maybe<Resource.Value> {
    const filter_ = options?.filter ?? defaultValueFilter;
    for (const value of this.values(property)) {
      if (filter_(value)) {
        return Maybe.of(value);
      }
    }
    return Maybe.empty();
  }

  /**
   * Get the first matching subject of dataset statements (subject, property, this.identifier).
   */
  valueOf(
    property: NamedNode,
    options?: {
      filter?: (subject: Resource.ValueOf) => boolean;
    },
  ): Maybe<Resource.ValueOf> {
    const filter_ = options?.filter ?? defaultValueOfFilter;
    for (const valueOf_ of this.valuesOf(property)) {
      if (filter_(valueOf_)) {
        return Just(valueOf_);
      }
    }
    return Nothing;
  }

  /**
   * Get all values of dataset statements (this.identifier, property, value).
   */
  *values(
    property: NamedNode,
    options?: { unique?: boolean },
  ): Generator<Resource.Value> {
    const uniqueObjects = options?.unique
      ? new TermSet<BlankNode | Literal | NamedNode>()
      : undefined;

    for (const quad of this.dataset.match(
      this.identifier,
      property,
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
            yield new Resource.Value(quad.object, this);
            uniqueObjects.add(quad.object);
          } else {
            yield new Resource.Value(quad.object, this);
          }
          break;
      }
    }
  }

  /**
   * Get the first subject of dataset statements (subject, property, this.identifier).
   */
  *valuesOf(
    property: NamedNode,
    options?: { unique: true },
  ): Generator<Resource.ValueOf> {
    const uniqueSubjects = options?.unique
      ? new TermSet<BlankNode | NamedNode>()
      : undefined;
    for (const quad of this.dataset.match(
      null,
      property,
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
            yield new Resource.ValueOf(this, quad.subject);
            uniqueSubjects.add(quad.subject);
          } else {
            yield new Resource.ValueOf(this, quad.subject);
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
      private readonly object: Exclude<Quad_Object, Quad | Variable>,
      private readonly subjectResource: Resource,
    ) {}

    isBoolean(): boolean {
      return this.toBoolean().isJust();
    }

    isDate(): boolean {
      return this.toDate().isJust();
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
      return this.toNumber().isJust();
    }

    isPrimitive(): boolean {
      return this.toPrimitive().isJust();
    }

    isString(): boolean {
      return this.toString().isJust();
    }

    toBoolean(): Maybe<boolean> {
      return this.toPrimitive().chain((primitive) =>
        typeof primitive === "boolean" ? Just(primitive) : Nothing,
      );
    }

    toDate(): Maybe<Date> {
      return this.toPrimitive().chain((primitive) =>
        primitive instanceof Date ? Just(primitive) : Nothing,
      );
    }

    toIdentifier(): Maybe<Resource.Identifier> {
      switch (this.object.termType) {
        case "BlankNode":
        case "NamedNode":
          return Just(this.object);
        default:
          return Nothing;
      }
    }

    toIri(): Maybe<NamedNode> {
      return this.object.termType === "NamedNode" ? Just(this.object) : Nothing;
    }

    toLiteral(): Maybe<Literal> {
      return this.object.termType === "Literal" ? Just(this.object) : Nothing;
    }

    toList(): Either<Error, readonly Resource.Value[]> {
      const object = this.object;
      switch (object.termType) {
        case "BlankNode":
        case "NamedNode": {
          return Either.encase(() => {
            return [
              ...getRdfList({
                dataset: this.subjectResource.dataset,
                node: object,
              }),
            ].map((value) => new Value(value, this.subjectResource));
          });
        }
        default:
          return Left(new Error("object is not an identifier"));
      }
    }

    toNamedResource(): Maybe<Resource<NamedNode>> {
      return this.toIri().map(
        (identifier) =>
          new Resource<NamedNode>({
            dataset: this.subjectResource.dataset,
            identifier,
          }),
      );
    }

    toNumber(): Maybe<number> {
      return this.toPrimitive().chain((primitive) =>
        typeof primitive === "number" ? Just(primitive) : Nothing,
      );
    }

    toPrimitive(): Maybe<boolean | Date | number | string> {
      if (this.object.termType !== "Literal") {
        return Nothing;
      }

      try {
        return Just(fromRdf(this.object, true));
      } catch {
        return Nothing;
      }
    }

    toResource(): Maybe<Resource> {
      return this.toIdentifier().map(
        (identifier) =>
          new Resource({ dataset: this.subjectResource.dataset, identifier }),
      );
    }

    toString(): Maybe<string> {
      return this.toPrimitive().chain((primitive) =>
        typeof primitive === "string" ? Just(primitive as string) : Nothing,
      );
    }

    toTerm(): Exclude<Quad_Object, Quad | Variable> {
      return this.object;
    }
  }

  export class ValueOf {
    constructor(
      private readonly objectResource: Resource,
      private readonly subject: Exclude<Quad_Subject, Quad | Variable>,
    ) {}

    isIri(): boolean {
      return this.subject.termType === "NamedNode";
    }

    toIdentifier(): Identifier {
      return this.subject;
    }

    toIri(): Maybe<NamedNode> {
      return this.subject.termType === "NamedNode"
        ? Just(this.subject)
        : Nothing;
    }

    toNamedResource(): Maybe<Resource<NamedNode>> {
      return this.toIri().map(
        (identifier) =>
          new Resource<NamedNode>({
            dataset: this.objectResource.dataset,
            identifier,
          }),
      );
    }

    toResource(): Resource {
      return new Resource({
        dataset: this.objectResource.dataset,
        identifier: this.subject,
      });
    }

    toTerm(): Exclude<Quad_Subject, Quad | Variable> {
      return this.subject;
    }
  }
}
