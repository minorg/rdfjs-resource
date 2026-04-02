import DataFactory from "@rdfjs/data-model";
import { sh } from "@tpluscode/rdf-ns-builders";
import { invariant } from "ts-invariant";
import { describe, it } from "vitest";
import { PropertyPath } from "../src/PropertyPath.js";
import { ResourceSet } from "../src/ResourceSet.js";
import { propertyPathsDataset } from "./propertyPathsDataset.js";

describe("PropertyPath", () => {
  const resourceSet = new ResourceSet(propertyPathsDataset);

  function propertyPath(name: string): PropertyPath {
    return PropertyPath.$fromRdf(
      resourceSet
        .resource(
          DataFactory.namedNode(`http://example.com/${name}PropertyShape`),
        )
        .value(sh.path)
        .unsafeCoerce()
        .toResource()
        .unsafeCoerce(),
    ).unsafeCoerce();
  }

  it("alternative path", ({ expect }) => {
    const propertyPath_ = propertyPath("AlternativePath");
    invariant(propertyPath_.termType === "AlternativePath");
    expect(propertyPath_.members).toHaveLength(2);
    for (let memberI = 0; memberI < 2; memberI++) {
      const member = propertyPath_.members[memberI];
      invariant(member.termType === "NamedNode");
      expect(member.value).toStrictEqual(
        `http://example.com/predicate${memberI + 1}`,
      );
    }
  });

  it("alternative inverse path", ({ expect }) => {
    const propertyPath_ = propertyPath("AlternativeInversePath");
    invariant(propertyPath_.termType === "AlternativePath");
    expect(propertyPath_.members).toHaveLength(2);
    for (let memberI = 0; memberI < 2; memberI++) {
      const member = propertyPath_.members[memberI];
      invariant(member.termType === "InversePath");
      invariant(member.path.termType === "NamedNode");
      expect(member.path.value).toStrictEqual(
        `http://example.com/predicate${memberI + 1}`,
      );
    }
  });

  it("inverse path", ({ expect }) => {
    const propertyPath_ = propertyPath("InversePath");
    invariant(propertyPath_.termType === "InversePath");
    invariant(propertyPath_.path.termType === "NamedNode");
    expect(propertyPath_.path.value).toStrictEqual(
      "http://example.com/predicate",
    );
  });

  it("one or more path", ({ expect }) => {
    const propertyPath_ = propertyPath("OneOrMorePath");
    invariant(propertyPath_.termType === "OneOrMorePath");
    invariant(propertyPath_.path.termType === "NamedNode");
    expect(propertyPath_.path.value).toStrictEqual(
      "http://example.com/predicate",
    );
  });

  it("predicate path", ({ expect }) => {
    const propertyPath_ = propertyPath("PredicatePath");
    invariant(propertyPath_.termType === "NamedNode");
    expect(propertyPath_.value).toStrictEqual("http://example.com/predicate");
  });

  it("sequence path", ({ expect }) => {
    const propertyPath_ = propertyPath("SequencePath");
    invariant(propertyPath_.termType === "SequencePath");
    expect(propertyPath_.members).toHaveLength(2);
    for (let memberI = 0; memberI < 2; memberI++) {
      const member = propertyPath_.members[memberI];
      invariant(member.termType === "NamedNode");
      expect(member.value).toStrictEqual(
        `http://example.com/predicate${memberI + 1}`,
      );
    }
  });

  it("zero or more path", ({ expect }) => {
    const propertyPath_ = propertyPath("ZeroOrMorePath");
    invariant(propertyPath_.termType === "ZeroOrMorePath");
    invariant(propertyPath_.path.termType === "NamedNode");
    expect(propertyPath_.path.value).toStrictEqual(
      "http://example.com/predicate",
    );
  });

  it("zero or one path", ({ expect }) => {
    const propertyPath_ = propertyPath("ZeroOrOnePath");
    invariant(propertyPath_.termType === "ZeroOrOnePath");
    invariant(propertyPath_.path.termType === "NamedNode");
    expect(propertyPath_.path.value).toStrictEqual(
      "http://example.com/predicate",
    );
  });
});
