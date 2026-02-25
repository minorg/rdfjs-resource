import DataFactory from "@rdfjs/data-model";
import type { Literal } from "@rdfjs/types";
import { describe, expect, it } from "vitest";
import { LiteralDecoder } from "../src/LiteralDecoder.js";
import { LiteralFactory } from "../src/LiteralFactory.js";
import { xsd } from "../src/vocabularies.js";
import { testData } from "./testData.js";

describe("LiteralFactory", () => {
  const { literals } = testData;
  const sut = new LiteralFactory();
  const weirdDatatype = DataFactory.namedNode("http://example.com/weird");

  function expectEquals(actual: Literal, expected: Literal): void {
    expect(actual.value).toStrictEqual(expected.value);
    expect(actual.datatype.value).toStrictEqual(expected.datatype.value);
  }

  describe("round trip with LiteralDecoder", () => {
    for (const expectedLiteral of Object.values(literals)) {
      it(expectedLiteral.datatype.value, () => {
        const actualPrimitive =
          LiteralDecoder.decodePrimitiveLiteral(expectedLiteral).unsafeCoerce();

        {
          const actualLiteral = sut.primitive(
            actualPrimitive,
            expectedLiteral.datatype, // Specify datatype
          );
          if (
            !expectedLiteral.datatype.equals(xsd.dateTime) &&
            !expectedLiteral.datatype.equals(xsd.dateTimeStamp)
          ) {
            expectEquals(actualLiteral, expectedLiteral);
          }
        }

        sut.primitive(actualPrimitive); // Don't specify datatype
      });
    }
  });

  describe("bigint", () => {
    it("no datatype", () => {
      expectEquals(sut.bigint(1n), DataFactory.literal("1", xsd.integer));
      expectEquals(sut.bigint(-1n), DataFactory.literal("-1", xsd.integer));
    });

    it("xsd:decimal", () => {
      expectEquals(
        sut.bigint(1n, xsd.decimal),
        DataFactory.literal("1", xsd.decimal),
      );
    });

    it("xsd:double", () => {
      expectEquals(
        sut.bigint(1n, xsd.double),
        DataFactory.literal("1", xsd.double),
      );
    });

    it("xsd:int", () => {
      expectEquals(sut.bigint(1n, xsd.int), DataFactory.literal("1", xsd.int));
    });

    it("xsd:integer", () => {
      expectEquals(
        sut.bigint(1n, xsd.integer),
        DataFactory.literal("1", xsd.integer),
      );
    });

    it("xsd:string", () => {
      expect(() => sut.bigint(1n, xsd.string)).toThrowError(RangeError);
    });

    it("violate range check", () => {
      expect(() =>
        sut.bigint(
          1000n,
          DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#byte"),
        ),
      ).toThrowError(RangeError);
    });

    it("weird datatype", () => {
      expectEquals(
        sut.bigint(1n, weirdDatatype),
        DataFactory.literal("1", weirdDatatype),
      );
    });
  });

  describe("boolean", () => {
    it("no datatype", () => {
      expectEquals(
        sut.boolean(false),
        DataFactory.literal("false", xsd.boolean),
      );
      expectEquals(sut.boolean(true), DataFactory.literal("true", xsd.boolean));
    });

    it("xsd:boolean", () => {
      expectEquals(
        sut.boolean(true, xsd.boolean),
        DataFactory.literal("true", xsd.boolean),
      );
    });

    it("xsd:string", () => {
      expect(() => sut.boolean(true, xsd.string)).toThrowError(RangeError);
    });

    it("weird datatype", () => {
      expectEquals(
        sut.boolean(true, weirdDatatype),
        DataFactory.literal("true", weirdDatatype),
      );
    });
  });

  describe("date", () => {
    it("no datatype", () => {
      expectEquals(
        sut.date(new Date(Date.UTC(2026, 0, 1, 0, 0, 0))),
        DataFactory.literal("2026-01-01T00:00:00.000Z", xsd.dateTime),
      );
    });

    it("xsd:date", () => {
      expectEquals(
        sut.date(new Date(Date.UTC(2026, 0, 1)), xsd.date),
        DataFactory.literal("2026-01-01", xsd.date),
      );
    });

    it("xsd:dateTime", () => {
      expectEquals(
        sut.date(new Date(Date.UTC(2026, 0, 1, 12, 30, 1, 1)), xsd.dateTime),
        DataFactory.literal("2026-01-01T12:30:01.001Z", xsd.dateTime),
      );
    });

    it("xsd:string", () => {
      expect(() => sut.date(new Date(2026, 1, 1), xsd.string)).toThrowError(
        RangeError,
      );
    });

    it("weird datatype", () => {
      expectEquals(
        sut.date(new Date(2026, 0, 1), weirdDatatype),
        DataFactory.literal(new Date(2026, 0, 1).toISOString(), weirdDatatype),
      );
    });
  });

  describe("number", () => {
    it("no datatype: -1", () => {
      expectEquals(sut.number(-1), DataFactory.literal("-1", xsd.byte));
    });

    it("no datatype: 1", () => {
      expectEquals(sut.number(1), DataFactory.literal("1", xsd.unsignedByte));
    });

    it("no datatype: double", () => {
      expectEquals(sut.number(1.1), DataFactory.literal("1.1", xsd.double));
    });

    it("no datatype: NaN", () => {
      expectEquals(sut.number(NaN), DataFactory.literal("NaN", xsd.double));
    });

    it("no datatype: Infinity", () => {
      expectEquals(
        sut.number(Infinity),
        DataFactory.literal("INF", xsd.double),
      );
    });

    it("no datatype: -Infinity", () => {
      expectEquals(
        sut.number(-Infinity),
        DataFactory.literal("-INF", xsd.double),
      );
    });

    for (const datatype of [
      xsd.byte,
      xsd.short,
      xsd.int,
      xsd.long,
      xsd.unsignedByte,
      xsd.unsignedShort,
      xsd.unsignedInt,
      xsd.unsignedLong,
      xsd.integer,
      xsd.float,
      xsd.double,
    ]) {
      it(datatype.value, () => {
        expectEquals(
          sut.number(1, datatype),
          DataFactory.literal("1", datatype),
        );
      });
    }

    it("violate range check", () => {
      expect(() =>
        sut.number(
          1000,
          DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#byte"),
        ),
      ).toThrowError(RangeError);
    });

    it("weird datatype", () => {
      expectEquals(
        sut.number(1, weirdDatatype),
        DataFactory.literal("1", weirdDatatype),
      );
    });
  });

  describe("primitive", () => {
    it("no datatype: bigint", () => {
      expectEquals(sut.primitive(1n), DataFactory.literal("1", xsd.integer));
    });

    it("no datatype: boolean", () => {
      expectEquals(
        sut.primitive(true),
        DataFactory.literal("true", xsd.boolean),
      );
    });

    it("no datatype: Date", () => {
      expectEquals(
        sut.primitive(new Date(Date.UTC(2026, 0, 1))),
        DataFactory.literal("2026-01-01T00:00:00.000Z", xsd.dateTime),
      );
    });

    it("no datatype: number", () => {
      expectEquals(sut.primitive(1.1), DataFactory.literal("1.1", xsd.double));
    });

    it("no datatype: string", () => {
      expectEquals(sut.primitive("test"), DataFactory.literal("test"));
    });

    it("weird datatype", () => {
      expectEquals(
        sut.primitive(1, weirdDatatype),
        DataFactory.literal("1", weirdDatatype),
      );
    });
  });

  describe("string", () => {
    it("no datatype", () => {
      expectEquals(sut.string("test"), DataFactory.literal("test", xsd.string));
    });

    it("xsd:string", () => {
      expectEquals(
        sut.string("test", xsd.string),
        DataFactory.literal("test", xsd.string),
      );
    });

    it("weird datatype", () => {
      expectEquals(
        sut.primitive(1, weirdDatatype),
        DataFactory.literal("1", weirdDatatype),
      );
    });
  });
});
