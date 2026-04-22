import DataFactory from "@rdfjs/data-model";
import { sh } from "@tpluscode/rdf-ns-builders";
import { invariant } from "ts-invariant";
import { describe, expect, it } from "vitest";
import { PropertyPath } from "../src/PropertyPath.js";
import { ResourceSet } from "../src/ResourceSet.js";
import { propertyPathsDataset } from "./propertyPathsDataset.js";

describe("PropertyPath", () => {
  const resourceSet = new ResourceSet(propertyPathsDataset);

  function testPropertyPath(
    name: string,
    expectPropertyPath: (propertyPath: PropertyPath) => void,
  ): void {
    const identifier = DataFactory.namedNode(
      `http://example.com/${name}PropertyShape`,
    );

    const propertyPathFromTestRdf = PropertyPath.fromResource(
      resourceSet
        .resource(identifier)
        .value(sh.path)
        .unsafeCoerce()
        .toResource()
        .unsafeCoerce(),
    ).unsafeCoerce();

    expectPropertyPath(propertyPathFromTestRdf);

    const propertyPathFromRoundTripRdf = PropertyPath.fromResource(
      PropertyPath.toResource(propertyPathFromTestRdf),
    ).unsafeCoerce();

    expectPropertyPath(propertyPathFromRoundTripRdf);

    expect(
      PropertyPath.equals(
        propertyPathFromTestRdf,
        propertyPathFromRoundTripRdf,
      ),
    ).toStrictEqual(true);
  }

  it("alternative path", ({ expect }) => {
    testPropertyPath("AlternativePath", (propertyPath) => {
      invariant(propertyPath.termType === "AlternativePath");
      expect(propertyPath.members).toHaveLength(2);
      for (let memberI = 0; memberI < 2; memberI++) {
        const member = propertyPath.members[memberI];
        invariant(member.termType === "NamedNode");
        expect(member.value).toStrictEqual(
          `http://example.com/predicate${memberI + 1}`,
        );
      }
    });
  });

  it("alternative inverse path", ({ expect }) => {
    testPropertyPath("AlternativeInversePath", (propertyPath) => {
      invariant(propertyPath.termType === "AlternativePath");
      expect(propertyPath.members).toHaveLength(2);
      for (let memberI = 0; memberI < 2; memberI++) {
        const member = propertyPath.members[memberI];
        invariant(member.termType === "InversePath");
        invariant(member.path.termType === "NamedNode");
        expect(member.path.value).toStrictEqual(
          `http://example.com/predicate${memberI + 1}`,
        );
      }
    });
  });

  it("inverse path", ({ expect }) => {
    testPropertyPath("InversePath", (propertyPath) => {
      invariant(propertyPath.termType === "InversePath");
      invariant(propertyPath.path.termType === "NamedNode");
      expect(propertyPath.path.value).toStrictEqual(
        "http://example.com/predicate",
      );
    });
  });

  it("one or more path", ({ expect }) => {
    testPropertyPath("OneOrMorePath", (propertyPath) => {
      invariant(propertyPath.termType === "OneOrMorePath");
      invariant(propertyPath.path.termType === "NamedNode");
      expect(propertyPath.path.value).toStrictEqual(
        "http://example.com/predicate",
      );
    });
  });

  it("predicate path", ({ expect }) => {
    testPropertyPath("PredicatePath", (propertyPath) => {
      invariant(propertyPath.termType === "NamedNode");
      expect(propertyPath.value).toStrictEqual("http://example.com/predicate");
    });
  });

  it("sequence path", ({ expect }) => {
    testPropertyPath("SequencePath", (propertyPath) => {
      invariant(propertyPath.termType === "SequencePath");
      expect(propertyPath.members).toHaveLength(2);
      for (let memberI = 0; memberI < 2; memberI++) {
        const member = propertyPath.members[memberI];
        invariant(member.termType === "NamedNode");
        expect(member.value).toStrictEqual(
          `http://example.com/predicate${memberI + 1}`,
        );
      }
    });
  });

  it("zero or more path", ({ expect }) => {
    testPropertyPath("ZeroOrMorePath", (propertyPath) => {
      invariant(propertyPath.termType === "ZeroOrMorePath");
      invariant(propertyPath.path.termType === "NamedNode");
      expect(propertyPath.path.value).toStrictEqual(
        "http://example.com/predicate",
      );
    });
  });

  it("zero or one path", ({ expect }) => {
    testPropertyPath("ZeroOrOnePath", (propertyPath) => {
      invariant(propertyPath.termType === "ZeroOrOnePath");
      invariant(propertyPath.path.termType === "NamedNode");
      expect(propertyPath.path.value).toStrictEqual(
        "http://example.com/predicate",
      );
    });
  });
});
