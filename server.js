//Dependencies

var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

//Require all models 
var db = require("./models");

var PORT = process.env.PORT || 8080;


//initialize express 
var app = express();

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(express.static("public"));

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database//
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

//GET route
app.get("/scrape", function(req,res){
    axios.get("https://www.nytimes.com/").then(function(response){
        var $ = cheerio.load(response.data);

        $("article h2").each(function(i, element){
            var result = {};

            result.title= $(this)
            .children("a")
            .text();
            result.link = $(this)
            .children("a")
            .attr("href");

            // create new article using th result from scraping

            db.Article.create(result)
                .then(function(dbArticle){
                    console.log(dbArticle);
                })
                .catch(function(err){
                    console.log(err);
                });

        });

        res.send("Scrape complete"); 
    });
});


//route to get the articles from the db

app.get("/articles", function(req,res){
    db.Article.find({})
    .then(function(dbArticle){
        res.json(dbArticle);
    })
    .catch(function(err){
        res.json(err);
    });
});

//route for specific Article by id with notes.
app.get("/articles/:id", function(req,res){
    db.Article.findOne({ _id: req.params.id})
    .populate("note")
    .then(function(dbArticle){
        res.json(dbArticle);
    })
    .catch(function(err){
        res.json(err);
    });
});

//route for saving and updating articles note
app.post("/articles/:id", function(req,res){
    db.Note.create(req.body)
    .then(function(dbNote){
        return db.Article.findOneAndUpdate({ _id: req.aparams.id }, {note: dbNote._id}, { new: true});
    })
    .then(function(dbArticle){
        res.json(dbArticle);
    })
    .catch(function(err){
        res.json(err);
    });
});


//route to get users comments

//start server 
app.listen(PORT, function(){
    console.log("App running on port " + PORT);
});
