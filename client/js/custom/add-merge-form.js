Template.AddMergeValues.expression = new ReactiveVar("");
// Template.AddMergeValues.alias = new ReactiveVar("");
Template.AddMergeValues.aliasField = new ReactiveVar("");
Template.AddMergeValues.mergeAlias = new ReactiveVar("");
Template.AddMergeValues.cardinality = new ReactiveVar(-1);
Template.AddMergeValues.aggregation = new ReactiveVar("group_concat");
Template.AddMergeValues.expressionField = new ReactiveVar("");
//Template.AddMergeValues.hideField = new ReactiveVar("");
Template.AddMergeValues.e = new ReactiveVar("");
Template.AddMergeValues.attribute = new ReactiveVar("");

Interpreter.customMethods({
	AddMergeValues: function (e) {
		
		var expressionField = getExpression(e);
		//var hideField = getHide(e);
		var parsedExpression = parsedExpressionField(expressionField.val());
		var expr = parsedExpression["expression"];
		var aggregation = parsedExpression["aggregation"];
		
		Template.AddMergeValues.expression.set(expr);
		var mergeAlias = getAlais(e).val();
		if(mergeAlias == null || mergeAlias == "") mergeAlias = expr.substring(0,1).toUpperCase();
		Template.AddMergeValues.mergeAlias.set(mergeAlias);
		// Template.AddMergeValues.alias.set(getAlais(e).val());
		Template.AddMergeValues.aliasField.set(getAlais(e));
		Template.AddMergeValues.attribute.set(e);
		if(aggregation != null && aggregation != "")Template.AddMergeValues.aggregation.set(aggregation);
		var card = countCardinality(expr, Session.get("activeElement"))
		var proj = Projects.findOne({_id: Session.get("activeProject")});
		if (proj){
      		if (typeof proj.showCardinalities ==='undefined' || proj.showCardinalities!="true"){
      			card = -1;
      		}
      	} else card = -1;
		
		if(card == -1)document.getElementById("merge-values-wizard-id").style.display = "none";
		
		Template.AddMergeValues.cardinality.set(card);
		Template.AddMergeValues.expressionField.set(expressionField);
		//Template.AddMergeValues.hideField.set(hideField);
		Template.AddMergeValues.e.set(e.target.parentElement.parentElement.parentElement.parentElement);

		if(expr != null && expr != "")$("#merge-values-form").modal("show");
		else Interpreter.showErrorMsg("Please specify expression", -3);
	}
})



Template.AddMergeValues.helpers({

	isMultiple: function() {
		var cardinality = Template.AddMergeValues.cardinality.get();
		if(cardinality == -1) return true;
		return false;
	},

	className: function() {
		var act_elem = Session.get("activeElement");
		var act_el = Elements.findOne({_id: act_elem}); //Check if element ID is valid
		if(typeof act_el !== 'undefined'){
			var compart_type = CompartmentTypes.findOne({name: "Name", elementTypeId: act_el["elementTypeId"]});
			var compart = Compartments.findOne({compartmentTypeId: compart_type["_id"], elementId: act_elem});
			if(typeof compart !== 'undefined') return compart["input"];
		}
		return "";
	},

	expression: function() {
		return Template.AddMergeValues.expression.get();
	},
	
	mergeAlias: function() {
		return Template.AddMergeValues.mergeAlias.get();
	},

	selectedCount: function() {
		if(Template.AddMergeValues.aggregation.get() == "count") return "selected";
		return "";
	},

	selectedDistinct: function() {
		if(Template.AddMergeValues.aggregation.get() == "count_distinct") return "selected";
		return "";
	},

	selectedSum: function() {
		if(Template.AddMergeValues.aggregation.get() == "sum") return "selected";
		return "";
	},

	selectedAvg: function() {
		if(Template.AddMergeValues.aggregation.get() == "avg") return "selected";
		return "";
	},

	selectedMax: function() {
		if(Template.AddMergeValues.aggregation.get() == "max") return "selected";
		return "";
	},

	selectedMin: function() {
		if(Template.AddMergeValues.aggregation.get() == "min") return "selected";
		return "";
	},

	selectedSample: function() {
		if(Template.AddMergeValues.aggregation.get() == "sample") return "selected";
		return "";
	},

	selectedConcat: function() {
		if(Template.AddMergeValues.aggregation.get() == "group_concat") return "selected";
		return "";
	},
});


Template.AddMergeValues.events({

	"click #ok-merge-values": function(e) {
		var mergeType = $('input[name=type-radio-merge]:checked').val();

		// var alias = Template.AddMergeValues.alias.get();
		var expr = $('input[name=expression-merge]').val();
		var aggregation = $('option[name=function-name-merge]:selected').val();
		expr = aggregation + "(" + expr + ")";
		var displayCase = document.getElementById("merge-display-results").checked;
		var mergeAliasName = $('input[id=merge-alias-name]').val();
		var minValue = $('input[id=merge-results-least]').val();
		var maxValue = $('input[id=merge-results-most]').val();
		
		if((typeof mergeType !== 'undefined' && mergeType == "MULTIPLE") || typeof mergeType === 'undefined'){
			var selected_elem_id = Session.get("activeElement");
			if (Elements.findOne({_id: selected_elem_id})){
				var vq_obj = new VQ_Element(selected_elem_id);

				var parentClass;
				var links = vq_obj.getLinks();
				for(var key in links) {
					if(links[key].link.getRootDirection() == "start" && links[key].link.obj.startElement != selected_elem_id) {
						parentClass = new VQ_Element(links[key].link.obj.startElement);
						links[key].link.setNestingType("SUBQUERY");
					}
					if(links[key].link.getRootDirection() == "end" && links[key].link.obj.endElement != selected_elem_id) {
						parentClass = new VQ_Element(links[key].link.obj.endElement);
						links[key].link.setNestingType("SUBQUERY");
					}
				}
				
				if(typeof parentClass !== 'undefined'){
					if(displayCase) parentClass.addField(mergeAliasName,"",false,false,false);
					if (minValue != "") parentClass.addCondition(mergeAliasName + ">=" + minValue);
					if (maxValue != "") parentClass.addCondition(mergeAliasName + "<=" + maxValue);
					
					//if(alias != null && alias !="") expr =  aggregation + "(" + alias + ")";
				}
				vq_obj.addAggregateField(expr,mergeAliasName);
				//Template.AddMergeValues.hideField.get().prop("checked", true);
				Template.AddMergeValues.expressionField.get().val("");
				Template.AddMergeValues.aliasField.get().val("");
				
				var list = {compartmentId: document.getElementById($(Template.AddMergeValues.attribute.get().target).closest(".multi-field").attr("id")).getAttribute("compartmentid"),
					projectId: Session.get("activeProject"),
					versionId: Session.get("versionId"),
				};

				Utilities.callMeteorMethod("removeCompartment", list);
				
				var form = $(Template.AddMergeValues.attribute.get().target).closest(".row-form")
				form.modal("hide");
			};
		} else {
			Template.AddMergeValues.expressionField.get().val(expr);
		}
		clearMergeValuesInput();
		return;

	},

	"click #cancel-merge-values": function() {
		clearMergeValuesInput();
		$(Template.AddMergeValues.e.get()).modal('toggle');
	},
	
	"change #merge-choice": function() {
		var checkedName = $('input[name=type-radio-merge]').filter(':checked').val();
        if (checkedName === 'SINGLE') {
           document.getElementById("merge-values-wizard-id").style.display = "none";
        } else {
           document.getElementById("merge-values-wizard-id").style.display = "block";
        } 
	},

});

function parsedExpressionField(expression){
	if(expression.indexOf("(") != -1 && expression.endsWith(")") == true ){
		var aggregation = expression.substring(0, expression.indexOf("("));
		var aggregationList = ["count", "count_distinct", "sum", "avg", "max", "min", "sample", "group_concat"];
		if(aggregationList.indexOf(aggregation.toLowerCase()) != -1) return {expression:expression.substring(expression.indexOf("(")+1, expression.length-1), aggregation:aggregation.toLowerCase()}
	}
	return {expression:expression, aggregation:""}
}

function clearMergeValuesInput(){
	var defaultFunctions = document.getElementsByName("function-name-merge");
	_.each(defaultFunctions, function(e){
		if (e.value == "group_concat") e.selected = true;
		else e.selected = false;
	});

	var defaultRadio = document.getElementsByName("type-radio-merge");
	_.each(defaultRadio, function(e){
		if (e.value == "SINGLE") e.checked = true;
		else e.checked = false;
	});
	
	document.getElementById("merge-alias-name").value = Template.AddMergeValues.mergeAlias.get();
	document.getElementById("merge-display-results").checked = false;
	document.getElementById("merge-results-least").value = "";
	document.getElementById("merge-results-most").value = "";
}

function getExpression(e){
	return getField(e, "Expression");
}
function getHide(e){
	return getField(e, "IsInternal");
}

function getAlais(e){
	return getField(e, "Field Name");
}

function getField(e, fieldName){
		var parent = $(e.target).closest(".compart-type");
		var parent_id = parent.attr("id");
		var compart_type = CompartmentTypes.findOne({_id: parent_id});

		// more elegant selection for subCompartmentTypes needed
		var expression_compart_type = _.find(compart_type.subCompartmentTypes[0].subCompartmentTypes, function(sub_compart_type) {
											return sub_compart_type.name == fieldName;
										});

		var exression_id = expression_compart_type._id

		var expression_value = parent.find("." + exression_id).val();

		return parent.find("." + exression_id);
}
