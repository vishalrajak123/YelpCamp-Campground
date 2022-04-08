const Campground = require('../models/campground');
const cloudinary=require('../cloudinary/index');
const mbxGeocoding=require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken=process.env.MAPBOX_TOKEN;
const geoCoder=mbxGeocoding({accessToken:mapBoxToken})





module.exports.index=async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campground/index', { campgrounds })
}

module.exports.renderNewForm=(req, res) => {
    res.render('campground/new');
}

module.exports.createCampground=async (req, res, next) => {
    const geoData=await geoCoder.forwardGeocode({
        query:req.body.campground.location,
        limit:1
    }).send()
    const campground = new Campground(req.body.campground);
    campground.geometry=geoData.body.features[0].geometry;
    campground.image=req.files.map(f=>({url:f.path, filename:f.filename}));
    campground.author= req.user._id;
    await campground.save();
    //console.log(campground);
    req.flash('success','Successfully made a new Campground!!!');
    res.redirect(`/campground/${campground._id}`)
}

module.exports.showCampground=async (req, res,) => {
    const campground = await Campground.findById(req.params.id).populate([{
        path:'reviews',
        populate:{
            path:'author'
        }
    }]).populate('author');
    
    if(!campground){
        req.flash('error','Cannot find the Campground');
        return res.redirect('/campground');
    }
    res.render('campground/show', { campground });
}

module.exports.renderEditForm=async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    if(!campground){
        req.flash('error','Cannot find the Campground');
        return res.redirect('/campground');
    }
    
    res.render('campground/edit', { campground });
}

module.exports.updateCampground=async (req, res) => {
    const { id } = req.params;
    //console.log(req.body);
    const geoData=await geoCoder.forwardGeocode({
        query:req.body.campground.location,
        limit:1
    }).send()
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    imgs=req.files.map(f=>({url:f.path, filename:f.filename}));
    campground.image.push(...imgs);
    campground.geometry=geoData.body.features[0].geometry;
    await campground.save();
    if(req.body.deleteImages){
        for (let filename of req.body.deleteImages){
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({$pull:{image:{filename:{$in: req.body.deleteImages}}}})
    }
    req.flash('success','Successfully Updated a Campground!!!');
    res.redirect(`/campground/${campground._id}`)
}

module.exports.deleteCampground=async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success','Deleted a Campground!!!');
    res.redirect('/campground');
}
