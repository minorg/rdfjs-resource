import DefaultDataFactory from "@rdfjs/data-model";
import TermSet from "@rdfjs/term-set";
import type {
  BlankNode,
  DataFactory,
  DatasetCore,
  NamedNode,
  Quad_Graph,
  Variable,
} from "@rdfjs/types";

import { Resource } from "./Resource.js";
import { rdf, rdfs } from "./vocabularies.js";

/**
 * A ResourceSet wraps an RDF/JS dataset with convenient resource factory methods.
 */
export class ResourceSet {
  private readonly dataFactory: DataFactory;
  private readonly graph?: Exclude<Quad_Graph, Variable>;

  constructor(
    readonly dataset: DatasetCore,
    options?: {
      dataFactory?: DataFactory;
      graph?: Exclude<Quad_Graph, Variable>;
    },
  ) {
    this.dataFactory = options?.dataFactory ?? DefaultDataFactory;
    this.graph = options?.graph;
  }

  *instancesOf(
    class_: NamedNode,
    options?: {
      excludeSubclasses?: boolean;
      graph?: Exclude<Quad_Graph, Variable>;
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
        yield this.resource(identifier, { graph: options?.graph });
    }
  }

  resource<IdentifierT extends Resource.Identifier>(
    identifier: IdentifierT,
    options?: { graph?: Exclude<Quad_Graph, Variable> },
  ): Resource<IdentifierT> {
    return new Resource(this.dataset, identifier, {
      dataFactory: this.dataFactory,
      graph: options?.graph ?? this.graph,
    });
  }

  private *instanceIdentifiers(
    class_: NamedNode,
    options?: Parameters<ResourceSet["instancesOf"]>[1],
  ): Generator<BlankNode | NamedNode> {
    yield* instanceIdentifiersRecursive({
      class_,
      dataset: this.dataset,
      graph: options?.graph ?? this.graph,
      visitedClasses: new TermSet<NamedNode>(),
      yieldedInstanceIdentifiers: new TermSet<BlankNode | NamedNode>(),
    });

    function* instanceIdentifiersRecursive({
      class_,
      dataset,
      graph,
      visitedClasses,
      yieldedInstanceIdentifiers,
    }: {
      class_: NamedNode;
      dataset: DatasetCore;
      graph: Exclude<Quad_Graph, Variable> | undefined;
      visitedClasses: TermSet<NamedNode>;
      yieldedInstanceIdentifiers: TermSet<BlankNode | NamedNode>;
    }): Generator<BlankNode | NamedNode> {
      // Get instanceQuads of the class
      for (const quad of dataset.match(
        null,
        options?.instanceOfPredicate ?? rdf.type,
        class_,
        graph,
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
        graph,
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
          graph,
          visitedClasses,
          yieldedInstanceIdentifiers,
        });
      }
    }
  }
}
