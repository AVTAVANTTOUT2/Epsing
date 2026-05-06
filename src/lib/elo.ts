export const ELO_K_FACTOR = 32;

export function calculateElo(
  rating1: number,
  rating2: number,
  score1: number,
  score2: number
): { newRating1: number; newRating2: number; change1: number; change2: number } {
  let sa = 0.5; // Match nul
  if (score1 > score2) sa = 1; // Joueur 1 gagne
  else if (score1 < score2) sa = 0; // Joueur 2 gagne

  const ea = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
  
  const change1 = Math.round(ELO_K_FACTOR * (sa - ea));
  const change2 = -change1; // C'est un jeu à somme nulle

  return {
    newRating1: rating1 + change1,
    newRating2: rating2 + change2,
    change1,
    change2,
  };
}
