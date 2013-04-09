var httpProxy = require('http-proxy'), 
    http = require('http'), 
    connect = require('connect');


httpProxy.createServer(
  require('proxy-by-url')({
      '/ie' : { port: 80, host: 'www.islendingabok.is' },
      '' : { port: 8081, host: 'localhost' } 
  })
).listen(8000);

connect.createServer(
  connect.favicon('assets/graphics/favicon.ico'),
  connect.static(__dirname+"/")
).listen(8081);