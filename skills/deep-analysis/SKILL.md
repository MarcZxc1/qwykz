---
name: deep-analysis
description: Perform a deep, evidence-based analysis when the user explicitly says “deep analyze”, “deep analysis”, “analyze this deeply”, or invokes $deep-analysis. Use before making recommendations or edits when the request requires full-project inspection, dependency/reliability review, architecture analysis, risk assessment, or root-cause reasoning.
---

# Deep analysis

Use this skill when the user asks for a deep or comprehensive analysis. Treat the request as an investigation first; do not silently convert it into an implementation request.

## Workflow

1. Define the analysis scope from the request. Identify the exact project, files, systems, environments, and decision the user cares about. State reasonable assumptions briefly.
2. Map the relevant surface area before forming conclusions. Inspect entry points, configuration, package manifests and lockfiles, generated or runtime artifacts, tests, CI/build scripts, and documentation. Search broadly with `rg` and inspect targeted files in full enough context.
3. Trace behavior end to end. Follow inputs through prompts/configuration, code paths, templates, generated output, dependencies, and runtime/build consumers. Check both the intended path and important failure paths.
4. Separate evidence from inference. For every important finding, record the concrete file, line, command output, test result, or reproducible behavior that supports it. Label assumptions, uncertainty, and gaps explicitly.
5. Check contradictions and edge cases. Compare declarations against actual behavior, especially package versions, framework-specific dependencies, optional selections, defaults, generated files, platform differences, and CI behavior.
6. Validate proportionally. Run the narrowest useful tests or builds, then expand to integration or matrix checks when the risk is cross-cutting. Do not claim validation that was not run; distinguish blocked checks from passing checks.
7. Produce a decision-ready report before changing files: conclusion, findings ranked by severity, evidence, likely root cause, impact, confidence, unresolved questions, and recommended next steps. If the user also asked to fix something, make the smallest safe change after the analysis and verify it.

## Reporting rules

- Lead with the conclusion, then supporting evidence.
- Use precise paths and line references where useful.
- Distinguish confirmed bugs from risks, design opinions, and missing evidence.
- Explain why a dependency or package is included, not merely that it exists.
- For generated projects, inspect the generated manifest and build output rather than trusting generator intent.
- Preserve unrelated working-tree changes.
- Never hide a failed, skipped, or unavailable check behind a general statement such as “it works”.

## Default output shape

1. Conclusion and confidence.
2. Scope and assumptions.
3. Findings ordered by severity, each with evidence and impact.
4. Validation performed and results.
5. Remaining uncertainty or blockers.
6. Recommended fix or next action; include a patch only when authorized by the request.
