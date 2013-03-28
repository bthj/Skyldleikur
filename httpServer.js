/*
    TODO: base this server on some framework like express...
*/


/*
var sys = require("sys"),  
my_http = require("http"),  
path = require("path"),  
url = require("url"),  
filesys = require("fs");  
my_http.createServer(function(request,response){  
    var my_path = url.parse(request.url).pathname;  
    var full_path = path.join(process.cwd(),my_path);  
    path.exists(full_path,function(exists){  
        if(!exists){  
            response.writeHeader(404, {"Content-Type": "text/plain"});    
            response.write("404 Not Found\n");    
            response.end();  
        }  
        else{  
            filesys.readFile(full_path, "binary", function(err, file) {    
                 if(err) {    
                     response.writeHeader(500, {"Content-Type": "text/plain"});    
                     response.write(err + "\n");    
                     response.end();    
                 
                 }    
                 else{  
                    response.writeHeader(200);    
                    response.write(file, "binary");    
                    response.end();  
                }  
                       
            });  
        }  
    });  
}).listen(8080);  
sys.puts("Server Running on 8080");    
*/

var static = require('node-static'),
    http = require('http'),
    url = require("url"),
    path = require("path"),
//    restler = require("restler");
    request = require('request');

var file = new(static.Server)();

http.createServer(function (req, res) {
    var my_path = url.parse(req.url).pathname;  
    var full_path = path.join(process.cwd(),my_path);  
    path.exists(full_path,function(exists){
        
        
        
        if(exists) {
            file.serve(req, res);
        } else if(req.url.substring(0,3) === '/ie' ) {
            
            console.log("exists: " + exists + "- " + my_path.substring(0,3)  );
/*                
            http.get({host:'oss.nemur.net',path:'/search?ordasafn=SearchIsmal&q=test&exact=true'}, function(response) {
                console.log("Got response: " + response.statusCode);
                res.writeHeader(200, {"Content-Type": "application/json"});    
                response.on('data', function (chunk) {
                    console.log('BODY: ' + chunk);
//                    res.write(chunk + "\n");    
//                    res.end();
//                    res.writeHead(200, {
//                        'Content-Type': 'application/json',
//                        'Content-Length': chunk.length
//                    });
                    res.end(chunk);
                });

            }).on('error', function(e) {
                console.log("Got error: " + e.message);
            });
*/       
            console.log('performing get to: http://www.islendingabok.is/ib_app/' + req.url.substring(4));
/*
            restler.get('http://www.islendingabok.is/ib_app/' + req.url.substring(4), {
            }).on('complete', function (data) {
                console.log(data);
                res.end(data);
            });
*/
            request('http://www.islendingabok.is/ib_app/' + req.url.substring(4), function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body);
                    res.end(body);
                }
            });
        }
        
    });
    
}).listen(8080);