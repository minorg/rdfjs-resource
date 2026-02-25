import DefaultDataFactory from "@rdfjs/data-model";
import type { DataFactory, Literal, NamedNode } from "@rdfjs/types";
import { literalDatatypeDefinitions } from "./literalDatatypeDefinitions.js";
import type { Primitive } from "./Primitive.js";
import { xsd } from "./vocabularies.js";

class DatatypeRangeError extends RangeError {
  constructor(readonly datatype: NamedNode) {
    super(`datatype out of range: ${datatype.value}`);
  }
}

/**
 * Factory with methods for creating RDF/JS Literals from other types.
 */
export class LiteralFactory {
  private readonly dataFactory: DataFactory;

  constructor(options?: { dataFactory?: DataFactory }) {
    this.dataFactory = options?.dataFactory ?? DefaultDataFactory;
  }

  bigint(value: bigint, datatype?: NamedNode): Literal {
    const valueString = value.toString(10);

    if (!datatype) {
      datatype = xsd.integer;
    }

    const datatypeDefinition = literalDatatypeDefinitions[datatype.value];
    if (datatypeDefinition) {
      switch (datatypeDefinition.kind) {
        case "bigdecimal":
        case "bigint":
        case "float":
        case "int": {
          const [min, max] = datatypeDefinition.range;
          if (
            (min !== undefined && value < min) ||
            (max !== undefined && value > max)
          ) {
            throw new RangeError(
              `value (${value}) outside range [${min}, ${max}] of ${datatype.value}`,
            );
          }
          break;
        }
        default:
          throw new DatatypeRangeError(datatype);
      }
    }

    return this.dataFactory.literal(valueString, datatype);
  }

  boolean(value: boolean, datatype?: NamedNode): Literal {
    if (!datatype) {
      datatype = xsd.boolean;
    }
    const datatypeDefinition = literalDatatypeDefinitions[datatype.value];
    if (datatypeDefinition && datatypeDefinition.kind !== "boolean") {
      throw new DatatypeRangeError(datatype);
    }
    return this.dataFactory.literal(value.toString(), datatype);
  }

  date(value: Date, datatype?: NamedNode): Literal {
    if (!datatype) {
      datatype = xsd.dateTime;
    }

    const datatypeDefinition = literalDatatypeDefinitions[datatype.value];
    if (datatypeDefinition) {
      switch (datatypeDefinition.kind) {
        case "date":
          return this.dataFactory.literal(
            value.toISOString().replace(/T.*$/, ""),
            datatype,
          );
        case "datetime":
          return this.dataFactory.literal(value.toISOString(), datatype);
        default:
          throw new DatatypeRangeError(datatype);
      }
    }

    // case "http://www.w3.org/2001/XMLSchema#gDay":
    //   return this.dataFactory.literal(
    //     value.getUTCDate().toString(),
    //     datatype,
    //   );
    // case "http://www.w3.org/2001/XMLSchema#gMonthDay":
    //   return this.dataFactory.literal(
    //     `${value.getUTCMonth() + 1}-${value.getUTCDate()}`,
    //     datatype,
    //   );
    // case "http://www.w3.org/2001/XMLSchema#gYear":
    //   return this.dataFactory.literal(
    //     value.getUTCFullYear().toString(),
    //     datatype,
    //   );
    // case "http://www.w3.org/2001/XMLSchema#gYearMonth":
    //   return this.dataFactory.literal(
    //     `${value.getUTCFullYear()}-${value.getUTCMonth() + 1}`,
    //     datatype,
    //   );

    return this.dataFactory.literal(value.toISOString(), datatype);
  }

  number(value: number, datatype?: NamedNode): Literal {
    let valueString = value.toString(10);
    if (Number.isNaN(value)) {
      valueString = "NaN";
    } else if (value === Infinity) {
      valueString = "INF";
    } else if (value === -Infinity) {
      valueString = "-INF";
    }

    if (!datatype) {
      if (Number.isInteger(value)) {
        if (value < 0) {
          datatype = [xsd.byte, xsd.short, xsd.int].find((checkDatatype) => {
            const checkDatatypeDefinition =
              literalDatatypeDefinitions[checkDatatype.value];
            if (checkDatatypeDefinition?.kind !== "int") {
              throw new Error("should never happen");
            }
            return value >= checkDatatypeDefinition.range[0];
          });
        } else {
          datatype = [
            xsd.unsignedByte,
            xsd.unsignedShort,
            xsd.unsignedInt,
          ].find((checkDatatype) => {
            const checkDatatypeDefinition =
              literalDatatypeDefinitions[checkDatatype.value];
            if (checkDatatypeDefinition?.kind !== "int") {
              throw new Error("should never happen");
            }
            return value <= checkDatatypeDefinition.range[1];
          });
        }

        if (!datatype) {
          datatype = xsd.integer;
        }
      } else {
        datatype = xsd.double;
      }
    }

    const datatypeDefinition = literalDatatypeDefinitions[datatype.value];
    if (datatypeDefinition) {
      if (Number.isNaN(value) || value === Infinity || value === -Infinity) {
        if (datatypeDefinition.kind !== "float") {
          throw new RangeError(
            `NaN/INF/-INF values only supported by xsd:double and xsd:float`,
          );
        }
      } else {
        switch (datatypeDefinition.kind) {
          case "bigdecimal":
          case "bigint":
          case "float":
          case "int": {
            const [min, max] = datatypeDefinition.range;
            if (
              (min !== undefined && value < min) ||
              (max !== undefined && value > max)
            ) {
              throw new RangeError(
                `value (${value}) outside range [${min}, ${max}] of ${datatype.value}`,
              );
            }
            break;
          }
          default:
            throw new DatatypeRangeError(datatype);
        }
      }
    }

    return this.dataFactory.literal(valueString, datatype);
  }

  primitive(value: Primitive, datatype?: NamedNode): Literal {
    switch (typeof value) {
      case "bigint":
        return this.bigint(value, datatype);
      case "boolean":
        return this.boolean(value, datatype);
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
      const datatypeDefinition = literalDatatypeDefinitions[datatype.value];
      if (datatypeDefinition && datatypeDefinition.kind !== "string") {
        throw new DatatypeRangeError(datatype);
      }
    }

    return this.dataFactory.literal(value, datatype);
  }
}
