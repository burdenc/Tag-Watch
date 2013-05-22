//TODO: Rely less on re-rendering


//Mustache Template
var compiledTemplate;

//Mustache Functions
var input = 
{
	"nsfwChooseImg" : function() {
		if(!this.nsfw) return this.image;
		if(!input.tag.nsfwFilter && !input.site.nsfwFilter) return this.image;
		return "";
	},
	
	"chooseThumbHref" : function() {
		if(input.site.type == "wallbase")
			return this.url;
		return this.image;
	},
    
	"badges" : function () {
	
		var str = "";
		
		//Bad tag warning badge
		if(this.lastChecked == -1)
		{
			str += "<span class=\"badge badge-important bad-tag\" style=\"float:right\">!</span>";
		}
		
		//New content badge
        if(this.newContent.length > 0)
		{
			str += "<span class=\"badge badge-info\" style=\"float:right\">";
			str += (this.newContent.length == 25) ? "25+" : this.newContent.length;
			str += "</span>";
		}
		
		return str;
	},
	
	"tagOptions": function () {
		var str = '';
		str += '<label class="checkbox">';
		str += '	<input type="checkbox" id="options-filter" ' + ((input.tag.nsfwFilter) ? 'checked' : '') + ' ident="nsfwFilter" /> Filter NSFW';
		str += '</label>';
		return str;
	},
    
    "tagUrl" : function () {
        return input.site.tagUrl + input.tag.name;
    },
	
	"clicked" : function() {
		if(this.name == input.tag.name)
			return "clicked";
	}
};

//-----Bootstrap----
$("style").append(self.options.bootstrap);
$("style").append(self.options.css);
$("style").append(self.options.css2);
//------------------

//-----Mustache-----
compiledTemplate = Mustache.compile(self.options.template);
//------------------

listeners();

self.port.on("getURL", function(data) {
    var selectedSiteStr = data.substr(data.lastIndexOf("#")+1);
    self.port.emit("requestSite", selectedSiteStr);
});
self.port.on("getSite", function(data) {
    input.site = JSON.parse(data);
	if(typeof input.tag == "undefined")
		input.tag = input.site.tags[0];
	else
	{
		for(var i = 0; i < input.site.tags.length; i++)
		{
			if(input.tag.name == input.site.tags[i].name)
			{
				input.tag = input.site.tags[i];
			}
		}
	}
    render();
});

function listeners()
{
    //X button listener
    $("body").on("click", ".x-button", function() {
		var id = $(this).parent().index();
		input.tag.newContent.splice(id, 1);
        commitUpdate();
		render();
	});
    
    //Reload button listener
    $("body").on("click", "#reload", function() {
		var index = jQuery.inArray(input.tag, input.site.tags);
    	self.port.emit("requestTagUpdate", input.site.name, index);
	});
	
	//TODO: UI needs proper synchronization with backend
	//Reload All button listener
    $("body").on("click", "#reloadall", function() {
		for(var i = 0; i < input.site.tags.length; i++)
		{
			self.port.emit("requestTagUpdate", input.site.name, i);
		}
	});
	
    //Tag selection listener
	$("body").on("click", "tr.clickable", function() {
		var id = $(this).index();
		input.tag = input.site.tags[id];
		render();
	});
	
    //Mark all read listener
	$("body").on("click", "#markread", function() {
		input.tag.newContent = [];
        commitUpdate();
		render();
	});
    
    //Add tag modal listener
    $("body").on("click", "#addtag", function() {
        if($("#add-name").val().trim() != "")
        {
            console.log("adding a tag!");
            input.site.tags.push({
                "name": $("#add-name").val().trim(),
                "lastChecked": 0,
                "autodl": true,
                "nsfwFilter": $("add-filter").prop("checked"),
                "newContent": []
            });
            
            self.port.emit("createTag", JSON.stringify(input.site));
            
            $("#addmodal").modal("close");
        }
    });
    
    $("body").on("hidden", "#addmodal", function() {
        $("#add-name").val("");
        $("#add-filter").prop("checked", false);
    });
	
	$("body").on("hidden", "#optionmodal", function() {
        $("#options-filter").prop("checked", input.tag.nsfwFilter);
    });
	
	//Non existant tag alert
	$("body").tooltip({
		selector: ".bad-tag",
		title: "Tag does not exist",
	});
	
	//TODO: Make extendable
	//		Able to recognize arbitrary options
	$("body").on("click", "#savetag", function() {
		$("#optionmodal > .modal-body").find("input").each(function() {
			var value;
			var ele = $(this);
			if(ele.attr("type") == "text")
				value = ele.val().trim();
			if(ele.attr("type") == "checkbox")
				value = ele.prop("checked");
			input.tag[ele.attr("ident")] = value;
		});
		commitUpdate();
		render();
		
		$("#optionmodal").modal("close");
	});
	
	//Delete tag
	$("body").on("click", "#deletetag", function() {
		var index = jQuery.inArray(input.tag, input.site.tags);
		console.log(index);
		input.site.tags.splice(index, 1);
		if(index >= input.site.tags.length)
			index--;
		input.tag =	input.site.tags[index];
		commitUpdate();
		render();
	});
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
