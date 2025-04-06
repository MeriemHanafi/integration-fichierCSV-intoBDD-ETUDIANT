const express = require('express');
const router = express.Router();
const upload = require('../config/multer.config.js');
const csvController = require('../controllers/csv.controller.js'); // Assurez-vous que le chemin est correct

// Route pour la page d'accueil
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

// Routes API
router.get('/api/universities', csvController.getUniversities);
router.get('/api/faculties', csvController.getFaculties); // Vérifiez que getFaculties existe dans le contrôleur
router.get('/api/departments', csvController.getDepartments); // Vérifiez que getDepartments existe
router.get('/api/academicYears', csvController.getAcademicYears); // Vérifiez que getAcademicYears existe

router.post('/api/file/upload', upload.single("file"), csvController.uploadFile);


module.exports = router;

