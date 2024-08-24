import type { BlankNode, NamedNode } from "@rdfjs/types";
import { DataFactory, Parser, Store } from "n3";
import { describe, it } from "vitest";
import { getRdfList } from "../getRdfList.js";

describe("getRdfList", () => {
  const subject = DataFactory.namedNode("urn:example:subject");
  const predicate = DataFactory.namedNode("urn:example:predicate");

  const parseAndGetRdfList = (ttl: string) => {
    const dataset = new Store();
    dataset.addQuads(new Parser({ format: "Turtle" }).parse(ttl));
    const node = [...dataset.match(subject, predicate, null, null)][0].object as
      | BlankNode
      | NamedNode;
    return [
      ...getRdfList({
        dataset,
        node,
      }),
    ];
  };

  it("should read an empty list", ({ expect }) => {
    expect(parseAndGetRdfList(`<${subject.value}> <${predicate.value}> ( ) .`))
      .to.be.empty;
  });

  it("should read a list with one literal", ({ expect }) => {
    const list = parseAndGetRdfList(
      `<${subject.value}> <${predicate.value}> ( "test" ) .`,
    );
    expect(list).to.have.length(1);
    expect(list[0].value).to.eq("test");
  });

  it("should read a list with two literals", ({ expect }) => {
    const list = parseAndGetRdfList(
      `<${subject.value}> <${predicate.value}> ( "test" "test2" ) .`,
    );
    expect(list).to.have.length(2);
    expect(list[0].value).to.eq("test");
    expect(list[1].value).to.eq("test2");
  });

  it("should read a list with blank nodes", ({ expect }) => {
    expect(
      parseAndGetRdfList(
        `<${subject.value}> <${predicate.value}> ( [ ] [ ] ) .`,
      ),
    ).to.have.length(2);
  });
});
