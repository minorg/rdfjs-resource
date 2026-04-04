import TermSet from "@rdfjs/term-set";
import type {
  BlankNode,
  DataFactory,
  DatasetCore,
  Literal,
  NamedNode,
  Quad_Graph,
  Variable,
} from "@rdfjs/types";

import type { PropertyPath } from "./PropertyPath.js";
import type { Resource } from "./Resource.js";
import { TermValue } from "./TermValue.js";
import { Values } from "./Values.js";

export class DatasetValues extends Values<TermValue> {
  private readonly dataFactory: DataFactory;
  private readonly graph: Exclude<Quad_Graph, Variable> | null;
  private readonly unique: boolean;

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
    propertyPath: PropertyPath;
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

  private get dataset(): DatasetCore {
    return this.focusResource.dataset;
  }

  override *[Symbol.iterator](): Iterator<TermValue> {
    if (this.unique) {
      const uniqueTerms = new TermSet<BlankNode | Literal | NamedNode>();
      for (const term of this.terms({
        focusIdentifier: this.focusResource.identifier,
        propertyPath: this.propertyPath,
      })) {
        if (uniqueTerms.has(term)) {
          continue;
        }
        yield new TermValue({
          dataFactory: this.dataFactory,
          focusResource: this.focusResource,
          propertyPath: this.propertyPath,
          value: term,
        });
        uniqueTerms.add(term);
      }
    } else {
      for (const term of this.terms({
        focusIdentifier: this.focusResource.identifier,
        propertyPath: this.propertyPath,
      })) {
        yield new TermValue({
          dataFactory: this.dataFactory,
          focusResource: this.focusResource,
          propertyPath: this.propertyPath,
          value: term,
        });
      }
    }
  }

  override toArray(): readonly TermValue[] {
    return [...this];
  }

  private *terms({
    inverse = false,
    focusIdentifier,
    propertyPath,
  }: {
    inverse?: boolean;
    focusIdentifier: NamedNode | BlankNode;
    propertyPath: PropertyPath;
  }): Iterable<BlankNode | Literal | NamedNode> {
    switch (propertyPath.termType) {
      case "AlternativePath": {
        for (const member of propertyPath.members) {
          yield* this.terms({ inverse, focusIdentifier, propertyPath: member });
        }
        break;
      }
      case "InversePath": {
        yield* this.terms({
          inverse: !inverse,
          focusIdentifier,
          propertyPath: propertyPath.path,
        });
        break;
      }
      case "NamedNode": {
        const [subject, object] = inverse
          ? [null, focusIdentifier]
          : [focusIdentifier, null];
        for (const quad of this.dataset.match(
          subject,
          propertyPath,
          object,
          this.graph,
        )) {
          const term = inverse ? quad.subject : quad.object;
          switch (term.termType) {
            case "BlankNode":
            case "Literal":
            case "NamedNode":
              yield term;
              break;
            default:
              throw new Error(`unexpected termType ${term.termType}`);
          }
        }
        break;
      }
      case "OneOrMorePath": {
        const visited: TermSet<BlankNode | Literal | NamedNode> = new TermSet();
        const queue: (NamedNode | BlankNode)[] = [focusIdentifier];
        while (queue.length > 0) {
          // biome-ignore lint/style/noNonNullAssertion: .length > 0
          const node = queue.shift()!;
          if (visited.has(node)) continue;
          visited.add(node);
          for (const next of this.terms({
            inverse,
            focusIdentifier: node,
            propertyPath: propertyPath.path,
          })) {
            if (
              next.termType === "NamedNode" ||
              next.termType === "BlankNode"
            ) {
              queue.push(next);
            }
            yield next;
          }
        }
        break;
      }
      case "SequencePath": {
        const members = inverse
          ? [...propertyPath.members].reverse()
          : propertyPath.members;
        let reached: TermSet<BlankNode | Literal | NamedNode> = new TermSet([
          focusIdentifier,
        ]);
        for (const member of members) {
          const nextReached: TermSet<BlankNode | Literal | NamedNode> =
            new TermSet();
          for (const node of reached) {
            if (
              node.termType === "NamedNode" ||
              node.termType === "BlankNode"
            ) {
              for (const next of this.terms({
                inverse,
                focusIdentifier: node,
                propertyPath: member,
              })) {
                nextReached.add(next);
              }
            }
          }
          reached = nextReached;
        }
        yield* reached;
        break;
      }
      case "ZeroOrMorePath": {
        yield focusIdentifier;
        const visited: TermSet<BlankNode | Literal | NamedNode> = new TermSet();
        const queue: (NamedNode | BlankNode)[] = [focusIdentifier];
        while (queue.length > 0) {
          // biome-ignore lint/style/noNonNullAssertion: .length > 0
          const node = queue.shift()!;
          if (visited.has(node)) continue;
          visited.add(node);
          for (const next of this.terms({
            inverse,
            focusIdentifier: node,
            propertyPath: propertyPath.path,
          })) {
            if (
              next.termType === "NamedNode" ||
              next.termType === "BlankNode"
            ) {
              queue.push(next);
            }
            yield next;
          }
        }
        break;
      }
      case "ZeroOrOnePath": {
        yield focusIdentifier;
        yield* this.terms({
          inverse,
          focusIdentifier,
          propertyPath: propertyPath.path,
        });
        break;
      }
    }
  }
}
