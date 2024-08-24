# rdfjs-resource

Resource abstraction over [RDF/JS Datasets](https://rdf.js.org/dataset-spec/), inspired by similar abstractions in 

* [Apache Jena](https://www.javadoc.io/doc/org.apache.jena/jena-core/3.3.0/org/apache/jena/rdf/model/Resource.html)
* [rdflib](https://rdflib.readthedocs.io/en/stable/_modules/rdflib/resource.html)
* [Sophia](https://crates.io/crates/sophia_resource)

## Installation

```
npm i rdfjs-resource
```

## Usage

### Wrap an RDF/JS `BlankNode` or `NamedNode` in a `Resource`

```
const resource = new Resource({ dataset: theDataset, identifier: theNode });
```

### Retrieve a value (object) of the `Resource`

```
import { rdf } from "@tpluscode/rdf-ns-builders";

const value = resource.value(rdf.type).toNumber().orDefault(0);
```

`Resource.value(predicate)` and `Resource.values(predicate)` return a `Resource.Value`, which has various `to` conversion methods that return [purify-ts](https://gigobyte.github.io/purify/) `Maybe` monads.

See the `Resource.test.ts` for additional usage.

### `MutableResource`

`Resource` instances are immutable. To create a mutable resource, you have to supply an [RDF/JS DataFactory](https://rdf.js.org/data-model-spec/) as well as a graph identifier (`BlankNode | DefaultGraph | NamedNode`) to add/delete quads to/from in the supplied `DatasetCore`.

```
import { rdf } from "@tpluscode/rdf-ns-builders";

const mutableResource = new MutableResource({
  dataFactory: DataFactory,
  dataset,
  identifier: DataFactory.namedNode("http://example.com/subject"),
  mutateGraph: DataFactory.defaultGraph(),
});

mutableResource.add(rdf.type, rdf.Resource);
```

### `ResourceSet`

For convenience, you can wrap a `DatasetCore` in a `ResourceSet`, then instantiate `Resource`s from that:

```
const resourceSet = new ResourceSet({ dataset });
resourceSet.resource(identifier).value(rdf.type);
```

### Named `Resource`

`Resource` and `MutableResource` take a type parameter for the `identifier` specified in the resource's constructor. The parameter defaults to `BlankNode | NamedNode`.

It's often useful to only deal in named resources (`Resource<NamedNode>`). The `ResourceSet` abstraction provides a `namedResource` factory method for convenience. `MutableResourceSet` provides a similar `namedMutableResource` factory method.
