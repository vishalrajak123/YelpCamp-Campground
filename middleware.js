const { campgroundSchema,reviewSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const Review=require('./models/review');
const Campground = require('./models/campground');

module.exports.isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.returnTo=req.originalUrl;
        req.flash('error','You must be Signed In');
        return res.redirect('/login');
    }
    next();
}

module.exports.validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}
module.exports.isAuthor= async (req,res,next)=>{
    const { id } = req.params;
    const campground= await Campground.findById(id);
    if(!campground.author.equals(req.user._id)){
        req.flash('error','You do not have permissions to update');
        return res.redirect(`/campground/${campground._id}`)
    }
    next();
}

module.exports.isReviewAuthor= async (req,res,next)=>{
    const { id,reviewId } = req.params;
    const review= await Review.findById(reviewId);
    if(!review.author.equals(req.user._id)){
        req.flash('error','You do not have permissions to delete');
        return res.redirect(`/campground/${id}`)
    }
    next();
}

module.exports.validateReview=(req,res,next)=>{
    const {error}=reviewSchema.validate(req.body) ;
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}