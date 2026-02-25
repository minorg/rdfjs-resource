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
  export const byte = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#byte",
  );
  export const date = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#date",
  );
  export const dateTime = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#dateTime",
  );
  export const dateTimeStamp = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#dateTimeStamp",
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
  export const int = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#int",
  );
  export const integer = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#integer",
  );
  export const long = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#long",
  );
  export const short = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#short",
  );
  export const string = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#string",
  );
  export const unsignedByte = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#unsignedByte",
  );
  export const unsignedInt = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#unsignedInt",
  );
  export const unsignedLong = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#unsignedLong",
  );
  export const unsignedShort = DataFactory.namedNode(
    "http://www.w3.org/2001/XMLSchema#unsignedShort",
  );
}
