import TermSet from "@rdfjs/term-set";
import type {
  BlankNode,
  DatasetCore,
  DefaultGraph,
  Literal,
  NamedNode,
} from "@rdfjs/types";
import { rdf } from "@tpluscode/rdf-ns-builders";

export function* getRdfList({
  dataset,
  graph,
  node,
}: {
  dataset: DatasetCore;
  graph?: BlankNode | DefaultGraph | NamedNode | null;
  node: BlankNode | NamedNode;
}): Generator<BlankNode | Literal | NamedNode> {
  if (node.equals(rdf.nil)) {
    return;
  }

  const firstObjects = [
    ...new TermSet(
      [...dataset.match(node, rdf.first, null, graph)].map(
        (quad) => quad.object,
      ),
    ),
  ];
  if (firstObjects.length === 0) {
    throw new RangeError(`RDF list ${node.value} has no rdf:first quad`);
  }
  if (firstObjects.length > 1) {
    throw new RangeError(
      `RDF list ${node.value} has multiple rdf:first objects: ${JSON.stringify(firstObjects.map((object) => object.value))}`,
    );
  }
  const firstObject = firstObjects[0];
  switch (firstObject.termType) {
    case "BlankNode":
    case "Literal":
    case "NamedNode":
      break;
    default:
      throw new RangeError(
        `rdf:first from ${node.value} must point to a blank or named node or a literal, not ${firstObject.termType}`,
      );
  }

  const restObjects = [
    ...new TermSet(
      [...dataset.match(node, rdf.rest, null, graph)].map(
        (quad) => quad.object,
      ),
    ),
  ];
  if (restObjects.length === 0) {
    throw new RangeError(`RDF list ${node.value} has no rdf:rest quad`);
  }
  if (restObjects.length > 1) {
    throw new RangeError(
      `RDF list ${node.value} has multiple rdf:rest objects: ${JSON.stringify(restObjects.map((object) => object.value))}`,
    );
  }
  const restObject = restObjects[0];
  switch (restObject.termType) {
    case "BlankNode":
    case "NamedNode":
      break;
    default:
      throw new RangeError(
        `rdf:rest from ${node.value} must point to a blank or named node, not ${restObject.termType}`,
      );
  }

  yield firstObject;

  yield* getRdfList({
    dataset,
    graph,
    node: restObject,
  });
}
