// Adapted from the United Airlines gold enamel pin prompt used in Cursor GenerateImage.
const unitedGoldPinPrompt =
  'Professional product photograph of a collectible hard enamel lapel pin depicting the United Airlines aircraft tail fin. The pin shows United\'s modern globe livery: deep navy blue tail background with a crisp gold stylized globe made of curved latitude and longitude lines forming a subtle "U" shape. Rich metallic gold enamel fill for the globe design, lustrous and warm. Clean silver metal outline and raised borders between enamel color fields; glossy, smooth hard-enamel finish with subtle specular highlights on the gold enamel. Straight-on front view, perfectly flat and centered facing the camera, no rotation or tilt. Pin shown head-on on a soft neutral gray studio surface. Soft diffused lighting, shallow depth of field, macro product photography, ultra-sharp focus on enamel details, realistic metal texture, no text, no logo distortion, no aircraft body — tail fin design only, centered composition, premium airline merchandise aesthetic, photorealistic, 4K quality.';

const unitedLiverySentence =
  'The pin shows United\'s modern globe livery: deep navy blue tail background with a crisp gold stylized globe made of curved latitude and longitude lines forming a subtle "U" shape. Rich metallic gold enamel fill for the globe design, lustrous and warm.';

const genericGoldLiverySentence =
  'The pin shows the airline\'s tail livery from the reference tail photo, with accurate background colors and logo shape, rendered in crisp gold enamel. Rich metallic gold enamel fill for the logo design, lustrous and warm.';

export function buildTailpinPrompt(airlineName) {
  if (airlineName === 'United Airlines') {
    return unitedGoldPinPrompt;
  }

  return unitedGoldPinPrompt
    .replace('United Airlines', airlineName)
    .replace(unitedLiverySentence, genericGoldLiverySentence);
}

export { unitedGoldPinPrompt };
