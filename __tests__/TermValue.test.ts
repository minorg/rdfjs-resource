import { Store } from "n3";
import { describe, it } from "vitest";
import { Resource } from "../src/Resource.js";
import { testData } from "./testData.js";

describe("TermValue", () => {
  const { objects, predicate, subject } = testData;
  const testResource = new Resource(new Store(), subject);
  for (const object of Object.values(objects)) {
    testResource.add(predicate, object);
  }

  it("toBigInt", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toBigInt().toMaybe().toList(),
    );
    expect(values).toHaveLength(13);
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
  });

  it("toDate", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toDate().toMaybe().toList(),
    );
    expect(values).toHaveLength(1);
  });

  it("toDateTime", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toDateTime().toMaybe().toList(),
    );
    expect(values).toHaveLength(2);
  });

  it("toFloat", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toFloat().toMaybe().toList(),
    );
    expect(values).toHaveLength(13);
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
  });

  it("toInt", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toInt().toMaybe().toList(),
    );
    expect(values).toHaveLength(11);
  });

  it("toIri", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toIri().toMaybe().toList(),
    );
    expect(values).toHaveLength(1);
    expect(values[0].equals(objects["namedNode"])).toStrictEqual(true);
  });

  it("toLiteral", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value.toLiteral().toMaybe().toList(),
      ),
    ).toHaveLength(31);
  });

  it("toNumber", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toNumber().toMaybe().toList(),
    );
    expect(values).toHaveLength(13);
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
    expect(
      testResource
        .values(predicate)
        .find((value) => value.toString().isRight())
        .chain((value) => value.toString())
        .orDefault("test"),
    ).toStrictEqual(objects["stringLiteral"].value);
  });

  it("toValues", ({ expect }) => {
    const value = testResource.value(predicate).unsafeCoerce();
    const values = value.toValues();
    expect(values).toHaveLength(1);
    expect(
      values.head().unsafeCoerce().toTerm().equals(value.toTerm()),
    ).toStrictEqual(true);
  });
});
