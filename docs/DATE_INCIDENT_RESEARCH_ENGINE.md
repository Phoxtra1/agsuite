# Date & Incident — Research Engine Deployment

## Runtime architecture

Date & Incident calls the existing Appwrite Function **agSuite** (\`69689f59003426b9e5e3\`) from the authenticated Amineva portal. The Gemini API key remains server-side in the Appwrite Function environment; it is never included in Vite/browser variables.

The function uses Gemini 2.5 Flash with Google Search grounding, plus date-index discovery leads from Wikipedia's On This Day endpoint and the Library of Congress API. Wikipedia and broad search indexes are discovery aids only. Event citations displayed in the portal are constructed from Gemini's returned Google Search grounding metadata, not URLs invented by the model.

## Required Appwrite function variables

Set this secret in the Appwrite Console under Functions → agSuite → Settings → Variables:

- \`GEMINI_API_KEY\` — Google AI Studio API key with Gemini API access.

Do not use a \`VITE_\` prefix and do not commit the key to Git.

## Function settings

- Function ID: \`69689f59003426b9e5e3\`
- Runtime: Node.js 18 or later (the gateway uses the Fetch API).
- Timeout: set to 60 seconds to allow web-grounded research to complete.
- Execution permission: authenticated users. The handler independently rejects requests without Appwrite's \`x-appwrite-user-id\` header.
- Keep the Gemini key scoped to this server-side function.

## Deploy

From the repository root, authenticate the Appwrite CLI against the self-hosted endpoint, then deploy the updated agSuite function using the project's configured function deployment. The source entrypoint is \`appwrite/functions/agsuite/src/main.js\`.

The repository contains the gateway source, but this code change does not itself deploy the function or configure Appwrite environment variables.

## Research quality controls

- African records are prioritised, with international records included.
- Prefer national archives, national libraries, official records, museums, universities, UNESCO and African regional institutions.
- Require a clear date basis for the event's occurrence; do not substitute an article's publication date.
- Use Google Search grounding metadata as the citation source list. Model-supplied arbitrary URLs are not accepted as citations.
- Label records as corroborated only when two or more grounded sources are attached; otherwise show single-source support. Preserve contested accounts and caveats.
- A source citation indicates that the source was retrieved for the claim; it is not a substitute for editorial review of the underlying document.

## Operational checks before public launch

1. Add \`GEMINI_API_KEY\` to the Appwrite function environment.
2. Confirm agSuite's deployed runtime and 60-second timeout.
3. Deploy the updated function.
4. Sign in to Amineva and search several known dates with African and international events.
5. Confirm source links open, event dates are occurrence dates, and disputed accounts carry caveats.
6. Monitor Appwrite execution logs and Gemini usage/costs.
