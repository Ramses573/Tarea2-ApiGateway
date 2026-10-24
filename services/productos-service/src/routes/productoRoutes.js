const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// Un ID con formato inválido es un error del cliente (400), no un fallo interno
router.param('id', (req, res, next, id) => {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({
      servicio: 'productos-service',
      mensaje: `El ID '${id}' no tiene un formato válido`
    });
  }
  next();
});

router.get('/', productoController.obtenerProductos);
router.get('/:id', productoController.obtenerProductoPorId);
router.post('/', productoController.crearProducto);
router.put('/:id', productoController.actualizarProducto);
router.delete('/:id', productoController.eliminarProducto);
router.patch('/:id/descontar-stock', productoController.descontarStock);
router.patch('/:id/reponer-stock', productoController.reponerStock);

module.exports = router;
