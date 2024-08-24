import type { DataFactory, DatasetCore } from "@rdfjs/types";
import { MutableResource } from "./MutableResource.js";
import type { Resource } from "./Resource.js";
import { ResourceSet } from "./ResourceSet.js";

/**
 * A ResourceSet wraps an RDF/JS dataset with convenient resource factory methods.
 */
export class MutableResourceSet extends ResourceSet {
  protected readonly dataFactory: DataFactory;

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

  mutableResource({
    identifier,
    mutateGraph,
  }: {
    identifier: Resource.Identifier;
    mutateGraph: MutableResource.MutateGraph;
  }): MutableResource {
    return new MutableResource({
      dataFactory: this.dataFactory,
      dataset: this.dataset,
      identifier,
      mutateGraph,
    });
  }
}
