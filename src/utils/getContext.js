/**
 * Time and contextual state utility
 */

export function getContext() {
  const hour = new Date().getHours()

  return {
    hour,
    isMorning: hour >= 6 && hour < 12,
    isAfternoon: hour >= 12 && hour < 18,
    isEvening: hour >= 18 && hour < 22,
    isNight: hour >= 22 || hour < 6,
    isWorkHours: hour >= 9 && hour < 17,
  }
}
