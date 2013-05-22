exports.main = function()
{
    //var notifications = require("sdk/notifications");
    var ss = require("sdk/simple-storage");    
    var widgets = require("sdk/widget");
    var tabs = require("sdk/tabs");
    var self = require("sdk/self");
    //var jscl = require("crypthelper.js");
    //var Request = require("sdk/request").Request;
    var query = require("query.js");
    var pageMod = require("sdk/page-mod");
    
	//Default storage settings
    if(ss.storage.sites == null)
        ss.storage.sites = JSON.parse(self.data.load("sites.json"));
    
    var widget = widgets.Widget
    ({
        id: "tagWatchWidget",
        label: "Tag Watch Widget",
        contentURL: self.data.url("icon.png"),
        contentScriptFile: self.data.url("clickhelper.js")
    });
	
	widget.port.on('left-click', function() {
        //tabs.open(self.data.url("tags.html")+"#Wallbase");
		tabs.open(self.data.url("sites.html"));
    });
    
    widget.port.on('right-click', function() {
        //TODO: Add quiet site reloading module
		tabs.open(self.data.url("sites.html"));
    });
    
    //Stupid css fixes because jetpack is stupid and afraid of local CSS hacks
    var css = '[class^="icon-"], [class*=" icon-"] { display: inline-block; width: 14px; height: 14px; margin-top: 1px; *margin-right: .3em; line-height: 14px; vertical-align: text-top; background-image: url("'+self.data.url("glyphicons-halflings.png")+'") !important; background-position: 14px 14px; background-repeat: no-repeat; }';
    var css2 = '.icon-white, .nav-pills > .active > a > [class^="icon-"], .nav-pills > .active > a > [class*=" icon-"], .nav-list > .active > a > [class^="icon-"], .nav-list > .active > a > [class*=" icon-"], .navbar-inverse .nav > .active > a > [class^="icon-"], .navbar-inverse .nav > .active > a > [class*=" icon-"], .dropdown-menu > li > a:hover > [class^="icon-"], .dropdown-menu > li > a:hover > [class*=" icon-"], .dropdown-menu > .active > a > [class^="icon-"], .dropdown-menu > .active > a > [class*=" icon-"], .dropdown-submenu:hover > a > [class^="icon-"], .dropdown-submenu:hover > a > [class*=" icon-"] { background-image: url("'+self.data.url("glyphicons-halflings-white.png")+'") !important; }';
    
    pageMod.PageMod({
        include: (self.data.url("tags.html")+"*"),
        contentScriptFile: [self.data.url("jquery.js"), self.data.url("mustache.js"), self.data.url("bootstrap.js"), self.data.url("ui-tabs.js")],
        contentStyleFile: self.data.url("bootstrap.css"),
        //contentStyle: [css, css2],
		//contentStyle: 'body{ background-image: url("'+self.data.url("glyphicons-halflings.png")+'") };',
        contentScriptOptions: {
            template: self.data.load("tags-tmplt.html"),
            //bootstrap: self.data.load("bootstrap.css"),
			//css: css,
			//css2: css2
        },
		
		//TODO: Create specific port event objects to make
		//		information passing more efficient
        onAttach: function(worker) {
            //serve url so hash identifier can be parsed
            worker.port.emit("getURL", worker.url);
            
            //serve site data based off of hash identifier
            worker.port.on("requestSite", function(siteName) { 
                var index = jsonSearch(ss.storage.sites, siteName);
                worker.port.emit("getSite", JSON.stringify(ss.storage.sites[index]));
            });
            
			//get new content of a tag
            worker.port.on("requestTagUpdate", function(siteName, tagindex) {
                var siteindex = jsonSearch(ss.storage.sites, siteName);
                ss.storage.sites[siteindex] = query.checkTag(ss.storage.sites[siteindex], tagindex);
                worker.port.emit("getSite", JSON.stringify(ss.storage.sites[siteindex]));
            });
            
			//get new site data (options, tags, etc.) from UI
            worker.port.on("siteUpdate", function(data) {
                var newSite = JSON.parse(data);
                var search = jsonSearch(ss.storage.sites, newSite.name);
                ss.storage.sites[search] = newSite;
            });
            
			//create new tag (get 'lastChecked' value)
            worker.port.on("createTag", function(data) {
                var site = JSON.parse(data);
                var index = jsonSearch(ss.storage.sites, site.name);
                ss.storage.sites[index] = query.createTag(site);
                worker.port.emit("getSite", JSON.stringify(site));
            });
        }
    });
	
	pageMod.PageMod({
        include: self.data.url("sites.html"),
        contentScriptFile: [self.data.url("jquery.js"), self.data.url("mustache.js"), self.data.url("bootstrap.js"), self.data.url("ui-sites.js")],
        contentStyleFile: self.data.url("bootstrap.css"),
        //contentStyle: [css, css2],
        contentScriptOptions: {
            template: self.data.load("sites-tmplt.html"),
            bootstrap: self.data.load("bootstrap.css")
        },
		
        onAttach: function(worker) {
			worker.port.emit("getSites", JSON.stringify(ss.storage.sites));
			
			worker.port.on("checkAllTags", function(siteindex) {
				for(var i = 0; i < ss.storage.sites[siteindex].tags.length; i++)
				{
					ss.storage.sites[siteindex] = query.checkTag(ss.storage.sites[siteindex], i);
				}
				
				var numNew = 0;
				for(var i = 0; i < ss.storage.sites[siteindex].tags.length; i++)
					if(ss.storage.sites[siteindex].tags[i].newContent.length != 0)
						numNew++;
				
				worker.port.emit("getReloadUpdate", numNew);
			});
			
			worker.port.on("newSite", function(siteURL) {
				var site = {};
				site.url = siteURL;
				site.name = siteURL;
				site.tagUrl = siteURL;
				site = query.createSite(site);
				
				if(site != null)
				{
					site.nsfwFilter = false;
					site.privateOnly = false;
					site.tags = [];
					ss.storage.sites.push(site);
				}
				
				worker.port.emit("getNewSite", site);
			});
			
			//TODO: Don't overwrite tag content
			worker.port.on("updateSite", function(site, siteindex) {
				ss.storage.sites[siteindex] = site;
			});
        }
    });
};

function jsonSearch(array, key)
{
    for(i = 0; i < array.length; i++)
        if(array[i].name == key)
            return i;
    return false;
}