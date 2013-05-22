//Mustache Template
var compiledTemplate;

//Image Preload
var imgs = new Array();

var selectedSite = 0;

//State
//var state = {};

//Mustache Functions
var input = 
{
	"updatedTags" : function () {
		var numUpdated = 0;
		for(var i = 0; i < this.tags.length; i++)
		{
			if(this.tags[i].newContent.length != 0)
			{
				numUpdated++;
			}
		}
		
		if(numUpdated == 0)
			return "";
		
		return "<span class=\"badge badge-info pull-right\">"+numUpdated+"</span>";
	},
	
	"siteOptions" : function () {
		if(this.nsfwFilter)
			return "checked='on'";
		return "";
	}
};

//console.log(self.options.template);

//-----Bootstrap----
//$("style").append(self.options.bootstrap);
//------------------

//-----Mustache-----
compiledTemplate = Mustache.compile(self.options.template);
//------------------

listeners();

self.port.on("getSites", function(data) {
	input.sites = JSON.parse(data);
	//preload();
	render();
});

function listeners()
{
	$("body").on("click", ".site-div", function() {
		$(this).next().slideToggle();
	});
	
	//Div click fix
	$("body").on("click", ".site-div > a", function(event) {
		event.stopPropogation();
	});
	
	$("body").on("hidden", "#addmodal", function() {
		$("#add-name").val("");
		$("#noAPI").hide();
	});
	
	$("body").on("click", "#closeAddAlert", function() {
		$(this).parent().slideUp();
	});
	
	$("body").on("click", "#addsite", function() {
		if($("#add-name").val().trim() != "")
		{
			$("#noAPI").hide();
			self.port.emit("newSite", $("#add-name").val());
			self.port.on("getNewSite", function(newSite) {
				if(newSite == null)
					$("#noAPI").slideDown();
				else
				{
					input.sites.push(newSite);
					render();
				}
			});
		}
	});
	
	$("body").on("click", ".options", function() {
		var sitethis = $(this);
		var index = sitethis.parents(".site-container").index();
		$("#options-name").val(input.sites[index].name);
		$("#options-filter").prop("checked", input.sites[index].name);
		$("#optionsmodal").modal("show");
		selectedSite = index;
	});
	
	//Check for updated tags, display number of updated tags count
	$("body").on("click", ".reload", function() {
		var sitethis = $(this);
		var index = sitethis.parents(".site-container").index();
		self.port.emit("checkAllTags", index);
		self.port.on("getReloadUpdate", function(numNew) {
			var str;
			if(numNew == 0)
				str = "";
			else
				str = "<span class=\"badge badge-info pull-right\">"+numNew+"</span>";
			sitethis.parents(".site-container").find(".updatedTags").html(str);
		});
	});
	
	$("body").on("click", "#saveoptions", function() {
		var name = $("#options-name").val();
		if(name.trim() != "")
		{
			var duplicate = false;
			for(var i = 0; i < input.sites; i++)
				if(input.sites[i].name == name)
					duplicate = true;
					
			if(!duplicate)
			{
				input.sites[selectedSite].name = name;
				input.sites[selectedSite].nsfwFilter = $("#options-filter").prop("checked");
				self.port.emit("updateSite", input.sites[selectedSite], selectedSite);
				render();
			}
		}
	});
}

function preload()
{
	for(var i = 0; i < input.sites; i++)
	{
		imgs[i] = new Image()
		imgs[i].src = input.sites[i].icon;
	}
}

function commitUpdate()
{
    self.port.emit("siteUpdate", JSON.stringify(input.site));
}

function render()
{
    $("body").hide();
    $("body").html(compiledTemplate(input));
	$("body").show();
}
