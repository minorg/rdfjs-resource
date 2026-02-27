import dataFactory from "@rdfjs/data-model";
import datasetFactory from "@rdfjs/dataset";
import { rdf, rdfs, schema, skos } from "@tpluscode/rdf-ns-builders";
import { describe, expect, it } from "vitest";
import { Resource } from "../src/Resource.js";
import { ResourceSet } from "../src/ResourceSet.js";
import { houseMdDataset } from "./houseMdDataset.js";
import { testData } from "./testData.js";

describe("Resource", () => {
  const { objects, predicate, subject } = testData;
  const testResource = new Resource(datasetFactory.dataset(), subject);
  for (const object of Object.values(objects)) {
    testResource.add(predicate, object);
  }

  it("add", () => {
    const resource = new Resource(datasetFactory.dataset(), subject);
    resource.add(predicate, objects["stringLiteral"]);
    const values = [...resource.values(predicate)].map((value) =>
      value.toTerm(),
    );
    expect(values).toHaveLength(1);
    expect(values[0].equals(objects["stringLiteral"])).toBe(true);
  });

  describe("addList", () => {
    it("simple", () => {
      const resource = new Resource(datasetFactory.dataset(), subject);
      resource.addList(predicate, [
        objects["stringLiteral"],
        objects["intLiteral"],
      ]);
      expect([...resource.values(predicate)]).toHaveLength(1);
      const list = resource
        .value(predicate)
        .chain((value) => value.toList())
        .map((values) =>
          values.flatMap((value) => value.toLiteral().toMaybe().toList()),
        )
        .orDefault([]);
      expect(list).toHaveLength(2);
      expect(
        list.some((element) => element.equals(objects["stringLiteral"])),
      ).toStrictEqual(true);
      expect(
        list.some((element) => element.equals(objects["intLiteral"])),
      ).toStrictEqual(true);
    });

    for (const terms of [
      [],
      [dataFactory.literal("test")],
      [dataFactory.literal("test"), dataFactory.literal("test")],
      [
        dataFactory.literal("test"),
        dataFactory.literal("test"),
        dataFactory.literal("test"),
      ],
      [
        dataFactory.literal("test"),
        dataFactory.literal("test"),
        dataFactory.literal("test"),
        dataFactory.literal("test"),
      ],
    ]) {
      it(`list of ${terms.length} terms`, ({ expect }) => {
        const resource = new Resource(datasetFactory.dataset(), subject);
        const listResource = resource.addList(predicate, terms, {
          mintSubListIdentifier: (_, itemIndex) =>
            dataFactory.namedNode(
              `http://example.com/list${itemIndex.toString()}`,
            ),
        });
        if (terms.length === 0) {
          expect(listResource.identifier.equals(rdf.nil)).toStrictEqual(true);
        } else {
          expect(resource.dataset.size).not.toEqual(0);
        }
        // Should only have NamedNode identifiers for the pieces of the list
        const datasetQuads = [
          ...resource.dataset.match(null, null, null, null),
        ];
        expect(
          datasetQuads.every(
            (quad) =>
              quad.subject.termType === "NamedNode" &&
              (quad.object.termType === "NamedNode" ||
                quad.object.termType === "Literal"),
          ),
        );
        const deserializedTerms = [
          ...listResource
            .toList()
            .unsafeCoerce()
            .map((value) => value.toTerm()),
        ];
        expect(deserializedTerms).toHaveLength(terms.length);
        terms.forEach((term, termI) => {
          expect(term.equals(deserializedTerms[termI])).toStrictEqual(true);
        });
      });
    }
  });

  describe("delete", () => {
    it("one value", () => {
      const resource = new Resource(datasetFactory.dataset(), subject);
      resource.add(predicate, objects["stringLiteral"]);
      resource.add(predicate, objects["intLiteral"]);
      expect([...resource.values(predicate)]).toHaveLength(2);
      resource.delete(predicate, objects["intLiteral"]);
      const values = [...resource.values(predicate)].map((value) =>
        value.toTerm(),
      );
      expect(values).toHaveLength(1);
      expect(values[0].equals(objects["stringLiteral"])).toBe(true);
    });

    it("all values", () => {
      const resource = new Resource(datasetFactory.dataset(), subject);
      resource.add(predicate, objects["stringLiteral"]);
      resource.add(predicate, objects["intLiteral"]);
      expect([...resource.values(predicate)]).toHaveLength(2);
      resource.delete(predicate);
      expect([...resource.values(predicate)]).toHaveLength(0);
    });
  });

  describe("isInstanceOf", () => {
    const dataset = datasetFactory.dataset();
    const class_ = skos.Concept;
    const classInstance = new Resource(dataset, dataFactory.blankNode());
    classInstance.add(rdf.type, class_);
    const subClass = dataFactory.namedNode(
      "http://example.com/ConceptSubclass",
    );
    const subClassInstance = new Resource(dataset, dataFactory.blankNode());
    subClassInstance.add(rdf.type, subClass);
    dataset.add(dataFactory.quad(subClass, rdfs.subClassOf, class_));

    it("third party data", ({ expect }) => {
      const houseMdResourceSet = new ResourceSet(houseMdDataset);
      const houseMdResource = houseMdResourceSet.resource(
        dataFactory.namedNode(
          "https://housemd.rdf-ext.org/person/allison-cameron",
        ),
      );
      expect(houseMdResource.isInstanceOf(schema.Person)).toStrictEqual(true);
    });

    it("should find a class instance", () => {
      expect(classInstance.isInstanceOf(class_)).toStrictEqual(true);
    });

    it("should find a subclass instance if excludeSubclasses is false", () => {
      expect(
        subClassInstance.isInstanceOf(class_, { excludeSubclasses: false }),
      ).toStrictEqual(true);
    });

    it("should not find a subclass instance if excludeSubclasses is true", () => {
      expect(
        subClassInstance.isInstanceOf(class_, { excludeSubclasses: true }),
      ).toStrictEqual(false);
    });

    it("should handle the negative case", () => {
      expect(
        new Resource(dataset, dataFactory.blankNode()).isInstanceOf(class_),
      ).toStrictEqual(false);
    });
  });

  it("isSubClassOf (positive case)", () => {
    const dataset = datasetFactory.dataset();
    const class_ = skos.Concept;
    const subClass = new Resource(
      dataset,
      dataFactory.namedNode("http://example.com/subClass"),
    );
    subClass.add(rdfs.subClassOf, class_);
    const subSubClass = new Resource(
      dataset,
      dataFactory.namedNode("http://example.com/subSubClass"),
    );
    subSubClass.add(rdfs.subClassOf, subClass.identifier);
    expect(subSubClass.isSubClassOf(class_)).toStrictEqual(true);
  });

  it("isSubClassOf (negative case)", () => {
    const dataset = datasetFactory.dataset();
    const class1 = skos.Concept;
    const class2 = new Resource(
      dataset,
      dataFactory.namedNode("http://example.com/subClass"),
    );
    const subClass = new Resource(
      dataset,
      dataFactory.namedNode("http://example.com/subSubClass"),
    );
    subClass.add(rdfs.subClassOf, class2.identifier);
    expect(subClass.isSubClassOf(class1)).toStrictEqual(false);
  });

  it("set", () => {
    const resource = new Resource(datasetFactory.dataset(), subject);
    resource.add(predicate, objects["stringLiteral"]);
    expect(resource.dataset.size).toStrictEqual(1);
    resource.set(predicate, objects["intLiteral"]);
    expect(resource.dataset.size).toStrictEqual(1);
    const values = [...resource.values(predicate)].map((value) =>
      value.toTerm(),
    );
    expect(values).toHaveLength(1);
    expect(values[0].equals(objects["intLiteral"])).toBe(true);
  });

  describe("toList", () => {
    it("should read an empty list", ({ expect }) => {
      const resource = new Resource(
        datasetFactory.dataset(),
        dataFactory.blankNode(),
      );
      resource.add(predicate, rdf.nil);
      expect(resource.value(predicate).unsafeCoerce().toList().unsafeCoerce())
        .to.be.empty;
    });

    it("should read a list with one literal", ({ expect }) => {
      const resource = new Resource(
        datasetFactory.dataset(),
        dataFactory.blankNode(),
      );
      resource.addList(predicate, ["test"]);
      const list = resource
        .value(predicate)
        .chain((_) => _.toList())
        .unsafeCoerce()
        .map((_) => _.toString().unsafeCoerce());
      expect(list).to.have.length(1);
      expect(list[0]).to.eq("test");
    });

    it("should read a list with two literals", ({ expect }) => {
      const resource = new Resource(
        datasetFactory.dataset(),
        dataFactory.blankNode(),
      );
      resource.addList(predicate, ["test1", "test2"]);
      const list = resource
        .value(predicate)
        .chain((_) => _.toList())
        .unsafeCoerce()
        .map((_) => _.toString().unsafeCoerce());
      expect(list).to.have.length(2);
      expect(list[0]).to.eq("test1");
      expect(list[1]).to.eq("test2");
    });
  });

  describe("value", () => {
    it("missing", ({ expect }) => {
      expect(
        testResource
          .value(dataFactory.namedNode("http://example.com/nonexistent"))
          .toMaybe()
          .extract(),
      ).toBeUndefined();
    });

    it("present", ({ expect }) => {
      expect(
        testResource
          .values(predicate)
          .find((value) => value.termType === "NamedNode")
          .unsafeCoerce()
          .toIri()
          .toMaybe()
          .extract()?.value,
      ).toStrictEqual(objects["namedNode"].value);
    });

    it("filtered", ({ expect }) => {
      const value = testResource
        .values(predicate)
        .find((value) => value.termType === "NamedNode")
        .toMaybe()
        .extract();
      expect(value).toBeDefined();
    });
  });

  it("values", ({ expect }) => {
    const values = [...testResource.values(predicate)];
    expect(values).toHaveLength(Object.keys(objects).length);
    for (const object of Object.values(objects)) {
      expect(
        values.find((value) => value.toTerm().equals(object)),
      ).toBeDefined();
    }
  });

  it("valueOf", ({ expect }) => {
    const resourceValues = [...testResource.values(predicate)].flatMap(
      (value) => value.toResource().toMaybe().toList(),
    );
    expect(resourceValues).toHaveLength(2);
    for (const resourceValue of resourceValues) {
      expect(
        resourceValue
          .valueOf(predicate)
          .unsafeCoerce()
          .toIdentifier()
          .equals(testResource.identifier),
      ).toBe(true);
    }
  });

  it("valuesOf", ({ expect }) => {
    const resourceValues = [...testResource.values(predicate)].flatMap(
      (value) => value.toResource().toMaybe().toList(),
    );
    expect(resourceValues).toHaveLength(2);
    for (const resourceValue of resourceValues) {
      const valuesOf = [...resourceValue.valuesOf(predicate)];
      expect(valuesOf).toHaveLength(1);
      expect(valuesOf[0].toIdentifier().equals(testResource.identifier)).toBe(
        true,
      );
    }
  });
});
