import type { Quad, Quad_Object, Variable } from "@rdfjs/types";
import { xsd } from "@tpluscode/rdf-ns-builders";
import { DataFactory, Store } from "n3";
import { Resource } from "../src/Resource.js";

const objects: Record<string, Exclude<Quad_Object, Quad | Variable>> = {
  blankNode: DataFactory.blankNode(),
  booleanLiteral: DataFactory.literal(1, xsd.boolean),
  dateLiteral: DataFactory.literal("2002-09-24", xsd.date),
  dateTimeLiteral: DataFactory.literal("2002-05-30T09:00:00", xsd.dateTime),
  intLiteral: DataFactory.literal(1),
  namedNode: DataFactory.namedNode("http://example.com/namedNodeObject"),
  stringLiteral: DataFactory.literal("stringLiteralObject"),
};

const predicate = DataFactory.namedNode("http://example.com/predicate");
const subject = DataFactory.namedNode("http://example.com/subject");

export const testData = {
  objects,
  predicate,
  resource: () => {
    const resource = new Resource(new Store(), subject);
    for (const object of Object.values(objects)) {
      resource.add(predicate, object);
    }
    return resource;
  },
  subject,
};
