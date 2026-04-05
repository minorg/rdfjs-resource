import datasetFactory from "@rdfjs/dataset";
import { describe, it } from "vitest";
import { Resource } from "../src/Resource.js";
import { testData } from "./testData.js";

describe("TermValue", () => {
  const { objects, predicate, subject } = testData;
  const testResource = new Resource(datasetFactory.dataset(), subject);
  for (const object of Object.values(objects)) {
    testResource.add(predicate, object);
  }

  it("toBigIntValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toBigIntValue().toMaybe().toList(),
    );
    expect(values).toHaveLength(13);

    const values42: Resource.Value<42n>[] = [
      ...testResource.values(predicate),
    ].flatMap((value) => value.toBigIntValue([42n]).toMaybe().toList());
    expect(values42).toHaveLength(1);
  });

  it("toBlankNodeValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toBlankNodeValue().toMaybe().toList(),
    );
    expect(values).toHaveLength(1);
    expect(values[0].value.termType).toStrictEqual("BlankNode");
  });

  it("toBooleanValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toBooleanValue().toMaybe().toList(),
    );
    expect(values).toHaveLength(1);
    expect(values[0].value).toStrictEqual(true);

    const falseValues: Resource.Value<false>[] = [
      ...testResource.values(predicate),
    ].flatMap((value) => value.toBooleanValue([false]).toMaybe().toList());
    expect(falseValues).toHaveLength(0);

    const trueValues: Resource.Value<true>[] = [
      ...testResource.values(predicate),
    ].flatMap((value) => value.toBooleanValue([true]).toMaybe().toList());
    expect(trueValues).toHaveLength(1);
  });

  it("toDateValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toDateValue().toMaybe().toList(),
    );
    expect(values).toHaveLength(1);
  });

  it("toDateTimeValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toDateTimeValue().toMaybe().toList(),
    );
    expect(values).toHaveLength(2);
  });

  it("toFloatValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toFloatValue().toMaybe().toList(),
    );
    expect(values).toHaveLength(13);
  });

  it("toIdentifierValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value
        .toIdentifierValue()
        .toMaybe()
        .toList()
        .map((_) => _.value),
    );
    expect(values).toHaveLength(2);
    expect(
      values.find((value) => value.equals(objects["blankNode"])),
    ).toBeDefined();
    expect(
      values.find((value) => value.equals(objects["namedNode"])),
    ).toBeDefined();
  });

  it("toIntValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toIntValue().toMaybe().toList(),
    );
    expect(values).toHaveLength(11);
  });

  it("toIriValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toIriValue().toMaybe().toList(),
    );
    expect(values).toHaveLength(1);
    expect(values[0].value.equals(objects["namedNode"])).toStrictEqual(true);
  });

  it("toLiteralValue", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value.toLiteralValue().toMaybe().toList(),
      ),
    ).toHaveLength(31);
  });

  it("toNumberValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toNumberValue().toMaybe().toList(),
    );
    expect(values).toHaveLength(13);
  });

  it("toPrimitiveValue", ({ expect }) => {
    const primitives = [...testResource.values(predicate)].flatMap((value) =>
      value
        .toPrimitiveValue()
        .toMaybe()
        .toList()
        .map((_) => _.value),
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

  it("toResourceValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value
        .toResourceValue()
        .toMaybe()
        .toList()
        .map((_) => _.value),
    );
    expect(values).toHaveLength(2);
    expect(
      values.find((value) => value.identifier.equals(objects["blankNode"])),
    ).toBeDefined();
    expect(
      values.find((value) => value.identifier.equals(objects["namedNode"])),
    ).toBeDefined();
  });

  it("toStringValue", ({ expect }) => {
    expect(
      testResource
        .values(predicate)
        .find((value) => value.toStringValue().isRight())
        .chain((value) => value.toStringValue())
        .map((_) => _.value)
        .orDefault("test"),
    ).toStrictEqual(objects["stringLiteral"].value);
  });

  it("toTermValue", ({ expect }) => {
    for (const object of Object.values(objects)) {
      expect(
        [...testResource.values(predicate)].some((value) =>
          value.toTermValue().value.equals(object),
        ),
      ).toStrictEqual(true);
    }
  });

  it("toValues", ({ expect }) => {
    const value = testResource.value(predicate).unsafeCoerce();
    const values = value.toValues();
    expect(values).toHaveLength(1);
  });
});
