Plan frontend feature: Assistant Rich Response Rendering + Discoverability

Goal:
Transform /assistant from a developer-style text interface into a user-friendly commerce assistant experience while keeping the existing backend contract unchanged.

Backend context:
- Endpoint: POST /api/assistant/query
- Current contract:
  {
    "question": "..."
  }

  Response:
  {
    "answer": "...",
    "toolsUsed": ["..."],
    "dataScope": "...",
    "unsupported": false
  }

- No backend changes are planned.
- No MCP execution is required.
- Assistant currently supports read-only commerce queries through backend orchestration.
- Backend assistant remains the source of truth for answers.

Current frontend context:
- Angular v22, standalone components, strict TypeScript.
- Auth/login/protected shell implemented.
- Assistant chat UI implemented.
- Assistant currently renders responses mostly as plain text.
- Assistant currently displays toolsUsed and dataScope prominently.
- Assistant supports retry/error handling.
- Assistant uses AssistantApiClient and POST /api/assistant/query.

Problem Statement:
The assistant works functionally but feels like a developer/debugging tool:
- Long text responses are difficult to scan.
- Orders render as plain text.
- Supported capabilities are not obvious.
- ToolsUsed and DataScope dominate the UI despite being secondary information.
- Empty assistant state provides little guidance.
- Large portions of the page are underutilized.

Scope:

1. Assistant Welcome Experience
- Add a richer empty state.
- Add a welcome panel explaining what the assistant can help with.
- Add a "What you can ask" section.

2. Supported Questions Catalog
Add categorized examples:

Orders
- Show my recent orders
- Show my latest order
- What products did I order?
- Which orders contain product 4444?

Spending & Analytics
- What is my total spend?
- What did I buy most often?
- Find orders containing products over 10

Products
- Find products under 20
- Search products named 4444

Requirements:
- Display examples as clickable chips/cards.
- Clicking an example should populate or submit the question.
- Examples must reflect actual backend-supported capabilities.
- Do not advertise unsupported features.

3. Rich Assistant Message Layout
Improve message hierarchy:
- User messages styled as chat bubbles.
- Assistant messages styled separately.
- Better spacing and typography.
- Timestamp support if already available or easy to add locally.

4. Rich Order Rendering
For known assistant responses involving order summaries:
- Detect recognizable order-summary patterns.
- Render order cards instead of a text wall.

Order card fields:
- Order ID
- Status
- Created Date
- Total Amount
- View Details link (/orders/:orderId)

Requirements:
- Gracefully fall back to plain text if parsing is uncertain.
- Never hide assistant answer text if parsing fails.

5. Rich Commerce Insight Rendering
For recognizable spending/order analysis responses:
- Highlight totals.
- Highlight product names.
- Use summary cards where safe.

Fallback:
- Plain text remains the source display if rich rendering cannot be safely inferred.

6. Assistant Metadata Improvements
Move:
- toolsUsed
- dataScope

Into a secondary/collapsible section.

Example:

▼ Assistant Details
- Scope: authenticated-user
- Tools: orders_search

Requirements:
- Metadata remains available.
- Metadata should not dominate the response.

7. Suggested Follow-Up Questions
After assistant responses:
Show contextual chips such as:
- Show my latest order
- What is my total spend?
- What products did I order?
- What did I buy most often?

Requirements:
- Reuse existing chat flow.
- Clicking submits a new question.

8. Layout Improvements
Use available page space more effectively:
- Better desktop layout.
- Better mobile responsiveness.
- Maintain accessibility.
- Preserve keyboard navigation.

9. Error and Unsupported UX
Improve unsupported responses:
- Keep backend response intact.
- Add clearer styling.
- Provide suggested supported questions after unsupported responses.

10. Testing
Add/update focused tests for:
- Welcome state rendering.
- Supported-question catalog rendering.
- Example chip click behavior.
- Rich order-card rendering.
- Plain-text fallback rendering.
- Collapsible metadata.
- Suggested follow-up questions.
- Unsupported state improvements.
- Existing assistant behavior remains functional.
- No MCP requests are sent from /assistant.

Out of Scope:
- Backend changes.
- Assistant API contract changes.
- Streaming responses.
- Conversation persistence/history.
- Real-time updates.
- MCP changes.
- Order creation.
- Order cancellation.
- Admin workflows.
- External AI provider changes.
- Database changes.

Rules:
- Frontend only.
- Keep backend contract unchanged.
- Preserve retry/error behavior.
- Preserve existing assistant endpoint usage.
- Do not add direct MCP execution.
- Do not infer data not returned by backend.
- Use plain-text fallback whenever rich parsing confidence is low.
- Do not advertise unsupported capabilities.

Verification:
- npm run build
- npm test -- --no-watch --no-progress
- npm audit --omit=dev

Main files likely affected:
src/app/features/mcp-assistant/mcp-assistant-page/*
src/app/features/mcp-assistant/data/*
assistant component specs
assistant styling

PLAN_STATUS: PENDING_APPROVAL