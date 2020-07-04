const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async');
const Bootcamp = require('../models/Bootcamp');
const geocoder = require('../utils/geocoder');

// @desc      Get all bootcamps
// @route     GET /api/v1/bootcamps
// @acces     Public 
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exlude
  const removeFields = ['select', 'sort'];

  // Loop over removeFields and delete them fom reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create opereators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
  query = Bootcamp.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBY = req.query.sort.split(',').join(' ');
    query = query.sort(sortBY);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Executing query
  const bootcamps = await query;

  res.status(200).json({ success: true, count: bootcamps.length, data: bootcamps });
});

// @desc      Get single bootcamp
// @route     GET /api/v1/bootcamps/:id
// @acces     Public 
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
      return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({ success: true, data: bootcamp });
});

// @desc      Create new bootcamp
// @route     POST /api/v1/bootcamps
// @acces     Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  
  const bootcamp = await Bootcamp.create(req.body);

  res.status(201).json({
    success: true,
    data: bootcamp
  });
});

// @desc      Update bootcamp
// @route     PUT /api/v1/bootcamps/:id
// @acces     Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!bootcamp) {
    return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({ success: true, data: bootcamp });
});

// @desc      Delete new bootcamp
// @route     DELETE /api/v1/bootcamps/:id
// @acces     Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);
  
  if (!bootcamp) {
    return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({ success: true, data: {} });
});

// @desc      Get bootcamp within radius
// @route     GET /api/v1/bootcamps/radius/:zipcode/:distance
// @acces     Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lang from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide dist by radius of Earth
  // Earth radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [ [ lng, lat ], radius ]}}
  });

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps
  });
});