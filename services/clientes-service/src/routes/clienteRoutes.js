const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Un ID con formato inválido es un error del cliente (400), no un fallo interno
router.param('id', (req, res, next, id) => {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    return res.status(400).json({
      servicio: 'clientes-service',
      mensaje: `El ID '${id}' no tiene un formato válido`
    });
  }
  next();
});

router.get('/', clienteController.obtenerClientes);
router.get('/:id', clienteController.obtenerClientePorId);
router.post('/', clienteController.crearCliente);
router.put('/:id', clienteController.actualizarCliente);
router.delete('/:id', clienteController.eliminarCliente);

module.exports = router;
