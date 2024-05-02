const mongoose = require("mongoose")

const aboutUsSchema = new mongoose.Schema({
 
    aboutUs: {
        type: String,
        required: true,
        trim: true,
       
    }

});

const AboutUs = mongoose.model("aboutus", aboutUsSchema);
module.exports=AboutUs