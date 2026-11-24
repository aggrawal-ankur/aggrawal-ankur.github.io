#!/usr/bin/env python3
import os
import re
import subprocess
import sys

# Paths that NEVER impact the production build
IGNORE_PREFIXES = (
  "src/content/drafts/",
  "test/",
  ".vscode/",
)

IGNORE_EXACT = {
  ".gitignore",
  ".editorconfig",
  ".prettierignore",
  ".prettierrc.js",
  ".npmrc",
  ".nvmrc",
  "LICENSE",
  "PEOPLE_TO_CONTACT",
}

def is_ignored_root_file(path: str) -> bool:
  if path in IGNORE_EXACT:
    return True
  if "/" not in path and path.endswith(".md"):
    return True
  return any(path.startswith(prefix) for prefix in IGNORE_PREFIXES)

def is_draft_content(content: str | None) -> bool:
  if not content:
    return False
  fm_match = re.search(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
  if not fm_match:
    return False
  fm = fm_match.group(1)
  return bool(re.search(r"^\s*draft\s*:\s*(true|\"true\"|'true')\s*$", fm, re.MULTILINE | re.IGNORECASE))

def git_file_content(rev: str, path: str) -> str | None:
  try:
    return subprocess.check_output(
      ["git", "show", f"{rev}:{path}"],
      stderr=subprocess.DEVNULL
    ).decode("utf-8", errors="ignore")
  except Exception:
    return None

def main():
  event_name = os.environ.get("GITHUB_EVENT_NAME", "push")
  if event_name == "workflow_dispatch":
    print("Triggered via workflow_dispatch (manual run) -> proceeding with build.")
    set_output(True)
    return

  before = os.environ.get("GITHUB_EVENT_BEFORE", "")
  sha = os.environ.get("GITHUB_SHA", "HEAD")

  if not before or before == "0000000000000000000000000000000000000000":
    try:
      subprocess.check_call(["git", "rev-parse", "HEAD~1"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
      before = "HEAD~1"
    except Exception:
      print("No previous commit found -> proceeding with build.")
      set_output(True)
      return

  try:
    changed_files = subprocess.check_output(
      ["git", "diff", "--name-only", before, sha]
    ).decode("utf-8").splitlines()
  except Exception as e:
    print(f"Error running git diff: {e} -> proceeding with build.")
    set_output(True)
    return

  reasons = []
  for path in changed_files:
    path = path.strip()
    if not path or is_ignored_root_file(path):
      continue

    # If it's a post in src/content/post, inspect draft state
    if path.startswith("src/content/post/") and (path.endswith(".md") or path.endswith(".mdx")):
      base_content = git_file_content(before, path)
      head_content = git_file_content(sha, path)

      was_draft = is_draft_content(base_content) if base_content is not None else True
      is_draft = is_draft_content(head_content) if head_content is not None else True

      if was_draft and is_draft:
        print(f"Skipping draft post: {path}")
        continue
      else:
        reasons.append(f"Published post modified or publication status changed: {path}")
    else:
      reasons.append(f"Production asset/code modified: {path}")

  if reasons:
    print("Rebuild required:")
    for r in reasons:
      print(f"  - {r}")
    set_output(True)
  else:
    print("No production changes detected (only drafts or docs modified). Skipping build.")
    set_output(False)

def set_output(should_build: bool):
  print(f"::notice::should_build={'true' if should_build else 'false'}")
  output_file = os.environ.get("GITHUB_OUTPUT")
  if output_file:
    with open(output_file, "a") as f:
      f.write(f"should_build={'true' if should_build else 'false'}\n")

if __name__ == "__main__":
  main()

