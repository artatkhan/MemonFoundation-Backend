const mongoose = require("mongoose");

const DocumentTypeSchema = new mongoose.Schema(
    {
        documentType: {
            type: String,
            required: true,

        },
        documentAbbreviation: {
            type: String,
            required: true,
        },
        description: {
            type: String,

        },

    },
     { timestamps: true }
);
module.exports = mongoose.model("Doc-Type", DocumentTypeSchema);


