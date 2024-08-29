import { schema } from "@tpluscode/rdf-ns-builders";
import N3 from "n3";
import { beforeEach, describe, it } from "vitest";
import { MutableResourceSet } from "../MutableResourceSet";
import { houseMdDataset } from "./houseMdDataset";

describe("MutableResourceSet", () => {
  let mutableResourceSet: MutableResourceSet;

  beforeEach(() => {
    mutableResourceSet = new MutableResourceSet({
      dataFactory: N3.DataFactory,
      dataset: new N3.Store([...houseMdDataset]),
    });
  });

  it("should get a mutable named instance of a Person", ({ expect }) => {
    const person = mutableResourceSet.mutableNamedResource({
      identifier: N3.DataFactory.namedNode(
        "https://housemd.rdf-ext.org/person/allison-cameron",
      ),
      mutateGraph: N3.DataFactory.defaultGraph(),
    });
    expect(
      person
        .value(schema.encodingFormat)
        .chain((value) => value.toString())
        .orDefault(""),
    ).toStrictEqual("");
    person.add(schema.encodingFormat, N3.DataFactory.literal("test"));
    expect(
      person
        .value(schema.encodingFormat)
        .chain((value) => value.toString())
        .orDefault(""),
    ).toStrictEqual("test");
  });
});