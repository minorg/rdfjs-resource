import dataFactory from "@rdfjs/data-model";
import { schema } from "@tpluscode/rdf-ns-builders";
import { describe, it } from "vitest";
import { ResourceSet } from "../src/ResourceSet.js";
import { houseMdDataset } from "./houseMdDataset.js";

describe("ResourceSet", () => {
  const houseMdResourceSet = new ResourceSet(houseMdDataset);

  describe("instancesOf", () => {
    it("no graph specified", ({ expect }) => {
      const addresses = [
        ...houseMdResourceSet.instancesOf(schema.PostalAddress),
      ];
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

    it("named graph", ({ expect }) => {
      expect([
        ...houseMdResourceSet.instancesOf(schema.PostalAddress, {
          graph: dataFactory.defaultGraph(),
        }),
      ]).toHaveLength(0);

      const addresses = [
        ...houseMdResourceSet.instancesOf(schema.PostalAddress, {
          graph: dataFactory.namedNode(
            "https://housemd.rdf-ext.org/place/princeton-plainsboro",
          ),
        }),
      ];
      expect(addresses).toHaveLength(1);
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
  });

  describe("namedInstancesOf", () => {
    it("no graph specified", ({ expect }) => {
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

    it("named graph", ({ expect }) => {
      const people = [
        ...houseMdResourceSet.namedInstancesOf(schema.Person, {
          graph: dataFactory.namedNode(
            "https://housemd.rdf-ext.org/person/allison-cameron",
          ),
        }),
      ];
      expect(people).toHaveLength(1);
      expect(
        people.some(
          (person) =>
            person.identifier.value ===
            "https://housemd.rdf-ext.org/person/allison-cameron",
        ),
      ).toStrictEqual(true);
    });
  });

  it("resource", ({ expect }) => {
    const person = houseMdResourceSet.resource(
      dataFactory.namedNode(
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
