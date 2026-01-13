const Listing=require("../Models/listing");
const axios = require("axios");

module.exports.index=async(req,res)=>{
    const allListings=await Listing.find({});
    res.render("listings/index.ejs",{allListings});
    
};

module.exports.renderNewForm=(req,res)=>{
  res.render("listings/new.ejs");
}

module.exports.showListing=async(req,res)=>{
    let {id}=req.params;
    const listing= await Listing.findById(id)
    .populate({
    path:"reviews",
    populate:{
        path:"author"
    },
    })
    .populate("owner");
    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs",{listing});

}

module.exports.createListing=async(req,res)=>{
    let url=req.file.path;
    let filename=req.file.filename;
    const newlisting=new Listing( req.body.listing);
    newlisting.owner=req.user._id; 
    newlisting.image={url,filename};
    //Add only this part for (Geocoding)
     let place = req.body.listing.location;

    const geoResponse = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
    );

    if (geoResponse.data.length > 0) {
        const latitude = geoResponse.data[0].lat;
        const longitude = geoResponse.data[0].lon;

        // ✅ Verify in console
        console.log("Location:", place);
        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);

        // Save in existing geometry field
        newlisting.geometry = {
            type: "Point",
            coordinates: [longitude, latitude]  // correct order
        };
    }

    //All the above part is for (Geocoding)
    await newlisting.save();
    req.flash("success","New Listing Created!");
 res.redirect("/listings");
}

module.exports.renderEditForm=async(req,res)=>{
     let {id}=req.params;
    const listing= await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250")
    res.render("listings/edit.ejs",{listing,originalImageUrl});
}


module.exports.updateListing=async(req,res)=>{
   let {id}=req.params;
   let listing= await Listing.findByIdAndUpdate(id,{...req.body.listing});
   if(typeof req.file!=="undefined"){
    let url=req.file.path;
    let filename=req.file.filename;
    listing.image={url,filename}
    await listing.save();
   }
  req.flash("success","Listing Updated!");
  res.redirect(`/listings/${id}`);
}

module.exports.destroyListing=async(req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","New Listing Deleted!");
    res.redirect("/listings");
}