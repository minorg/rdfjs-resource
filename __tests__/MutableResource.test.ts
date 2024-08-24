import type { DatasetCore, Quad, Quad_Object, Variable } from "@rdfjs/types";
import { xsd } from "@tpluscode/rdf-ns-builders";
import { DataFactory, Store } from "n3";
import { Maybe } from "purify-ts";
import { beforeEach, describe, expect, it } from "vitest";
import { MutableResource } from "..";

describe("MutableResource", () => {
  let dataset: DatasetCore;
  let resource: MutableResource;

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
    resource = new MutableResource({
      dataFactory: DataFactory,
      dataset,
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
});
