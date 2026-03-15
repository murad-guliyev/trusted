import { prisma } from "@/lib/db"

export async function createNewReplyNotification(
  askAuthorId: string,
  askId: string,
  replyId: string
) {
  await prisma.notification.create({
    data: {
      recipientId: askAuthorId,
      type: "NEW_REPLY",
      subjectType: "reply",
      subjectId: replyId,
    },
  })
}

export async function createConnectionInviteNotification(
  recipientId: string,
  inviteId: string
) {
  await prisma.notification.create({
    data: {
      recipientId,
      type: "CONNECTION_INVITE",
      subjectType: "invite",
      subjectId: inviteId,
    },
  })
}

export async function createInviteAcceptedNotification(
  senderId: string,
  inviteId: string
) {
  await prisma.notification.create({
    data: {
      recipientId: senderId,
      type: "INVITE_ACCEPTED",
      subjectType: "invite",
      subjectId: inviteId,
    },
  })
}
