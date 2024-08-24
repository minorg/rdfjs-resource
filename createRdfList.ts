import type {
  BlankNode,
  DataFactory,
  DatasetCore,
  DefaultGraph,
  Literal,
  NamedNode,
} from "@rdfjs/types";
import { rdf } from "@tpluscode/rdf-ns-builders";

/**
 * Create an RDF list for a sequence of items and return the list's identifier
 *
 * The generateIdentifier function can be used to generate custom identifiers for the list and its tails instead of using blank nodes.
 */
export function createRdfList({
  dataFactory,
  dataset,
  generateIdentifier,
  graph,
  items,
}: {
  dataFactory: DataFactory;
  dataset: DatasetCore;
  generateIdentifier?: (
    item: BlankNode | Literal | NamedNode,
    itemIndex: number,
  ) => BlankNode | NamedNode;
  graph?: BlankNode | DefaultGraph | NamedNode;
  items: Iterable<BlankNode | Literal | NamedNode>;
}): BlankNode | NamedNode {
  if (!generateIdentifier) {
    generateIdentifier = () => dataFactory.blankNode();
  }

  let currentHead: BlankNode | NamedNode | undefined;
  let list: BlankNode | NamedNode | undefined;
  let itemIndex = 0;
  for (const item of items) {
    const newHead = generateIdentifier(item, itemIndex);
    if (currentHead) {
      dataset.add(dataFactory.quad(currentHead, rdf.rest, newHead, graph));
      currentHead = newHead;
    } else {
      currentHead = list = newHead;
    }
    dataset.add(dataFactory.quad(currentHead, rdf.first, item, graph));
    itemIndex++;
  }
  if (!list) {
    return rdf.nil;
  }
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  dataset.add(dataFactory.quad(currentHead!, rdf.rest, rdf.nil, graph));
  return list;
}
