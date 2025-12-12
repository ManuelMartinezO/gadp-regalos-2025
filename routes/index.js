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
    let { fecha } = req.query;

    // Si no hay fecha, usar hoy
    if (!fecha) {
      fecha = new Date().toISOString().split("T")[0];
    }

    // Rango de fecha filtrado
    const inicio = new Date(fecha);
    inicio.setUTCHours(0, 0, 0, 0);
    const fin = new Date(fecha);
    fin.setUTCHours(23, 59, 59, 999);

    // Totales generales (sin filtrar por fecha)
    const totalesGeneralesAggr = await Juguete.aggregate([
      {
        $group: {
          _id: "$categoria",
          total: { $sum: "$cantidad" }
        }
      }
    ]);

    const totalesGenerales = { niño: 0, niña: 0, bebe: 0 };
    totalesGeneralesAggr.forEach(item => {
      totalesGenerales[item._id] = item.total;
    });

    // Totales filtrados por fecha
    const totalesFechaAggr = await Juguete.aggregate([
      { $match: { fecha_entrega: { $gte: inicio, $lte: fin } } },
      { $group: { _id: "$categoria", total: { $sum: "$cantidad" } } }
    ]);

    const estadisticas = { niño: 0, niña: 0, bebe: 0 };
    totalesFechaAggr.forEach(item => {
      estadisticas[item._id] = item.total;
    });

    res.render("estadisticas", {
      estadisticas,
      totalesGenerales,
      fechaSeleccionada: fecha
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar estadísticas");
  }
});


module.exports = router;