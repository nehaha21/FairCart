function getBiasScore(original, alternative) {
  if (!alternative || original === 0) {
    return { label: "Unknown" };
  }

  const diff = original - alternative;
  const percent = (diff / original) * 100;

  if (percent < 5) return { label: "Fair" };
  if (percent < 15) return { label: "Moderate" };
  return { label: "High" };
}

module.exports = getBiasScore;