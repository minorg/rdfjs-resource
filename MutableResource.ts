import type {
  BlankNode,
  DataFactory,
  NamedNode,
  Quad,
  Quad_Graph,
  Quad_Object,
  Variable,
} from "@rdfjs/types";
import { rdf } from "@tpluscode/rdf-ns-builders";
import type { Maybe } from "purify-ts";
import { toRdf } from "rdf-literal";
import { Resource } from "./Resource.js";

type Value =
  | Exclude<Quad_Object, Quad | Variable>
  | boolean
  | Date
  | number
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
  }: MutableResource.Parameters<IdentifierT, MutateGraphT>) {
    super(resourceParameters);
    this.dataFactory = dataFactory;
    this.mutateGraph = mutateGraph;
  }

  add(predicate: NamedNode, value: Value): this {
    this.dataset.add(
      this.dataFactory.quad(
        this.identifier,
        predicate,
        this.valueToTerm(value),
        this.mutateGraph,
      ),
    );
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
    items: Iterable<Value>,
    options?: MutableResource.AddListOptions,
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
    items: Iterable<Value>,
    options?: MutableResource.AddListOptions,
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

  addMaybe(predicate: NamedNode, value: Maybe<Value>): this {
    value.ifJust((value) => this.add(predicate, value));
    return this;
  }

  delete(predicate: NamedNode, value?: Value): this {
    for (const quad of [
      ...this.dataset.match(
        this.identifier,
        predicate,
        typeof value !== "undefined" ? this.valueToTerm(value) : undefined,
        this.mutateGraph,
      ),
    ]) {
      this.dataset.delete(quad);
    }
    return this;
  }

  set(predicate: NamedNode, value: Value): this {
    this.delete(predicate);
    return this.add(predicate, value);
  }

  private valueToTerm(value: Value): Exclude<Quad_Object, Quad | Variable> {
    switch (typeof value) {
      case "boolean":
      case "number":
      case "string":
        return toRdf(value, { dataFactory: this.dataFactory });
      case "object":
        if (value instanceof Date) {
          return toRdf(value, { dataFactory: this.dataFactory });
        }
        return value;
    }
  }
}

export namespace MutableResource {
  export interface AddListOptions {
    addSubListResourceValues?: (subListResource: MutableResource) => void;
    mintSubListIdentifier?: (
      item: Value,
      itemIndex: number,
    ) => BlankNode | NamedNode;
  }

  export type MutateGraph = Exclude<Quad_Graph, Variable>;

  export interface Parameters<
    IdentifierT extends Resource.Identifier,
    MutateGraphT extends MutateGraph,
  > extends Resource.Parameters<IdentifierT> {
    dataFactory: DataFactory;
    mutateGraph: MutateGraphT;
  }
}
