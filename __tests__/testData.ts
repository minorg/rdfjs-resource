import type { Quad, Quad_Object, Variable } from "@rdfjs/types";
import { xsd } from "@tpluscode/rdf-ns-builders";
import { DataFactory } from "n3";

const literals = {
  // String types
  string: DataFactory.literal("stringLiteralObject"),
  normalizedString: DataFactory.literal(
    "normalized string",
    xsd.normalizedString,
  ),
  token: DataFactory.literal("token", xsd.token),
  language: DataFactory.literal("en", xsd.language),
  name: DataFactory.literal("Name", xsd.Name),
  ncName: DataFactory.literal("NCName", xsd.NCName),
  nmtoken: DataFactory.literal("NMTOKEN", xsd.NMTOKEN),

  // Boolean
  boolean: DataFactory.literal("true", xsd.boolean),

  // Binary
  base64Binary: DataFactory.literal("SGVsbG8=", xsd.base64Binary),
  hexBinary: DataFactory.literal("48656C6C6F", xsd.hexBinary),

  // Numeric - integer hierarchy
  integer: DataFactory.literal("42", xsd.integer),
  nonPositiveInteger: DataFactory.literal("-1", xsd.nonPositiveInteger),
  negativeInteger: DataFactory.literal("-5", xsd.negativeInteger),
  long: DataFactory.literal("9223372036854775807", xsd.long),
  int: DataFactory.literal("2147483647", xsd.int),
  short: DataFactory.literal("32767", xsd.short),
  byte: DataFactory.literal("127", xsd.byte),
  nonNegativeInteger: DataFactory.literal("1", xsd.nonNegativeInteger),
  unsignedLong: DataFactory.literal("18446744073709551615", xsd.unsignedLong),
  unsignedInt: DataFactory.literal("4294967295", xsd.unsignedInt),
  unsignedShort: DataFactory.literal("65535", xsd.unsignedShort),
  unsignedByte: DataFactory.literal("255", xsd.unsignedByte),
  positiveInteger: DataFactory.literal("1", xsd.positiveInteger),

  // Numeric - decimal & floating point
  // decimal: DataFactory.literal("10.5", xsd.decimal),
  float: DataFactory.literal("3.14", xsd.float),
  double: DataFactory.literal("2.718281828459045", xsd.double),

  // Date & time
  date: DataFactory.literal("2002-09-24", xsd.date),
  dateTime: DataFactory.literal("2002-05-30T09:00:00", xsd.dateTime),
  dateTimeStamp: DataFactory.literal("2002-05-30T09:00:00Z", xsd.dateTimeStamp),
  // time: DataFactory.literal("09:00:00", xsd.time),
  // duration: DataFactory.literal("P1Y2M3DT4H5M6S", xsd.duration),
  // yearMonthDuration: DataFactory.literal("P1Y2M", xsd.yearMonthDuration),
  // dayTimeDuration: DataFactory.literal("P3DT4H", xsd.dayTimeDuration),
  // gYear: DataFactory.literal("2002", xsd.gYear),
  // gYearMonth: DataFactory.literal("2002-09", xsd.gYearMonth),
  // gMonth: DataFactory.literal("--09", xsd.gMonth),
  // gMonthDay: DataFactory.literal("--09-24", xsd.gMonthDay),
  // gDay: DataFactory.literal("---24", xsd.gDay),

  // URI & QName
  anyUri: DataFactory.literal("https://example.org/resource", xsd.anyURI),
  qName: DataFactory.literal("ex:localPart", xsd.QName),

  // NOTATION (rarely used)
  notation: DataFactory.literal("notationName", xsd.NOTATION),
};

const objects: Record<string, Exclude<Quad_Object, Quad | Variable>> = {
  blankNode: DataFactory.blankNode(),
  namedNode: DataFactory.namedNode("http://example.com/namedNodeObject"),
};
for (const [key, literal] of Object.entries(literals)) {
  objects[`${key}Literal`] = literal;
}

const predicate = DataFactory.namedNode("http://example.com/predicate");
const subject = DataFactory.namedNode("http://example.com/subject");

export const testData = {
  literals,
  objects,
  predicate,
  subject,
};
