import DataFactory from "@rdfjs/data-model";
import { describe, it } from "vitest";
import { LiteralDecoder } from "../src/LiteralDecoder.js";
import { xsd } from "../src/vocabularies.js";

describe("LiteralDecoder", () => {
  const sut = LiteralDecoder;

  describe("decodeBigIntLiteral", () => {
    it("xsd:double", ({ expect }) => {
      expect(
        sut
          .decodeBigIntLiteral(DataFactory.literal("1.0", xsd.double))
          .unsafeCoerce(),
      ).toStrictEqual(1n);
    });

    it("xsd:int", ({ expect }) => {
      expect(
        sut
          .decodeBigIntLiteral(DataFactory.literal("1", xsd.int))
          .unsafeCoerce(),
      ).toStrictEqual(1n);
    });

    it("xsd:integer", ({ expect }) => {
      const expected = BigInt(Number.MAX_SAFE_INTEGER + 1);
      expect(
        sut
          .decodeBigIntLiteral(
            DataFactory.literal(expected.toString(), xsd.integer),
          )
          .unsafeCoerce(),
      ).toStrictEqual(expected);
    });

    it("xsd:long", ({ expect }) => {
      const expected = BigInt(Number.MAX_SAFE_INTEGER + 1);
      expect(
        sut
          .decodeBigIntLiteral(
            DataFactory.literal(expected.toString(), xsd.long),
          )
          .unsafeCoerce(),
      ).toStrictEqual(expected);
    });

    it("xsd:string", ({ expect }) => {
      expect(
        sut.decodeBigIntLiteral(DataFactory.literal("test")).isLeft(),
      ).toStrictEqual(true);
    });

    it("unrecognized datatype", ({ expect }) => {
      expect(
        sut
          .decodeBigIntLiteral(
            DataFactory.literal(
              "1",
              DataFactory.namedNode("http://example.com/other"),
            ),
          )
          .isLeft(),
      ).toStrictEqual(true);
    });
  });

  describe("decodeBooleanLiteral", () => {
    it("xsd:boolean", ({ expect }) => {
      expect(
        sut
          .decodeBooleanLiteral(DataFactory.literal("true", xsd.boolean))
          .unsafeCoerce(),
      ).toStrictEqual(true);
      expect(
        sut
          .decodeBooleanLiteral(DataFactory.literal("1", xsd.boolean))
          .unsafeCoerce(),
      ).toStrictEqual(true);

      expect(
        sut
          .decodeBooleanLiteral(DataFactory.literal("false", xsd.boolean))
          .unsafeCoerce(),
      ).toStrictEqual(false);
      expect(
        sut
          .decodeBooleanLiteral(DataFactory.literal("0", xsd.boolean))
          .unsafeCoerce(),
      ).toStrictEqual(false);
    });

    it("xsd:string", ({ expect }) => {
      expect(
        sut.decodeBooleanLiteral(DataFactory.literal("true")).isLeft(),
      ).toStrictEqual(true);
    });
  });

  describe("decodeDateLiteral", () => {
    it("xsd:date", ({ expect }) => {
      const expected = new Date(2026, 1, 1);
      const actual = sut
        .decodeDateLiteral(
          DataFactory.literal(
            expected.toISOString().replace(/T.*$/, ""),
            xsd.date,
          ),
        )
        .unsafeCoerce();
      expect(actual.getUTCFullYear()).toStrictEqual(expected.getUTCFullYear());
      expect(actual.getUTCMonth()).toStrictEqual(expected.getUTCMonth());
      expect(actual.getUTCDay()).toStrictEqual(expected.getUTCDay());
    });

    it("xsd:dateTime", ({ expect }) => {
      const expected = new Date(2026, 1, 1);
      expect(
        sut
          .decodeDateLiteral(
            DataFactory.literal(expected.toISOString(), xsd.dateTime),
          )
          .isLeft(),
      ).toStrictEqual(true);
    });

    it("xsd:string", ({ expect }) => {
      expect(
        sut.decodeDateLiteral(DataFactory.literal("2026-01-01")).isLeft(),
      ).toStrictEqual(true);
    });
  });

  describe("decodeDateTimeLiteral", () => {
    it("xsd:date", ({ expect }) => {
      const expected = new Date(2026, 1, 1);
      expect(
        sut
          .decodeDateTimeLiteral(
            DataFactory.literal(
              expected.toISOString().replace(/T.*$/, ""),
              xsd.date,
            ),
          )
          .isLeft(),
      ).toStrictEqual(true);
    });

    it("xsd:dateTime", ({ expect }) => {
      const expected = new Date();
      const actual = sut
        .decodeDateTimeLiteral(
          DataFactory.literal(expected.toISOString(), xsd.dateTime),
        )
        .unsafeCoerce();
      expect(actual.getTime()).toStrictEqual(expected.getTime());
    });

    it("xsd:string", ({ expect }) => {
      expect(
        sut.decodeDateTimeLiteral(DataFactory.literal("2026-01-01")).isLeft(),
      ).toStrictEqual(true);
    });
  });

  describe("decodeFloatLiteral", () => {
    it("xsd:double", ({ expect }) => {
      expect(
        sut
          .decodeFloatLiteral(DataFactory.literal("1.1", xsd.double))
          .unsafeCoerce(),
      ).toStrictEqual(1.1);
    });

    it("xsd:float", ({ expect }) => {
      expect(
        sut
          .decodeFloatLiteral(DataFactory.literal("1.1", xsd.float))
          .unsafeCoerce(),
      ).toStrictEqual(1.1);
    });

    it("xsd:int", ({ expect }) => {
      expect(
        sut
          .decodeFloatLiteral(DataFactory.literal("1", xsd.int))
          .unsafeCoerce(),
      ).toStrictEqual(1);
    });

    it("xsd:integer (in range)", ({ expect }) => {
      expect(
        sut
          .decodeFloatLiteral(DataFactory.literal("1", xsd.integer))
          .unsafeCoerce(),
      ).toStrictEqual(1);
    });

    it("xsd:integer (out of range)", ({ expect }) => {
      expect(
        sut
          .decodeFloatLiteral(
            DataFactory.literal(
              BigInt(Number.MAX_SAFE_INTEGER + 1).toString(),
              xsd.integer,
            ),
          )
          .isLeft(),
      ).toStrictEqual(true);
    });

    it("xsd:string", ({ expect }) => {
      expect(
        sut.decodeFloatLiteral(DataFactory.literal("test")).isLeft(),
      ).toStrictEqual(true);
    });

    it("unrecognized datatype", ({ expect }) => {
      expect(
        sut
          .decodeFloatLiteral(
            DataFactory.literal(
              "1",
              DataFactory.namedNode("http://example.com/other"),
            ),
          )
          .isLeft(),
      ).toStrictEqual(true);
    });
  });

  describe("decodeIntLiteral", () => {
    it("xsd:double (integer)", ({ expect }) => {
      expect(
        sut
          .decodeIntLiteral(DataFactory.literal("1", xsd.double))
          .unsafeCoerce(),
      ).toStrictEqual(1);
    });

    it("xsd:double (non-integer)", ({ expect }) => {
      expect(
        sut.decodeIntLiteral(DataFactory.literal("1.1", xsd.double)).isLeft(),
      ).toStrictEqual(true);
    });

    it("xsd:int", ({ expect }) => {
      expect(
        sut.decodeIntLiteral(DataFactory.literal("1", xsd.int)).unsafeCoerce(),
      ).toStrictEqual(1);
    });

    it("xsd:integer (in range)", ({ expect }) => {
      expect(
        sut
          .decodeIntLiteral(DataFactory.literal("1", xsd.integer))
          .unsafeCoerce(),
      ).toStrictEqual(1);
    });

    it("xsd:integer (out of range)", ({ expect }) => {
      expect(
        sut
          .decodeIntLiteral(
            DataFactory.literal(
              BigInt(Number.MAX_SAFE_INTEGER + 1).toString(),
              xsd.integer,
            ),
          )
          .isLeft(),
      ).toStrictEqual(true);
    });

    it("xsd:string", ({ expect }) => {
      expect(
        sut.decodeIntLiteral(DataFactory.literal("test")).isLeft(),
      ).toStrictEqual(true);
    });

    it("unrecognized datatype", ({ expect }) => {
      expect(
        sut
          .decodeIntLiteral(
            DataFactory.literal(
              "1",
              DataFactory.namedNode("http://example.com/other"),
            ),
          )
          .isLeft(),
      ).toStrictEqual(true);
    });
  });

  describe("decodeNumberLiteral", () => {
    it("xsd:double", ({ expect }) => {
      expect(
        sut
          .decodeNumberLiteral(DataFactory.literal("1.1", xsd.double))
          .unsafeCoerce(),
      ).toStrictEqual(1.1);
    });

    it("xsd:int", ({ expect }) => {
      expect(
        sut
          .decodeNumberLiteral(DataFactory.literal("1", xsd.int))
          .unsafeCoerce(),
      ).toStrictEqual(1);
    });

    it("xsd:integer (in range)", ({ expect }) => {
      expect(
        sut
          .decodeNumberLiteral(DataFactory.literal("1", xsd.integer))
          .unsafeCoerce(),
      ).toStrictEqual(1);
    });

    it("xsd:integer (out of range)", ({ expect }) => {
      expect(
        sut
          .decodeNumberLiteral(
            DataFactory.literal(
              BigInt(Number.MAX_SAFE_INTEGER + 1).toString(),
              xsd.integer,
            ),
          )
          .isLeft(),
      ).toStrictEqual(true);
    });

    it("xsd:string", ({ expect }) => {
      expect(
        sut.decodeNumberLiteral(DataFactory.literal("test")).isLeft(),
      ).toStrictEqual(true);
    });

    it("unrecognized datatype", ({ expect }) => {
      expect(
        sut
          .decodeNumberLiteral(
            DataFactory.literal(
              "1",
              DataFactory.namedNode("http://example.com/other"),
            ),
          )
          .isLeft(),
      ).toStrictEqual(true);
    });
  });

  describe("decodePrimitiveLiteral", () => {
    it("xsd:boolean", ({ expect }) => {
      expect(
        sut
          .decodePrimitiveLiteral(DataFactory.literal("true", xsd.boolean))
          .unsafeCoerce(),
      ).toStrictEqual(true);
    });

    it("xsd:date", ({ expect }) => {
      const expected = new Date(2026, 1, 1);
      const actual = sut
        .decodePrimitiveLiteral(
          DataFactory.literal(
            expected.toISOString().replace(/T.*$/, ""),
            xsd.date,
          ),
        )
        .unsafeCoerce();
      expect(actual).toBeInstanceOf(Date);
      expect((actual as Date).getUTCFullYear()).toStrictEqual(
        expected.getUTCFullYear(),
      );
      expect((actual as Date).getUTCMonth()).toStrictEqual(
        expected.getUTCMonth(),
      );
      expect((actual as Date).getUTCDay()).toStrictEqual(expected.getUTCDay());
    });

    it("xsd:dateTime", ({ expect }) => {
      const expected = new Date();
      const actual = sut
        .decodePrimitiveLiteral(
          DataFactory.literal(expected.toISOString(), xsd.dateTime),
        )
        .unsafeCoerce();
      expect(actual).toBeInstanceOf(Date);
      expect((actual as Date).getTime()).toStrictEqual(expected.getTime());
    });

    it("xsd:decimal", ({ expect }) => {
      expect(
        sut.decodeIntLiteral(DataFactory.literal("1.0", xsd.decimal)).isLeft(),
      ).toStrictEqual(true);
    });

    it("xsd:double", ({ expect }) => {
      expect(
        sut
          .decodePrimitiveLiteral(DataFactory.literal("1.1", xsd.double))
          .unsafeCoerce(),
      ).toStrictEqual(1.1);
    });

    it("xsd:int", ({ expect }) => {
      expect(
        sut
          .decodePrimitiveLiteral(DataFactory.literal("1", xsd.int))
          .unsafeCoerce(),
      ).toStrictEqual(1);
    });

    it("xsd:integer", ({ expect }) => {
      const expected = BigInt(Number.MAX_SAFE_INTEGER + 1);
      expect(
        sut
          .decodePrimitiveLiteral(
            DataFactory.literal(expected.toString(), xsd.integer),
          )
          .unsafeCoerce(),
      ).toStrictEqual(expected);
    });

    it("xsd:string", ({ expect }) => {
      expect(
        sut.decodePrimitiveLiteral(DataFactory.literal("test")).unsafeCoerce(),
      ).toStrictEqual("test");
    });

    it("unrecognized datatype", ({ expect }) => {
      expect(
        sut
          .decodePrimitiveLiteral(
            DataFactory.literal(
              "1",
              DataFactory.namedNode("http://example.com/other"),
            ),
          )
          .isLeft(),
      ).toStrictEqual(true);
    });
  });

  describe("decodeStringLiteral", () => {
    it("xsd:boolean", ({ expect }) => {
      expect(
        sut
          .decodeStringLiteral(DataFactory.literal("true", xsd.boolean))
          .isLeft(),
      ).toStrictEqual(true);
    });

    it("xsd:string", ({ expect }) => {
      expect(
        sut.decodeStringLiteral(DataFactory.literal("true")).unsafeCoerce(),
      ).toStrictEqual("true");
    });

    it("unrecognized datatype", ({ expect }) => {
      expect(
        sut
          .decodeStringLiteral(
            DataFactory.literal(
              "1",
              DataFactory.namedNode("http://example.com/other"),
            ),
          )
          .isLeft(),
      ).toStrictEqual(true);
    });
  });
});
