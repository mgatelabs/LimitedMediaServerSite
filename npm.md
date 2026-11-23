# npm Notes

## Checking skipped install scripts

The project `.npmrc` sets `ignore-scripts=true`, which blocks all lifecycle scripts (preinstall, postinstall, etc.) during `npm install`.

### See what scripts a package would have run

```bash
npm show <package-name> scripts
```

Prints the `scripts` block from the package's registry metadata without installing anything.

### Run a one-off install with scripts enabled

```bash
npm install --foreground-scripts
```

Overrides `ignore-scripts=true` for that single invocation and prints all lifecycle output.

### Re-run scripts for a specific package after install

```bash
npm rebuild <package-name>
```

Triggers only that package's build/install scripts deliberately, without affecting others.

### Temporarily allow all scripts

Edit `.npmrc` and set:

```
ignore-scripts=false
```

Remember to revert after.
