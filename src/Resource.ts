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
import { rdf, rdfs } from "./vocabularies.js";

type AddableValue = BlankNode | Literal | NamedNode | boolean | number | string;

/**
 * A Resource abstraction over subjects or objects in an RDF/JS dataset.
 */
export class Resource<
  IdentifierT extends Resource.Identifier = Resource.Identifier,
> {
  readonly dataset: DatasetCore;
  readonly identifier: IdentifierT;

  /**
   * Delete zero or more values from this resource.
   *
   * If value is empty, delete all values of p
   * Else delete (p, arrayValue) for each value in the array.
   */
  delete(predicate: NamedNode, ...values: readonly AddableValue[]): this {
    if (values.length === 0) {
      for (const quad of [
        ...this.dataset.match(
          this.identifier,
          predicate,
          null,
          this.mutateGraph,
        ),
      ]) {
        this.dataset.delete(quad);
      }
    } else {
      for (const term of this.addableValuesToTerms(values)) {
        for (const quad of [
          ...this.dataset.match(
            this.identifier,
            predicate,
            term,
            this.mutateGraph,
          ),
        ]) {
          this.dataset.delete(quad);
        }
      }
    }
    return this;
  }

  /**
   * Delete all existing values of p and then add the specified values.
   */
  set(predicate: NamedNode, ...values: readonly AddableValue[]): this {
    this.delete(predicate);
    return this.add(predicate, ...values);
  }

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

  /**
   * Add zero or more values to this resource.
   */
  add(predicate: NamedNode, ...values: readonly AddableValue[]): this {
    for (const term of this.addableValuesToTerms(values)) {
      this.dataset.add(
        this.dataFactory.quad(
          this.identifier,
          predicate,
          term,
          this.mutateGraph,
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
      return new Resource({
        dataFactory: this.dataFactory,
        dataset: this.dataset,
        identifier: rdf.nil,
        mutateGraph: this.mutateGraph,
      });
    }

    const mintSubListIdentifier =
      options?.mintSubListIdentifier ?? (() => this.dataFactory.blankNode());

    const listResource = new Resource({
      dataFactory: this.dataFactory,
      dataset: this.dataset,
      identifier: mintSubListIdentifier(itemsArray[0], 0),
      mutateGraph: this.mutateGraph,
    });
    listResource.addListItems(itemsArray, { mintSubListIdentifier });

    this.add(predicate, listResource.identifier);

    return listResource;
  }

  private addableValueToTerm(
    value: AddableValue,
  ): BlankNode | Literal | NamedNode {
    switch (typeof value) {
      case "boolean":
      case "number":
      case "string":
        return toRdf(value, { dataFactory: this.dataFactory });
      case "object":
        return value;
    }
  }

  private addableValuesToTerms(
    values: readonly AddableValue[],
  ): readonly (BlankNode | Literal | NamedNode)[] {
    return values.map((value) => this.addableValueToTerm(value));
  }

  /**
   * Add rdf:first and rdf:rest predicates to the current Resource.
   */
  addListItems(
    items: Iterable<AddableValue>,
    options?: {
      addSubListResourceValues?: (subListResource: Resource) => void;
      mintSubListIdentifier?: (
        item: AddableValue,
        itemIndex: number,
      ) => BlankNode | NamedNode;
    },
  ): this {
    const addSubListResourceValues =
      options?.addSubListResourceValues ?? (() => {});
    const mintSubListIdentifier =
      options?.mintSubListIdentifier ?? (() => this.dataFactory.blankNode());

    let currentHead: Resource = this;
    let itemIndex = 0;
    for (const item of items) {
      if (itemIndex > 0) {
        // If currentHead !== this, then create a new head and point the current head's rdf:rest at it
        const newHead = new Resource({
          dataFactory: this.dataFactory,
          dataset: this.dataset,
          identifier: mintSubListIdentifier(item, itemIndex),
          mutateGraph: this.mutateGraph,
        });
        addSubListResourceValues(newHead);
        currentHead.add(rdf.rest, newHead.identifier);
        currentHead = newHead;
      }
      currentHead.add(rdf.first, item);
      itemIndex++;
    }
    if (itemIndex > 0) {
      // If there were any items there was an rdf:first on the current head
      // Close that head by adding an rdf:rest rdf:nil
      currentHead.add(rdf.rest, rdf.nil);
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

export namespace Resource {}
