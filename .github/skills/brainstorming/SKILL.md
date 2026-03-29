---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Designs

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design and get user approval.

**CRITICAL**: Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.

## Anti-Pattern: "This Is Too Simple To Need A Design"

Every project goes through this process. A todo list, a single-function utility, a config change — all of them. "Simple" projects are where unexamined assumptions cause the most wasted work. The design can be short (a few sentences for truly simple projects), but you MUST present it and get approval.

## Checklist

You MUST create a task for each of these items and complete them in order:

1. **Explore project context** — check files, docs, recent commits
2. **Offer visual companion** (if topic will involve visual questions) — this is its own message, not combined with clarifying questions
3. **Ask clarifying questions** — one at a time, understand purpose/constraints/success criteria
4. **Propose 2-3 approaches** — with trade-offs and your recommendation
5. **Present design** — in sections scaled to their complexity, get user approval after each section
6. **Write design doc** — save to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and commit
7. **Spec self-review** — quick inline check for placeholders, contradictions, ambiguity, scope
8. **User reviews written spec** — ask user to review the spec file before proceeding
9. **Transition to implementation** — invoke writing-plans skill to create implementation plan

## The Process

### Understanding the Idea

- Check out the current project state first (files, docs, recent commits)
- Before asking detailed questions, assess scope: if the request describes multiple independent subsystems, flag this immediately
- If the project is too large for a single spec, help the user decompose into sub-projects
  - What are the independent pieces?
  - How do they relate?
  - What order should they be built?
- For appropriately-scoped projects, ask questions one at a time to refine the idea
- **Prefer multiple choice questions** when possible, but open-ended is fine too
- **Only one question per message** - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

### Exploring Approaches

- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

### Presenting the Design

- Once you believe you understand what you're building, present the design
- **Scale each section to its complexity**: a few sentences if straightforward, up to 200-300 words if nuanced
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

### Design for Isolation and Clarity

- Break the system into smaller units that each have **one clear purpose**
- Units should communicate through **well-defined interfaces**
- Each unit can be **understood and tested independently**

For each unit, you should be able to answer:
- What does it do?
- How do you use it?
- What does it depend on?

**Key tests**:
- Can someone understand what a unit does without reading its internals?
- Can you change the internals without breaking consumers?
- If not, the boundaries need work.

Smaller, well-bounded units are easier to work with:
- You reason better about code you can hold in context at once
- Your edits are more reliable when files are focused
- When a file grows large, that's often a signal it's doing too much

### Working in Existing Codebases

- Explore the current structure before proposing changes
- Follow existing patterns
- Where existing code has problems that affect the work:
  - Include targeted improvements as part of the design
  - Work like a good developer improving code they're working in
- Don't propose unrelated refactoring
- Stay focused on what serves the current goal

## After the Design

### Documentation

**Write the validated design (spec) to**: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- User preferences for spec location override this default
- Use clear, concise writing
- Commit the design document to git

### Spec Self-Review

After writing the spec document, look at it with fresh eyes:

1. **Placeholder scan**: Any "TBD", "TODO", incomplete sections, or vague requirements? Fix them.
2. **Internal consistency**: Do any sections contradict each other? Does the architecture match the feature descriptions?
3. **Scope check**: Is this focused enough for a single implementation plan, or does it need decomposition?
4. **Ambiguity check**: Could any requirement be interpreted two different ways? If so, pick one and make it explicit.

**Fix any issues inline.** No need to re-review — just fix and move on.

### User Review Gate

After the spec review loop passes, ask the user to review the written spec before proceeding:

> "Spec written and committed to `<path>`. Please review it and let me know if you want to make any changes before we start writing out the implementation plan."

Wait for the user's response. If they request changes, make them and re-run the spec review loop. **Only proceed once the user approves.**

### Implementation

- **Invoke the writing-plans skill** to create a detailed implementation plan
- **Do NOT invoke any other skill.** writing-plans is the next step.
- Do NOT invoke frontend-design, mcp-builder, or any other implementation skill

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Incremental validation** - Present design, get approval before moving on
- **Be flexible** - Go back and clarify when something doesn't make sense

## Visual Companion

A browser-based companion for showing mockups, diagrams, and visual options during brainstorming.

### Offering the Companion

When you anticipate that upcoming questions will involve visual content (mockups, layouts, diagrams), offer it once for consent:

> "Some of what we're working on might be easier to explain if I can show it to you in a web browser. I can put together mockups, diagrams, comparisons, and other visuals as we go. This feature is still new and can be token-intensive. Want to try it? (Requires opening a local URL)"

**This offer MUST be its own message.** Do not combine it with clarifying questions, context summaries, or any other content. Wait for the user's response before continuing. If they decline, proceed with text-only brainstorming.

### Per-Question Decision

Even after the user accepts, decide FOR EACH QUESTION whether to use the browser or the terminal.

**The test**: Would the user understand this better by seeing it than reading it?

**Use the browser for** content that IS visual:
- Mockups and wireframes
- Layout comparisons
- Architecture diagrams
- Side-by-side visual designs

**Use the terminal for** content that is text:
- Requirements questions
- Conceptual choices
- Tradeoff lists
- A/B/C/D text options
- Scope decisions

**Important**: A question about a UI topic is not automatically a visual question. "What does personality mean in this context?" is a conceptual question — use the terminal. "Which wizard layout works better?" is a visual question — use the browser.

## Process Flow

```
Explore project context
    ↓
Visual questions ahead? ──Yes──> Offer Visual Companion
    ↓ (No)                       ↓
Ask clarifying questions ←────────┘
    ↓
Propose 2-3 approaches
    ↓
Present design sections
    ↓
User approves design? ──No──> Revise sections
    ↓ (Yes)
Write design doc
    ↓
Spec self-review
    ↓
User reviews spec? ──Changes requested──> Revise
    ↓ (Approved)
Invoke writing-plans skill
```

**Terminal state**: Invoking writing-plans.
**Important**: The ONLY skill you invoke after brainstorming is writing-plans.
