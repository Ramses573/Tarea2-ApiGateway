const express = require('express');
const router = express.Router();
const ordenController = require('../controllers/ordenController');

// Un ID con formato inválido es un error del cliente (400), no un fallo interno
router.param('id', (req, res, next, id) => {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({
      servicio: 'ordenes-service',
      mensaje: `El ID '${id}' no tiene un formato válido`
    });
  }
  next();
});

router.get('/', ordenController.obtenerOrdenes);
router.get('/:id', ordenController.obtenerOrdenPorId);
router.post('/', ordenController.crearOrden);
router.put('/:id/estado', ordenController.actualizarEstado);
router.delete('/:id', ordenController.cancelarOrden);

module.exports = router;
