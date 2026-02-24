type LiteralDatatypeDefinition =
  | {
      // Arbitrary-precision decimal
      kind: "bigdecimal";
      readonly range: [undefined, undefined];
    }
  | {
      // Arbitrary precision integer
      kind: "bigint";
      range: readonly [bigint | undefined, bigint | undefined];
    }
  | {
      // Boolean
      kind: "boolean";
    }
  | {
      // Date (without time)
      kind: "date";
    }
  | {
      // Date with time
      kind: "datetime";
    }
  | {
      // Fixed-with float
      kind: "float";
      readonly range: readonly [number, number];
    }
  | {
      // Fixed-width intheger
      kind: "int";
      readonly range: readonly [number, number];
    }
  | {
      // String
      kind: "string";
    };

export const literalDatatypeDefinitions: Record<
  string,
  LiteralDatatypeDefinition
> = {
  // Boolean
  "http://www.w3.org/2001/XMLSchema#boolean": {
    kind: "boolean",
  },

  // Date
  "http://www.w3.org/2001/XMLSchema#date": {
    kind: "date",
  },

  // Date-time
  "http://www.w3.org/2001/XMLSchema#dateTime": {
    kind: "datetime",
  },
  "http://www.w3.org/2001/XMLSchema#dateTimeStamp": {
    kind: "datetime",
  },

  // Fixed-width floats
  // 32-bit
  "http://www.w3.org/2001/XMLSchema#float": {
    kind: "float",
    range: [-3.4028235e38, 3.4028235e38],
  },
  // 64-bit
  "http://www.w3.org/2001/XMLSchema#double": {
    kind: "float",
    // Number.MIN_VALUE is the smallest positive number greater than 0
    range: [-Number.MAX_VALUE, Number.MAX_VALUE],
  },

  // Arbitrary precision decimal
  "http://www.w3.org/2001/XMLSchema#decimal": {
    kind: "bigdecimal",
    range: [undefined, undefined],
  },

  // Fixed-width integers
  // 8-bit signed
  "http://www.w3.org/2001/XMLSchema#byte": {
    kind: "int",
    range: [-128, 127],
  },
  // 16-bit signed
  "http://www.w3.org/2001/XMLSchema#short": {
    kind: "int",
    range: [-32768, 32767],
  },
  // 32-bit signed
  "http://www.w3.org/2001/XMLSchema#int": {
    kind: "int",
    range: [-2147483648, 2147483647],
  },
  // 64-bit signed
  "http://www.w3.org/2001/XMLSchema#long": {
    kind: "bigint",
    range: [-9223372036854775808n, 9223372036854775807n],
  },
  // 8-bit unsigned
  "http://www.w3.org/2001/XMLSchema#unsignedByte": {
    kind: "int",
    range: [0, 255],
  },
  // 16-bit unsigned
  "http://www.w3.org/2001/XMLSchema#unsignedShort": {
    kind: "int",
    range: [0, 65535],
  },
  // 32-bit unsigned
  "http://www.w3.org/2001/XMLSchema#unsignedInt": {
    kind: "int",
    range: [0, 4294967295],
  },
  // 64-bit unsigned
  "http://www.w3.org/2001/XMLSchema#unsignedLong": {
    kind: "bigint",
    range: [0n, 18446744073709551615n],
  },

  // Arbitrary precision integers
  "http://www.w3.org/2001/XMLSchema#integer": {
    kind: "bigint",
    range: [undefined, undefined],
  },
  "http://www.w3.org/2001/XMLSchema#negativeInteger": {
    kind: "bigint",
    range: [undefined, -1n],
  },
  "http://www.w3.org/2001/XMLSchema#nonNegativeInteger": {
    kind: "bigint",
    range: [0n, undefined],
  },
  "http://www.w3.org/2001/XMLSchema#nonPositiveInteger": {
    kind: "bigint",
    range: [undefined, 0n],
  },
  "http://www.w3.org/2001/XMLSchema#positiveInteger": {
    kind: "bigint",
    range: [1n, undefined],
  },

  // String
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#dirLangString": {
    kind: "string",
  },
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#anyURI": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#base64Binary": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#duration": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#hexBinary": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#language": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#Name": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#NCName": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#NMTOKEN": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#NOTATION": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#normalizedString": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#QName": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#string": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#time": { kind: "string" },
  "http://www.w3.org/2001/XMLSchema#token": { kind: "string" },
};
