const express = require('express');
const router = express.Router();
const Personal = require('../models/Personal');
const Juguete = require('../models/Juguete');

// Página principal con formulario
router.get('/', async (req, res) => {
  try {
    const personal = await Personal.find();
    res.render('index', { personal });
  } catch (error) {
    res.status(500).send('Error al cargar la página');
  }
});

// Registrar personal
router.post('/personal', async (req, res) => {
  try {
    const nuevoPersonal = new Personal(req.body);
    await nuevoPersonal.save();
    res.redirect('/');
  } catch (error) {
    res.status(500).send('Error al registrar personal');
  }
});

// Registrar entrega de juguetes
router.post('/juguetes', async (req, res) => {
  try {
    const nuevoJuguete = new Juguete(req.body);
    await nuevoJuguete.save();
    res.redirect('/estadisticas');
  } catch (error) {
    res.status(500).send('Error al registrar juguete');
  }
});

// Ver estadísticas
router.get('/estadisticas', async (req, res) => {
  try {
    const juguetes = await Juguete.find().populate('personal');
    
    // Calcular totales por categoría
    const totales = await Juguete.aggregate([
      {
        $group: {
          _id: '$categoria',
          total: { $sum: '$cantidad' }
        }
      }
    ]);
    
    const estadisticas = {
      niño: 0,
      niña: 0,
      bebe: 0
    };
    
    totales.forEach(item => {
      estadisticas[item._id] = item.total;
    });
    
    res.render('estadisticas', { juguetes, estadisticas });
  } catch (error) {
    res.status(500).send('Error al cargar estadísticas');
  }
});

module.exports = router;