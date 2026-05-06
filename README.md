# LookLab

LookLab is an app concept where users upload a selfie and preview how they might look with different facial, beauty, skin, and cosmetic changes before making real-life decisions.

## Target Audience

Women ages 18-55 who want to safely explore beauty changes, cosmetic treatments, makeup looks, skin tone options, and facial adjustments before doing anything permanent or expensive.

## Main Idea

The user uploads a clear image of their face, chooses one beauty style, and generates one realistic AI preview first.

After that, she can generate more styles from the same uploaded image and build a visual gallery of looks.

The app should feel private, polished, simple, and trustworthy. It should help users explore options without pressure or judgment.

## Post-Upload Layout

After the user uploads her face, the app should generate at least 15-20 different predefined facial-change images.

The layout should follow the attached reference image:

- Dense masonry-style gallery
- Mixed tile sizes and aspect ratios
- Visual-first layout with minimal text
- Similar to a Pinterest board or beauty moodboard
- Each image tile shows one facial change applied to the uploaded face
- The original uploaded face should stay available for comparison
- The gallery should work well on desktop and mobile
- Short labels can be used for clarity, such as "Smaller Nose", "Foxy Eye", or "Lip Filler"

## Planned Features

- Upload a selfie
- Choose one beauty style first
- Generate one preview first, then generate more variations
- Show results in a masonry-style image gallery
- Download generated results
- Preview smaller nose
- Preview fuller lips
- Preview foxy eye lift
- Preview face lift
- Preview Botox-style smoothing
- Preview different skin tones
- Preview jawline contour
- Preview cheek filler
- Preview chin reshaping
- Preview brow lift
- Preview eyebrow reshaping
- Preview under-eye filler
- Preview teeth whitening
- Preview smile enhancement
- Preview acne smoothing
- Preview wrinkle reduction
- Preview hair color changes
- Preview makeup styles
- Preview facial slimming
- Compare before and after
- Save or download results

## Common Facial Cosmetic Procedures To Support

- Rhinoplasty / nose reshaping
- Revision rhinoplasty
- Facelift
- Mini facelift / partial facelift
- Deep plane facelift
- Neck lift
- Brow lift / forehead lift
- Upper eyelid surgery / upper blepharoplasty
- Lower eyelid surgery / lower blepharoplasty
- Double eyelid surgery
- Foxy eye lift / cat eye lift
- Chin augmentation / chin implant
- Chin reduction or reshaping
- Cheek augmentation / cheek implants
- Cheek filler
- Jawline contouring
- Jawline filler
- Facial fat grafting
- Buccal fat removal
- Lip augmentation / lip filler
- Lip lift
- Botox / neuromodulator wrinkle smoothing
- Forehead line smoothing
- Crow's feet smoothing
- Frown line smoothing
- Under-eye filler
- Tear trough correction
- Non-surgical nose filler / liquid rhinoplasty
- Skin resurfacing
- Chemical peel
- Laser skin treatment
- Microneedling
- Acne scar smoothing
- Skin tightening
- Otoplasty / ear reshaping

## Important Product Notes

This app should describe results as visual simulations only. It should not promise medical, surgery, or treatment outcomes.

Uploaded face images are sensitive. The MVP should avoid storing images unless the user clearly chooses to save them.

The first MVP should not require accounts or persistent storage.

## Tech Stack

- Framework: Next.js
- UI: React
- Styling: Tailwind CSS
- Image generation/editing: Gemini API with `gemini-3.1-flash-image-preview`
- Storage: none for the first MVP

## MVP Flow

1. User uploads a selfie.
2. User chooses one beauty style.
3. The app generates one AI-edited preview.
4. The preview appears on screen.
5. The user can download the image.
6. The user can generate more variations from the same uploaded photo.

## Development Commands

Create a `.env.local` file with your OpenRouter API key before running the app.

```bash
npm install

npm run dev

npm run build

npm run lint
```

## Environment Variables

```bash
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=google/gemini-3.1-flash-image-preview
```

## Status

MVP scaffold in progress.
