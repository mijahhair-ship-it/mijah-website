/install garrytan/gstack

name: requesting-code-review
description: "Use when completing tasks, implementing major features, or before merging to verify work meets requirements"
---

# Requesting Code Review

Dispatch a code-reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation — never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

**Core principle: Review early, review often.**

## When to Request Review

### Mandatory:
- ✅ After each task in subagent-driven development
- ✅ After completing major feature
- ✅ Before merge to main

### Optional but Valuable:
- ⚠️ When stuck (fresh perspective)
- ⚠️ Before refactoring (baseline check)
- ⚠️ After fixing complex bug

## How to Request

### Step 1: Get Git SHAs

```bash
# Get the starting commit (usually previous commit or origin/main)
BASE_SHA=$(git rev-parse HEAD~1)

# Get the ending commit (current HEAD)
HEAD_SHA=$(git rev-parse HEAD)

# Or use a specific branch
BASE_SHA=$(git merge-base origin/main HEAD)
```

### Step 2: Prepare Review Template

Fill in the code-reviewer template with:

| Placeholder | Description |
|-------------|-------------|
| `{WHAT_WAS_IMPLEMENTED}` | What you just built |
| `{PLAN_OR_REQUIREMENTS}` | What it should do (from plan or spec) |
| `{BASE_SHA}` | Starting commit SHA |
| `{HEAD_SHA}` | Ending commit SHA |
| `{DESCRIPTION}` | Brief summary of changes |

### Step 3: Dispatch Reviewer

Invoke a code-reviewer subagent with the filled template containing:
- What was implemented
- What it should do (requirements/plan)
- The exact SHAs being reviewed
- Context about the work

## Example Workflow

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

# Get SHAs
BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

# Dispatch code-reviewer subagent with:
WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
PLAN_OR_REQUIREMENTS: Task 2 from docs/superpowers/plans/deployment-plan.md
BASE_SHA: a7981ec
HEAD_SHA: 3df7661
DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types

[Subagent reviews and returns]:
  ✅ Strengths: Clean architecture, real tests, good error handling
  ⚠️ Issues:
    🔴 Critical: Missing progress indicators during long operations
    🟡 Important: Resource leak in cleanup function
    🟢 Minor: Magic number (100) for reporting interval
  Assessment: Ready to proceed AFTER fixes

You: [Fix critical and important issues]
[Commit changes]
You: [Continue to Task 3]
```

## Integration with Workflows

### Subagent-Driven Development
- Review **after EACH task**
- Catch issues before they compound
- Fix before moving to next task
- Fast feedback loop

### Executing Plans
- Review **after each batch** (3 tasks)
- Get feedback, apply changes, continue
- Batch reviews when doing manual execution

### Ad-Hoc Development
- Review **before merge**
- Review **when stuck**
- Use as fresh perspective

## Acting on Feedback

### Issue Severity Levels

🔴 **Critical** (Must Fix):
- Security vulnerabilities
- Logic errors that break requirements
- Data integrity issues
- Test failures
- **MUST fix before proceeding**

🟡 **Important** (Should Fix):
- Performance issues
- Error handling gaps
- Code clarity issues
- Missing edge cases
- **Fix before proceeding to next task**

🟢 **Minor** (Nice to Fix):
- Style suggestions
- Optimization opportunities
- Documentation improvements
- Refactoring ideas
- **Note for later, doesn't block progress**

### Response Strategy

1. **Fix Critical issues immediately**
2. **Fix Important issues before proceeding**
3. **Note Minor issues for later** (backlog/tech debt)
4. **Push back if reviewer is wrong** (with technical reasoning)

## Red Flags

### Never:
- ❌ Skip review because "it's simple"
- ❌ Ignore Critical issues
- ❌ Proceed with unfixed Important issues
- ❌ Argue without technical reasoning

### If Reviewer is Wrong:
- 📝 Push back with technical reasoning
- 🧪 Show code/tests that prove it works
- ❓ Request clarification
- 💬 Explain your approach

**Always be respectful and evidence-based.**

## Code Review Template

Save this as `code-reviewer.md` for reference:

```markdown
# Code Review Request

## What Was Implemented
{WHAT_WAS_IMPLEMENTED}

## Requirements/Plan
{PLAN_OR_REQUIREMENTS}

## Changes
- {DESCRIPTION}

## Git Range
- Base: {BASE_SHA}
- Head: {HEAD_SHA}

## Questions for Reviewer
[Optional context the reviewer should know]
```

## Best Practices

✅ **DO**:
- Request review after completing each task
- Provide clear descriptions of what was built
- Include link to requirements/plan
- Be specific about SHAs
- Ask clarifying questions if feedback is unclear
- Fix issues promptly after review

❌ **DON'T**:
- Review code while building (breaks flow)
- Skip reviews to save time
- Ignore reviewer feedback
- Argue without evidence
- Postpone critical fixes
- Review same code multiple times

## Integration with Other Skills

This skill works with:
- **writing-plans** - Get task requirements for review reference
- **subagent-driven-development** - Review after each subagent task
- **executing-plans** - Review batches of completed tasks
- **test-driven-development** - Verify tests pass before review

## Key Principle

**The reviewer is isolated from your full context.** This is intentional:
- Keeps reviewer focused on the code, not your thought process
- Prevents reviewer from being influenced by your reasoning
- Preserves your context for continued work
- Makes review more objective and efficient

Be precise with what you submit for review.
