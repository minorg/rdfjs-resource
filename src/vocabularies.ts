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

export namespace xsd {
  export const boolean = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#boolean",
  );
  export const date = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#date",
  );
  export const dateTime = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#dateTime",
  );
  export const decimal = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#decimal",
  );
  export const double = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#double",
  );
  export const float = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#float",
  );
  export const integer = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#integer",
  );
}
