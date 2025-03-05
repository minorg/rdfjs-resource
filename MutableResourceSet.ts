import type { DataFactory, DatasetCore, NamedNode } from "@rdfjs/types";
import { MutableResource } from "./MutableResource.js";
import type { Resource } from "./Resource.js";
import { ResourceSet } from "./ResourceSet.js";

/**
 * A ResourceSet wraps an RDF/JS dataset with convenient resource factory methods.
 */
export class MutableResourceSet extends ResourceSet {
  readonly dataFactory: DataFactory;

  constructor({
    dataFactory,
    dataset,
  }: {
    dataFactory: DataFactory;
    dataset: DatasetCore;
  }) {
    super({ dataset });
    this.dataFactory = dataFactory;
  }

  mutableNamedResource(
    identifier: NamedNode,
    options?: {
      mutateGraph?: MutableResource.MutateGraph;
    },
  ): MutableResource<NamedNode> {
    return new MutableResource<NamedNode>({
      dataFactory: this.dataFactory,
      dataset: this.dataset,
      identifier,
      mutateGraph: options?.mutateGraph,
    });
  }

  mutableResource(
    identifier: Resource.Identifier,
    options?: {
      mutateGraph?: MutableResource.MutateGraph;
    },
  ): MutableResource {
    return new MutableResource({
      dataFactory: this.dataFactory,
      dataset: this.dataset,
      identifier,
      mutateGraph: options?.mutateGraph,
    });
  }
}
