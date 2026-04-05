import dataFactory from "@rdfjs/data-model";
import datasetFactory from "@rdfjs/dataset";
import type { NamedNode } from "@rdfjs/types";
import { xsd } from "@tpluscode/rdf-ns-builders";
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
      value
        .toBigIntValue()
        .toMaybe()
        .toList()
        .map((_) => _.unwrap()),
    );
    expect(values).toHaveLength(13);

    const values42: readonly 42n[] = [...testResource.values(predicate)]
      .flatMap((value) => value.toBigIntValue([42n]).toMaybe().toList())
      .map((_) => _.unwrap());
    expect(values42).toHaveLength(1);
  });

  it("toBlankNodeValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value
        .toBlankNodeValue()
        .toMaybe()
        .toList()
        .map((_) => _.unwrap()),
    );
    expect(values).toHaveLength(1);
    expect(values[0].termType).toStrictEqual("BlankNode");
  });

  it("toBooleanValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value
        .toBooleanValue()
        .toMaybe()
        .toList()
        .map((_) => _.unwrap()),
    );
    expect(values).toHaveLength(1);
    expect(values[0]).toStrictEqual(true);

    const falseValues: readonly false[] = [...testResource.values(predicate)]
      .flatMap((value) => value.toBooleanValue([false]).toMaybe().toList())
      .map((_) => _.unwrap());
    expect(falseValues).toHaveLength(0);

    const trueValues: readonly true[] = [...testResource.values(predicate)]
      .flatMap((value) => value.toBooleanValue([true]).toMaybe().toList())
      .map((_) => _.unwrap());
    expect(trueValues).toHaveLength(1);
  });

  it("toDateValue", ({ expect }) => {
    const values = [...testResource.values(predicate)]
      .flatMap((value) => value.toDateValue().toMaybe().toList())
      .map((_) => _.unwrap());
    expect(values).toHaveLength(1);

    expect(
      [...testResource.values(predicate)]
        .flatMap((value) => value.toDateValue([values[0]]).toMaybe().toList())
        .map((_) => _.unwrap()),
    ).toHaveLength(1);

    expect(
      [...testResource.values(predicate)]
        .flatMap((value) => value.toDateValue([new Date()]).toMaybe().toList())
        .map((_) => _.unwrap()),
    ).toHaveLength(0);
  });

  it("toDateTimeValue", ({ expect }) => {
    const values = [...testResource.values(predicate)]
      .flatMap((value) => value.toDateTimeValue().toMaybe().toList())
      .map((_) => _.unwrap());
    expect(values).toHaveLength(2);

    expect(
      [...testResource.values(predicate)]
        .flatMap((value) =>
          value.toDateTimeValue([values[0]]).toMaybe().toList(),
        )
        .map((_) => _.unwrap()),
    ).toHaveLength(1);

    expect(
      [...testResource.values(predicate)]
        .flatMap((value) =>
          value.toDateTimeValue([new Date()]).toMaybe().toList(),
        )
        .map((_) => _.unwrap()),
    ).toHaveLength(0);
  });

  it("toFloatValue", ({ expect }) => {
    expect(
      [...testResource.values(predicate)]
        .flatMap((value) => value.toFloatValue().toMaybe().toList())
        .map((_) => _.unwrap()),
    ).toHaveLength(13);

    const valuesPi: readonly 3.14[] = [...testResource.values(predicate)]
      .flatMap((value) => value.toFloatValue([3.14]).toMaybe().toList())
      .map((_) => _.unwrap());
    expect(valuesPi).toHaveLength(1);
  });

  it("toIdentifierValue", ({ expect }) => {
    const values = [...testResource.values(predicate)]
      .flatMap((value) => value.toIdentifierValue().toMaybe().toList())
      .map((_) => _.unwrap());
    expect(values).toHaveLength(2);
    expect(
      values.find((value) => value.equals(objects["blankNode"])),
    ).toBeDefined();
    expect(
      values.find((value) => value.equals(objects["namedNode"])),
    ).toBeDefined();

    const specificIdentifierValues: readonly NamedNode<"http://example.com/namedNodeObject">[] =
      [...testResource.values(predicate)].flatMap((value) =>
        value
          .toIdentifierValue([
            dataFactory.namedNode("http://example.com/namedNodeObject"),
          ])
          .toMaybe()
          .toList()
          .map((_) => _.unwrap()),
      );
    expect(specificIdentifierValues).toHaveLength(1);
  });

  it("toIntValue", ({ expect }) => {
    expect(
      [...testResource.values(predicate)]
        .flatMap((value) => value.toIntValue().toMaybe().toList())
        .map((_) => _.unwrap()),
    ).toHaveLength(11);

    const valuesByte: readonly 127[] = [...testResource.values(predicate)]
      .flatMap((value) => value.toIntValue([127]).toMaybe().toList())
      .map((_) => _.unwrap());
    expect(valuesByte).toHaveLength(1);
  });

  it("toIriValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value.toIriValue().toMaybe().toList(),
    );
    expect(values).toHaveLength(1);
    expect(values[0].unwrap().equals(objects["namedNode"])).toStrictEqual(true);

    const specificIriValues: readonly NamedNode<"http://example.com/namedNodeObject">[] =
      [...testResource.values(predicate)].flatMap((value) =>
        value
          .toIriValue([
            dataFactory.namedNode("http://example.com/namedNodeObject"),
          ])
          .toMaybe()
          .toList()
          .map((_) => _.unwrap()),
      );
    expect(specificIriValues).toHaveLength(1);
  });

  it("toLiteralValue", ({ expect }) => {
    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value.toLiteralValue().toMaybe().toList(),
      ),
    ).toHaveLength(31);

    expect(
      [...testResource.values(predicate)].flatMap((value) =>
        value
          .toLiteralValue([dataFactory.literal("true", xsd.boolean)])
          .toMaybe()
          .toList(),
      ),
    ).toHaveLength(1);
  });

  it("toNumberValue", ({ expect }) => {
    expect(
      [...testResource.values(predicate)]
        .flatMap((value) => value.toNumberValue().toMaybe().toList())
        .map((_) => _.unwrap()),
    ).toHaveLength(13);

    const valuesByte: readonly 127[] = [...testResource.values(predicate)]
      .flatMap((value) => value.toNumberValue([127]).toMaybe().toList())
      .map((_) => _.unwrap());
    expect(valuesByte).toHaveLength(1);
  });

  it("toPrimitiveValue", ({ expect }) => {
    const primitives = [...testResource.values(predicate)]
      .flatMap((value) => value.toPrimitiveValue().toMaybe().toList())
      .map((_) => _.unwrap());
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
    ]
      .flatMap((value) =>
        value.toPrimitiveValue(["stringLiteralObject"]).toMaybe().toList(),
      )
      .map((_) => _.unwrap());
    expect(specificPrimitives).toHaveLength(1);
  });

  it("toResourceValue", ({ expect }) => {
    const values = [...testResource.values(predicate)].flatMap((value) =>
      value
        .toResourceValue()
        .toMaybe()
        .toList()
        .map((_) => _.unwrap()),
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
    const values = [...testResource.values(predicate)]
      .flatMap((value) => value.toStringValue().toMaybe().toList())
      .map((_) => _.unwrap());
    expect(values).toHaveLength(12);
    expect(
      values.some((value) => value === objects["stringLiteral"].value),
    ).toStrictEqual(true);

    const specificStrings: readonly "stringLiteralObject"[] = [
      ...testResource.values(predicate),
    ]
      .flatMap((value) =>
        value.toStringValue(["stringLiteralObject"]).toMaybe().toList(),
      )
      .map((_) => _.unwrap());
    expect(specificStrings).toHaveLength(1);
  });

  it("toTermValue", ({ expect }) => {
    for (const object of Object.values(objects)) {
      expect(
        [...testResource.values(predicate)].some((value) =>
          value.toTermValue().unsafeCoerce().unwrap().equals(object),
        ),
      ).toStrictEqual(true);
    }

    const specificTermValues: readonly NamedNode<"http://example.com/namedNodeObject">[] =
      [...testResource.values(predicate)].flatMap((value) =>
        value
          .toTermValue([
            dataFactory.namedNode("http://example.com/namedNodeObject"),
          ])
          .toMaybe()
          .toList()
          .map((_) => _.unwrap()),
      );
    expect(specificTermValues).toHaveLength(1);
  });

  it("toValues", ({ expect }) => {
    const value = testResource.value(predicate).unsafeCoerce();
    const values = value.toValues();
    expect(values).toHaveLength(1);
  });
});
