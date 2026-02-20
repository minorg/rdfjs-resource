import DataFactory from "@rdfjs/data-model";
import { schema } from "@tpluscode/rdf-ns-builders";
import { describe, it } from "vitest";
import { ResourceSet } from "../src/ResourceSet.js";
import { houseMdDataset } from "./houseMdDataset.js";

describe("ResourceSet", () => {
  const houseMdResourceSet = new ResourceSet(houseMdDataset);

  it("should get instances of PostalAddress", ({ expect }) => {
    const addresses = [...houseMdResourceSet.instancesOf(schema.PostalAddress)];
    expect(addresses).toHaveLength(3);
    expect(
      addresses.some(
        (address) =>
          address
            .value(schema.addressLocality)
            .chain((value) => value.toString())
            .orDefault("") === "Plainsboro Township",
      ),
    ).toStrictEqual(true);
  });

  it("should get named instances of Person", ({ expect }) => {
    const people = [...houseMdResourceSet.namedInstancesOf(schema.Person)];
    expect(people).toHaveLength(9);
    expect(
      people.some(
        (person) =>
          person.identifier.value ===
          "https://housemd.rdf-ext.org/person/allison-cameron",
      ),
    ).toStrictEqual(true);
  });

  it("should get a named instance of a Person", ({ expect }) => {
    const person = houseMdResourceSet.namedResource(
      DataFactory.namedNode(
        "https://housemd.rdf-ext.org/person/allison-cameron",
      ),
    );
    expect(
      person
        .value(schema.familyName)
        .chain((value) => value.toString())
        .orDefault(""),
    ).toStrictEqual("Cameron");
  });
});
