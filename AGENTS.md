# Agent Instructions

Instructions for AI agents working on this project.

## Development Workflow

### Work Epic by Epic

1. **Check current epic** - Read `.prodman/roadmap.yaml` to identify the current milestone and its epics
2. **Read epic details** - Load the epic file from `.prodman/epics/EPIC-XXX.yaml`
3. **Read related specs** - Load specs referenced in the epic from `.prodman/specs/`
4. **Implement** - Build the feature according to acceptance criteria
5. **Verify** - Test against ALL acceptance criteria in the epic
6. **Update status** - Mark epic as complete in `.prodman/`
7. **Log issues** - Document any blockers or bugs found
8. **Move to next epic** - Only after current epic is verified

### Epic Dependencies

Always check the `dependencies` field in each epic. Never start an epic until all its dependencies are `completed`.

---

## Prodman Structure

The `.prodman/` directory contains all product management artifacts:

```
.prodman/
├── config.yaml      # Project config and counters
├── product.yaml     # Product definition, vision, target users
├── roadmap.yaml     # Milestones and releases
├── epics/           # Feature epics (EPIC-XXX.yaml)
├── specs/           # Technical specifications (SPEC-XXX.md)
├── decisions/       # Architecture Decision Records (DEC-XXX.md)
├── issues/          # Bug reports and issues (ISSUE-XXX.yaml)
└── templates/       # Templates for new artifacts
```

### Key Files

| File | Purpose | When to Read |
|------|---------|--------------|
| `product.yaml` | Product vision, principles, target users | Understanding context |
| `roadmap.yaml` | Current milestone, epic order | Start of work |
| `epics/EPIC-XXX.yaml` | Feature requirements, acceptance criteria | Before implementing |
| `specs/SPEC-XXX.md` | Technical design, API details | During implementation |
| `decisions/DEC-XXX.md` | Architecture choices made | When making tech decisions |

---

## Verification

After completing an epic, verify ALL acceptance criteria before marking complete.

1. Read the `acceptance_criteria` list in the epic file
2. Test each criterion manually or via automated tests
3. Only mark `status: completed` when ALL criteria pass
4. If any criterion fails, log an issue and keep status as `in_progress`

---

## Proactive Issue Logging

**When you discover a bug or issue during development or testing, ALWAYS log it to `.prodman/issues/` immediately.**

This ensures issues are tracked even if they are not immediately fixed. Follow this process:

1. **Identify** - Notice unexpected behavior, visual bugs, or functionality issues
2. **Document** - Create an issue file following the template in `.prodman/issues/`
3. **Increment counter** - Update `counters.issue` in `.prodman/config.yaml`
4. **Reference** - Link to the related epic if applicable
5. **Continue or Fix** - Either fix immediately or continue with current work

### When to Log Issues

- Visual bugs (broken images, misaligned elements, missing styles)
- Functional bugs (features not working as specified)
- Edge cases discovered during testing
- Performance problems
- Missing error handling
- Platform-specific issues

**Do not skip issue logging** - even if you plan to fix immediately, the issue record provides valuable documentation.

## Updating Status in .prodman/

### When Starting an Epic

Edit `.prodman/epics/EPIC-XXX.yaml`:
```yaml
status: in_progress  # was: planning
updated_at: "YYYY-MM-DD"
```

### When Completing an Epic

Edit `.prodman/epics/EPIC-XXX.yaml`:
```yaml
status: completed  # was: in_progress
updated_at: "YYYY-MM-DD"
```

### Status Values

| Status | Meaning |
|--------|---------|
| `planning` | Not yet started |
| `in_progress` | Currently being implemented |
| `blocked` | Waiting on dependency or decision |
| `completed` | Done and verified |

---

## Logging Issues

When you encounter bugs, blockers, or unexpected behavior, create an issue file.

### Create Issue File

1. Get next issue number from `.prodman/config.yaml` → `counters.issue`
2. Increment the counter in `config.yaml`
3. Create `.prodman/issues/ISSUE-XXX.yaml`

### Issue Template

```yaml
id: "ISSUE-XXX"
title: "Brief description"
status: open
priority: p1  # p0=critical, p1=high, p2=medium, p3=low
epic: "EPIC-XXX"  # Related epic, if any
type: bug  # bug | blocker | enhancement
description: |
  Detailed description of the issue.
steps_to_reproduce:
  - "Step 1"
  - "Step 2"
expected_behavior: "What should happen"
actual_behavior: "What actually happens"
workaround: null
created_at: "YYYY-MM-DD"
updated_at: "YYYY-MM-DD"
```

### Issue Status Values

| Status | Meaning |
|--------|---------|
| `open` | Newly created |
| `in_progress` | Being worked on |
| `resolved` | Fixed, pending verification |
| `closed` | Verified fixed |
| `wont_fix` | Decided not to address |

---

## Quick Reference

### Before Starting Work
```bash
cat .prodman/roadmap.yaml        # Check milestones
cat .prodman/epics/EPIC-XXX.yaml # Read current epic
cat .prodman/specs/SPEC-XXX.md   # Read related spec
```

### After Completing Work
1. Verify all acceptance criteria pass
2. Update epic status to `completed`
3. Log any issues discovered
4. Check for next epic in roadmap
