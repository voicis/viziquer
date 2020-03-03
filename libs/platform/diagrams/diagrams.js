
Diagrams.after.remove(function (user_id, doc) {
	if (!doc)
		return false;

	Elements.remove({diagramId: doc["_id"]});
	DiagramTypes.remove({diagramId: doc["_id"]});
});
Diagrams.hookOptions.after.remove = {fetchPrevious: false};

Meteor.methods({

	insertDiagram: function(list) {
		var user_id = Meteor.userId();
		if (is_project_version_admin(user_id, list)) {

			build_diagram(list, user_id);
			var id = Diagrams.insert(list);

			return id;
		}
	},

	updateDiagram: function(list) {
		var user_id = Meteor.userId();

		var update = {};
		update[list["attrName"]] = list["attrValue"];

		if (is_project_version_admin(user_id, list)) {

			Diagrams.update({_id: list["diagramId"], projectId: list["projectId"],
							versionId: list["versionId"]},
							{$set: update});
		}

		else if (is_system_admin(user_id, list)) {

			Diagrams.update({_id: list["diagramId"], toolId: list["toolId"],
							versionId: list["versionId"]},
							{$set: update});
		}

	},

	removeDiagram: function(list) {
		var user_id = Meteor.userId();
		if (is_project_version_admin(user_id, list)) {
			Diagrams.remove({_id: list["id"], projectId: list["projectId"], versionId: list["versionId"]});
		}

		else if (is_system_admin(user_id, list)) {
			Diagrams.remove({_id: list["id"], toolId: list["toolId"], versionId: list["versionId"]});
		}
	},

	addTargetDiagram: function(list) {
		var user_id = Meteor.userId();
		if (is_project_version_admin(user_id, list)) {

			var diagram = list["diagram"];
			build_diagram(diagram, user_id);

			//overriding the default values
			diagram["parentDiagrams"] = [list["parentDiagram"]];

			//selecting the element
			var elem = list["element"];

			var id = Diagrams.insert(diagram);
			Elements.update({_id: element["id"], projectId: elem["projectId"], versionId: elem["versionId"]},
							{$set: {targetId: id}});
		}
	},

	addDiagramPermission: function(list) {
		var user_id = Meteor.userId();
		if (is_project_admin(user_id, list)) {

			Diagrams.update({_id: list["diagramId"], projectId: list["projectId"]},
							{$push: {allowedGroups: list["groupId"]}});
		}
	},

	removeDiagramPermission: function(list) {
		var user_id = Meteor.userId();
		if (is_project_admin(user_id, list)) {
			Diagrams.update({_id: list["diagramId"], projectId: list["projectId"]},
							{$pull: {allowedGroups: list["groupId"]}});
		}
	},

	updateDiagramsSeenCount: function(list) {
		var user_id = Meteor.userId();
		if (is_project_version_reader(user_id, list)) {
			Diagrams.update({_id: list["diagramId"], projectId: list["projectId"]},
							{$inc: {seenCount: 1}});
		}
	},

	lockingDiagram: function(list) {

		var user_id = Meteor.userId();
		if (list["toolId"] && is_system_admin(user_id)) {

			Diagrams.update({_id: list["diagramId"],
							toolId: list["toolId"]},

							{$set: {"editingUserId": user_id,
									"editingStartedAt": new Date(),}
							});

		}

		else if (is_project_version_admin(user_id, list)) {

			Diagrams.update({_id: list["diagramId"],
							projectId: list["projectId"], versionId: list["versionId"],},
							
							{$set: {"editingUserId": user_id,
									"editingStartedAt": new Date(),}
							});
		}

	},

	removeLocking: function(list) {

		var user_id = Meteor.userId();
		if (list["toolId"] && is_system_admin(user_id)) {
			Diagrams.update({_id: list["diagramId"], toolId: list["toolId"]},
							{$unset: {editingUserId: "", editingStartedAt: ""}});
		}

		else if (is_project_version_admin(user_id, list)) {
			Diagrams.update({_id: list["diagramId"],
							projectId: list["projectId"], versionId: list["versionId"]},
							{$unset: {editingUserId: "", editingStartedAt: ""}});
		}

	},


	duplicateDiagram: function(list) {

		var user_id = Meteor.userId();
		if (is_project_version_admin(user_id, list)) {

			var diagram_id = list.diagramId;
			var project_id = list.projectId;

			var diagram = Diagrams.findOne({_id: diagram_id, projectId: project_id,});
			if (!diagram) {
				console.error("No diagram ", diagram);
				return;
			}

			diagram._id = undefined;
			var new_diagram_id = Diagrams.insert(diagram);


			var elems_map = {};
			Elements.find({diagramId: diagram_id, projectId: project_id, type: "Box"}).forEach(function(box) {

				var old_box_id = box._id;
				box._id = undefined;
				box.diagramId = new_diagram_id;

				var new_box_id = Elements.insert(box);
				elems_map[old_box_id] = new_box_id;
			});


			Elements.find({diagramId: diagram_id, projectId: project_id, type: "Line"}).forEach(function(line) {

				var old_line_id = line._id;

				line._id = undefined;
				line.startElement = elems_map[line.startElement];
				line.endElement = elems_map[line.endElement];
				line.diagramId = new_diagram_id;

				var new_line_id = Elements.insert(line);
				elems_map[old_line_id] = new_line_id;
			});


			Compartments.find({diagramId: diagram_id, projectId: project_id}).forEach(function(compart) {

				compart._id = undefined;
				compart.elementId = elems_map[compart.elementId];
				compart.diagramId = new_diagram_id;

				Compartments.insert(compart);
			});

		}

	},

});

function build_diagram(list, user_id) {

	var time = new Date();
	list["createdAt"] = time;
	list["createdBy"] = user_id;
	list["imageUrl"] = "http://placehold.it/770x347";
	list["edit"] = {action: "new", time: time, userId: user_id},
	list["parentDiagrams"] = [];
	list["allowedGroups"] = [];
	//list["editing"] = {},
	list["seenCount"] = 0;
}
