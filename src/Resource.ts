import DefaultDataFactory from "@rdfjs/data-model";
import TermSet from "@rdfjs/term-set";
import type {
  BlankNode,
  DataFactory,
  DatasetCore,
  Literal,
  NamedNode,
  Quad_Graph,
  Variable,
} from "@rdfjs/types";

import { Either, Left } from "purify-ts";
import { DatasetObjectValues } from "./DatasetObjectValues.js";
import { DatasetSubjectValues } from "./DatasetSubjectValues.js";
import { Identifier as _Identifier } from "./Identifier.js";
import { IdentifierValue as _IdentifierValue } from "./IdentifierValue.js";
import { ListStructureError as _ListStructureError } from "./ListStructureError.js";
import { LiteralCodec } from "./LiteralDecoder.js";
import { MistypedTermValueError as _MistypedTermValueError } from "./MistypedTermValueError.js";
import type { Primitive } from "./Primitive.js";
import { TermValue as _TermValue } from "./TermValue.js";
import { ValueError as _ValueError } from "./ValueError.js";
import { Values as _Values } from "./Values.js";
import { rdf, rdfs } from "./vocabularies.js";

/**
 * A Resource abstraction over subjects or objects in an RDF/JS dataset.
 */
export class Resource<
  IdentifierT extends Resource.Identifier = Resource.Identifier,
> {
  private readonly dataFactory: DataFactory;
  private readonly literalCodec: LiteralCodec;

  constructor(
    readonly dataset: DatasetCore,
    readonly identifier: IdentifierT,
    options?: { dataFactory?: DataFactory },
  ) {
    this.dataFactory = options?.dataFactory ?? DefaultDataFactory;
    this.literalCodec = new LiteralCodec({ dataFactory: this.dataFactory });
  }

  /**
   * Add zero or more values to this resource.
   */
  add(
    predicate: NamedNode,
    object: AddableValue | readonly AddableValue[],
    graph?: Exclude<Quad_Graph, Variable>,
  ): this {
    for (const term of this.addableValuesToTerms(object)) {
      this.dataset.add(
        this.dataFactory.quad(this.identifier, predicate, term, graph),
      );
    }
    return this;
  }

  /**
   * Create a new list, add items to it, and attach it to this resource via predicate in a
   * (this, predicate, newList) statement.
   *
   * Returns the list resource.
   */
  addList(
    predicate: NamedNode,
    items: Iterable<AddableValue>,
    options?: Parameters<Resource["addListItems"]>[1],
  ): Resource {
    const itemsArray = [...items];
    if (itemsArray.length === 0) {
      return new Resource(this.dataset, rdf.nil, {
        dataFactory: this.dataFactory,
      });
    }

    const mintSubListIdentifier =
      options?.mintSubListIdentifier ?? (() => this.dataFactory.blankNode());

    const listResource = new Resource(
      this.dataset,
      mintSubListIdentifier(itemsArray[0], 0),
      { dataFactory: this.dataFactory },
    );
    listResource.addListItems(itemsArray, { mintSubListIdentifier });

    this.add(predicate, listResource.identifier);

    return listResource;
  }

  /**
   * Add rdf:first and rdf:rest predicates to the current Resource.
   */
  addListItems(
    items: Iterable<AddableValue>,
    options?: {
      addSubListResourceValues?: (subListResource: Resource) => void;
      graph?: Exclude<Quad_Graph, Variable>;
      mintSubListIdentifier?: (
        item: AddableValue,
        itemIndex: number,
      ) => BlankNode | NamedNode;
    },
  ): this {
    const addSubListResourceValues =
      options?.addSubListResourceValues ?? (() => {});
    const graph = options?.graph;
    const mintSubListIdentifier =
      options?.mintSubListIdentifier ?? (() => this.dataFactory.blankNode());

    let currentHead: Resource = this;
    let itemIndex = 0;
    for (const item of items) {
      if (itemIndex > 0) {
        // If currentHead !== this, then create a new head and point the current head's rdf:rest at it
        const newHead = new Resource(
          this.dataset,
          mintSubListIdentifier(item, itemIndex),
          { dataFactory: this.dataFactory },
        );
        addSubListResourceValues(newHead);
        currentHead.add(rdf.rest, newHead.identifier, graph);
        currentHead = newHead;
      }
      currentHead.add(rdf.first, item, graph);
      itemIndex++;
    }
    if (itemIndex > 0) {
      // If there were any items there was an rdf:first on the current head
      // Close that head by adding an rdf:rest rdf:nil
      currentHead.add(rdf.rest, rdf.nil, graph);
    }
    return this;
  }

  /**
   * Delete zero or more values from this resource.
   *
   * If value is empty, delete all values of p
   * Else delete (p, arrayValue) for each value in the array.
   */
  delete(
    predicate: NamedNode,
    object?: AddableValue | readonly AddableValue[],
    graph?: Exclude<Quad_Graph, Variable>,
  ): this {
    if (!object) {
      for (const quad of [
        ...this.dataset.match(this.identifier, predicate, null, graph),
      ]) {
        this.dataset.delete(quad);
      }
    } else {
      for (const term of this.addableValuesToTerms(object)) {
        for (const quad of [
          ...this.dataset.match(this.identifier, predicate, term, graph),
        ]) {
          this.dataset.delete(quad);
        }
      }
    }
    return this;
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
   * Delete all existing values of p and then add the specified values.
   */
  set(
    predicate: NamedNode,
    object: AddableValue | readonly AddableValue[],
    graph?: Exclude<Quad_Graph, Variable>,
  ): this {
    this.delete(predicate, undefined, graph);
    return this.add(predicate, object, graph);
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
      new Resource(this.dataset, restObject)
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

  private addableValueToTerm(
    value: AddableValue,
  ): BlankNode | Literal | NamedNode {
    switch (typeof value) {
      case "boolean":
      case "number":
      case "string":
        return this.literalCodec.fromPrimitive(value);
      case "object":
        return value;
    }
  }

  private addableValuesToTerms(
    values: AddableValue | readonly AddableValue[],
  ): readonly (BlankNode | Literal | NamedNode)[] {
    if (Array.isArray(values)) {
      return values.map((value) => this.addableValueToTerm(value));
    }
    return [this.addableValueToTerm(values as AddableValue)];
  }
}

type AddableValue = BlankNode | Literal | NamedNode | Exclude<Primitive, Date>;

export namespace Resource {
  export type Identifier = _Identifier;
  export const Identifier = _Identifier;
  export type IdentifierValue = _IdentifierValue;
  export const IdentifierValue = _IdentifierValue;
  export type ListStructureError = _ListStructureError;
  export const ListStructureError = _ListStructureError;
  export type MistypedTermValueError = _MistypedTermValueError;
  export const MistypedTermValueError = _MistypedTermValueError;
  export type TermValue = _TermValue;
  export const TermValue = _TermValue;
  export type ValueError = _ValueError;
  export const ValueError = _ValueError;
  export type Values<ValueT> = _Values<ValueT>;
  export const Values = _Values;
}
