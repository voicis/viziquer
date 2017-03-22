Interpreter.customMethods({
  // These method can be called by ajoo editor, e.g., context menu

 // -->
  // method just prints active diagram's Abstract Query Syntax tree to the console
  GenerateAbstractQuery: function() {
    //console.log("GenerateAbstractQuery called");
    // get _id of the active ajoo diagram
    var diagramId = Session.get("activeDiagram");

    // get an array of ajoo Elements whithin the active diagram
    var elems_in_diagram_ids = Elements.find({diagramId:diagramId}).map(function(e) {
      return e["_id"]
    });

    // Print All Queries within the diagram
    _.each(genAbstractQueryForElementList(elems_in_diagram_ids),function(q) {
         console.log(JSON.stringify(q,null,2));
         console.log(JSON.stringify(resolveTypesAndBuildSymbolTable(q),null,2));
       })
    //_.each(genAbstractQueryForElementList(elems_in_diagram_ids),function(q) { console.log(JSON.stringify(q,null,2))});
    // console.log("GenerateAbstractQuery ends");
  },
});


//[JSON] --> {root:[JSON], symbolTable:[some_name:{scope:?, type:?, elType:?} }]}
// For the query in abstract syntax
// this function resolves the types (adds to identification property what is missing)
// and creats symbol table with resolved types
// it should parse expressions ??
function resolveTypesAndBuildSymbolTable(query) {
  // string -->[IdObject]
  // This is stub
  function resolveClassByName(className) {
    return {URI:"http://foo.foo/"+className}
  };

  // string -->[IdObject]
  // This is stub
  function resolveLinkByName(linkName) {
    return {URI:"http://foo.foo/"+linkName}
  };

  // string, string -->[IdObject]
  // This is stub
  function resolveAttributeByName(className, attributeName) {
    return {URI:"http://foo.foo/"+className+"."+attributeName}
  };

  var symbol_table = {};

  //JSON -->
  // function recursively modifies query by adding identification info
  function resolveClass(obj_class) {
    _.extend(obj_class.identification, resolveClassByName(obj_class.identification.localName));
    if (obj_class.linkIdentification) {
        _.extend(obj_class.linkIdentification, resolveLinkByName(obj_class.linkIdentification.localName));
    };

    obj_class.conditionLinks.forEach(function(cl) {_.extend(cl.identification,resolveLinkByName(cl.identification.localName))});

    if (obj_class.instanceAlias) {
      if(symbol_table[obj_class.instanceAlias]) {
        // name exists - ERROR
        console.log("Duplicate instanceAlias name")
      } else {
        symbol_table[obj_class.instanceAlias]={type:resolveClassByName(obj_class.identification.localName)};
    }};

    obj_class.fields.forEach(function(f) {
        if (f.alias) {
          if (symbol_table[f.alias]) {
             // name exists - ERROR
             console.log("Duplicate alias name")
          } else {
             symbol_table[f.alias]={type:null}
        }};
    });

    obj_class.children.forEach(resolveClass);

    return;
  };

  resolveClass(query.root);

  function resolveClassExpressions(obj_class) {
    obj_class.conditions.forEach(function(c) {
      console.log(grammer.parse(c.exp))
    })
    return;
  };

  resolveClassExpressions(query.root);

  return {root:query.root, symbolTable:symbol_table}
};

// [string]--> JSON
// Returns query AST-s for the ajoo elements specified by an array of id-s
function genAbstractQueryForElementList(element_id_list) {
  // conver id-s to VQ_Elements (filter out incorrect id-s)
  var element_list = _.filter(_.map(element_id_list, function(id) {return new VQ_Element(id)}), function(v) {if (v.obj) {return true} else {return false}});
  // determine which elements are root elements
  var root_elements = _.filter(element_list, function(e) {return e.isRoot();});

  // map each root element to AST
  return _.map(root_elements, function(e) {

    var visited = {};
    visited[e._id()]=e._id();

    // Next auxilary functions

    // {link:VQ_Element, start:bool}-->JSON for conditional link
    // target is coded as _id
    // TODO: Optimize!!!
    var genConditionalLink = function(link) {
       if (link.start) {
          if (visited[link.link.getStartElement()._id()]) {
            return { identification: { _id: link.link._id(), localName: link.link.getName() },
                      isInverse: true,
                      isNot: link.link.getType()=="NOT",
                      target: visited[link.link.getStartElement()._id()]
            };
          };
       } else {
          if (visited[link.link.getEndElement()._id()]) {
            return { identification: { _id: link.link._id(), localName: link.link.getName() },
                      isInverse: false,
                      isNot: link.link.getType()=="NOT",
                      target: visited[link.link.getEndElement()._id()]
            };
          };
       };
       return null;
    };

    // VQ_Element --> [JSON for linked class]
    // Recursive. Traverses the query via deep first search
    // TODO: Optimize!!!!
    function genLinkedElements(current_elem) {
      // {link:VQ_Element, start:bool} --> JSON for linked class
      var genLinkedElement = function(link) {
          if (link.start) {
            var elem = link.link.getStartElement();
            // generate if the element on the other end is not visited AND the link is not conditional
            if (!visited[elem._id()] && !link.link.isConditional()) {
                visited[elem._id()]=elem._id();
                return {
                  linkIdentification:{_id: link.link._id(),localName: link.link.getName()},
                  linkType: link.link.getType(),
                  isInverse:true,
                  isSubQuery:link.link.isSubQuery(),
                  identification: { _id: elem._id(), localName: elem.getName()},
                  stereotype: elem.getStereotype(),
                  instanceAlias: elem.getInstanceAlias(),
                  isVariable:elem.isVariable(),
                  variableName:elem.getVariableName(),
                  // should not add the link which was used to get to the elem
                  conditionLinks:_.filter(_.map(_.filter(elem.getLinks(),function(l) {return !l.link.isEqualTo(link.link)}), genConditionalLink), function(l) {return l}),
                  fields: elem.getFields(),
                  conditions: elem.getConditions(),
                  children: _.filter(_.map(elem.getLinks(), genLinkedElement), function(l) {return l}),
                }
            }
          } else {
            var elem = link.link.getEndElement();
            // generate if the element on the other end is not visited AND the link is not conditional
            if (!visited[elem._id()] && !link.link.isConditional()) {
                visited[elem._id()]=elem._id();
                return {
                  linkIdentification:{_id: link.link._id(),localName: link.link.getName()},
                  linkType: link.link.getType(),
                  // not really correct because of isInverse option
                  isInverse:false,
                  isSubQuery:link.link.isSubQuery(),
                  identification: { _id: elem._id(), localName: elem.getName()},
                  stereotype: elem.getStereotype(),
                  instanceAlias: elem.getInstanceAlias(),
                  isVariable:elem.isVariable(),
                  variableName:elem.getVariableName(),
                  // should not add the link which was used to get to the elem
                  conditionLinks:_.filter(_.map(_.filter(elem.getLinks(),function(l) {return !l.link.isEqualTo(link.link)}), genConditionalLink), function(l) {return l}),
                  fields: elem.getFields(),
                  conditions: elem.getConditions(),
                  children: _.filter(_.map(elem.getLinks(), genLinkedElement), function(l) {return l}),
                }
            }
          };
      };

      return _.filter(_.map(current_elem.getLinks(), genLinkedElement), function(l) {return l})
  };

    return { root: {
      identification: { _id: e._id(), localName: e.getName()},
      stereotype: e.getStereotype(),
      instanceAlias: e.getInstanceAlias(),
      isVariable:e.isVariable(),
      variableName:e.getVariableName(),
      conditionLinks:_.filter(_.map(e.getLinks(), genConditionalLink), function(l) {return l}),
      fields: e.getFields(),
      conditions: e.getConditions(),
      orderings: e.getOrderings(),
      distinct:e.isDistinct(),
      limit:e.getLimit(),
      offset:e.getOffset(),
      havingConditions:e.getHavings(),
      children: genLinkedElements(e)
    }}
  });
};