const db = require('../database/models');
const fs = require('fs');
const path = require('path');
const getDataDB = require('../utils/getDataDB');
const { validationResult } = require('express-validator');
const { Product, Color, Size, Carrito } = db;

// const filePathProductos = '../data/productos.json';
const filePathProductosCarrito = '../data/productos_carrito.json';
/* Analisas Productos */

// function allProducts() {
//   const jsonData = fs.readFileSync(path.join(__dirname, '../data/productos.json'));
//   const data = JSON.parse(jsonData);
//   return data;
// };

/* escribir en JSON con un filePath */
function writeJson(data, filePath) {
  const JsonData = JSON.stringify(data, null, 6);
  fs.writeFileSync(path.join(__dirname, filePath), JsonData);
};

/* Analisis Carro */

function allProductsCarrito() {
  const jsonData = fs.readFileSync(path.join(__dirname, '../data/productos_carrito.json'));
  const data = JSON.parse(jsonData);
  return data;
};

const dbProductsController = {
  getCreateProduct: async(req, res) => {
    const responseColors = await Color.findAll();
    const colors = getDataDB(responseColors);

    const responseSize = await Size.findAll();
    const sizes = getDataDB(responseSize);

    res.render('crear-producto', { colors, sizes });
  },
  postCreateProduct: async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // si tenemos errores, los mostramos en pantalla.
      const response = await Color.findAll();
      const colors = getDataDB(response);
      const responseSize = await Size.findAll();
      const sizes = getDataDB(responseSize);

      res.render('crear-producto', { errors: errors.mapped(), old: req.body, colors, sizes });
    } else {
      Product.create({
        name: req.body.titulo,
        description: req.body.descripcion,
        price: req.body.precio,
        image: '/images/productos/' + req.file.filename,
        color_id: Number(req.body.color),
        size_id: Number(req.body.size)
      }).then(() => {
        res.redirect('/tienda');
      }).catch(error => res.send(error));
    }
  },
  getEditProduct: async(req, res) => {
    const productId = req.params.id;

    const responseColors = await Color.findAll();
    const colors = getDataDB(responseColors);
    
    const responseSize = await Size.findAll();
    const sizes = getDataDB(responseSize);
    
    Product.findByPk(productId)
      .then((product) => {
        res.render('editar-producto', { producto: product, colors, sizes });
      }).catch(error => res.send(error));
  },
  putEditProduct: (req, res) => {
    const productId = req.params.id;
    Product.update({
      name: req.body.titulo,
      description: req.body.descripcion,
      price: req.body.precio,
      image: req.body.imagen
    }, {
      where: {
        id: productId
      }
    }).then(() => {
      res.redirect('/');
    }).catch(error => res.send(error));
  },
  delete: function (req, res) {
    const productId = req.params.id;
    Product.findByPk(productId)
      .then((product) => {
        res.render('productDelete', { producto: product });
      }).catch(error => res.send(error));
  },
  destroy: (req, res) => {
    const productId = req.params.id;
    Product.destroy({
      where: { id: productId }, force: true
    })
      .then(() => {
        return res.redirect('/');
      }).catch(error => res.send(error));
  },
  getProductById: function (req, res) {
    const productId = req.params.id;
    Product.findByPk(productId)
      .then((product) => {
        res.render('detalle-producto', { producto: product });
      }).catch(error => res.send(error));

    /*
        const data = allProducts();
        const productoEncontrado = data.find(producto => {
          return producto.id == req.params.id;
        });
        res.render('detalle-producto', { producto: productoEncontrado }); */
  },
  postCarrito: async(req, res) => {
    const { params, body } = req;
    const response = await Carrito.findAll({
      where: {
        user_id: res.locals.usuario.id
      }
    });
    const productsCarrito = getDataDB(response);

    const existedProduct = productsCarrito.find((productCarrito) => {
      return productCarrito.product_id == params.id;
    });
    if (existedProduct) { // Productos existe en el carrito del usuario
      Carrito.update({
        quantity: existedProduct.quantity + Number(body.quantity),
        total: existedProduct.total + (body.price * body.quantity)
      },
      {
        where: {
          id: existedProduct.id
        }
      }).then(() => {
        res.redirect('/products/carrito');
      }).catch(error => { res.send(error); });
    } else { // Producto no existe en el carrito del usuario
      Carrito.create({
        product_id: params.id,
        quantity: body.quantity,
        total: body.quantity * body.price,
        user_id: res.locals.usuario.id
      }).then(() => {
        res.redirect('/products/carrito');
      }).catch(error => { res.send(error); });
    }
  },
  deleteProductCarrito: function (req, res) {
    const id = req.params.id;
    const data = allProductsCarrito();

    const sinCarritoEliminado = data.filter((productoCarrito) => {
      return productoCarrito.id != id;
    });
    writeJson(sinCarritoEliminado, filePathProductosCarrito);
    res.redirect('/products/carrito');
  },
  getCarrito: async (req, res) => {
    const response = await Carrito.findAll({
      include: [
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: Size,
              as: 'size'
            },
            {
              model: Color,
              as: 'color'
            }
          ]
        }
      ],
      where: {
        user_id: res.locals.usuario.id
      }
    });
    const productsCarritoResponse = getDataDB(response);

    const productsCarrito = productsCarritoResponse.map((productCarritoResponse) => {
      return {
        name: productCarritoResponse.product.name,
        price: productCarritoResponse.product.price,
        color: productCarritoResponse.product.color.name,
        image: productCarritoResponse.product.image,
        quantity: productCarritoResponse.quantity,
        total: productCarritoResponse.total,
        size: productCarritoResponse.product.size.size
      };
    });
    res.render('carrito', { productsCarrito });
  }
};
module.exports = dbProductsController;
