import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Seed city
  const baku = await prisma.city.upsert({
    where: { id: "city_baku" },
    update: {},
    create: {
      id: "city_baku",
      name: "Bakı",
    },
  })
  console.log("Seeded city:", baku.name)

  // Seed categories
  const categories = [
    { key: "car_master", label: "Avtomobil ustası" },
    { key: "doctor", label: "Həkim" },
    { key: "dentist", label: "Diş həkimi" },
    { key: "nurse", label: "Tibb bacısı" },
    { key: "tutor", label: "Repetitor" },
    { key: "electrician", label: "Elektrik ustası" },
    { key: "plumber", label: "Santexnik" },
    { key: "repair_master", label: "Təmir ustası" },
    { key: "beauty", label: "Gözəllik / Salon" },
    { key: "lawyer", label: "Hüquqşünas" },
    { key: "babysitter", label: "Uşaq baxıcısı" },
    { key: "restaurant", label: "Restoran / Kafe" },
    { key: "vet", label: "Baytarlıq həkimi" },
    { key: "it_specialist", label: "Proqramçı / IT" },
    { key: "other", label: "Digər" },
  ]

  for (const cat of categories) {
    const result = await prisma.category.upsert({
      where: { key: cat.key },
      update: { label: cat.label },
      create: cat,
    })
    console.log("Seeded category:", result.label)
  }

  console.log("Seed completed successfully.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
