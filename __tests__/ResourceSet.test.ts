import dataFactory from "@rdfjs/data-model";
import datasetFactory from "@rdfjs/dataset";
import { schema } from "@tpluscode/rdf-ns-builders";
import { describe, it } from "vitest";
import { ResourceSet } from "../src/ResourceSet.js";
import { houseMdDataset } from "./houseMdDataset.js";
import { testData } from "./testData.js";

describe("ResourceSet", () => {
  const houseMdResourceSet = new ResourceSet(houseMdDataset);
  const { graph, literals, predicate, subject } = testData;

  describe("constructor", () => {
    it("no graph specified", ({ expect }) => {
      const dataset = datasetFactory.dataset();
      const resourceSet = new ResourceSet(dataset);
      resourceSet.resource(subject).add(predicate, literals.string);
      expect(dataset.size).toStrictEqual(1);
      expect(
        [...dataset][0].equals(
          dataFactory.quad(
            subject,
            predicate,
            literals.string,
            dataFactory.defaultGraph(),
          ),
        ),
      ).toStrictEqual(true);
    });

    it("named graph", ({ expect }) => {
      const dataset = datasetFactory.dataset();
      const resourceSet = new ResourceSet(dataset, { graph });
      resourceSet.resource(subject).add(predicate, literals.string);
      expect(dataset.size).toStrictEqual(1);
      expect(
        [...dataset][0].equals(
          dataFactory.quad(subject, predicate, literals.string, graph),
        ),
      ).toStrictEqual(true);
    });
  });

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

  describe("resource", () => {
    it("no graph specified", ({ expect }) => {
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

    it("named graph", ({ expect }) => {
      const person = houseMdResourceSet.resource(
        dataFactory.namedNode(
          "https://housemd.rdf-ext.org/person/allison-cameron",
        ),
        {
          graph: dataFactory.namedNode(
            "https://housemd.rdf-ext.org/person/allison-cameron",
          ),
        },
      );
      expect(
        person
          .value(schema.familyName)
          .chain((value) => value.toString())
          .orDefault(""),
      ).toStrictEqual("Cameron");
    });
  });
});
