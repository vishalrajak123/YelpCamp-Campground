if(process.env.NODE_ENV!=="production"){
    require("dotenv").config();
}


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session=require('express-session');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const flash=require('connect-flash');
const campgroundRoutes=require('./routes/campground');
const reviewRoutes=require('./routes/review');
const passport=require('passport');
const LocalStrategy=require('passport-local');
const User=require('./models/user');
const userRoutes=require('./routes/user');
const helmet=require('helmet');
const dbUrl=process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';


const MongoStore = require('connect-mongo');


mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify:false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static( path.join(__dirname, 'public')));
app.use(helmet({
    contentSecurityPolicy:false
}));

const sessionConfig={
    store:MongoStore.create({
        mongoUrl:dbUrl,
        secret:'Fuckitsasecret',
        touchAfter:24*3600
    }),
    secret: 'Fuckitsasecret',
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now()+(1000*7*24*60*60),
        maxAge:1000*7*24*60*60
    }
}
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.currentUser=req.user;
    res.locals.success=req.flash('success');
    res.locals.error=req.flash('error');
    next();
})



app.use('/',userRoutes);
app.use('/campground',campgroundRoutes);
app.use('/campground/:id/reviews',reviewRoutes);




app.get('/', (req, res) => {
    res.render('home')
});
app.get('/fakeuser',async (req,res)=>{
    const user=new User({email:'yash@gmail.com',username:'aashuvardhan'});
    const newUser=await User.register(user,'monkey');
    res.send(newUser);

})


app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

const port=process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})