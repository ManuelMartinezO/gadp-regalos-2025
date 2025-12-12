const express = require('express');
const router = express.Router();
const Personal = require('../models/Personal');
const Juguete = require('../models/Juguete');

// Función auxiliar para obtener fecha local
function obtenerFechaLocal() {
  const ahora = new Date();
  const offsetMinutos = ahora.getTimezoneOffset();
  return new Date(ahora.getTime() - (offsetMinutos * 60 * 1000));
}

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
    const nuevoPersonal = new Personal({
      ...req.body,
      fecha_registro: obtenerFechaLocal()
    });
    await nuevoPersonal.save();
    res.redirect('/');
  } catch (error) {
    res.status(500).send('Error al registrar personal');
  }
});

// Registrar entrega de juguetes
router.post('/juguetes', async (req, res) => {
  try {
    const nuevoJuguete = new Juguete({
      ...req.body,
      fecha_entrega: obtenerFechaLocal()
    });
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

    // Si no hay fecha, usar hoy en zona horaria local
    if (!fecha) {
      fecha = obtenerFechaLocal().toISOString().split("T")[0];
    }

    // Rango de fecha filtrado (ajustado a zona horaria local)
    const inicio = new Date(fecha + "T00:00:00");
    const fin = new Date(fecha + "T23:59:59.999");

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

    // NUEVO: Obtener donaciones por donante (general)
    const donacionesPorDonante = await Juguete.aggregate([
      {
        $group: {
          _id: "$personal",
          totalJuguetes: { $sum: "$cantidad" }
        }
      },
      {
        $lookup: {
          from: "personals", // Nombre de la colección en MongoDB (plural)
          localField: "_id",
          foreignField: "_id",
          as: "donante"
        }
      },
      {
        $unwind: "$donante"
      },
      {
        $project: {
          nombre: "$donante.nombre",
          totalJuguetes: 1
        }
      },
      {
        $sort: { totalJuguetes: -1 } // Ordenar de mayor a menor
      }
    ]);

    // NUEVO: Obtener donaciones por donante filtradas por fecha
    const donacionesPorDonanteFecha = await Juguete.aggregate([
      { $match: { fecha_entrega: { $gte: inicio, $lte: fin } } },
      {
        $group: {
          _id: "$personal",
          totalJuguetes: { $sum: "$cantidad" }
        }
      },
      {
        $lookup: {
          from: "personals",
          localField: "_id",
          foreignField: "_id",
          as: "donante"
        }
      },
      {
        $unwind: "$donante"
      },
      {
        $project: {
          nombre: "$donante.nombre",
          totalJuguetes: 1
        }
      },
      {
        $sort: { totalJuguetes: -1 }
      }
    ]);

    res.render("estadisticas", {
      estadisticas,
      totalesGenerales,
      fechaSeleccionada: fecha,
      donacionesPorDonante,
      donacionesPorDonanteFecha
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar estadísticas");
  }
});


module.exports = router;