import dataFactory from "@rdfjs/data-model";
import datasetFactory from "@rdfjs/dataset";
import type { Quad_Object } from "@rdfjs/types";

const dataset = datasetFactory.dataset();

const ex = (local: string) =>
  dataFactory.namedNode(`http://example.com/${local}`);
const sh = (local: string) =>
  dataFactory.namedNode(`http://www.w3.org/ns/shacl#${local}`);
const rdf = (local: string) =>
  dataFactory.namedNode(`http://www.w3.org/1999/02/22-rdf-syntax-ns#${local}`);

const b = () => dataFactory.blankNode();

// RDF list helper
const addList = (...items: readonly Quad_Object[]) => {
  if (items.length === 0) return rdf("nil");
  const nodes = items.map(() => b());
  nodes.forEach((node, i) => {
    dataset.add(dataFactory.quad(node, rdf("first"), items[i]));
    dataset.add(
      dataFactory.quad(
        node,
        rdf("rest"),
        i + 1 < nodes.length ? nodes[i + 1] : rdf("nil"),
      ),
    );
  });
  return nodes[0];
};

// :AlternativePathPropertyShape
const altPathList = addList(ex("predicate1"), ex("predicate2"));
const altPathNode = b();
dataset.add(
  dataFactory.quad(
    ex("AlternativePathPropertyShape"),
    rdf("type"),
    sh("PropertyShape"),
  ),
);
dataset.add(
  dataFactory.quad(ex("AlternativePathPropertyShape"), sh("path"), altPathNode),
);
dataset.add(dataFactory.quad(altPathNode, sh("alternativePath"), altPathList));

// :AlternativeInversePathPropertyShape
const inv1 = b(),
  inv2 = b();
dataset.add(dataFactory.quad(inv1, sh("inversePath"), ex("predicate1")));
dataset.add(dataFactory.quad(inv2, sh("inversePath"), ex("predicate2")));
const altInvPathList = addList(inv1, inv2);
const altInvPathNode = b();
dataset.add(
  dataFactory.quad(
    ex("AlternativeInversePathPropertyShape"),
    rdf("type"),
    sh("PropertyShape"),
  ),
);
dataset.add(
  dataFactory.quad(
    ex("AlternativeInversePathPropertyShape"),
    sh("path"),
    altInvPathNode,
  ),
);
dataset.add(
  dataFactory.quad(altInvPathNode, sh("alternativePath"), altInvPathList),
);

// :InversePathPropertyShape
const invPathNode = b();
dataset.add(
  dataFactory.quad(
    ex("InversePathPropertyShape"),
    rdf("type"),
    sh("PropertyShape"),
  ),
);
dataset.add(
  dataFactory.quad(ex("InversePathPropertyShape"), sh("path"), invPathNode),
);
dataset.add(dataFactory.quad(invPathNode, sh("inversePath"), ex("predicate")));

// :OneOrMorePathPropertyShape
const oneOrMoreNode = b();
dataset.add(
  dataFactory.quad(
    ex("OneOrMorePathPropertyShape"),
    rdf("type"),
    sh("PropertyShape"),
  ),
);
dataset.add(
  dataFactory.quad(ex("OneOrMorePathPropertyShape"), sh("path"), oneOrMoreNode),
);
dataset.add(
  dataFactory.quad(oneOrMoreNode, sh("oneOrMorePath"), ex("predicate")),
);

// :PredicatePathPropertyShape
dataset.add(
  dataFactory.quad(
    ex("PredicatePathPropertyShape"),
    rdf("type"),
    sh("PropertyShape"),
  ),
);
dataset.add(
  dataFactory.quad(
    ex("PredicatePathPropertyShape"),
    sh("path"),
    ex("predicate"),
  ),
);

// :SequencePathPropertyShape
const seqList = addList(ex("predicate1"), ex("predicate2"));
dataset.add(
  dataFactory.quad(
    ex("SequencePathPropertyShape"),
    rdf("type"),
    sh("PropertyShape"),
  ),
);
dataset.add(
  dataFactory.quad(ex("SequencePathPropertyShape"), sh("path"), seqList),
);

// :ZeroOrMorePathPropertyShape
const zeroOrMoreNode = b();
dataset.add(
  dataFactory.quad(
    ex("ZeroOrMorePathPropertyShape"),
    rdf("type"),
    sh("PropertyShape"),
  ),
);
dataset.add(
  dataFactory.quad(
    ex("ZeroOrMorePathPropertyShape"),
    sh("path"),
    zeroOrMoreNode,
  ),
);
dataset.add(
  dataFactory.quad(zeroOrMoreNode, sh("zeroOrMorePath"), ex("predicate")),
);

// :ZeroOrOnePathPropertyShape
const zeroOrOneNode = b();
dataset.add(
  dataFactory.quad(
    ex("ZeroOrOnePathPropertyShape"),
    rdf("type"),
    sh("PropertyShape"),
  ),
);
dataset.add(
  dataFactory.quad(ex("ZeroOrOnePathPropertyShape"), sh("path"), zeroOrOneNode),
);
dataset.add(
  dataFactory.quad(zeroOrOneNode, sh("zeroOrOnePath"), ex("predicate")),
);

export const propertyPathsDataset = dataset;
