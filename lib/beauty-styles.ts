export type BeautyStyle = {
  id: string;
  label: string;
  shortLabel: string;
  category: "Shape" | "Eyes" | "Skin" | "Finish";
  prompt: string;
};

export const BEAUTY_STYLES: BeautyStyle[] = [
  {
    id: "smaller-nose",
    label: "Smaller Nose",
    shortLabel: "Nose",
    category: "Shape",
    prompt: "Refine the nose into a smaller, elegant, natural-looking shape.",
  },
  {
    id: "fuller-lips",
    label: "Fuller Lips",
    shortLabel: "Lips",
    category: "Shape",
    prompt: "Create naturally fuller lips with balanced volume and soft definition.",
  },
  {
    id: "foxy-eye-lift",
    label: "Foxy Eye Lift",
    shortLabel: "Foxy Eye",
    category: "Eyes",
    prompt: "Lift the outer eye area subtly for a foxy-eye effect while preserving identity.",
  },
  {
    id: "soft-facelift",
    label: "Soft Facelift",
    shortLabel: "Facelift",
    category: "Shape",
    prompt: "Create a subtle facelift effect with smoother contours and gentle lift.",
  },
  {
    id: "botox-smoothing",
    label: "Botox Smoothing",
    shortLabel: "Botox",
    category: "Skin",
    prompt: "Smooth forehead and expression lines for a soft botox-inspired finish.",
  },
  {
    id: "warmer-skin-tone",
    label: "Warmer Skin Tone",
    shortLabel: "Warm Tone",
    category: "Finish",
    prompt: "Shift the skin tone slightly warmer in a flattering, realistic way.",
  },
  {
    id: "jawline-contour",
    label: "Jawline Contour",
    shortLabel: "Jawline",
    category: "Shape",
    prompt: "Define the jawline with a cleaner, more sculpted contour.",
  },
  {
    id: "cheek-filler",
    label: "Cheek Filler",
    shortLabel: "Cheeks",
    category: "Shape",
    prompt: "Add soft cheek volume for a lifted, balanced mid-face look.",
  },
  {
    id: "chin-refine",
    label: "Chin Shape Refinement",
    shortLabel: "Chin",
    category: "Shape",
    prompt: "Refine the chin for a balanced, elegant profile and front view.",
  },
  {
    id: "brow-lift",
    label: "Brow Lift",
    shortLabel: "Brows",
    category: "Eyes",
    prompt: "Lift and shape the brows slightly for a fresher, open-eye look.",
  },
  {
    id: "under-eye-filler",
    label: "Under-Eye Filler",
    shortLabel: "Under-Eye",
    category: "Eyes",
    prompt: "Reduce under-eye hollowness with a subtle tear-trough filler effect.",
  },
  {
    id: "facial-slimming",
    label: "Facial Slimming",
    shortLabel: "Slimming",
    category: "Shape",
    prompt: "Slim the face slightly while keeping the same person and proportions believable.",
  },
  {
    id: "acne-smoothing",
    label: "Acne Smoothing",
    shortLabel: "Acne",
    category: "Skin",
    prompt: "Smooth visible acne and texture while keeping skin realistic and human.",
  },
  {
    id: "wrinkle-reduction",
    label: "Wrinkle Reduction",
    shortLabel: "Wrinkles",
    category: "Skin",
    prompt: "Reduce visible fine lines and wrinkles while preserving natural texture.",
  },
  {
    id: "glass-skin-finish",
    label: "Glass Skin Finish",
    shortLabel: "Glass Skin",
    category: "Skin",
    prompt: "Create a hydrated, luminous glass-skin finish with realistic detail.",
  },
  {
    id: "teeth-whitening",
    label: "Teeth Whitening",
    shortLabel: "Teeth",
    category: "Finish",
    prompt: "Brighten the teeth naturally without making them unnaturally white.",
  },
  {
    id: "soft-glam-makeup",
    label: "Soft Glam Makeup",
    shortLabel: "Soft Glam",
    category: "Finish",
    prompt: "Apply polished soft-glam makeup that suits the face and lighting.",
  },
  {
    id: "lip-liner-shape",
    label: "Lip Liner Shape",
    shortLabel: "Lip Line",
    category: "Finish",
    prompt: "Define the lip border and cupid's bow with a subtle liner effect.",
  },
  {
    id: "nose-filler-bridge",
    label: "Nose Bridge Refinement",
    shortLabel: "Nose Lift",
    category: "Shape",
    prompt: "Refine and lift the nose bridge subtly with a non-surgical look.",
  },
  {
    id: "neck-lift",
    label: "Neck Lift",
    shortLabel: "Neck",
    category: "Shape",
    prompt: "Tighten and smooth the neck area subtly for a refreshed look.",
  },
];

export function getBeautyStyle(styleId: string) {
  return BEAUTY_STYLES.find((style) => style.id === styleId);
}
