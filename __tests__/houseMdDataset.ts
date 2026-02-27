import dataFactory from "@rdfjs/data-model";
import datasetFactory from "@rdfjs/dataset";
import type { DatasetCore, Quad } from "@rdfjs/types";
// @ts-expect-error
import housemd from "housemd";

export const houseMdDataset: DatasetCore = datasetFactory.dataset(
  housemd({ factory: dataFactory }) as Quad[],
);
