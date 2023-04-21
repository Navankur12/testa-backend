require("dotenv").config()
const router = require("express").Router();
const { getStateByCountry, getAllCitiesByState } = require("../controller/country-city-controller");
router.post('/getStates', getStateByCountry);
router.post('/getcities', getAllCitiesByState);
module.exports = router;