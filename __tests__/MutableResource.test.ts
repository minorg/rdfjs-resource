import type { DatasetCore, Quad, Quad_Object, Variable } from "@rdfjs/types";
import { rdf, xsd } from "@tpluscode/rdf-ns-builders";
import { DataFactory, Store } from "n3";
import { Maybe } from "purify-ts";
import { beforeEach, describe, expect, it } from "vitest";
import { type MutableResource, MutableResourceSet } from "..";

describe("MutableResource", () => {
  let dataset: DatasetCore;
  let resource: MutableResource;
  let resourceSet: MutableResourceSet;

  const objects: Record<string, Exclude<Quad_Object, Quad | Variable>> = {
    blankNode: DataFactory.blankNode(),
    booleanLiteral: DataFactory.literal(1, xsd.boolean),
    intLiteral: DataFactory.literal(1),
    namedNode: DataFactory.namedNode("http://example.com/namedNodeObject"),
    stringLiteral: DataFactory.literal("stringLiteralObject"),
  };

  const predicate = DataFactory.namedNode("http://example.com/predicate");

  beforeEach(() => {
    dataset = new Store();
    resourceSet = new MutableResourceSet({
      dataFactory: DataFactory,
      dataset,
    });
    resource = resourceSet.mutableNamedResource({
      identifier: DataFactory.namedNode("http://example.com/subject"),
      mutateGraph: DataFactory.defaultGraph(),
    });
  });

  it("should add a value", () => {
    resource.add(predicate, objects["stringLiteral"]);
    const values = [...resource.values(predicate)].map((value) =>
      value.toTerm(),
    );
    expect(values).toHaveLength(1);
    expect(values[0].equals(objects["stringLiteral"])).toBe(true);
  });

  it("should add a Maybe value", () => {
    expect(dataset.size).toStrictEqual(0);
    resource.addMaybe(predicate, Maybe.empty());
    expect(dataset.size).toStrictEqual(0);
    resource.addMaybe(predicate, Maybe.of(objects["stringLiteral"]));
    expect(dataset.size).toStrictEqual(1);
  });

  it("should add a List value", () => {
    resource.addList(predicate, [
      objects["stringLiteral"],
      objects["intLiteral"],
    ]);
    expect([...resource.values(predicate)]).toHaveLength(1);
    const list = resource
      .value(predicate)
      .chain((value) => value.toList().toMaybe())
      .map((values) => values.flatMap((value) => value.toLiteral().toList()))
      .orDefault([]);
    expect(list).toHaveLength(2);
    expect(
      list.some((element) => element.equals(objects["stringLiteral"])),
    ).toStrictEqual(true);
    expect(
      list.some((element) => element.equals(objects["intLiteral"])),
    ).toStrictEqual(true);
  });

  it("should delete a value", () => {
    resource.add(predicate, objects["stringLiteral"]);
    resource.add(predicate, objects["intLiteral"]);
    expect([...resource.values(predicate)]).toHaveLength(2);
    resource.delete(predicate, objects["intLiteral"]);
    const values = [...resource.values(predicate)].map((value) =>
      value.toTerm(),
    );
    expect(values).toHaveLength(1);
    expect(values[0].equals(objects["stringLiteral"])).toBe(true);
  });

  it("should delete all values", () => {
    resource.add(predicate, objects["stringLiteral"]);
    resource.add(predicate, objects["intLiteral"]);
    expect([...resource.values(predicate)]).toHaveLength(2);
    resource.delete(predicate);
    expect([...resource.values(predicate)]).toHaveLength(0);
  });

  it("should set a value", () => {
    resource.add(predicate, objects["stringLiteral"]);
    expect(dataset.size).toStrictEqual(1);
    resource.set(predicate, objects["intLiteral"]);
    expect(dataset.size).toStrictEqual(1);
    const values = [...resource.values(predicate)].map((value) =>
      value.toTerm(),
    );
    expect(values).toHaveLength(1);
    expect(values[0].equals(objects["intLiteral"])).toBe(true);
  });

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
    it(`should create and read a list of ${terms.length} terms`, ({
      expect,
    }) => {
      const listResource = resource.addList(predicate, terms, {
        createSubListResource: (_, itemIndex) =>
          resourceSet.mutableNamedResource({
            identifier: DataFactory.namedNode(
              `http://example.com/list${itemIndex.toString()}`,
            ),
            mutateGraph: DataFactory.defaultGraph(),
          }),
      });
      if (terms.length === 0) {
        expect(listResource.identifier.equals(rdf.nil)).toStrictEqual(true);
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
      const deserializedTerms = [
        ...listResource
          .toList()
          .unsafeCoerce()
          .map((value) => value.toTerm()),
      ];
      expect(deserializedTerms).toHaveLength(terms.length);
      terms.forEach((term, termI) => {
        expect(term.equals(deserializedTerms[termI])).toStrictEqual(true);
      });
    });
  }
});
