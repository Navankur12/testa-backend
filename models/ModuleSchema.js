const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema({
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "role",
    },
    moduleName: {
        type: String,
        required: true,
    },
    permissions: {
        read: {
            type: Boolean,
            default: false,
        },
        write: {
            type: Boolean,
            default: false,
        },
        edit: {
            type: Boolean,
            default: false,
        },
        delete: {
            type: Boolean,
            default: false,
        },
    }
},{timestamps:true});


module.exports = mongoose.model("module", moduleSchema) 