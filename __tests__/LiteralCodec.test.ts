import { describe, it } from "vitest";
import { LiteralCodec } from "../src/LiteralCodec.js";
import { testData } from "./testData.js";

describe("LiteralCodec", () => {
  const { objects } = testData;
  const sut = new LiteralCodec();

  for (const object of Object.values(objects)) {
    if (object.termType !== "Literal") {
      continue;
    }

    it(object.datatype.value, ({ expect }) => {
      const expectedLiteral = object;
      const actualPrimitive = sut.toPrimitive(expectedLiteral).unsafeCoerce();
      {
        const actualLiteral = sut.fromPrimitive(
          actualPrimitive,
          expectedLiteral.datatype, // Specify datatype
        );
        expect(actualLiteral.equals(expectedLiteral)).toStrictEqual(true);
      }

      sut.fromPrimitive(actualPrimitive); // Don't specify datatype
    });
  }
});
