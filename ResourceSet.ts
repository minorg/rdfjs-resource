import TermSet from "@rdfjs/term-set";
import type {
  BlankNode,
  DatasetCore,
  NamedNode,
  Quad_Graph,
  Variable,
} from "@rdfjs/types";
import { rdf, rdfs } from "@tpluscode/rdf-ns-builders";
import { Resource } from "./Resource.js";

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
    for (const identifier of this.instanceIdentifiers(class_, options)) {
      yield this.resource(identifier);
    }
  }

  *namedInstancesOf(
    class_: NamedNode,
    options?: Parameters<ResourceSet["instancesOf"]>[1],
  ): Generator<Resource<NamedNode>> {
    for (const identifier of this.instanceIdentifiers(class_, options)) {
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

  private *instanceIdentifiers(
    class_: NamedNode,
    options?: Parameters<ResourceSet["instancesOf"]>[1],
  ): Generator<BlankNode | NamedNode> {
    yield* instanceIdentifiersRecursive({
      class_,
      dataset: this.dataset,
      visitedClasses: new TermSet<NamedNode>(),
      yieldedInstanceIdentifiers: new TermSet<BlankNode | NamedNode>(),
    });

    function* instanceIdentifiersRecursive({
      class_,
      dataset,
      visitedClasses,
      yieldedInstanceIdentifiers,
    }: {
      class_: NamedNode;
      dataset: DatasetCore;
      visitedClasses: TermSet<NamedNode>;
      yieldedInstanceIdentifiers: TermSet<BlankNode | NamedNode>;
    }): Generator<BlankNode | NamedNode> {
      // Get instanceQuads of the class
      for (const quad of dataset.match(
        null,
        options?.instanceOfPredicate ?? rdf.type,
        class_,
        options?.graph,
      )) {
        switch (quad.subject.termType) {
          case "BlankNode":
          case "NamedNode":
            if (!yieldedInstanceIdentifiers.has(quad.subject)) {
              yield quad.subject;
              yieldedInstanceIdentifiers.add(quad.subject);
            }
            break;
          default:
            break;
        }
      }

      visitedClasses.add(class_);

      if (options?.excludeSubclasses) {
        return;
      }

      // Recurse into class's sub-classes that haven't been visited yet.
      for (const quad of dataset.match(
        null,
        options?.subClassOfPredicate ?? rdfs.subClassOf,
        class_,
        options?.graph,
      )) {
        if (quad.subject.termType !== "NamedNode") {
          continue;
        }
        if (visitedClasses.has(quad.subject)) {
          continue;
        }
        yield* instanceIdentifiersRecursive({
          class_: quad.subject,
          dataset,
          visitedClasses,
          yieldedInstanceIdentifiers,
        });
      }
    }
  }
}
