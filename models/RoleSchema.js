const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const Role = mongoose.model("role", roleSchema)
module.exports =  Role;