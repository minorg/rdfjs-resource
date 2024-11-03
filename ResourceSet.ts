import type {
  DatasetCore,
  NamedNode,
  Quad_Graph,
  Variable,
} from "@rdfjs/types";
import { Resource } from "./Resource.js";
import { getRdfInstances } from "./getRdfInstances.js";

/**
 * A ResourceSet wraps an RDF/JS dataset with convenient resource factory methods.
 */
export class ResourceSet {
  readonly dataset: DatasetCore;

  constructor({ dataset }: { dataset: DatasetCore }) {
    this.dataset = dataset;
  }

  *instancesOf(
    class_: NamedNode,
    options?: {
      excludeSubclasses?: boolean;
      graph?: Exclude<Quad_Graph, Variable> | null;
      instanceOfPredicate?: NamedNode;
      subClassOfPredicate?: NamedNode;
    },
  ): Generator<Resource> {
    for (const identifier of getRdfInstances({
      class_,
      dataset: this.dataset,
      ...options,
    })) {
      yield this.resource(identifier);
    }
  }

  *namedInstancesOf(
    class_: NamedNode,
    options?: Parameters<ResourceSet["instancesOf"]>[1],
  ): Generator<Resource<NamedNode>> {
    for (const identifier of getRdfInstances({
      class_,
      dataset: this.dataset,
      ...options,
    })) {
      if (identifier.termType === "NamedNode")
        yield this.namedResource(identifier);
    }
  }

  namedResource(identifier: NamedNode): Resource<NamedNode> {
    return new Resource({
      dataset: this.dataset,
      identifier,
    });
  }

  resource(identifier: Resource.Identifier): Resource {
    return new Resource({
      dataset: this.dataset,
      identifier,
    });
  }
}
