import type {
  DataFactory,
  NamedNode,
  Quad_Graph,
  Variable,
} from "@rdfjs/types";
import type { Resource } from "./Resource.js";
import { Values } from "./Values.js";

export abstract class DatasetValues<ValueT> extends Values<ValueT> {
  protected readonly dataFactory: DataFactory;
  protected readonly graph: Exclude<Quad_Graph, Variable> | null;
  protected readonly unique: boolean;

  constructor({
    dataFactory,
    focusResource,
    graph,
    propertyPath,
    unique,
  }: {
    dataFactory: DataFactory;
    focusResource: Resource;
    graph: Exclude<Quad_Graph, Variable> | null;
    propertyPath: NamedNode;
    unique: boolean;
  }) {
    super({ focusResource, propertyPath });
    this.dataFactory = dataFactory;
    this.graph = graph;
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
