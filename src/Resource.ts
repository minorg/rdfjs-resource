import DefaultDataFactory from "@rdfjs/data-model";
import TermSet from "@rdfjs/term-set";
import type {
  DataFactory,
  DatasetCore,
  NamedNode,
  Quad_Graph,
  Variable,
} from "@rdfjs/types";

import { Either, Left } from "purify-ts";
import { DatasetValues } from "./DatasetValues.js";
import { Identifier as _Identifier, type Identifier } from "./Identifier.js";
import { ListStructureError as _ListStructureError } from "./ListStructureError.js";
import { LiteralFactory } from "./LiteralFactory.js";
import { MistypedTermValueError as _MistypedTermValueError } from "./MistypedTermValueError.js";
import type { Primitive } from "./Primitive.js";
import type { PropertyPath } from "./PropertyPath.js";
import type { Term } from "./Term.js";
import { TermWrapper } from "./TermWrapper.js";
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
  private readonly graph?: Exclude<Quad_Graph, Variable>;
  private readonly literalFactory: LiteralFactory;

  constructor(
    readonly dataset: DatasetCore,
    readonly identifier: IdentifierT,
    options?: {
      dataFactory?: DataFactory;
    },
  ) {
    this.dataFactory = options?.dataFactory ?? DefaultDataFactory;
    this.literalFactory = new LiteralFactory({ dataFactory: this.dataFactory });
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
        this.dataFactory.quad(
          this.identifier,
          predicate,
          term,
          graph ?? this.graph,
        ),
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
    listResource.addListItems(itemsArray, {
      graph: options?.graph,
      mintSubListIdentifier,
    });

    this.add(predicate, listResource.identifier, options?.graph);

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
      ) => Identifier;
    },
  ): this {
    const addSubListResourceValues =
      options?.addSubListResourceValues ?? (() => {});
    const graph = options?.graph ?? this.graph;
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
        ...this.dataset.match(
          this.identifier,
          predicate,
          null,
          graph ?? this.graph,
        ),
      ]) {
        this.dataset.delete(quad);
      }
    } else {
      for (const term of this.addableValuesToTerms(object)) {
        for (const quad of [
          ...this.dataset.match(
            this.identifier,
            predicate,
            term,
            graph ?? this.graph,
          ),
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
      graph?: Exclude<Quad_Graph, Variable>;
      instanceOfPredicate?: NamedNode;
      subClassOfPredicate?: NamedNode;
    },
  ): boolean {
    return isInstanceOfRecursive({
      class_,
      dataset: this.dataset,
      graph: options?.graph ?? this.graph,
      instance: this.identifier,
      visitedClasses: new TermSet<NamedNode>(),
    });

    function isInstanceOfRecursive({
      class_,
      dataset,
      graph,
      instance,
      visitedClasses,
    }: {
      class_: NamedNode;
      dataset: DatasetCore;
      graph: Exclude<Quad_Graph, Variable> | undefined;
      instance: Identifier;
      visitedClasses: TermSet<NamedNode>;
    }): boolean {
      for (const _ of dataset.match(
        instance,
        options?.instanceOfPredicate ?? rdf.type,
        class_,
        graph,
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
        graph,
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
            graph,
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
      graph?: Exclude<Quad_Graph, Variable>;
      subClassOfPredicate?: NamedNode;
    },
  ): boolean {
    return isSubClassOfRecursive({
      class_,
      dataset: this.dataset,
      graph: options?.graph ?? this.graph,
      thisIdentifier: this.identifier,
      visitedClasses: new TermSet<NamedNode>(),
    });

    function isSubClassOfRecursive({
      class_,
      dataset,
      graph,
      thisIdentifier,
      visitedClasses,
    }: {
      class_: NamedNode;
      dataset: DatasetCore;
      graph: Exclude<Quad_Graph, Variable> | undefined;
      thisIdentifier: Identifier;
      visitedClasses: TermSet<NamedNode>;
    }): boolean {
      for (const _ of dataset.match(
        thisIdentifier,
        options?.subClassOfPredicate ?? rdfs.subClassOf,
        class_,
        graph,
      )) {
        return true;
      }

      visitedClasses.add(class_);

      // Recurse into class's sub-classes that haven't been visited yet.
      for (const quad of dataset.match(
        null,
        options?.subClassOfPredicate ?? rdfs.subClassOf,
        class_,
        graph,
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
            graph,
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
  toList(options?: {
    graph?: Exclude<Quad_Graph, Variable>;
  }): Either<Resource.ValueError, Resource.Values<TermWrapper>> {
    if (this.identifier.equals(rdf.nil)) {
      return Either.of(
        Resource.Values.fromArray({
          focusResource: this,
          propertyPath: rdf.nil,
          values: [],
        }),
      );
    }

    const graph = options?.graph ?? this.graph;

    const firstObjects = [
      ...new TermSet(
        [...this.dataset.match(this.identifier, rdf.first, null, graph)].map(
          (quad) => quad.object,
        ),
      ),
    ];
    if (firstObjects.length === 0) {
      return Left(
        new Resource.ListStructureError({
          focusResource: this,
          message: "list has no rdf:first statements",
          propertyPath: rdf.first,
        }),
      );
    }
    if (firstObjects.length > 1) {
      return Left(
        new Resource.ListStructureError({
          focusResource: this,
          message: "list has multiple rdf:first statements",
          propertyPath: rdf.first,
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
            propertyPath: rdf.first,
          }),
        );
    }

    const restObjects = [
      ...new TermSet(
        [...this.dataset.match(this.identifier, rdf.rest, null, graph)].map(
          (quad) => quad.object,
        ),
      ),
    ];
    if (restObjects.length === 0) {
      return Left(
        new Resource.ListStructureError({
          focusResource: this,
          message: "list has no rdf:rest statements",
          propertyPath: rdf.rest,
        }),
      );
    }
    if (restObjects.length > 1) {
      return Left(
        new Resource.ListStructureError({
          focusResource: this,
          message: "list has multiple rdf:rest statements",
          propertyPath: rdf.rest,
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
            propertyPath: rdf.rest,
          }),
        );
    }

    return Either.of<Resource.ValueError, Resource.Values<TermWrapper<Term>>>(
      new TermWrapper({
        dataFactory: this.dataFactory,
        focusResource: this,
        propertyPath: rdf.first,
        term: firstObject,
      }).toValues(),
    ).chain((items) =>
      new Resource(this.dataset, restObject, {
        dataFactory: this.dataFactory,
      })
        .toList({ graph })
        .map((restItems) => items.concat(...restItems)),
    );
  }

  /**
   * Get the first matching value for the property path.
   */
  value(
    propertyPath: PropertyPath,
    options?: { graph?: Exclude<Quad_Graph, Variable> },
  ): Either<Resource.ValueError, TermWrapper> {
    return this.values(propertyPath, options).head();
  }

  /**
   * Get all values for the property path.
   */
  values(
    propertyPath: PropertyPath,
    options?: { graph?: Exclude<Quad_Graph, Variable>; unique?: boolean },
  ): Resource.Values<TermWrapper> {
    return new DatasetValues({
      dataFactory: this.dataFactory,
      focusResource: this,
      graph: options?.graph ?? this.graph ?? null,
      propertyPath,
      unique: !!options?.unique,
    });
  }

  private addableValueToTerm(value: AddableValue): Term {
    switch (typeof value) {
      case "bigint":
        return this.literalFactory.bigint(value);
      case "boolean":
        return this.literalFactory.boolean(value);
      case "number":
        return this.literalFactory.number(value);
      case "string":
        return this.literalFactory.string(value);
      case "object":
        return value;
    }
  }

  private addableValuesToTerms(
    values: AddableValue | readonly AddableValue[],
  ): readonly Term[] {
    if (Array.isArray(values)) {
      return values.map((value) => this.addableValueToTerm(value));
    }
    return [this.addableValueToTerm(values as AddableValue)];
  }
}

type AddableValue = Term | Exclude<Primitive, Date>;

export namespace Resource {
  export type Identifier = _Identifier;
  export const Identifier = _Identifier;
  export type ListStructureError = _ListStructureError;
  export const ListStructureError = _ListStructureError;
  export type MistypedTermValueError = _MistypedTermValueError;
  export const MistypedTermValueError = _MistypedTermValueError;
  export type ValueError = _ValueError;
  export const ValueError = _ValueError;
  export type Values<T> = _Values<T>;
  export const Values = _Values;
}
