import type { Quad, Quad_Object, Variable } from "@rdfjs/types";
import { schema, xsd } from "@tpluscode/rdf-ns-builders";
import N3, { DataFactory, Store } from "n3";
import { beforeAll, describe, it } from "vitest";
import { MutableResource, type Resource, ResourceSet } from "..";
import { houseMdDataset } from "./houseMdDataset";

describe("Resource", () => {
  const immutableResourceSet = new ResourceSet({ dataset: houseMdDataset });
  const immutableResource = immutableResourceSet.namedResource(
    N3.DataFactory.namedNode(
      "https://housemd.rdf-ext.org/person/allison-cameron",
    ),
  );
  let mutableResource: Resource;

  const objects: Record<string, Exclude<Quad_Object, Quad | Variable>> = {
    blankNode: DataFactory.blankNode(),
    booleanLiteral: DataFactory.literal(1, xsd.boolean),
    dateLiteral: DataFactory.literal("2002-09-24", xsd.date),
    dateTimeLiteral: DataFactory.literal("2002-05-30T09:00:00", xsd.dateTime),
    intLiteral: DataFactory.literal(1),
    namedNode: DataFactory.namedNode("http://example.com/namedNodeObject"),
    stringLiteral: DataFactory.literal("stringLiteralObject"),
  };

  const predicate = DataFactory.namedNode("http://example.com/predicate");

  beforeAll(() => {
    mutableResource = new MutableResource({
      dataFactory: DataFactory,
      dataset: new Store(),
      identifier: DataFactory.namedNode("http://example.com/subject"),
      mutateGraph: DataFactory.defaultGraph(),
    });
    for (const object of Object.values(objects)) {
      (mutableResource as MutableResource).add(predicate, object);
    }
  });

  it("should check instance of with rdf:type", ({ expect }) => {
    expect(immutableResource.isInstanceOf(schema.Person)).toStrictEqual(true);
  });

  it("should get a value (missing)", ({ expect }) => {
    expect(
      mutableResource
        .value(DataFactory.namedNode("http://example.com/nonexistent"))
        .extract(),
    ).toBeUndefined();
  });

  it("should get a value (present)", ({ expect }) => {
    expect(
      [...mutableResource.values(predicate)]
        .filter((value) => value.isIri())
        .at(0)
        ?.toIri()
        .extract()?.value,
    ).toStrictEqual(objects["namedNode"].value);
  });

  it("should get a value (filtered)", ({ expect }) => {
    const value = mutableResource
      .value(predicate, (value) => value.isIri())
      .extract();
    expect(value?.isIri()).toBe(true);
  });

  it("should get all values", ({ expect }) => {
    const values = [...mutableResource.values(predicate)];
    expect(values).toHaveLength(Object.keys(objects).length);
    for (const object of Object.values(objects)) {
      expect(
        values.find((value) => value.toTerm().equals(object)),
      ).toBeDefined();
    }
  });

  it("should get identifier values", ({ expect }) => {
    const values = [...mutableResource.values(predicate)].flatMap((value) =>
      value.toIdentifier().toList(),
    );
    expect(values).toHaveLength(2);
    expect(
      values.find((value) => value.equals(objects["blankNode"])),
    ).toBeDefined();
    expect(
      values.find((value) => value.equals(objects["namedNode"])),
    ).toBeDefined();
  });

  it("should get a boolean value", ({ expect }) => {
    expect(
      mutableResource
        .value(predicate, (value) => value.isBoolean())
        .chain((value) => value.toBoolean())
        .orDefault(false),
    ).toStrictEqual(true);
  });

  it("should get a number value", ({ expect }) => {
    expect(
      mutableResource
        .value(predicate, (value) => value.isNumber())
        .chain((value) => value.toNumber())
        .orDefault(-1),
    ).toStrictEqual(1);
  });

  it("should get a string value", ({ expect }) => {
    expect(
      mutableResource
        .value(predicate, (value) => value.isString())
        .chain((value) => value.toString())
        .orDefault("test"),
    ).toStrictEqual(objects["stringLiteral"].value);
  });

  it("should get Date values", ({ expect }) => {
    expect(
      [...mutableResource.values(predicate)].flatMap((value) =>
        value.toDate().toList(),
      ),
    ).toHaveLength(2);
  });

  it("should get literal values", ({ expect }) => {
    expect(
      [...mutableResource.values(predicate)].flatMap((value) =>
        value.toLiteral().toList(),
      ),
    ).toHaveLength(5);
  });

  it("should get primitive values", ({ expect }) => {
    const primitives = [...mutableResource.values(predicate)].flatMap((value) =>
      value.toPrimitive().toList(),
    );
    expect(primitives).toHaveLength(5);
    expect(
      primitives.filter((primitive) => typeof primitive === "boolean"),
    ).toHaveLength(1);
    expect(
      primitives.filter((primitive) => primitive instanceof Date),
    ).toHaveLength(2);
    expect(
      primitives.filter((primitive) => typeof primitive === "number"),
    ).toHaveLength(1);
    expect(
      primitives.filter((primitive) => typeof primitive === "string"),
    ).toHaveLength(1);
  });

  it("should get resource values", ({ expect }) => {
    const values = [...mutableResource.values(predicate)].flatMap((value) =>
      value.toResource().toList(),
    );
    expect(values).toHaveLength(2);
    expect(
      values.find((value) => value.identifier.equals(objects["blankNode"])),
    ).toBeDefined();
    expect(
      values.find((value) => value.identifier.equals(objects["namedNode"])),
    ).toBeDefined();
  });

  it("should get a valueOf", ({ expect }) => {
    const resourceValues = [...mutableResource.values(predicate)].flatMap(
      (value) => value.toResource().toList(),
    );
    expect(resourceValues).toHaveLength(2);
    for (const resourceValue of resourceValues) {
      expect(
        resourceValue
          .valueOf(predicate)
          .unsafeCoerce()
          .toIdentifier()
          .equals(mutableResource.identifier),
      ).toBe(true);
    }
  });

  it("should get a valuesOf", ({ expect }) => {
    const resourceValues = [...mutableResource.values(predicate)].flatMap(
      (value) => value.toResource().toList(),
    );
    expect(resourceValues).toHaveLength(2);
    for (const resourceValue of resourceValues) {
      const valuesOf = [...resourceValue.valuesOf(predicate)];
      expect(valuesOf).toHaveLength(1);
      expect(
        valuesOf[0].toIdentifier().equals(mutableResource.identifier),
      ).toBe(true);
    }
  });
});
