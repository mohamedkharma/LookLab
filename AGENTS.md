# AGENTS.md

## Project Overview
- **Project:** LookLab  an app where users upload a selfie and preview realistic facial and beauty changes before making real cosmetic, skincare, makeup, or aesthetic decisions.
- **Target user:** women ages 18-55 who want to explore facial changes, beauty treatments, makeup styles, and skin tone options before doing them in real life.
- **My skill level:** beginner
- **Stack:** Next.js, React, Tailwind CSS, Gemini API (`gemini-3.1-flash-image-preview`)

## Product Goals
- Let users upload a clear photo of their face.
- Show realistic AI-generated previews.
- Let the user choose one beauty style first, then generate one preview.
- After the first preview, allow the user to generate more predefined variations from the same selfie.
- Support common beauty, cosmetic, and facial-change previews.
- Keep the experience simple, private, and easy to understand.
- Avoid making medical claims or promising real treatment results.

## Post-Upload Layout Direction
- Use the attached reference image as layout inspiration.
- After the user uploads her face, show a dense masonry-style image gallery.
- The gallery should feel like a visual moodboard or Pinterest board.
- Use mixed image sizes and aspect ratios instead of identical cards.
- Show at least 15-20 generated variations at once when possible.
- Each tile should be one predefined change applied to the uploaded face.
- Keep the original uploaded image available for comparison.
- Make the gallery easy to scan on desktop and mobile.
- Avoid heavy text on the gallery screen. Let the images lead.
- Add short labels only when useful, such as "Smaller Nose" or "Brow Lift".

## Core Features
- Selfie upload
- Automatic generation of 15-20 facial-change preview images
- Masonry-style generated-results gallery
- Before-and-after comparison
- Smaller nose preview
- Fuller lips preview
- Foxy eye lift preview
- Face lift preview
- Botox-style smoothing preview
- Skin tone preview
- Jawline contour preview
- Cheek filler preview
- Chin shape preview
- Brow lift preview
- Eyebrow shape preview
- Under-eye filler preview
- Teeth whitening preview
- Smile enhancement preview
- Acne smoothing preview
- Wrinkle reduction preview
- Hair color preview
- Makeup style preview
- Facial slimming preview

## Commands
- **Install:** `npm install`
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Test:** [not added yet]
- **Lint:** `npm run lint`

## Do
- Read existing code before modifying anything
- Match existing patterns, naming, and style
- Handle errors gracefully  no silent failures
- Keep changes small and scoped to what was asked
- Run dev/build after changes to verify nothing broke
- Ask clarifying questions before guessing
- Design for women ages 18-55 with a clean, polished, trustworthy feel
- Treat uploaded face images as private and sensitive
- Be clear that previews are simulations, not medical results
- Let users download generated results without requiring accounts
- Keep the first MVP stateless  no persistent storage

## Don't
- Install new dependencies without asking
- Delete or overwrite files without confirming
- Hardcode secrets, API keys, or credentials
- Rewrite working code unless explicitly asked
- Push, deploy, or force-push without permission
- Make changes outside the scope of the request
- Store uploaded face images unless the user clearly asks for saving
- Use language that pressures users to change their appearance
- Make medical, surgery, or treatment guarantees
- Add authentication or database storage to the MVP unless asked

## When Stuck
- If a task is large, break it into steps and confirm the plan first
- If you can't fix an error in 2 attempts, stop and explain the issue

## Testing
- Run existing tests after any change
- Add at least one test for new features
- Never skip or delete tests to make things pass
- Test image upload with valid, invalid, large, and missing files
- Test mobile layouts carefully because many users will upload selfies from phones
- Test the first-preview flow before adding multi-image generation

## Git
- Small, focused commits with descriptive messages
- Never force push

## Response Style
- always respond with clear & concise messages
- use plain English when explaining to the User
- avoid long sentences, complex words, or long paragraphs
