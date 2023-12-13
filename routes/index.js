
var express = require('express');
var router = express.Router();

/* GET index page. */

router.get('/', function (req, res, next) {
  res.render('index', { title: 'Group 4' });
});

/* GET home page. */
router.get('/home', function (req, res, next) {
  res.render('home', { title: 'Home' });
});

/* GET about page. */
router.get('/about', function (req, res, next) {
  res.render('about', { title: 'About' });
});



/* GET Cart page. */
router.get('/cart', function (req, res, next) {
  res.render('cart', { title: 'Cart' });
});

/* GET home page. */
router.get('/list', function (req, res, next) {
  res.render('list', { title: 'List' });
});


/* GET UpdateProductdescription page. */  //areebah1
router.get('/updatedescription2', function (req, res, next) {
  res.render('updatedescription2', { title: 'updatedescription' });
});

/* GET UpdateOrderStatus page. */  //maan
router.get('/updateorderstatus', function (req, res, next) {
  res.render('updateorderstatus', { title: 'updateorderstatus' });
});

/* GET showproductstatetax page. */  //maan
router.get('/showproductstatetax', function (req, res, next) {
  res.render('showproductstatetax', { title: 'showproductstatetax' });
});

/* Get Create new product page. Noor*/
router.get('/create-product', function (req, res, next) {
  res.render('createProduct', { title: 'createProduct' });
});
/* Get Create new product page. Noor*/
router.get('/addtocart', function (req, res, next) {
  res.render('addtocart', { title: 'Add to Basket' });
});
router.get('/getproductsalesinfo', function (req, res, next) {
  res.render('getproductsalesinfo', { title: 'Sale Status' });
});

// reports routes
router.get('/checkstock', function (req, res, next) {
  res.render('checkstock', { title: 'checkstock' });
});

router.get('/calcspending', function (req, res, next) {
  res.render('calcspending', { title: 'Calculate Total Spending' });
});
module.exports = router;