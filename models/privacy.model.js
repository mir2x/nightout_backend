const mongoose = require("mongoose")

const privacySchema = new mongoose.Schema({
 
   privacy: {
        type: String,
        required: true,
        trim: true,
       
    }

});

const PrivacyModel = mongoose.model("privacy", privacySchema);
module.exports=PrivacyModel