import dataFactory from "@rdfjs/data-model";
import datasetFactory from "@rdfjs/dataset";
import type { NamedNode } from "@rdfjs/types";
import { xsd } from "@tpluscode/rdf-ns-builders";
import { describe, it } from "vitest";
import { Resource } from "../src/Resource.js";
import { testData } from "./testData.js";

describe("Value", () => {
  const { objects, predicate, subject } = testData;
  const testResource = new Resource(datasetFactory.dataset(), subject);
  for (const object of Object.values(objects)) {
    testResource.add(predicate, object);
  }

  it("toBigInt", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toBigInt().toMaybe().toList(),
    );
    expect(values).toHaveLength(13);

    const values42: readonly 42n[] = [
      ...testResource.values(predicate),
    ].flatMap((value) => value.toBigInt([42n]).toMaybe().toList());
    expect(values42).toHaveLength(1);
  });

  it("toBlankNode", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toBlankNode().toMaybe().toList(),
    );
    expect(values).toHaveLength(1);
    expect(values[0].termType).toStrictEqual("BlankNode");
  });

  it("toBoolean", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toBoolean().toMaybe().toList(),
    );
    expect(values).toHaveLength(1);
    expect(values[0]).toStrictEqual(true);

    const falses: readonly false[] = [
      ...testResource.values(predicate),
    ].flatMap((value) => value.toBoolean([false]).toMaybe().toList());
    expect(falses).toHaveLength(0);

    const trues: readonly true[] = [...testResource.values(predicate)].flatMap(
      (value) => value.toBoolean([true]).toMaybe().toList(),
    );
    expect(trues).toHaveLength(1);
  });

  it("toDate", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toDate().toMaybe().toList(),
    );
    expect(values).toHaveLength(1);

    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value.toDate([values[0]]).toMaybe().toList(),
      ),
    ).toHaveLength(1);

    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value.toDate([new Date()]).toMaybe().toList(),
      ),
    ).toHaveLength(0);
  });

  it("toDateTime", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toDateTime().toMaybe().toList(),
    );
    expect(values).toHaveLength(2);

    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value.toDateTime([values[0]]).toMaybe().toList(),
      ),
    ).toHaveLength(1);

    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value.toDateTime([new Date()]).toMaybe().toList(),
      ),
    ).toHaveLength(0);
  });

  it("toFloat", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value.toFloat().toMaybe().toList(),
      ),
    ).toHaveLength(13);

    const valuesPi: readonly 3.14[] = [
      ...testResource.values(predicate),
    ].flatMap((value) => value.toFloat([3.14]).toMaybe().toList());
    expect(valuesPi).toHaveLength(1);
  });

  it("toIdentifier", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toIdentifier().toMaybe().toList(),
    );
    expect(values).toHaveLength(2);
    expect(
      values.find((value) => value.equals(objects["blankNode"])),
    ).toBeDefined();
    expect(
      values.find((value) => value.equals(objects["namedNode"])),
    ).toBeDefined();

    const specificIdentifiers: readonly NamedNode<"http://example.com/namedNodeObject">[] =
      [...testResource.values(predicate)].flatMap((value) =>
        value
          .toIdentifier([
            dataFactory.namedNode("http://example.com/namedNodeObject"),
          ])
          .toMaybe()
          .toList(),
      );
    expect(specificIdentifiers).toHaveLength(1);
  });

  it("toInt", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value.toInt().toMaybe().toList(),
      ),
    ).toHaveLength(11);

    const valuesByte: readonly 127[] = [
      ...testResource.values(predicate),
    ].flatMap((value) => value.toInt([127]).toMaybe().toList());
    expect(valuesByte).toHaveLength(1);
  });

  it("toIri", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toIri().toMaybe().toList(),
    );
    expect(values).toHaveLength(1);
    expect(values[0].equals(objects["namedNode"])).toStrictEqual(true);

    const specificIris: readonly NamedNode<"http://example.com/namedNodeObject">[] =
      [...testResource.values(predicate)].flatMap((value) =>
        value
          .toIri([dataFactory.namedNode("http://example.com/namedNodeObject")])
          .toMaybe()
          .toList(),
      );
    expect(specificIris).toHaveLength(1);
  });

  it("toLiteral", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value.toLiteral().toMaybe().toList(),
      ),
    ).toHaveLength(31);

    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value
          .toLiteral([dataFactory.literal("true", xsd.boolean)])
          .toMaybe()
          .toList(),
      ),
    ).toHaveLength(1);
  });

  it("toNumber", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value.toNumber().toMaybe().toList(),
      ),
    ).toHaveLength(13);

    const valuesByte: readonly 127[] = [
      ...testResource.values(predicate),
    ].flatMap((value) => value.toNumber([127]).toMaybe().toList());
    expect(valuesByte).toHaveLength(1);
  });

  it("toPrimitive", ({ expect }) => {
    const primitives = [...testResource.values(predicate)].flatMap((value) =>
      value.toPrimitive().toMaybe().toList(),
    );
    expect(primitives).toHaveLength(31);
    expect(
      primitives.filter((primitive) => typeof primitive === "bigint"),
    ).toHaveLength(7);
    expect(
      primitives.filter((primitive) => typeof primitive === "boolean"),
    ).toHaveLength(1);
    expect(
      primitives.filter((primitive) => primitive instanceof Date),
    ).toHaveLength(3);
    expect(
      primitives.filter((primitive) => typeof primitive === "number"),
    ).toHaveLength(8);
    expect(
      primitives.filter((primitive) => typeof primitive === "string"),
    ).toHaveLength(12);

    const specificPrimitives: readonly "stringLiteralObject"[] = [
      ...testResource.values(predicate),
    ].flatMap((value) =>
      value.toPrimitive(["stringLiteralObject"]).toMaybe().toList(),
    );
    expect(specificPrimitives).toHaveLength(1);
  });

  it("toResource", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toResource().toMaybe().toList(),
    );
    expect(values).toHaveLength(2);
    expect(
      values.find((value) => value.identifier.equals(objects["blankNode"])),
    ).toBeDefined();
    expect(
      values.find((value) => value.identifier.equals(objects["namedNode"])),
    ).toBeDefined();
  });

  it("toString", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toString().toMaybe().toList(),
    );
    expect(values).toHaveLength(12);
    expect(
      values.some((value) => value === objects["stringLiteral"].value),
    ).toStrictEqual(true);

    const specificStrings: readonly "stringLiteralObject"[] = [
      ...testResource.values(predicate),
    ].flatMap((value) =>
      value.toString(["stringLiteralObject"]).toMaybe().toList(),
    );
    expect(specificStrings).toHaveLength(1);
  });

  it("toTerm", ({ expect }) => {
    for (const object of Object.values(objects)) {
      expect(
        [...testResource.values(predicate)].some((value) =>
          value.term.equals(object),
        ),
      ).toStrictEqual(true);
    }

    const specificTerms: readonly NamedNode<"http://example.com/namedNodeObject">[] =
      [...testResource.values(predicate)].flatMap((value) =>
        value
          .toTerm([dataFactory.namedNode("http://example.com/namedNodeObject")])
          .toMaybe()
          .toList(),
      );
    expect(specificTerms).toHaveLength(1);
  });

  it("toValues", ({ expect }) => {
    const value = testResource.value(predicate).unsafeCoerce();
    const values = value.toValues();
    expect(values).toHaveLength(1);
  });
});
