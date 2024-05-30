const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const SomeExtraFieldSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    option: [String] // Assuming options are strings
});

const categorySchema = new mongoose.Schema(
    {
       
        categoryName: {
            type: String,
            required: true,
            trim: true,
            
        },
        categoryImage: {
            type: String,
            required: false,


        },

        someExtraField:[SomeExtraFieldSchema],

    //    someExtraField: {
    //         type: mongoose.Schema.Types.Mixed
    //     }
       
    },
    { timestamps: true }
);

const Category= mongoose.model("Category", categorySchema);
module.exports = Category;