const express = require('express');
const router = express.Router();
const ordenController = require('../controllers/ordenController');

router.get('/', ordenController.obtenerOrdenes);
router.get('/:id', ordenController.obtenerOrdenPorId);
router.post('/', ordenController.crearOrden);
router.put('/:id/estado', ordenController.actualizarEstado);
router.delete('/:id', ordenController.cancelarOrden);

module.exports = router;
