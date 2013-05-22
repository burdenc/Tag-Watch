// query.js - deltaburnt (1)'s module
// author: deltaburnt

//TODO: This practically needs a complete rewrite, preferably
//		so it's more object orientated.

var xhr = require("xhr");
var {Cc, Ci} = require("chrome");
var parser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser);

//TODO: Dynamically load APIs
//APIs
var gel = require("api/gelbooru.js");
var wall = require("api/wallbase.js");

//TODO: Make loosely coupled with ss.storage.sites
//		Should manipulate tag objects only

exports.checkTag = function(site, tagIndex)
{
    var api = chooseAPI(site);
    api.getNewContent(site.tags[tagIndex], site);
		
    return site;
}

exports.createTag = function(site)
{
    var api = chooseAPI(site);
	//TODO: change so that tags are alphabetized and new tag is not last in list
    api.createTag(site.tags[site.tags.length-1], site); //Updates lastChecked of new tag
    return site;
}

exports.createSite = function(site)
{
    var xmlRequest = new xhr.XMLHttpRequest();
    
    if(site.url.match("^(http:\/\/)?(wallbase)(\.cc(\/.*)?)?$"))
    {
        site.type = "wallbase";
		site.url = "http://wallbase.cc/home";
		site.icon = findFavicon(site.url);
        return site;
    }
	
	if(site.url.toLowerCase() == "gelbooru")
	{
		site.name = "Gelbooru";
		site.url = "http://gelbooru.com";
		site.type = "gelbooru";
		site.tagUrl = "/index.php?page=post&s=list&tags=";
		site.icon = findFavicon(site.url);
		return site;
	}
    
	//Below requires a valid base URL, so we regex first to make sure
	var urlMatch = site.url.match(/^(http(s)?:\/\/)(www.)?([a-z0-9-]+\.)*([a-z0-9-]+)*?(\.[a-z0-9-]+)(:[0-9]+)?(\/)?$/i);
	if(!urlMatch)
		return null;
	
	//Remove trailing forward slash
	//Slash is backreference #8
	if(urlMatch[8] == '/')
		site.url = site.url.splice(0, site.url.length-1);
	
	//Default site name to domain
	//Domain name uses backreference #5
	site.name = urlMatch[5];
	
    //Attempt gelbooru api
    xmlRequest.open("get", site.url+"/index.php?page=dapi&s=post&q=index", false);
    xmlRequest.send();
    if(xmlRequest.status == 200 && xmlRequest.responseXML != null && xmlRequest.responseXML.querySelector("posts") != null)
    {
        site.type = "gelbooru";
		site.tagUrl = "/index.php?page=post&s=list&tags=";
		site.icon = findFavicon(site.url);
        return site;
    }
    
    //TODO: Attempt danbooru api
    
	
	return null;
    
}

function findFavicon(url)
{
	return "http://www.google.com/s2/favicons?domain="+url;
	var xmlRequest = new xhr.XMLHttpRequest();
	
	xmlRequest.open("get", "http://www.google.com/s2/favicons?domain="+url, false);
	xmlRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    //xmlRequest.overrideMimeType("text/xml");
	//xmlRequest.responseType = "document";
	xmlRequest.send();
	if(xmlRequest.status == 200)
	{
		console.log("xhr success");
		//var doc = xmlRequest.responseXML;
		//var doc = document.implementation.createHTMLDocument("example");
		//doc.documentElement.innerHTML = xmlRequest.responseText;
		var doc = parser.parseFromString(xmlRequest.responseText, "text/html");
		
		var icon = doc.querySelector("link[rel='shortcut icon'], link[rel='icon'], link[rel='ICON'], link[rel='SHORTCUT ICON']");
		var link = doc.createElement("a");
		link.href = icon.href;
		console.log(link.href);
		console.log(link.protocol+"//"+link.host+link.pathname+link.search+link.hash);
		if(icon != null)
			return url+icon.href;
		else
			return "null.png";
	}
	else
		return "null.png";
}

function chooseAPI(site)
{
    if(site.type == "gelbooru")
        return gel;
    if(site.type == "wallbase")
        return wall;
    if(site.type == "danbooru")
        return booruorgGetCID;
}