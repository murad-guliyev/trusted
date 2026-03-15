export function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 6) {
    return new Date(date).toLocaleDateString("az-AZ", {
      day: "numeric",
      month: "short",
    })
  } else if (days > 0) {
    return `${days} gün əvvəl`
  } else if (hours > 0) {
    return `${hours} saat əvvəl`
  } else if (minutes > 0) {
    return `${minutes} dəq əvvəl`
  } else {
    return "İndicə"
  }
}

export function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date()
  const diff = new Date(expiresAt).getTime() - now.getTime()

  if (diff <= 0) return "Müddəti bitib"

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} gün qalıb`
  } else if (hours > 0) {
    return `${hours} saat qalıb`
  } else {
    const minutes = Math.floor(diff / (1000 * 60))
    return `${minutes} dəq qalıb`
  }
}
