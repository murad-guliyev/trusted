import { z } from "zod"
import { VisibilityMode, ReportTargetType, ModerationActionType } from "@prisma/client"

export const registerSchema = z.object({
  email: z.string().email("Düzgün e-poçt ünvanı daxil edin"),
  password: z.string().min(8, "Şifrə ən az 8 simvol olmalıdır"),
  displayName: z.string().min(1, "Ad Soyad tələb olunur").max(100, "Ad Soyad 100 simvoldan çox ola bilməz"),
})

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Ad Soyad tələb olunur")
    .max(100, "Ad Soyad 100 simvoldan çox ola bilməz"),
  cityId: z.string().optional(),
})

export const sendInviteSchema = z.object({
  recipientId: z.string().min(1, "Alıcı ID tələb olunur"),
})

export const createAskSchema = z
  .object({
    text: z
      .string()
      .min(10, "Sual ən az 10 simvol olmalıdır")
      .max(220, "Sual 220 simvoldan çox ola bilməz"),
    categoryId: z.string().min(1, "Kateqoriya seçin"),
    cityId: z.string().optional(),
    visibilityMode: z.nativeEnum(VisibilityMode),
    audienceIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.visibilityMode === VisibilityMode.SELECTED_CONNECTIONS) {
        return data.audienceIds && data.audienceIds.length > 0
      }
      return true
    },
    {
      message: "Seçilmiş əlaqələr rejimində ən az bir əlaqə seçilməlidir",
      path: ["audienceIds"],
    }
  )

export const createReplySchema = z
  .object({
    note: z.string().max(500, "Qeyd 500 simvoldan çox ola bilməz").optional(),
    recommendedName: z
      .string()
      .max(100, "Ad 100 simvoldan çox ola bilməz")
      .optional(),
    phone: z
      .string()
      .regex(/^[+\d\s\-()]{7,20}$/, "Düzgün telefon nömrəsi daxil edin")
      .optional()
      .or(z.literal("")),
    url: z.string().url("Düzgün link daxil edin").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      return (
        (data.note && data.note.length > 0) ||
        (data.recommendedName && data.recommendedName.length > 0) ||
        (data.phone && data.phone.length > 0) ||
        (data.url && data.url.length > 0)
      )
    },
    {
      message: "Ən az bir sahə doldurulmalıdır",
      path: ["note"],
    }
  )

export const submitReportSchema = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: z.string().min(1, "Hədəf ID tələb olunur"),
  reasonCode: z.enum(["spam", "harassment", "unsafe", "fraud", "privacy"], {
    errorMap: () => ({ message: "Düzgün səbəb seçin" }),
  }),
  note: z.string().max(300, "Qeyd 300 simvoldan çox ola bilməz").optional(),
})

export const resolveReportSchema = z.object({
  actionType: z.nativeEnum(ModerationActionType),
  actionNote: z
    .string()
    .max(300, "Qeyd 300 simvoldan çox ola bilməz")
    .optional(),
})
