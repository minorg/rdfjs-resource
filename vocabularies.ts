import type { NamedNode, Term } from "@rdfjs/types";

const namedNode = <ValueT extends string>(
  value: ValueT,
): NamedNode<ValueT> => ({
  equals: (other: Term) =>
    other.termType === "NamedNode" && other.value === value,
  termType: "NamedNode",
  value,
});

export namespace rdf {
  export const first = namedNode(
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#first",
  );
  export const nil = namedNode(
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil",
  );
  export const rest = namedNode(
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest",
  );
  export const type = namedNode(
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  );
}

export namespace rdfs {
  export const subClassOf = namedNode(
    "http://www.w3.org/2000/01/rdf-schema#subClassOf",
  );
}
