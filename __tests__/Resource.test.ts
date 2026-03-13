import dataFactory from "@rdfjs/data-model";
import datasetFactory from "@rdfjs/dataset";
import { rdf, rdfs, schema, skos } from "@tpluscode/rdf-ns-builders";
import { describe, expect, it } from "vitest";
import { Resource } from "../src/Resource.js";
import { ResourceSet } from "../src/ResourceSet.js";
import { houseMdDataset } from "./houseMdDataset.js";
import { testData } from "./testData.js";

describe("Resource", () => {
  const { graph, literals, objects, predicate, subject } = testData;
  const testResource = new Resource(datasetFactory.dataset(), subject);
  for (const object of Object.values(objects)) {
    testResource.add(predicate, object);
  }

  describe("constructor", () => {
    it("no graph specified", () => {
      const dataset = datasetFactory.dataset();
      const resource = new Resource(dataset, subject);
      resource.add(predicate, literals.string);
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

    it("named graph", () => {
      const dataset = datasetFactory.dataset();
      const resource = new Resource(dataset, subject, { graph });
      resource.add(predicate, literals.string);
      expect(dataset.size).toStrictEqual(1);
      expect(
        [...dataset][0].equals(
          dataFactory.quad(subject, predicate, literals.string, graph),
        ),
      ).toStrictEqual(true);
    });
  });

  describe("add", () => {
    it("default graph", ({ expect }) => {
      const dataset = datasetFactory.dataset();
      const resource = new Resource(dataset, subject);
      resource.add(predicate, literals.string);
      expect(dataset.size).toStrictEqual(1);
      expect(
        [...dataset][0].graph.equals(dataFactory.defaultGraph()),
      ).toStrictEqual(true);
      const values = [...resource.values(predicate)].map((value) =>
        value.toTerm(),
      );
      expect(values).toHaveLength(1);
      expect(values[0].equals(literals.string)).toBe(true);
    });

    it("named graph", ({ expect }) => {
      const dataset = datasetFactory.dataset();
      const resource = new Resource(dataset, subject);
      resource.add(predicate, literals.string, graph);
      expect(dataset.size).toStrictEqual(1);
      expect([...dataset][0].graph.equals(graph)).toStrictEqual(true);
      const values = [...resource.values(predicate, { graph })].map((value) =>
        value.toTerm(),
      );
      expect(values).toHaveLength(1);
      expect(values[0].equals(literals.string)).toBe(true);
    });
  });

  describe("addList", () => {
    it("simple", () => {
      const dataset = datasetFactory.dataset();
      const resource = new Resource(dataset, subject);
      resource.addList(predicate, [literals.string, literals.int]);
      expect(dataset.size).toStrictEqual(5);
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
        list.some((element) => element.equals(literals.string)),
      ).toStrictEqual(true);
      expect(
        list.some((element) => element.equals(literals.int)),
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

    it("named graph", ({ expect }) => {
      const dataset = datasetFactory.dataset();
      const resource = new Resource(dataset, subject);
      resource.addList(predicate, [literals.string, literals.int], { graph });
      expect(
        [...dataset].filter((quad) =>
          quad.graph.equals(dataFactory.defaultGraph()),
        ),
      ).toHaveLength(0);
      expect(
        [...dataset].filter((quad) => quad.graph.equals(graph)),
      ).toHaveLength(5);
    });
  });

  describe("delete", () => {
    it("one value", () => {
      const resource = new Resource(datasetFactory.dataset(), subject);
      resource.add(predicate, literals.string);
      resource.add(predicate, literals.int);
      expect([...resource.values(predicate)]).toHaveLength(2);
      resource.delete(predicate, literals.int);
      const values = [...resource.values(predicate)].map((value) =>
        value.toTerm(),
      );
      expect(values).toHaveLength(1);
      expect(values[0].equals(literals.string)).toBe(true);
    });

    it("all values", () => {
      const resource = new Resource(datasetFactory.dataset(), subject);
      resource.add(predicate, literals.string);
      resource.add(predicate, literals.int);
      expect([...resource.values(predicate)]).toHaveLength(2);
      resource.delete(predicate);
      expect([...resource.values(predicate)]).toHaveLength(0);
    });

    it("named graph", ({ expect }) => {
      const testResource = new Resource(datasetFactory.dataset(), subject);
      testResource.add(predicate, literals.string, graph);
      testResource.add(predicate, literals.string);
      testResource.add(predicate, literals.boolean); // In default graph
      testResource.add(
        predicate,
        literals.date,
        dataFactory.namedNode("http://example.com/othergraph"),
      );

      expect(testResource.values(predicate).toArray()).toHaveLength(4);

      testResource.delete(predicate, literals.string, graph);
      expect(testResource.values(predicate).toArray()).toHaveLength(3);
      expect(
        testResource
          .values(predicate)
          .toArray()
          .map((_) => _.toTerm())
          .some((_) => _.equals(literals.string)),
      ).toStrictEqual(true);
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
    resource.add(predicate, literals.string);
    expect(resource.dataset.size).toStrictEqual(1);
    resource.set(predicate, literals.int);
    expect(resource.dataset.size).toStrictEqual(1);
    const values = [...resource.values(predicate)].map((value) =>
      value.toTerm(),
    );
    expect(values).toHaveLength(1);
    expect(values[0].equals(literals.int)).toBe(true);
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

  describe("values", () => {
    it("every added value present", ({ expect }) => {
      const values = [...testResource.values(predicate)];
      expect(values).toHaveLength(Object.keys(objects).length);
      for (const object of Object.values(objects)) {
        expect(
          values.find((value) => value.toTerm().equals(object)),
        ).toBeDefined();
      }
    });

    it("named graph", ({ expect }) => {
      const testResource = new Resource(datasetFactory.dataset(), subject);
      testResource.add(predicate, literals.string, graph);
      testResource.add(predicate, literals.boolean); // In default graph
      testResource.add(
        predicate,
        literals.date,
        dataFactory.namedNode("http://example.com/othergraph"),
      );

      // Values in any graph
      expect(testResource.values(predicate).toArray()).toHaveLength(3);

      // Values in a specific graph
      const actualValues = testResource.values(predicate, { graph }).toArray();
      expect(actualValues).toHaveLength(1);
      expect(actualValues[0].toTerm().equals(literals.string)).toStrictEqual(
        true,
      );
    });

    it("unique (default graph)", ({ expect }) => {
      expect(
        testResource.values(predicate, { unique: true }).toArray(),
      ).toHaveLength(Object.values(objects).length);
    });

    it("unique (multiple graphs", ({ expect }) => {
      // Same object, different graphs
      const testResource = new Resource(datasetFactory.dataset(), subject);
      testResource.add(predicate, literals.string);
      testResource.add(predicate, literals.string, graph);
      expect(testResource.values(predicate).toArray()).toHaveLength(2);
      expect(
        testResource.values(predicate, { unique: true }).toArray(),
      ).toHaveLength(1);
    });
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
