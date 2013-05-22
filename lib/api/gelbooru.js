// api/gelbooru.js - Tag Watch's module
// author: deltaburnt

var xhr = require("xhr");

exports.getNewContent = function(tagInfo, site)
{
    console.log("API URL: "+site.url+"/index.php?page=dapi&s=post&q=index&limit=25&tags="+encodeURIComponent(tagInfo.name));
    var response = query(site.url+"/index.php?page=dapi&s=post&q=index&limit=25&tags="+encodeURIComponent(tagInfo.name));
    var posts = response.getElementsByTagName("post");
    for(var j = posts.length-1; j >= 0; j--)
    {
        
        if(!(posts[j].getAttribute("id") > parseInt(tagInfo.lastChecked)))
            continue;
        
        var content = 
        {
            "url": site.url+"/index.php?page=post&s=view&id="+posts[j].getAttribute("id"),
            "image": posts[j].getAttribute("file_url"),
            "nsfw": true
        }
        if(posts[j].getAttribute("rating") == "s")
            content.nsfw = false;
        
        tagInfo.newContent.unshift(content); //add to beginning
        if(tagInfo.newContent.length > 25)  //limit display to 25
            tagInfo.newContent.pop();

        if(j == 0)
            tagInfo.lastChecked = parseInt(posts[j].getAttribute("id"));
    }
}

exports.createTag = function(tagInfo, site)
{
	var response = query(site.url+"/index.php?page=dapi&s=post&q=index&limit=25&tags="+encodeURIComponent(tagInfo.name));
    var posts = response.getElementsByTagName("post");
	if(posts.length == 0)
		tagInfo.lastChecked = -1;
	else
		tagInfo.lastChecked = posts[0].getAttribute("id");
	
	tagInfo.lastChecked = 0;
	return tagInfo;
}

function query(url)
{
    var request = new xhr.XMLHttpRequest();
    request.open("get", url, false);
    request.send();
    
    return request.responseXML;
}