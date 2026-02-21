import DefaultDataFactory from "@rdfjs/data-model";
import type { DataFactory, Literal, NamedNode } from "@rdfjs/types";
import type { Primitive } from "./Primitive.js";
import { xsd } from "./vocabularies.js";

const numericXsdDatatypeRange: Record<
  string,
  [bigint | number | undefined, bigint | number | undefined]
> = {
  "http://www.w3.org/2001/XMLSchema#byte": [-128, 127],

  "http://www.w3.org/2001/XMLSchema#short": [-32768, 32767],

  "http://www.w3.org/2001/XMLSchema#int": [-2147483648, 2147483647],

  "http://www.w3.org/2001/XMLSchema#long": [
    -9223372036854775808n,
    9223372036854775807n,
  ],

  "http://www.w3.org/2001/XMLSchema#integer": [undefined, undefined],

  "http://www.w3.org/2001/XMLSchema#positiveInteger": [1, undefined],

  "http://www.w3.org/2001/XMLSchema#nonNegativeInteger": [0, undefined],

  "http://www.w3.org/2001/XMLSchema#negativeInteger": [undefined, -1],

  "http://www.w3.org/2001/XMLSchema#nonPositiveInteger": [undefined, 0],

  "http://www.w3.org/2001/XMLSchema#unsignedByte": [0, 255],

  "http://www.w3.org/2001/XMLSchema#unsignedShort": [0, 65535],

  "http://www.w3.org/2001/XMLSchema#unsignedInt": [0, 4294967295],

  "http://www.w3.org/2001/XMLSchema#unsignedLong": [0, 18446744073709551615n],
};

/**
 * Factory with methods for creating RDF/JS Literals from other types.
 */
export class LiteralFactory {
  private readonly dataFactory: DataFactory;

  constructor(options?: { dataFactory?: DataFactory }) {
    this.dataFactory = options?.dataFactory ?? DefaultDataFactory;
  }

  boolean(value: boolean): Literal {
    return this.dataFactory.literal(value.toString(), xsd.boolean);
  }

  date(value: Date, datatype?: NamedNode): Literal {
    if (!datatype) {
      datatype = xsd.dateTime;
    }

    switch (datatype.value) {
      case "http://www.w3.org/2001/XMLSchema#date":
        return this.dataFactory.literal(
          value.toISOString().replace(/T.*$/, ""),
          datatype,
        );
      case "http://www.w3.org/2001/XMLSchema#dateTime":
        return this.dataFactory.literal(value.toISOString(), datatype);
      case "http://www.w3.org/2001/XMLSchema#gDay":
        return this.dataFactory.literal(
          value.getUTCDate().toString(),
          datatype,
        );
      case "http://www.w3.org/2001/XMLSchema#gMonthDay":
        return this.dataFactory.literal(
          `${value.getUTCMonth() + 1}-${value.getUTCDate()}`,
          datatype,
        );
      case "http://www.w3.org/2001/XMLSchema#gYear":
        return this.dataFactory.literal(
          value.getUTCFullYear().toString(),
          datatype,
        );
      case "http://www.w3.org/2001/XMLSchema#gYearMonth":
        return this.dataFactory.literal(
          `${value.getUTCFullYear()}-${value.getUTCMonth() + 1}`,
          datatype,
        );
      default:
        throw new RangeError(`unrecognized date datatype ${datatype.value}`);
    }
  }

  number(value: number, datatype?: NamedNode): Literal {
    let valueString = value.toString(10);

    if (Number.isNaN(value) || value === Infinity || value === -Infinity) {
      if (datatype) {
        switch (datatype.value) {
          case "http://www.w3.org/2001/XMLSchema#double":
          case "http://www.w3.org/2001/XMLSchema#float":
            break;
          default:
            throw new RangeError(
              `NaN/INF/-INF values only supported by xsd:double and xsd:float`,
            );
        }
      } else {
        datatype = xsd.double;
      }

      if (Number.isNaN(value)) {
        valueString = "NaN";
      } else if (value === Infinity) {
        valueString = "INF";
      } else if (value === -Infinity) {
        valueString = "-INF";
      }
    } else {
      if (!datatype) {
        if (Number.isInteger(value)) {
          datatype = xsd.integer;
        } else if (
          /^[+-]?([0-9]+(\\.[0-9]*)?|\\.[0-9]+)[eE][+-]?[0-9]+$/.test(
            valueString,
          )
        ) {
          // Has exponent: xsd:double
          datatype = xsd.double;
          return this.dataFactory.literal(valueString, xsd.double);
        } else {
          datatype = xsd.decimal;
        }
      }

      const range = numericXsdDatatypeRange[datatype.value];
      if (!range) {
        throw new RangeError(`unrecognized numeric datatype ${datatype.value}`);
      }
      const [min, max] = range;
      if (
        (min !== undefined && value < min) ||
        (max !== undefined && value > max)
      ) {
        throw new RangeError(
          `value (${value}) outside range [${min}, ${max}] of ${datatype.value}`,
        );
      }
    }

    return this.dataFactory.literal(valueString, datatype);
  }

  primitive(value: Primitive, datatype?: NamedNode): Literal {
    switch (typeof value) {
      case "boolean":
        if (datatype && !datatype.equals(xsd.boolean)) {
          throw new RangeError(
            `unrecognized boolean datatype ${datatype.value}`,
          );
        }
        return this.boolean(value);
      case "object": {
        if (value instanceof Date) {
          return this.date(value, datatype);
        }
        throw new Error("not implemented");
      }
      case "number":
        return this.number(value, datatype);
      case "string":
        return this.string(value, datatype);
    }
  }

  string(value: string, datatype?: NamedNode) {
    if (datatype) {
      switch (datatype.value) {
        case "http://www.w3.org/1999/02/22-rdf-syntax-ns#dirLangString":
        case "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString":
        case "http://www.w3.org/2001/XMLSchema#anyURI":
        case "http://www.w3.org/2001/XMLSchema#base64Binary":
        case "http://www.w3.org/2001/XMLSchema#duration":
        case "http://www.w3.org/2001/XMLSchema#hexBinary":
        case "http://www.w3.org/2001/XMLSchema#language":
        case "http://www.w3.org/2001/XMLSchema#Name":
        case "http://www.w3.org/2001/XMLSchema#NCName":
        case "http://www.w3.org/2001/XMLSchema#NMTOKEN":
        case "http://www.w3.org/2001/XMLSchema#normalizedString":
        case "http://www.w3.org/2001/XMLSchema#string":
        case "http://www.w3.org/2001/XMLSchema#time":
        case "http://www.w3.org/2001/XMLSchema#token":
          break;
        default:
          throw new Error(`unrecognized string datatype ${datatype.value}`);
      }
    }

    return this.dataFactory.literal(value, datatype);
  }
}
