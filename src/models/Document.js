const mongoose = require("mongoose");

const Document = new mongoose.Schema(
    {
        title:{
            type: String,
            required: true,
        },
        documentType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doc-Type",
            required: true,
        },
        documnetBrief:{
            type: String,
            required: true,
            trim: true,
        },

       documentURL: {
            type: String,
            required: true,
        },
        documentUpload: {
            type: String,
            required: true,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
)
module.exports = mongoose.model("Document",Document);
