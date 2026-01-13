if(process.env.NODE_ENV!="production"){
    require('dotenv').config();
}

const express=require("express");
const app= express();
const mongoose=require("mongoose");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/expressError.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./Models/user.js");

const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");


// const MONGO_URL="mongodb://127.0.0.1:27017/Livora";
const dbUrl=process.env.ATLASHDB_URL;

main().then(()=>{
    console.log("Connected to DB");
})
.catch((err)=>{
    console.log(err);
})
async function main(){
    await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
});

store.on("error", (err) => {
    console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now() + 7 * 24 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 1000,
        httpOnly:true,
    },
};
let port=8080;
// app.get("/",(req,res)=>{
//     res.send("Hi i am root");
// });

app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
res.locals.success=req.flash("success");
res.locals.error=req.flash("error");
res.locals.currUser=req.user;

next();
});


// app.get("/demouser",async(req,res)=>{
//     let fakeUser=new User({
//         email:"sagar@gmail.com",
//         username:"sagar_patel",
//     });
//    let registeredUser=await User.register(fakeUser,"helloworld");
//    res.send(registeredUser);
// });



//listings routes
app.use("/listings",listingRouter);
//reviews routes
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

// app.get("/testListing",async(req,res)=>{
//     let sampleListing=new Listing({
//         title:"My new Villa",
//         description:"By the beach",
//         price:1200,
//         location:"Calanggute Goa",
//         country:"India",
//     });

//    await sampleListing.save();
//    console.log("sample was save");
//    res.send("Successful testing");
// })


//if the incoming request does not match any route, forward 404
app.use((req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
})



//error handling middleware
app.use((err,req,res,next)=>{
   const {statusCode=500,message="something went wrong"}=err;
   res.status(statusCode).render("error.ejs",{message});
//    res.status(statusCode).send(message);
})


app.listen(port,()=>{
    console.log(`app is listening on ${port}`);
})
