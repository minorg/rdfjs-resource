import type { BlankNode, NamedNode } from "@rdfjs/types";
import {
  type GetRdfInstanceQuadsParameters,
  getRdfInstanceQuads,
} from "./getRdfInstanceQuads.js";

/**
 * Get all unique RDF instances of a given class in the given dataset.
 */
export function* getRdfInstances(
  kwds: GetRdfInstanceQuadsParameters,
): Generator<BlankNode | NamedNode> {
  for (const instanceQuad of getRdfInstanceQuads(kwds)) {
    yield instanceQuad.subject as BlankNode | NamedNode;
  }
}
