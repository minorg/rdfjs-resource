import DataFactory from "@rdfjs/data-model";

export namespace rdf {
  export const first = DataFactory.namedNode(
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#first",
  );
  export const nil = DataFactory.namedNode(
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil",
  );
  export const rest = DataFactory.namedNode(
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest",
  );
  export const type = DataFactory.namedNode(
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
  );
}

export namespace rdfs {
  export const subClassOf = DataFactory.namedNode(
    "http://www.w3.org/2000/01/rdf-schema#subClassOf",
  );
}
