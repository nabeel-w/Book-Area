require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const fetch= require("node-fetch");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy=require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: 'very very secret',
    resave: false,
    saveUninitialized: false
  }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/usersDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    userId: String,
    AvatarImg: String,
    booklist: Array
  });
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done)=> {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id).then(function(user,err) {
      done(err,user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/home",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(profile);

    User.findOrCreate({ userId: profile.id, AvatarImg: profile.photos[0].value}, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FCLIENT_ID,
    clientSecret: process.env.FCLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/home"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ userId: profile.id ,AvatarImg:"https://img.freepik.com/free-icon/user_318-159711.jpg"}, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/login",(req,res)=>{
    res.render("login");
});
app.get("/signup",(req,res)=>{
    res.render("signup");
})
app.get("/",(req,res)=>{
    if(req.isAuthenticated()){
        console.log(req.user.booklist);
        res.render("home",{AvatarImg:req.user.AvatarImg,BookList:req.user.booklist});
    }else{
        res.redirect("/login");
    }
})
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);
app.get("/auth/google/home",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/");
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/home',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
app.get("/logout", function(req, res,next){
    req.logout(function(err) {
        if (err) { return next(err);}});
    res.redirect("/");
  });
app.get("/books/:id",(req,res)=>{
  let id=req.params.id;
  let url=`https://www.googleapis.com/books/v1/volumes/${id}?key=${process.env.API_KEY}`;
  fetch(url)
  .then(response=> response.json())
  .then(data=>{
    //console.log(data.volumeInfo.imageLinks);
    const Book={
      imgURL: data.volumeInfo.imageLinks.thumbnail,
      title: data.volumeInfo.title,
      author: data.volumeInfo.authors[0],
      description: data.volumeInfo.description,
      pages: data.volumeInfo.pageCount,
      date: data.volumeInfo.publishedDate,
      rating: data.volumeInfo.averageRating
    };
    //console.log(Book);
    res.render("book",{
      imgURL:Book.imgURL,
      title: Book.title,
      date: Book.date,
      description: Book.description,
      pages: Book.pages,
      author: Book.author,
      rating: Book.rating,
      id: id
    });
  })
  .catch(err=>{
    console.log(err);
  })
})
app.post("/addbook/:id",(req,res)=>{
  let id=req.params.id;
  if(req.isAuthenticated()){
    let found= req.user.booklist.find(element=>{
      return element===id;
    });
    if(found){
      res.redirect("/");
    }
    else{
      req.user.booklist.push(id);
    //console.log(req.user);
    User.findOne({_id:req.user._id})
    .then(result=>{
      result.booklist=req.user.booklist;
      result.save();
      res.redirect("/");
    }).catch(err=>{
      console.log(err);
    })
    }
  }
})
app.post("/login",(req,res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });
    req.login(user,(err)=>{
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/")
            });
        }
    })
});

app.post("/signup",(req,res)=>{
    User.register({username: req.body.username,AvatarImg:"https://img.freepik.com/free-icon/user_318-159711.jpg"}, req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/signup")
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/")
            })
        }
    })
});

app.listen(3000, ()=> {
    console.log("Server started on port 3000.");
  });