import { prisma } from "@/lib/db"

export async function trackUserSignedUp(userId: string) {
  await prisma.analyticsEvent.create({
    data: { userId, name: "user_signed_up", properties: {} },
  })
}

export async function trackProfileCompleted(userId: string) {
  await prisma.analyticsEvent.create({
    data: { userId, name: "profile_completed", properties: {} },
  })
}

export async function trackConnectionInviteSent(userId: string) {
  await prisma.analyticsEvent.create({
    data: { userId, name: "connection_invite_sent", properties: {} },
  })
}

export async function trackConnectionInviteAccepted(userId: string) {
  await prisma.analyticsEvent.create({
    data: { userId, name: "connection_invite_accepted", properties: {} },
  })
}

export async function trackAskCreated(
  userId: string,
  props: {
    categoryId: string
    visibilityMode: string
    cityId?: string | null
    textLength: number
  }
) {
  await prisma.analyticsEvent.create({
    data: {
      userId,
      name: "ask_created",
      properties: props as object,
    },
  })
}

export async function trackAskViewed(userId: string, askId: string) {
  await prisma.analyticsEvent.create({
    data: { userId, name: "ask_viewed", properties: { askId } },
  })
}

export async function trackReplyStarted(userId: string, askId: string) {
  await prisma.analyticsEvent.create({
    data: { userId, name: "reply_started", properties: { askId } },
  })
}

export async function trackReplySubmitted(
  userId: string,
  askId: string,
  props: {
    hasPhone: boolean
    hasLink: boolean
    hasName: boolean
    hasNote: boolean
  }
) {
  await prisma.analyticsEvent.create({
    data: {
      userId,
      name: "reply_submitted",
      properties: { askId, ...props } as object,
    },
  })
}

export async function trackNotificationOpened(
  userId: string,
  notificationType: string
) {
  await prisma.analyticsEvent.create({
    data: {
      userId,
      name: "notification_opened",
      properties: { notificationType },
    },
  })
}

export async function trackReportSubmitted(userId: string) {
  await prisma.analyticsEvent.create({
    data: { userId, name: "report_submitted", properties: {} },
  })
}

export async function trackUserBlocked(userId: string) {
  await prisma.analyticsEvent.create({
    data: { userId, name: "user_blocked", properties: {} },
  })
}
