const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

// Route pour obtenir la liste des universités
exports.getUniversities = async (req, res) => {
  try {
      // Utiliser select pour ne récupérer que le champ nomUni
      const universities = await prisma.university.findMany({
          select: {
              nomUni: true,  
              idUni: true    
          }
      });
      res.json(universities);
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des universités' });
  }
};

// Récupérer les facultés
exports.getFaculties = async (req, res) => {
    try {
        const faculties = await prisma.faculty.findMany({
            where: { idUni: parseInt(req.query.universityId) },
            select: { idFaculty: true, nomFaculty: true }
        });
        res.json(faculties);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Récupérer les départements
exports.getDepartments = async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            where: { idFaculty: parseInt(req.query.facultyId) },
            select: { idDepart: true, nomDepart: true }
        });
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Récupérer les années académiques
exports.getAcademicYears = async (req, res) => {
    try {
        const years = await prisma.anneeUniversitaire.findMany({
            orderBy: { annee: 'desc' },
            select: { idAnnee: true, annee: true, isCurrent: true }
        });
        res.json(years);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upload de fichier CSV
exports.uploadFile = async (req, res) => {
    try {
        const { facultyId, departmentId, anneeId } = req.body;
        const etudiants = [];
        
        // Validation des IDs
        const faculty = facultyId ? await prisma.faculty.findUnique({ where: { idFaculty: parseInt(facultyId) } }) : null;
        const department = departmentId ? await prisma.department.findUnique({ where: { idDepart: parseInt(departmentId) } }) : null;
        const annee = await prisma.anneeUniversitaire.findUnique({ where: { idAnnee: parseInt(anneeId) } });
        if (!faculty || !department || !annee) {
            console.error("Erreur : certaines informations sont manquantes pour l'étudiant", row);
            return;
        }
        
        
        if (!annee) throw new Error("Année universitaire invalide");

        fs.createReadStream(path.join(__dirname, '../../uploads/', req.file.filename))
            .pipe(csv.parse({ headers: true }))
            .on('error', error => { throw error; })
            .on('data', (row) => {
                etudiants.push({
                    nom: row.nom,
                    prenom: row.prenom,
                    email: row.email,
                    matricule: row.matricule,
                    telephone: row.telephone,
                    dateNaissance: new Date(row.dateNaissance),
                    lieuNaissance: row.lieuNaissance,
                    cursus: {
                        section: row.section,
                        groupe: row.groupe,
                        filiere: row.filiere,
                        specialite: row.specialite,
                        niveau: parseInt(row.niveau),
                        moyenneAnnuelle: parseFloat(row.moyenneAnnuelle),
                        idFaculty: faculty.idFaculty ,
                        idDepart: department.idDepart ,
                        idAnnee: annee.idAnnee
                    }
                });
            })
            .on('end', async () => {
                try {
                    await prisma.$transaction(async (prisma) => {
                        for (const etudiant of etudiants) {
                            await prisma.etudiant.upsert({
                                where: { email: etudiant.email },
                                create: {
                                    ...etudiant,
                                    cursus: { create: etudiant.cursus }
                                },
                                update: {
                                    ...etudiant,
                                    cursus: {
                                        create: etudiant.cursus
                                    }
                                }
                            });
                        }
                    });

                    
                    // Suppression du fichier après l'importation
                    const filePath = path.join(__dirname, '../../uploads/', req.file.filename);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error("Erreur lors de la suppression du fichier:", err);
                        } else {
                            console.log("Fichier supprimé avec succès:", req.file.filename);
                        }
                    });
                    
                    res.json({
                        status: "ok",
                        filename: req.file.originalname,
                        message: "Upload réussi!",
                        count: etudiants.length
                    });
                } catch (error) {
                    console.error("Erreur Prisma:", error);
                    res.status(500).json({
                        status: "fail",
                        message: error.message
                    });
                }
            });
    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: error.message
        });
    }
};
