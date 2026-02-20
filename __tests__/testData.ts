import type { Quad, Quad_Object, Variable } from "@rdfjs/types";
import { xsd } from "@tpluscode/rdf-ns-builders";
import { DataFactory } from "n3";

const objects: Record<string, Exclude<Quad_Object, Quad | Variable>> = {
  blankNode: DataFactory.blankNode(),
  namedNode: DataFactory.namedNode("http://example.com/namedNodeObject"),

  // Literals
  // String types
  stringLiteral: DataFactory.literal("stringLiteralObject"),
  normalizedStringLiteral: DataFactory.literal(
    "normalized string",
    xsd.normalizedString,
  ),
  tokenLiteral: DataFactory.literal("token", xsd.token),
  languageLiteral: DataFactory.literal("en", xsd.language),
  nameLiteral: DataFactory.literal("Name", xsd.Name),
  ncNameLiteral: DataFactory.literal("NCName", xsd.NCName),
  nmtokenLiteral: DataFactory.literal("NMTOKEN", xsd.NMTOKEN),

  // Boolean
  booleanLiteral: DataFactory.literal("true", xsd.boolean),

  // Binary
  base64BinaryLiteral: DataFactory.literal("SGVsbG8=", xsd.base64Binary),
  hexBinaryLiteral: DataFactory.literal("48656C6C6F", xsd.hexBinary),

  // Numeric - integer hierarchy
  integerLiteral: DataFactory.literal("42", xsd.integer),
  nonPositiveIntegerLiteral: DataFactory.literal("-1", xsd.nonPositiveInteger),
  negativeIntegerLiteral: DataFactory.literal("-5", xsd.negativeInteger),
  longLiteral: DataFactory.literal("9223372036854775807", xsd.long),
  intLiteral: DataFactory.literal("2147483647", xsd.int),
  shortLiteral: DataFactory.literal("32767", xsd.short),
  byteLiteral: DataFactory.literal("127", xsd.byte),
  nonNegativeIntegerLiteral: DataFactory.literal("1", xsd.nonNegativeInteger),
  unsignedLongLiteral: DataFactory.literal(
    "18446744073709551615",
    xsd.unsignedLong,
  ),
  unsignedIntLiteral: DataFactory.literal("4294967295", xsd.unsignedInt),
  unsignedShortLiteral: DataFactory.literal("65535", xsd.unsignedShort),
  unsignedByteLiteral: DataFactory.literal("255", xsd.unsignedByte),
  positiveIntegerLiteral: DataFactory.literal("1", xsd.positiveInteger),

  // Numeric - decimal & floating point
  decimalLiteral: DataFactory.literal("10.5", xsd.decimal),
  floatLiteral: DataFactory.literal("3.14", xsd.float),
  doubleLiteral: DataFactory.literal("2.718281828459045", xsd.double),

  // Date & time
  dateLiteral: DataFactory.literal("2002-09-24", xsd.date),
  dateTimeLiteral: DataFactory.literal("2002-05-30T09:00:00", xsd.dateTime),
  dateTimeStampLiteral: DataFactory.literal(
    "2002-05-30T09:00:00Z",
    xsd.dateTimeStamp,
  ),
  timeLiteral: DataFactory.literal("09:00:00", xsd.time),
  durationLiteral: DataFactory.literal("P1Y2M3DT4H5M6S", xsd.duration),
  yearMonthDurationLiteral: DataFactory.literal("P1Y2M", xsd.yearMonthDuration),
  dayTimeDurationLiteral: DataFactory.literal("P3DT4H", xsd.dayTimeDuration),
  gYearLiteral: DataFactory.literal("2002", xsd.gYear),
  gYearMonthLiteral: DataFactory.literal("2002-09", xsd.gYearMonth),
  gMonthLiteral: DataFactory.literal("--09", xsd.gMonth),
  gMonthDayLiteral: DataFactory.literal("--09-24", xsd.gMonthDay),
  gDayLiteral: DataFactory.literal("---24", xsd.gDay),

  // URI & QName
  anyUriLiteral: DataFactory.literal(
    "https://example.org/resource",
    xsd.anyURI,
  ),
  qNameLiteral: DataFactory.literal("ex:localPart", xsd.QName),

  // NOTATION (rarely used)
  notationLiteral: DataFactory.literal("notationName", xsd.NOTATION),
};

const predicate = DataFactory.namedNode("http://example.com/predicate");
const subject = DataFactory.namedNode("http://example.com/subject");

export const testData = {
  objects,
  predicate,
  subject,
};
