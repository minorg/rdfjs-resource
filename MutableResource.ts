import type {
  BlankNode,
  DataFactory,
  Literal,
  NamedNode,
  Quad_Graph,
  Variable,
} from "@rdfjs/types";
import { rdf } from "@tpluscode/rdf-ns-builders";
import { Maybe } from "purify-ts";
import { toRdf } from "rdf-literal";
import { Resource } from "./Resource.js";

type AddableValue =
  | BlankNode
  | Literal
  | NamedNode
  | boolean
  | Date
  | number
  | Resource
  | string;

/**
 * Resource subclass with operations to mutate the underlying dataset.
 */
export class MutableResource<
  IdentifierT extends Resource.Identifier = Resource.Identifier,
  MutateGraphT extends
    MutableResource.MutateGraph = MutableResource.MutateGraph,
> extends Resource<IdentifierT> {
  readonly dataFactory: DataFactory;
  readonly mutateGraph: MutateGraphT;

  constructor({
    dataFactory,
    mutateGraph,
    ...resourceParameters
  }: {
    dataFactory: DataFactory;
    mutateGraph: MutateGraphT;
  } & ConstructorParameters<typeof Resource<IdentifierT>>[0]) {
    super(resourceParameters);
    this.dataFactory = dataFactory;
    this.mutateGraph = mutateGraph;
  }

  /**
   * Add zero or more values to this resource.
   *
   * If value is Maybe and Just, add (p, value).
   * If value is Maybe and Nothing, do nothing.
   * If value is an array, add all the values separately.
   * If value is undefined, do nothing.
   * Else add (p, value).
   */
  add(
    predicate: NamedNode,
    value:
      | AddableValue
      | readonly AddableValue[]
      | Maybe<AddableValue>
      | undefined,
  ): this {
    for (const term of this.addableValuesToTerms(value)) {
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
    options?: Parameters<MutableResource["addListItems"]>[1],
  ): MutableResource {
    const itemsArray = [...items];
    if (itemsArray.length === 0) {
      return new MutableResource({
        dataFactory: this.dataFactory,
        dataset: this.dataset,
        identifier: rdf.nil,
        mutateGraph: this.mutateGraph,
      });
    }

    const mintSubListIdentifier =
      options?.mintSubListIdentifier ?? (() => this.dataFactory.blankNode());

    const listResource = new MutableResource({
      dataFactory: this.dataFactory,
      dataset: this.dataset,
      identifier: mintSubListIdentifier(itemsArray[0], 0),
      mutateGraph: this.mutateGraph,
    });
    listResource.addListItems(itemsArray, { mintSubListIdentifier });

    this.add(predicate, listResource.identifier);

    return listResource;
  }

  /**
   * Add rdf:first and rdf:rest predicates to the current MutableResource.
   */
  addListItems(
    items: Iterable<AddableValue>,
    options?: {
      addSubListResourceValues?: (subListResource: MutableResource) => void;
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

    let currentHead: MutableResource = this;
    let itemIndex = 0;
    for (const item of items) {
      if (itemIndex > 0) {
        // If currentHead !== this, then create a new head and point the current head's rdf:rest at it
        const newHead = new MutableResource({
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

  /**
   * Delete zero or more values from this resource.
   *
   * If value is undefined, delete all values of p.
   * If value is an array, delete (p, arrayValue) for each value in the array.
   * Else delete (p, value).
   */
  delete(
    predicate: NamedNode,
    value?: AddableValue | readonly AddableValue[],
  ): this {
    if (typeof value === "undefined") {
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
      for (const term of this.addableValuesToTerms(value)) {
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
  set(
    predicate: NamedNode,
    value: AddableValue | readonly AddableValue[],
  ): this {
    this.delete(predicate);
    return this.add(predicate, value);
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
        if (value instanceof Date) {
          return toRdf(value, { dataFactory: this.dataFactory });
        }
        if (value instanceof Resource) {
          return value.identifier;
        }
        return value;
    }
  }

  private addableValuesToTerms(
    value:
      | AddableValue
      | readonly AddableValue[]
      | Maybe<AddableValue>
      | undefined,
  ): readonly (BlankNode | Literal | NamedNode)[] {
    if (typeof value === "undefined") {
      return [];
    }
    if (Array.isArray(value)) {
      return value.map((subValue) => this.addableValueToTerm(subValue));
    }
    if (Maybe.isMaybe(value)) {
      return value
        .map((subValue) => this.addableValueToTerm(subValue))
        .toList();
    }
    // TypeScript doesn't pick up that we've handled the array case above, so we have to cast here.
    return [this.addableValueToTerm(value as AddableValue)];
  }
}

export namespace MutableResource {
  export type MutateGraph = Exclude<Quad_Graph, Variable>;
}
