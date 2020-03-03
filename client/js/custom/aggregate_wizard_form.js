Template.AggregateWizard.defaultAlias = new ReactiveVar("No_class");
Template.AggregateWizard.attList = new ReactiveVar([{attribute: "No_attribute"}]);
Template.AggregateWizard.startClassId = new ReactiveVar("No start id");
Template.AggregateWizard.endClassId = new ReactiveVar("No end");
Template.AggregateWizard.linkId = new ReactiveVar("No link");
Template.AggregateWizard.showDisplay = new ReactiveVar("none");

Template.AggregateWizard.helpers({
	defaultAlias: function(){
		//console.log("AggregateWizard.helpers");
		return Template.AggregateWizard.defaultAlias.get();
	},

	attList: function(){
		return Template.AggregateWizard.attList.get();
	},

	startClassId: function(){
		return Template.AggregateWizard.startClassId.get();
	},

	endClassId: function(){
		return Template.AggregateWizard.endClassId.get();
	},

	linkId: function(){
		return Template.AggregateWizard.linkId.get();
	},

	showDisplay: function(){
		return Template.AggregateWizard.showDisplay.get();
	},
});

Template.AggregateWizard.events({
	"click #ok-aggregate-wizard": function() {
		var vq_end_obj = new VQ_Element(Template.AggregateWizard.endClassId.curValue);
		var alias = $('input[id=alias-name]').val();
		var expr = $('option[name=function-name]:selected').val()
		var fld = $('option[name=field-name]:selected').val();
		if (fld == "") {
			expr = expr.concat("(.)");
		} else {
			expr = expr.concat("(", fld, ")");
		}
		//console.log(alias + " " + expr);
		vq_end_obj.addAggregateField(expr,alias);

		if (Template.AggregateWizard.linkId.curValue != "No link") {
			var vq_link_obj = new VQ_Element(Template.AggregateWizard.linkId.curValue);
			if (vq_link_obj.isLink()) {
				vq_link_obj.setNestingType("SUBQUERY");
			}
		}

		var displayCase = document.getElementById("display-results").checked;
		var minValue = $('input[id=results_least]').val();
		var maxValue = $('input[id=results-most]').val();
		//console.log(displayCase, minValue, maxValue);
		if (displayCase || (minValue != "") || (maxValue != "")) {
			console.log("display or min/max");
			var vq_start_obj = new VQ_Element(Template.AggregateWizard.startClassId.curValue);
			if (alias == null || alias == "") {
				var cName = vq_start_obj.getName();
				var newFunction = $('option[name=function-name]:selected').val();
				alias = cName.charAt(0) + "_" + newFunction;
			}
			//addField: function(exp,alias,requireValues,groupValues,isInternal)
			if (displayCase) vq_start_obj.addField(alias,);
			if (minValue != "") vq_start_obj.addCondition(alias + ">=" + minValue);
			if (maxValue != "") vq_start_obj.addCondition(alias + "<=" + maxValue);
		} else {
			//console.log("no display or min/max");
		}

		clearAggregateInput();
		return;
	},

	"click #cancel-aggregate-wizard": function() {
		clearAggregateInput();
		return;
	},

	"change #aggregate-wizard-function-list": function() {
		// console.log("changed");
		var vq_obj = new VQ_Element(Template.AggregateWizard.endClassId.curValue);
		var alias = $('input[id=alias-name]').val();
		var newFunction = $('option[name=function-name]:selected').val();
		var fieldName = $('option[name=field-name]:selected').val();
		var cName = vq_obj.getName();
		//console.log(cName.charAt(0), fieldName.length);

		//Select suitable atributes for Field form
		defaultFieldList();
		var schema = new VQ_Schema();
		// console.log(schema.resolveAttributeByName(Template.AggregateWizard.startClassId.curValue, fieldName).type);
		var attrArray = Template.AggregateWizard.attList.curValue;
		var newAttrList = [];
		if (newFunction == "count" || newFunction == "count_distinct" || newFunction == "sample") {
			newAttrList.push({attribute: ""});
		}
		if (schema.classExist(cName)){
			var klass = schema.findClassByName(cName);
			_.each(klass.getAllAttributes(), function(att){
				var attrType = schema.resolveAttributeByName(cName, att["name"]).type;
				if (newFunction == "sum" || newFunction == "avg") {
					if (attrType == "xsd:integer" || attrType == "xsd:decimal" || attrType == "xsd:double"
						|| attrType == "xsd:float" || attrType == "xsd:int" || attrType == "xsd:long"
						|| attrType == "xsd:short") {
						newAttrList.push({attribute: att["name"]})
					}
				} else {
					newAttrList.push({attribute: att["name"]});
				}
			})

			newAttrList = _.sortBy(newAttrList, "attribute");
		}
		//console.log(attr_list);
		Template.AggregateWizard.attList.set(newAttrList);

		//Set default alias
		var functionArray = ["count", "count_distinct", "sum", "avg", "max", "min", "sample", "group_concat"];
		_.each(functionArray, function(f) {
			var defaultName = cName.charAt(0) + "_" + f;
			var defaultFieldName = f + "_" + fieldName;
			if (alias == defaultName) {
				Template.AggregateWizard.defaultAlias.set(cName.charAt(0) + "_" + newFunction);
			} else if (alias == defaultFieldName) {
				if (newAttrList.indexOf(fieldName) > -1) {
					Template.AggregateWizard.defaultAlias.set(newFunction + "_" + fieldName);
				} else {
					Template.AggregateWizard.defaultAlias.set(cName.charAt(0) + "_" + newFunction);
				}
			}
		})

		//Set at least/at most
		if (newFunction == "count" || newFunction == "sum" || newFunction == "avg" || newFunction == "count_distinct"){
			$('input[id=results_least]').attr('disabled', false);
			$('input[id=results-most]').attr('disabled', false);
		} else {
			$('input[id=results_least]').attr('disabled', true);
			$('input[id=results-most]').attr('disabled', true);
		}
		return;
	},

	"change #field-list": function() {
		// console.log("changed field");
		var vq_obj = new VQ_Element(Template.AggregateWizard.endClassId.curValue);
		var vq_start_obj = new VQ_Element(Template.AggregateWizard.startClassId.curValue);
		var alias = $('input[id=alias-name]').val();
		var newFunction = $('option[name=function-name]:selected').val();
		var fieldName = $('option[name=field-name]:selected').val();
		var cName = vq_start_obj.getName();
		//console.log(cName.charAt(0), fieldName.length);
		var functionArray = Template.AggregateWizard.attList.curValue;
		_.each(functionArray, function(f) {
			var defaultName = cName.charAt(0) + "_" + newFunction;
			var defaultFieldName = newFunction + "_" + f.attribute;
			if ((alias == defaultName || alias == defaultFieldName) && fieldName.length == 0) {
				Template.AggregateWizard.defaultAlias.set(cName.charAt(0) + "_" + newFunction);
			} else if ((alias == defaultName || alias == defaultFieldName) && fieldName.length != 0) {
				Template.AggregateWizard.defaultAlias.set(newFunction + "_" + fieldName);
			}
		})
		return;
	},
});

//++++++++++++
//Functions
//++++++++++++
// Template.AggregateWizard.defaultAlias = new ReactiveVar("No_class");
// Template.AggregateWizard.attList = new ReactiveVar([{attribute: "No_attribute"}]);
// Template.AggregateWizard.startClassId = new ReactiveVar("No start id");
// Template.AggregateWizard.endClassId = new ReactiveVar("No end");
// Template.AggregateWizard.linkId = new ReactiveVar("No link");
// Template.AggregateWizard.showDisplay = new ReactiveVar("none");

function clearAggregateInput(){
	var defaultFunctions = document.getElementsByName("function-name");
	_.each(defaultFunctions, function(e){
		if (e.value == "count") e.selected = true;
		else e.selected = false;
	});

	defaultFieldList();
	Template.AggregateWizard.showDisplay.set("none");
	Template.AggregateWizard.defaultAlias.set("N_count");
	Template.AggregateWizard.attList.set([{attribute: "No_attribute"}]);
	Template.AggregateWizard.startClassId.set("No start id");
	Template.AggregateWizard.endClassId.set("No end id");
	Template.AggregateWizard.linkId.set("No link");
	$('input[id=display-results]:checked').attr('checked', false);
	document.getElementById("results_least").value = "";
	document.getElementById("results-most").value = "";
}

function defaultFieldList(){
	var defaultFunctions = document.getElementsByName("field-name");
	_.each(defaultFunctions, function(e){
		if (e.value == "") e.selected = true;
		else e.selected = false;
	});
}