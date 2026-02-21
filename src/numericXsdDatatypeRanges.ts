export const numericXsdDatatypeRanges: Record<
  string,
  [bigint | number | undefined, bigint | number | undefined]
> = {
  "http://www.w3.org/2001/XMLSchema#byte": [-128, 127],
  "http://www.w3.org/2001/XMLSchema#int": [-2147483648, 2147483647],
  "http://www.w3.org/2001/XMLSchema#integer": [undefined, undefined],
  "http://www.w3.org/2001/XMLSchema#long": [
    -9223372036854775808n,
    9223372036854775807n,
  ],
  "http://www.w3.org/2001/XMLSchema#negativeInteger": [undefined, -1],
  "http://www.w3.org/2001/XMLSchema#nonNegativeInteger": [0, undefined],
  "http://www.w3.org/2001/XMLSchema#nonPositiveInteger": [undefined, 0],
  "http://www.w3.org/2001/XMLSchema#positiveInteger": [1, undefined],
  "http://www.w3.org/2001/XMLSchema#short": [-32768, 32767],
  "http://www.w3.org/2001/XMLSchema#unsignedByte": [0, 255],
  "http://www.w3.org/2001/XMLSchema#unsignedInt": [0, 4294967295],
  "http://www.w3.org/2001/XMLSchema#unsignedLong": [0, 18446744073709551615n],
  "http://www.w3.org/2001/XMLSchema#unsignedShort": [0, 65535],
};
