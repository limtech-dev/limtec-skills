# Pushing this repository to GitHub

The tree in this folder is already in the layout Claude Code expects. Do not re-arrange it.

```bash
# 0) create an EMPTY public repo named siemens-servo-selector on github.com (no README, no licence)

git init -b main
git add -A
git commit -m "v1.0.4: Siemens servo selector (160 motors, USD reference prices)"
git remote add origin git@github.com:YOUR-ORG/siemens-servo-selector.git
git push -u origin main
git tag v1.0.4 && git push --tags
```

Then, on the GitHub release page for `v1.0.4`, attach:

- `dist/siemens-servo-selector_en_v1.0.4.zip`
- `dist/siemens-servo-selector_en_v1.0.4_flat.zip` (root is `SKILL.md`; for hosts that do not accept a folder root)

Checks before pushing:

```bash
# the skill must run from this exact tree
node plugins/siemens-servo-selector/skills/siemens-servo-selector/scripts/select.js --kw=1.5 --rpm=3000 --brake=yes

# the marketplace manifest must parse
python3 -c "import json;json.load(open('.claude-plugin/marketplace.json'))"

# no placeholder left behind
grep -rn "YOUR-ORG" . || echo "clean"
```

After the push, the two install lines in the README become live:

```
/plugin marketplace add YOUR-ORG/siemens-servo-selector
/plugin install siemens-servo-selector@limtec
```
