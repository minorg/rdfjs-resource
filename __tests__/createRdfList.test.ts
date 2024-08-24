import { rdf } from "@tpluscode/rdf-ns-builders";
import { DataFactory } from "n3";
import { Store } from "n3";
import { describe, it } from "vitest";
import { createRdfList } from "../createRdfList.js";
import { getRdfList } from "../getRdfList.js";

describe("createRdfList", () => {
  for (const terms of [
    [],
    [DataFactory.literal("test")],
    [DataFactory.literal("test"), DataFactory.literal("test")],
    [
      DataFactory.literal("test"),
      DataFactory.literal("test"),
      DataFactory.literal("test"),
    ],
    [
      DataFactory.literal("test"),
      DataFactory.literal("test"),
      DataFactory.literal("test"),
      DataFactory.literal("test"),
    ],
  ]) {
    it(`should serialize and deserialize an array of ${terms.length} terms`, ({
      expect,
    }) => {
      const dataset = new Store();
      const rdfList = createRdfList({
        dataFactory: DataFactory,
        dataset,
        generateIdentifier: (_, itemIndex) =>
          DataFactory.namedNode(
            `http://example.com/list${itemIndex.toString()}`,
          ),
        items: terms,
      });
      if (terms.length === 0) {
        expect(rdfList.equals(rdf.nil)).toStrictEqual(true);
      } else {
        expect(dataset.size).not.toEqual(0);
      }
      // Should only have NamedNode identifiers for the pieces of the list
      const datasetQuads = [...dataset.match(null, null, null, null)];
      expect(
        datasetQuads.every(
          (quad) =>
            quad.subject.termType === "NamedNode" &&
            (quad.object.termType === "NamedNode" ||
              quad.object.termType === "Literal"),
        ),
      );
      const deserializedTerms = [...getRdfList({ dataset, node: rdfList })];
      expect(deserializedTerms).toHaveLength(terms.length);
      terms.forEach((term, termI) => {
        expect(term.equals(deserializedTerms[termI])).toStrictEqual(true);
      });
    });
  }
});
