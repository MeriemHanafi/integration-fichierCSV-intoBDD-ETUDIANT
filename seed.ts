import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleData() {
  // 1. Création de l'Université
  const university = await prisma.university.create({
    data: {
      nomUni: "Université des Sciences et de la technologie Houari Boumedien",
      adresseUni: "Beb el Zouar..",
      telephoneUni: "+21369157200",
      emailUni: "contact@universite-usthb.fr",
    }
  });

  // 2. Création de 3 Facultés
  const faculties = await Promise.all([
    prisma.faculty.create({
      data: {
        nomFaculty: "Faculté des Sciences",
        idUni: university.idUni,
      }
    }),
    prisma.faculty.create({
      data: {
        nomFaculty: "Faculté des Lettres et des Sciences Humaines",
        idUni: university.idUni,
      }
    }),
    prisma.faculty.create({
      data: {
        nomFaculty: "Faculté des Sciences de l'Ingénieur",
        idUni: university.idUni,
      }
    })
  ]);

  // 3. Création de 2 départements distincts pour chaque faculté
  // Faculté des Sciences
  const faculty1Departments = [
    { nomDepart: "Département de Mathématiques" },
    { nomDepart: "Département de Physique" }
  ];

  // Faculté des Lettres et des Sciences Humaines
  const faculty2Departments = [
    { nomDepart: "Département de Philosophie" },
    { nomDepart: "Département d'Histoire" }
  ];

  // Faculté des Sciences de l'Ingénieur
  const faculty3Departments = [
    { nomDepart: "Département d'Informatique" },
    { nomDepart: "Département d'Électronique" }
  ];

  // Création des départements pour chaque faculté
  await Promise.all([
    ...faculty1Departments.map(department => 
      prisma.department.create({
        data: {
          nomDepart: department.nomDepart,
          idFaculty: faculties[0].idFaculty,
          idUni: university.idUni,
        }
      })
    ),
    ...faculty2Departments.map(department => 
      prisma.department.create({
        data: {
          nomDepart: department.nomDepart,
          idFaculty: faculties[1].idFaculty,
          idUni: university.idUni,
        }
      })
    ),
    ...faculty3Departments.map(department => 
      prisma.department.create({
        data: {
          nomDepart: department.nomDepart,
          idFaculty: faculties[2].idFaculty,
          idUni: university.idUni,
        }
      })
    )
  ]);

  console.log("Données créées avec succès:");
  console.log({ university, faculties });
}

createSampleData().catch(console.error);
