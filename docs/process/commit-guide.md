# Commit Guide

## Pre-Commit Checklist

- Review:
  - `git status`
  - `git diff`
  - `git diff --staged`

- Verify:
  - `tools/build.sh` (keeps `applet/<UUID>/` in sync)
  - `tests/run.sh` (if `gjs` is installed)

## Commit Process

1. Stage files:
   - `git add -p` (preferred) or `git add -A`

2. Commit:
   ```bash
   git commit -m "<type>: <summary>"
   ```

3. Push:
   - `git push` (or `git push -u origin <branch>` for new branches)

## Commit Message Format

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting only
- `refactor`: Code restructuring
- `test`: Test additions/changes
- `chore`: Build, config, dependencies

**Examples:**
- `feat: add alarm list removal button`
- `fix: handle invalid time input`
- `docs: update installation steps`
- `refactor: simplify time parsing`
- `chore: update build scripts`

## Rules
- Use imperative mood ("add" not "added")
- No period at end of the summary line
- Keep commits small and focused; avoid drive-by refactors.
