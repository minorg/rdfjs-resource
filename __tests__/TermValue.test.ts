import { describe, it } from "vitest";
import { testData } from "./testData.js";

describe("TermValue", () => {
  const { objects, predicate } = testData;
  const testResource = testData.resource();

  it("isBlankNode", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].filter((value) =>
        value.isBlankNode(),
      ),
    ).toHaveLength(1);
  });

  it("isBoolean", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].filter((value) => value.isBoolean()),
    ).toHaveLength(1);
  });

  it("isDate", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].filter((value) => value.isDate()),
    ).toHaveLength(2);
  });

  it("isIdentifier", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].filter((value) =>
        value.isIdentifier(),
      ),
    ).toHaveLength(2);
  });

  it("isLiteral", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].filter((value) => value.isLiteral()),
    ).toHaveLength(5);
  });

  it("isNumber", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].filter((value) => value.isNumber()),
    ).toHaveLength(1);
  });

  it("isPrimitive", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].filter((value) =>
        value.isPrimitive(),
      ),
    ).toHaveLength(5);
  });

  it("isString", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].filter((value) => value.isString()),
    ).toHaveLength(1);
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
    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value.toDate().toMaybe().toList(),
      ),
    ).toHaveLength(2);
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
    ).toHaveLength(5);
  });

  it("toNumber", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toNumber().toMaybe().toList(),
    );
    expect(values).toHaveLength(1);
    expect(values[0]).toStrictEqual(1);
  });

  it("toPrimitive", ({ expect }) => {
    const primitives = [...testResource.values(predicate)].flatMap((value) =>
      value.toPrimitive().toMaybe().toList(),
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
        .find((value) => value.isString())
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
