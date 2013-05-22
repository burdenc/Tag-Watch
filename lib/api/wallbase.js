// api/wallbase.js - Tag Watch's module
// author: deltaburnt

var xhr = require("xhr");

exports.getNewContent = function(tagInfo, site)
{
    //console.log("API URL: http://gelbooru.com/index.php?page=dapi&s=post&q=index&limit=25&tags="+encodeURIComponent(tagInfo.name));
    var response = query("board=213&nsfw=111&res=0&res_opt=gteq&aspect=0&orderby=date&orderby_opt=desc&thpp=60&section=wallpapers&query="+encodeURIComponent(tagInfo.name));
    var posts = response.getElementsByClassName("thumb");
    for(var j = posts.length-1; j >= 0; j--)
    {
        var wallid = parseInt(posts[j].getAttribute("id").substring(5)); //"thumb{{id#}}"
        if(!(wallid > parseInt(tagInfo.lastChecked)))
            continue;
        
        var content = 
        {
            "url": "http://wallbase.cc/wallpaper/"+wallid,
            "image": posts[j].querySelector("a > img").getAttribute("src"),
            "nsfw": true
        }
        if(posts[j].className == "thumb")
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
    var response = query("board=213&nsfw=111&res=0&res_opt=gteq&aspect=0&orderby=date&orderby_opt=desc&thpp=60&section=wallpapers&query="+encodeURIComponent(tagInfo.name));
    var posts = response.getElementsByClassName("thumb");
    
    if(posts.length != 0)
        tagInfo.lastChecked = parseInt(posts[0].getAttribute("id").substring(5));
    else
        tagInfo.lastChecked = -1; //tag does not exist
    
    console.log(tagInfo.lastChecked);
    return tagInfo;
}

function query(params)
{
    console.log(params);
    var request = new xhr.XMLHttpRequest();
    request.open("post", "http://wallbase.cc/search", false);
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    request.overrideMimeType("text/xml");
    request.send(params);
    
    return request.responseXML;
}