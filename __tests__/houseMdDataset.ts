import type { DatasetCore, Quad } from "@rdfjs/types";
// @ts-expect-error
import housemd from "housemd";
import N3 from "n3";

export const houseMdDataset: DatasetCore = new N3.Store(
  housemd({ factory: N3.DataFactory }) as Quad[],
);
