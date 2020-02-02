
const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const objectId = require("mongodb").ObjectID; 

const app = express();
const jsonParser = express.json();

//const url = "mongodb://localhost:27017/";
const url = "mongodb+srv://alang:4031982oc@cluster0-tepdd.gcp.mongodb.net";
const mongoClient = new MongoClient(url, { useUnifiedTopology: true });

let dbClient;

// CONNECTION create
mongoClient.connect(function(err, client) {
    if(err) return console.log(err);

    dbClient = client;
    app.locals.collection = client.db("waybill").collection("waybilllist");
    app.listen(3000, function(err) {
        console.log("Сервер ожидает подключения...");
    })
})

app.options("/api/waybilllist", function(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS'); 
    response.setHeader('Content-Type', 'application/json');     
    response.send();
    console.log("Request OPTIONS from path /api/waybilllist");
})
app.options("/api/waybilllist/:id", function(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS'); 
    response.setHeader('Content-Type', 'application/json');     
    response.send();
    console.log("Request OPTIONS from path /api/waybilllist/:id");
})
// SELECT all
app.get("/api/waybilllist", function(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', '*');
    response.setHeader('Access-Control-Allow-Methods', '*');   
    console.log("Request GET all");
    const collection = request.app.locals.collection;
    collection.find().toArray( function(err, results) { 
        if(err) return console.log(err);       
        response.send(results);
    })
})

// SELECT by ID
app.get("/api/waybilllist/:id", function(request,response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', '*');
    response.setHeader('Access-Control-Allow-Methods', '*');   
    console.log("Request GET id");
    const collection = request.app.locals.collection;
    const incoming = new Incoming(request);

    if(incoming.notId()) return response.sendStatus(400);

    collection.findOne(incoming.id(), function(err, data) {
        if(err) return console.log(err);
        response.send(data);
    })
})

// INSERT. Expected json in request body
app.post("/api/waybilllist", jsonParser, function(request,response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', '*');
    response.setHeader('Access-Control-Allow-Methods', '*'); 
    console.log("Request POST");
    const incoming = new Incoming(request);
    const collection = request.app.locals.collection;

    if(incoming.noObject()) return response.sendStatus(400);
    
    collection.insertOne(incoming.object(), function(err, result) {
        if(err) return console.log(err);
        response.send(result);
    })
})

// UPDATE. Expected json in request body
app.put("/api/waybilllist", jsonParser, function(request,response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', '*');
    response.setHeader('Access-Control-Allow-Methods', '*'); 
    console.log("Request PUT");
    const incoming = new Incoming(request);    
    const collection = request.app.locals.collection;


    if(incoming.notId()) return response.sendStatus(400);    
    if(incoming.noObject()) return response.sendStatus(400);

    collection.findOneAndUpdate(incoming.id(), {$set: incoming.object()},
    {returnOriginal: false }, function(err, result) {
        if(err) return console.log(err);
        response.send(result.value);
    })
})

// DELETE
app.delete("/api/waybilllist/:id", function(request,response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');  
    response.setHeader('Content-Type', 'application/json');     
    console.log("Request DELETE item");
    const incoming = new Incoming(request);  
    const collection = request.app.locals.collection;

    if(incoming.notId()) return response.sendStatus(400);     
    console.log(incoming.id());
    
    collection.findOneAndDelete( incoming.id(), function(err, result) {
        if(err) return console.log(err);
        response.send(result.value);
    })
})

// HANDLE default url
app.get("/*+", function (request, response) {
    response.send("Не знаю такого адреса. (" + request.url + ")")
});

// прослушиваем прерывание работы программы (ctrl-c)
process.on("SIGINT", () => {
    dbClient.close();
    process.exit();
});


class Incoming {
    _request = null;
    
    constructor(request) {
        if(request) this._request = request;
    }
    id() {
        return { "_id": this.getObjectId() };
    }
    notId(){
        if(this.extractId() == null) return true;
        if(this.notObjectId()) return true;
        return false;
    }
    isId() {
        return !this.notId();
    }
    extractId(){
        if(this._request && this._request.params && this._request.params.id) return this._request.params.id;
        if(this._request && this._request.body && this._request.body._id)    return this._request.body._id;        
        return null;
    }
    getObjectId(){ 
        if(this.notObjectId()) return null;

        return new objectId(this.extractId()) 
    }
    notObjectId() {
        try{
            new objectId(this.extractId());
            return false
        }
        catch {
            return true;
        }
    }
    

    object() {
        var result = new Object();
        if(this.isId()) result._id = this.getObjectId();
        for (var key in this._request.body) {
            if(key!="_id") result[key] = this._request.body[key];
        }
        return result;
    }
    noObject() {
        if(!this._request) return true;
        if(!this._request.body) return true;
        var countKeys = 0;
        for (var key in this._request.body) {
            countKeys = countKeys + 1;
        }
        if(countKeys == 0) return true;
        return false;
    }
}